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
import {
  Building2,
  Tv,
  LayoutGrid,
  Monitor,
  Sun,
  Sunset,
  Moon,
  Eye,
  Play,
  Pause,
  Navigation,
} from 'lucide-react';

const OfficeWorld3D = dynamic(() => import('@/components/OfficeWorld3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      <p className="mt-3 text-xs font-bold tracking-wide text-slate-300">
        Entering 3D Executive Office...
      </p>
    </div>
  ),
});

export default function WorkstationOfficePage() {
  const [officeState, setOfficeState] = useState<OfficeState>(
    INITIAL_OFFICE_STATE
  );
  // Start outside the main courtyard gate facing North toward the glass office entrance
  const [playerPos, setPlayerPos] = useState({
    x: 0.0,
    z: 21.5,
    rotY: 0,
  });

  const [cameraMode, setCameraMode] = useState<
    'third-person' | 'first-person' | 'aerial'
  >('third-person');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  const [currentZone, setCurrentZone] = useState(
    'Estate Avenue (Outside Gate)'
  );
  const [nearbyStation, setNearbyStation] =
    useState<InteractiveStationId | null>(null);

  // Active modals
  const [activeModal, setActiveModal] =
    useState<InteractiveStationId | null>(null);
  const [ambientPlaying, setAmbientPlaying] = useState(false);

  // Move input (kept for OfficeWorld3D prop compatibility)
  const [moveInput] = useState({
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

  const pendingTodosCount = useMemo(
    () => officeState.todos.filter((t) => !t.completed).length,
    [officeState.todos]
  );

  const nearbyStationMeta = useMemo(
    () => OFFICE_STATIONS.find((s) => s.id === nearbyStation) || null,
    [nearbyStation]
  );

  const fs = officeState.focusSession;
  const timerMins = Math.floor(fs.remainingSeconds / 60);
  const timerSecs = fs.remainingSeconds % 60;

  const cycleTimeOfDay = () => {
    setTimeOfDay((prev) =>
      prev === 'day' ? 'sunset' : prev === 'sunset' ? 'night' : 'day'
    );
  };

  const cycleCameraMode = () => {
    setCameraMode((prev) =>
      prev === 'third-person'
        ? 'first-person'
        : prev === 'first-person'
        ? 'aerial'
        : 'third-person'
    );
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D Walk-In Office World Canvas */}
      <OfficeWorld3D
        officeState={officeState}
        playerPos={playerPos}
        setPlayerPos={setPlayerPos}
        cameraMode={cameraMode}
        timeOfDay={timeOfDay}
        roofCutaway={false}
        moveInput={moveInput}
        teleportTarget={teleportTarget}
        onSelectStation={handleSelectStation}
        onNearbyStationChange={setNearbyStation}
        onCurrentZoneChange={setCurrentZone}
        onToggleTodo={handleToggleTodo}
        onUpdateActivityStage={handleUpdateActivityStage}
      />

      {/* ================= MINIMAL FLOATING TOP PILL BAR ================= */}
      <header className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-full border border-slate-800/80 bg-slate-950/75 px-3 py-1.5 shadow-xl backdrop-blur-md">
          {/* Current Zone Indicator */}
          <div className="flex items-center gap-2 pr-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-200">
              {currentZone}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Quick Walk / Teleport Pills */}
          <button
            type="button"
            onClick={() => triggerTeleport(0, 21.5, 0)}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            title="Stand Outside Courtyard Gate"
          >
            Outside
          </button>
          <button
            type="button"
            onClick={() => triggerTeleport(-3.2, -5.8, Math.PI)}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            title="Walk Inside Office to Smart TV & Activity Board"
          >
            <Navigation className="h-3 w-3 text-emerald-400" />
            <span>Inside Office</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Direct Station Openers */}
          <button
            type="button"
            onClick={() => setActiveModal('todo-tv')}
            className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500 hover:text-slate-950"
          >
            <Tv className="h-3.5 w-3.5" />
            <span>TV To-Dos ({pendingTodosCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('activity-board')}
            className="flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300 transition hover:bg-sky-500 hover:text-slate-950"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Board</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModal('workstation-desk')}
            className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500 hover:text-slate-950"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>
              Desk{' '}
              {fs.isRunning
                ? `(${String(timerMins).padStart(2, '0')}:${String(
                    timerSecs
                  ).padStart(2, '0')})`
                : ''}
            </span>
          </button>

          {/* Compact Play/Pause Focus Timer */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playChime(fs.isRunning ? 'click' : 'start');
              handleUpdateFocusSession({ isRunning: !fs.isRunning });
            }}
            className={`rounded-full p-1.5 transition ${
              fs.isRunning
                ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-slate-950'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title={fs.isRunning ? 'Pause Focus Timer' : 'Start Focus Timer'}
          >
            {fs.isRunning ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Camera View Toggle (Single Compact Pill) */}
          <button
            type="button"
            onClick={cycleCameraMode}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title="Switch Camera View (Walker / 1st Person / Drone)"
          >
            {cameraMode === 'third-person'
              ? 'Walker'
              : cameraMode === 'first-person'
              ? '1st Person'
              : 'Drone'}
          </button>

          {/* Time of Day Toggle (Single Icon Button) */}
          <button
            type="button"
            onClick={cycleTimeOfDay}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-amber-300"
            title={`Time of Day: ${timeOfDay} (Click to switch)`}
          >
            {timeOfDay === 'day' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : timeOfDay === 'sunset' ? (
              <Sunset className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* ================= SUBTLE BOTTOM INTERACTION PROMPT ================= */}
      {nearbyStationMeta ? (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
          <button
            type="button"
            onClick={() => handleSelectStation(nearbyStationMeta.id)}
            className="flex items-center gap-2.5 rounded-full border border-emerald-500/50 bg-slate-950/85 px-4 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition hover:scale-105 hover:border-emerald-400"
          >
            <Eye className="h-4 w-4 text-emerald-400" />
            <span>Open {nearbyStationMeta.name}</span>
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-emerald-300">
              E
            </kbd>
          </button>
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-slate-950/50 px-3 py-1 text-[11px] text-slate-400 backdrop-blur-sm">
          WASD / Arrows or Click floor to walk • Click TV, Board, or Desk inside
        </div>
      )}

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
