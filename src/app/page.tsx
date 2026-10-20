'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  INITIAL_OFFICE_STATE,
  OFFICE_STATIONS,
} from '@/data/initial-office';
import {
  ActivityStage,
  FocusSessionState,
  InteractiveStationId,
  OfficeState,
  PriorityLevel,
  StickyNote,
  TodoItem,
} from '@/types/office';
import { fetchOfficeState, postOfficeAction } from '@/utils/officeApi';
import { soundEngine } from '@/utils/soundEffects';
import TodoTvModal from '@/components/TodoTvModal';
import ActivityBoardModal from '@/components/ActivityBoardModal';
import WorkstationDeskModal from '@/components/WorkstationDeskModal';
import OfficeMinimap from '@/components/OfficeMinimap';
import {
  Building2,
  Tv,
  LayoutGrid,
  Monitor,
  Coffee,
  Sun,
  Sunset,
  Moon,
  Camera,
  Eye,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  Navigation,
  Layers,
  X,
} from 'lucide-react';

const OfficeWorld3D = dynamic(() => import('@/components/OfficeWorld3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      <p className="mt-4 text-sm font-extrabold tracking-wide text-emerald-400">
        Loading 3D Executive Office Building &amp; Live Workspace...
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Preparing Courtyard Gate, Reception Lobby, Activity Board &amp; 85&quot; Smart TV To-Do Wall
      </p>
    </div>
  ),
});

export default function WorkstationOfficePage() {
  const [officeState, setOfficeState] = useState<OfficeState>(
    INITIAL_OFFICE_STATE
  );
  // Start just outside the main courtyard gate facing North toward the glass office entrance
  const [playerPos, setPlayerPos] = useState({
    x: 0.0,
    z: 21.5,
    rotY: 0,
  });

  const [cameraMode, setCameraMode] = useState<
    'third-person' | 'first-person' | 'aerial'
  >('third-person');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  const [roofCutaway, setRoofCutaway] = useState(false);
  const [currentZone, setCurrentZone] = useState(
    'Estate Avenue (Outside Gate)'
  );
  const [nearbyStation, setNearbyStation] =
    useState<InteractiveStationId | null>(null);

  // Active modals
  const [activeModal, setActiveModal] =
    useState<InteractiveStationId | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  // On-screen D-Pad controls
  const [moveInput, setMoveInput] = useState({
    forward: 0,
    turn: 0,
    sprint: false,
  });

  // Teleport trigger
  const [teleportTarget, setTeleportTarget] = useState<{
    x: number;
    z: number;
    rotY?: number;
    id: number;
  } | null>(null);

  // Load persisted state from API (or DynamoDB in prod) on mount
  useEffect(() => {
    fetchOfficeState().then((loaded) => {
      setOfficeState(loaded);
    });
  }, []);

  // Tick the Pomodoro / Deep-Work timer every second when running
  useEffect(() => {
    if (!officeState.focusSession.isRunning) return;
    const interval = setInterval(() => {
      setOfficeState((prev) => {
        const rem = prev.focusSession.remainingSeconds;
        if (rem <= 1) {
          soundEngine.playChime('complete');
          const nextSession: FocusSessionState = {
            ...prev.focusSession,
            remainingSeconds: prev.focusSession.durationSeconds,
            isRunning: false,
            completedSessionsToday:
              prev.focusSession.completedSessionsToday + 1,
          };
          postOfficeAction({
            action: 'update_focus_session',
            focusSession: nextSession,
          });
          return {
            ...prev,
            focusSession: nextSession,
          };
        }
        return {
          ...prev,
          focusSession: {
            ...prev.focusSession,
            remainingSeconds: rem - 1,
          },
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [officeState.focusSession.isRunning]);

  // Press 'E' to open nearby station modal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'KeyE' && nearbyStation) {
        setActiveModal(nearbyStation);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [nearbyStation]);

  // Helper to apply optimistic update + persist to API/DynamoDB
  const syncAction = useCallback(
    async (
      optimisticUpdater: (prev: OfficeState) => OfficeState,
      apiPayload: Record<string, any>
    ) => {
      setOfficeState((prev) => {
        const next = optimisticUpdater(prev);
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'workstation_3d_office_state_v1',
            JSON.stringify(next)
          );
        }
        return next;
      });
      const remoteState = await postOfficeAction(apiPayload);
      if (remoteState) {
        setOfficeState(remoteState);
      }
    },
    []
  );

  // Handlers for To-Do TV
  const handleAddTodo = useCallback(
    (todo: {
      title: string;
      category: TodoItem['category'];
      priority: PriorityLevel;
      estimatedMinutes: number;
    }) => {
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title: todo.title,
        category: todo.category,
        priority: todo.priority,
        completed: false,
        estimatedMinutes: todo.estimatedMinutes,
        createdAt: new Date().toISOString(),
      };
      syncAction(
        (prev) => ({ ...prev, todos: [newTodo, ...prev.todos] }),
        { action: 'add_todo', ...todo }
      );
    },
    [syncAction]
  );

  const handleToggleTodo = useCallback(
    (todoId: string) => {
      syncAction(
        (prev) => ({
          ...prev,
          todos: prev.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed
                    ? new Date().toISOString()
                    : undefined,
                }
              : t
          ),
        }),
        { action: 'toggle_todo', todoId }
      );
    },
    [syncAction]
  );

  const handleDeleteTodo = useCallback(
    (todoId: string) => {
      syncAction(
        (prev) => ({
          ...prev,
          todos: prev.todos.filter((t) => t.id !== todoId),
        }),
        { action: 'delete_todo', todoId }
      );
    },
    [syncAction]
  );

  const handleClearCompletedTodos = useCallback(() => {
    syncAction(
      (prev) => ({
        ...prev,
        todos: prev.todos.filter((t) => !t.completed),
      }),
      { action: 'clear_completed_todos' }
    );
  }, [syncAction]);

  // Handlers for Activity Board
  const handleAddActivity = useCallback(
    (act: {
      title: string;
      description: string;
      timeSlot: string;
      durationMinutes: number;
      colorTag: string;
      linkedTodoId?: string;
    }) => {
      syncAction(
        (prev) => ({
          ...prev,
          activities: [
            ...prev.activities,
            {
              id: `act-${Date.now()}`,
              ...act,
              stage: 'planned',
            },
          ],
        }),
        { action: 'add_activity', ...act }
      );
    },
    [syncAction]
  );

  const handleUpdateActivityStage = useCallback(
    (activityId: string, stage: ActivityStage) => {
      syncAction(
        (prev) => {
          const target = prev.activities.find((a) => a.id === activityId);
          const nextActivities = prev.activities.map((a) =>
            a.id === activityId ? { ...a, stage } : a
          );
          let nextTodos = prev.todos;
          let nextFocus = { ...prev.focusSession };

          if (stage === 'active' && target) {
            nextFocus = {
              ...nextFocus,
              activeActivityId: target.id,
              activeActivityTitle: target.title,
              durationSeconds: (target.durationMinutes || 25) * 60,
              remainingSeconds: (target.durationMinutes || 25) * 60,
              isRunning: true,
            };
          } else if (stage === 'completed' && target) {
            if (target.linkedTodoId) {
              nextTodos = prev.todos.map((t) =>
                t.id === target.linkedTodoId
                  ? {
                      ...t,
                      completed: true,
                      completedAt: new Date().toISOString(),
                    }
                  : t
              );
            }
            if (nextFocus.activeActivityId === target.id) {
              nextFocus.isRunning = false;
              nextFocus.completedSessionsToday += 1;
            }
          }

          return {
            ...prev,
            activities: nextActivities,
            todos: nextTodos,
            focusSession: nextFocus,
          };
        },
        { action: 'update_activity_stage', activityId, stage }
      );
    },
    [syncAction]
  );

  const handleDeleteActivity = useCallback(
    (activityId: string) => {
      syncAction(
        (prev) => ({
          ...prev,
          activities: prev.activities.filter((a) => a.id !== activityId),
        }),
        { action: 'delete_activity', activityId }
      );
    },
    [syncAction]
  );

  const handleAddStickyNote = useCallback(
    (note: { text: string; color: StickyNote['color'] }) => {
      syncAction(
        (prev) => ({
          ...prev,
          stickyNotes: [
            {
              id: `note-${Date.now()}`,
              text: note.text,
              color: note.color,
              author: prev.ownerName,
              createdAt: new Date().toISOString(),
            },
            ...prev.stickyNotes,
          ],
        }),
        { action: 'add_sticky_note', ...note }
      );
    },
    [syncAction]
  );

  const handleDeleteStickyNote = useCallback(
    (noteId: string) => {
      syncAction(
        (prev) => ({
          ...prev,
          stickyNotes: prev.stickyNotes.filter((n) => n.id !== noteId),
        }),
        { action: 'delete_sticky_note', noteId }
      );
    },
    [syncAction]
  );

  // Handlers for Workstation Desk
  const handleUpdateScratchpad = useCallback(
    (scratchpadText: string) => {
      syncAction(
        (prev) => ({ ...prev, scratchpadText }),
        { action: 'update_scratchpad', scratchpadText }
      );
    },
    [syncAction]
  );

  const handleAddQuickLink = useCallback(
    (link: { label: string; url: string; category: string }) => {
      syncAction(
        (prev) => ({
          ...prev,
          quickLinks: [
            ...prev.quickLinks,
            { id: `link-${Date.now()}`, ...link },
          ],
        }),
        { action: 'add_quick_link', ...link }
      );
    },
    [syncAction]
  );

  const handleDeleteQuickLink = useCallback(
    (linkId: string) => {
      syncAction(
        (prev) => ({
          ...prev,
          quickLinks: prev.quickLinks.filter((l) => l.id !== linkId),
        }),
        { action: 'delete_quick_link', linkId }
      );
    },
    [syncAction]
  );

  const handleUpdateFocusSession = useCallback(
    (patch: Partial<FocusSessionState>) => {
      syncAction(
        (prev) => ({
          ...prev,
          focusSession: { ...prev.focusSession, ...patch },
        }),
        {
          action: 'update_focus_session',
          focusSession: { ...officeState.focusSession, ...patch },
        }
      );
    },
    [syncAction, officeState.focusSession]
  );

  const triggerTeleport = useCallback(
    (x: number, z: number, rotY?: number) => {
      setTeleportTarget({ x, z, rotY, id: Date.now() });
    },
    []
  );

  const handleSelectStation = useCallback((stationId: InteractiveStationId) => {
    if (stationId === 'focus-lounge' || stationId === 'reception-kiosk') {
      setActiveModal('workstation-desk');
    } else {
      setActiveModal(stationId);
    }
  }, []);

  const handleToggleAmbient = useCallback(() => {
    const playing = soundEngine.toggleAmbientFocusSound();
    setAmbientPlaying(playing);
  }, []);

  const completedTodosCount = useMemo(
    () => officeState.todos.filter((t) => t.completed).length,
    [officeState.todos]
  );
  const activeActivity = useMemo(
    () => officeState.activities.find((a) => a.stage === 'active'),
    [officeState.activities]
  );

  const nearbyStationMeta = useMemo(
    () => OFFICE_STATIONS.find((s) => s.id === nearbyStation) || null,
    [nearbyStation]
  );

  const fs = officeState.focusSession;
  const timerMins = Math.floor(fs.remainingSeconds / 60);
  const timerSecs = fs.remainingSeconds % 60;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D Walk-In Office World Canvas */}
      <OfficeWorld3D
        officeState={officeState}
        playerPos={playerPos}
        setPlayerPos={setPlayerPos}
        cameraMode={cameraMode}
        timeOfDay={timeOfDay}
        roofCutaway={roofCutaway}
        moveInput={moveInput}
        teleportTarget={teleportTarget}
        onSelectStation={handleSelectStation}
        onNearbyStationChange={setNearbyStation}
        onCurrentZoneChange={setCurrentZone}
        onToggleTodo={handleToggleTodo}
        onUpdateActivityStage={handleUpdateActivityStage}
      />

      {/* ================= TOP NAVIGATION & HUD BAR ================= */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-4">
        {/* Left: Office Title & Current Room Badge */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-800/90 bg-slate-950/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 text-slate-950 shadow">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wide text-white">
                {officeState.officeName}
              </h1>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                Walk-In 3D HQ
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-sky-400">{currentZone}</span>
              <span>•</span>
              <span>
                TV To-Dos: {completedTodosCount}/{officeState.todos.length} Done
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Active Activity & Pomodoro Pill */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-slate-950/90 px-4 py-2 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                Doing Now in Office
              </div>
              <div className="max-w-[230px] truncate text-xs font-bold text-white">
                {activeActivity
                  ? activeActivity.title
                  : 'Click Activity Board to start a task'}
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-black text-emerald-400">
              {String(timerMins).padStart(2, '0')}:
              {String(timerSecs).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playChime(fs.isRunning ? 'click' : 'start');
                handleUpdateFocusSession({ isRunning: !fs.isRunning });
              }}
              className={`rounded-lg p-1.5 text-slate-950 transition ${
                fs.isRunning
                  ? 'bg-rose-400 hover:bg-rose-300'
                  : 'bg-emerald-400 hover:bg-emerald-300'
              }`}
              title={fs.isRunning ? 'Pause Focus Timer' : 'Start Focus Timer'}
            >
              {fs.isRunning ? (
                <Pause className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
            </button>
          </div>
        </div>

        {/* Right: Quick Action Buttons, Camera Mode, Roof Cutaway & Time of Day */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveModal('todo-tv')}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-3 py-2 text-xs font-extrabold text-emerald-300 shadow-lg backdrop-blur-md transition hover:bg-emerald-500 hover:text-slate-950"
          >
            <Tv className="h-4 w-4" />
            <span>Office TV ({officeState.todos.filter((t) => !t.completed).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('activity-board')}
            className="flex items-center gap-1.5 rounded-xl border border-sky-500/50 bg-sky-500/20 px-3 py-2 text-xs font-extrabold text-sky-300 shadow-lg backdrop-blur-md transition hover:bg-sky-500 hover:text-slate-950"
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Activity Board</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('workstation-desk')}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/20 px-3 py-2 text-xs font-extrabold text-amber-300 shadow-lg backdrop-blur-md transition hover:bg-amber-500 hover:text-slate-950"
          >
            <Monitor className="h-4 w-4" />
            <span>Command Desk</span>
          </button>

          {/* Ambient Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleAmbient}
            className={`rounded-xl border p-2 shadow-lg backdrop-blur-md transition ${
              ambientPlaying
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                : 'border-slate-800 bg-slate-950/90 text-slate-400 hover:text-white'
            }`}
            title="Toggle Ambient Focus Sound"
          >
            {ambientPlaying ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>

          {/* Roof Cutaway Toggle */}
          <button
            type="button"
            onClick={() => setRoofCutaway((prev) => !prev)}
            className={`flex items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold shadow-lg backdrop-blur-md transition ${
              roofCutaway
                ? 'border-sky-400 bg-sky-500/20 text-sky-300'
                : 'border-slate-800 bg-slate-950/90 text-slate-300 hover:text-white'
            }`}
            title="Toggle Roof Cutaway"
          >
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">
              {roofCutaway ? 'Roof: Hidden' : 'Roof: On'}
            </span>
          </button>

          {/* Camera Mode Switcher */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/90 p-1 shadow-lg backdrop-blur-md">
            {(
              [
                { id: 'third-person', label: 'Walker' },
                { id: 'first-person', label: '1st Person' },
                { id: 'aerial', label: 'Drone' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setCameraMode(m.id)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition ${
                  cameraMode === m.id
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Time of Day Switcher */}
          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950/90 p-1 shadow-lg backdrop-blur-md">
            {[
              { id: 'day', icon: Sun },
              { id: 'sunset', icon: Sunset },
              { id: 'night', icon: Moon },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    setTimeOfDay(t.id as 'day' | 'sunset' | 'night')
                  }
                  className={`rounded-lg p-1.5 transition ${
                    timeOfDay === t.id
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Time of Day: ${t.id}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ================= LEFT SIDEBAR: ROOM TELEPORT & LIVE TODAY AGENDA ================= */}
      {sidebarOpen ? (
        <aside className="pointer-events-auto absolute bottom-4 left-4 top-20 z-20 flex w-80 flex-col overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-950/92 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                Office Navigator &amp; Agenda
              </h2>
              <p className="text-[11px] text-slate-400">
                Walk with WASD / Arrows or click to teleport
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Teleport Buttons into Office Stations */}
          <div className="border-b border-slate-800/80 p-3">
            <div className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Walk / Teleport to Station
            </div>
            <div className="space-y-1.5">
              {OFFICE_STATIONS.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    triggerTeleport(
                      st.standPos.x,
                      st.standPos.z,
                      st.standPos.rotY
                    );
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-800/90 bg-slate-900/80 px-3 py-2 text-left transition hover:border-emerald-500/50 hover:bg-slate-900"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: st.accentColor }}
                    />
                    <div className="overflow-hidden">
                      <div className="truncate text-xs font-bold text-white">
                        {st.name}
                      </div>
                      <div className="truncate text-[10px] text-slate-400">
                        {st.room}
                      </div>
                    </div>
                  </div>
                  <Navigation className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Live Mini-TV To-Do Preview */}
          <div className="flex flex-1 flex-col overflow-y-auto p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                Office TV To-Do Checklist
              </span>
              <button
                type="button"
                onClick={() => setActiveModal('todo-tv')}
                className="text-[11px] font-bold text-sky-400 hover:underline"
              >
                + Add / Edit
              </button>
            </div>
            <div className="space-y-1.5">
              {officeState.todos.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => {
                    soundEngine.playChime(todo.completed ? 'click' : 'complete');
                    handleToggleTodo(todo.id);
                  }}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-xs transition ${
                    todo.completed
                      ? 'border-slate-900 bg-slate-900/30 text-slate-500 line-through'
                      : 'border-slate-800 bg-slate-900/90 text-white hover:border-emerald-500/50'
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      todo.completed ? 'text-emerald-400' : 'text-slate-600'
                    }`}
                  />
                  <span className="truncate font-semibold">{todo.title}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="pointer-events-auto absolute left-4 top-20 z-20 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/90 px-3.5 py-2.5 text-xs font-extrabold text-white shadow-xl backdrop-blur-md hover:border-emerald-500/50"
        >
          <Navigation className="h-4 w-4 text-emerald-400" />
          <span>Open Office Navigator</span>
        </button>
      )}

      {/* ================= NEARBY STATION INTERACTION BANNER ================= */}
      {nearbyStationMeta && (
        <div className="pointer-events-auto absolute bottom-24 left-1/2 z-20 -translate-x-1/2">
          <button
            type="button"
            onClick={() => handleSelectStation(nearbyStationMeta.id)}
            className="flex items-center gap-3 rounded-2xl border-2 border-emerald-400 bg-slate-950/95 px-5 py-3 text-left shadow-[0_0_40px_rgba(16,185,129,0.4)] transition hover:scale-105"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-950 shadow"
              style={{ backgroundColor: nearbyStationMeta.accentColor }}
            >
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white">
                {nearbyStationMeta.name}
              </div>
              <div className="text-[11px] font-semibold text-emerald-300">
                Press <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-white">E</kbd> or Click to Interact
              </div>
            </div>
          </button>
        </div>
      )}

      {/* ================= BOTTOM RIGHT: MINIMAP & ON-SCREEN WALK CONTROLS ================= */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex items-end gap-3">
        {/* Touch / Mouse D-Pad Walker Controls */}
        <div className="pointer-events-auto flex flex-col items-center gap-1 rounded-2xl border border-slate-800 bg-slate-950/90 p-2.5 shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onMouseDown={() => setMoveInput((m) => ({ ...m, forward: 1 }))}
            onMouseUp={() => setMoveInput((m) => ({ ...m, forward: 0 }))}
            onMouseLeave={() => setMoveInput((m) => ({ ...m, forward: 0 }))}
            onTouchStart={() => setMoveInput((m) => ({ ...m, forward: 1 }))}
            onTouchEnd={() => setMoveInput((m) => ({ ...m, forward: 0 }))}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white active:bg-emerald-500 active:text-slate-950"
            title="Walk Forward (W / Up)"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onMouseDown={() => setMoveInput((m) => ({ ...m, turn: 1 }))}
              onMouseUp={() => setMoveInput((m) => ({ ...m, turn: 0 }))}
              onMouseLeave={() => setMoveInput((m) => ({ ...m, turn: 0 }))}
              onTouchStart={() => setMoveInput((m) => ({ ...m, turn: 1 }))}
              onTouchEnd={() => setMoveInput((m) => ({ ...m, turn: 0 }))}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white active:bg-emerald-500 active:text-slate-950"
              title="Turn Left (A / Left)"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onMouseDown={() => setMoveInput((m) => ({ ...m, forward: -1 }))}
              onMouseUp={() => setMoveInput((m) => ({ ...m, forward: 0 }))}
              onMouseLeave={() => setMoveInput((m) => ({ ...m, forward: 0 }))}
              onTouchStart={() => setMoveInput((m) => ({ ...m, forward: -1 }))}
              onTouchEnd={() => setMoveInput((m) => ({ ...m, forward: 0 }))}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white active:bg-emerald-500 active:text-slate-950"
              title="Walk Backward (S / Down)"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
            <button
              type="button"
              onMouseDown={() => setMoveInput((m) => ({ ...m, turn: -1 }))}
              onMouseUp={() => setMoveInput((m) => ({ ...m, turn: 0 }))}
              onMouseLeave={() => setMoveInput((m) => ({ ...m, turn: 0 }))}
              onTouchStart={() => setMoveInput((m) => ({ ...m, turn: -1 }))}
              onTouchEnd={() => setMoveInput((m) => ({ ...m, turn: 0 }))}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white active:bg-emerald-500 active:text-slate-950"
              title="Turn Right (D / Right)"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            WASD / Click Floor
          </span>
        </div>

        {/* Interactive Floorplan Minimap */}
        <OfficeMinimap
          playerPos={playerPos}
          onTeleportToPosition={triggerTeleport}
          onSelectStation={handleSelectStation}
        />
      </div>

      {/* ================= INTERACTIVE STATION MODALS ================= */}
      <TodoTvModal
        open={activeModal === 'todo-tv'}
        onClose={() => setActiveModal(null)}
        officeState={officeState}
        onAddTodo={handleAddTodo}
        onToggleTodo={handleToggleTodo}
        onDeleteTodo={handleDeleteTodo}
        onClearCompleted={handleClearCompletedTodos}
      />

      <ActivityBoardModal
        open={activeModal === 'activity-board'}
        onClose={() => setActiveModal(null)}
        officeState={officeState}
        onAddActivity={handleAddActivity}
        onUpdateStage={handleUpdateActivityStage}
        onDeleteActivity={handleDeleteActivity}
        onAddStickyNote={handleAddStickyNote}
        onDeleteStickyNote={handleDeleteStickyNote}
      />

      <WorkstationDeskModal
        open={activeModal === 'workstation-desk'}
        onClose={() => setActiveModal(null)}
        officeState={officeState}
        ambientPlaying={ambientPlaying}
        onToggleAmbient={handleToggleAmbient}
        onUpdateScratchpad={handleUpdateScratchpad}
        onAddQuickLink={handleAddQuickLink}
        onDeleteQuickLink={handleDeleteQuickLink}
        onUpdateFocusSession={handleUpdateFocusSession}
      />
    </main>
  );
}
