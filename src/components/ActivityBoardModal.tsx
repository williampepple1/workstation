'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityStage,
  DailyActivity,
  OfficeState,
  StickyNote,
} from '@/types/office';
import {
  LayoutGrid,
  Play,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  StickyNote as StickyIcon,
  ArrowRight,
  RotateCcw,
  X,
  Link2,
} from 'lucide-react';
import { soundEngine } from '@/utils/soundEffects';

interface ActivityBoardModalProps {
  open: boolean;
  onClose: () => void;
  officeState: OfficeState;
  onAddActivity: (act: {
    title: string;
    description: string;
    timeSlot: string;
    durationMinutes: number;
    colorTag: string;
    linkedTodoId?: string;
  }) => void;
  onUpdateStage: (activityId: string, stage: ActivityStage) => void;
  onDeleteActivity: (activityId: string) => void;
  onAddStickyNote: (note: {
    text: string;
    color: StickyNote['color'];
  }) => void;
  onDeleteStickyNote: (noteId: string) => void;
}

const COLOR_SWATCHES = ['#38bdf8', '#10b981', '#f59e0b', '#a855f7', '#ec4899'];
const STICKY_COLORS: StickyNote['color'][] = [
  '#fef08a',
  '#bae6fd',
  '#bbf7d0',
  '#fecdd3',
  '#e9d5ff',
];

export default function ActivityBoardModal({
  open,
  onClose,
  officeState,
  onAddActivity,
  onUpdateStage,
  onDeleteActivity,
  onAddStickyNote,
  onDeleteStickyNote,
}: ActivityBoardModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [tab, setTab] = useState<'kanban' | 'stickies'>('kanban');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeSlot, setTimeSlot] = useState('13:30 - 14:30');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [colorTag, setColorTag] = useState('#38bdf8');
  const [linkedTodoId, setLinkedTodoId] = useState('');

  // Sticky note inputs
  const [stickyText, setStickyText] = useState('');
  const [stickyColor, setStickyColor] =
    useState<StickyNote['color']>('#fef08a');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Fallback for browsers without closedby="any" support per modern-web-guidance
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClick = (event: MouseEvent) => {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!isDialogContent) {
          dialog.close();
        }
      }
    };
    dialog.addEventListener('click', handleClick);
    return () => dialog.removeEventListener('click', handleClick);
  }, []);

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    soundEngine.playChime('start');
    onAddActivity({
      title: title.trim(),
      description: description.trim() || 'Scheduled office session',
      timeSlot: timeSlot.trim() || 'Flexible',
      durationMinutes: Number(durationMinutes) || 45,
      colorTag,
      linkedTodoId: linkedTodoId || undefined,
    });
    setTitle('');
    setDescription('');
    setLinkedTodoId('');
  };

  const handleAddSticky = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stickyText.trim()) return;
    soundEngine.playChime('click');
    onAddStickyNote({
      text: stickyText.trim(),
      color: stickyColor,
    });
    setStickyText('');
  };

  const columns: {
    stage: ActivityStage;
    label: string;
    subtitle: string;
    accent: string;
  }[] = [
    {
      stage: 'planned',
      label: 'Planned Today',
      subtitle: 'Queued up on your daily schedule',
      accent: 'border-sky-500/40 text-sky-300',
    },
    {
      stage: 'active',
      label: 'Doing Right Now (In Office)',
      subtitle: 'Active deep-work block & timer',
      accent: 'border-amber-500/50 text-amber-300',
    },
    {
      stage: 'completed',
      label: 'Done Today',
      subtitle: 'Completed & synced to Office TV',
      accent: 'border-emerald-500/40 text-emerald-300',
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby="activity-board-modal-title"
      onClose={onClose}
      className="m-auto w-full max-w-6xl rounded-3xl border-2 border-sky-500/50 bg-slate-950 p-0 text-white shadow-[0_0_80px_rgba(56,189,248,0.25)] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[90vh] flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-sky-950/50 to-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/40 bg-sky-500/20 text-sky-400">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h2
                id="activity-board-modal-title"
                className="text-lg font-extrabold tracking-wide text-white"
              >
                Executive Activity &amp; Kanban Whiteboard
              </h2>
              <p className="text-xs text-slate-400">
                Start any activity here to do it in your office — completing a linked activity automatically checks off its To-Do on the Office TV!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('kanban')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                tab === 'kanban'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="h-4 w-4" /> Daily Activities (
              {officeState.activities.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('stickies')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                tab === 'stickies'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <StickyIcon className="h-4 w-4" /> Sticky Notes (
              {officeState.stickyNotes.length})
            </button>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="ml-2 rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 transition hover:text-white"
              title="Close Board (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {tab === 'kanban' ? (
          <>
            {/* New Activity Form */}
            <form
              onSubmit={handleAddActivity}
              className="border-b border-slate-800 bg-slate-900/60 px-6 py-3.5"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Activity title (e.g. Deep Work: Build Terraform API)..."
                  className="min-w-[200px] flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short note / objective..."
                  className="min-w-[180px] flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  placeholder="14:00 - 15:00"
                  className="w-28 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-sky-300 focus:border-sky-400 focus:outline-none"
                />
                <select
                  value={linkedTodoId}
                  onChange={(e) => setLinkedTodoId(e.target.value)}
                  className="max-w-[200px] rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-sky-400 focus:outline-none"
                >
                  <option value="">Link to TV To-Do (Optional)</option>
                  {officeState.todos
                    .filter((t) => !t.completed)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        TV: {t.title.slice(0, 32)}
                      </option>
                    ))}
                </select>
                <div className="flex items-center gap-1">
                  {COLOR_SWATCHES.map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => setColorTag(sw)}
                      className={`h-5 w-5 rounded-full transition ${
                        colorTag === sw
                          ? 'scale-125 ring-2 ring-white'
                          : 'opacity-70'
                      }`}
                      style={{ backgroundColor: sw }}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-xl bg-sky-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow transition hover:bg-sky-400"
                >
                  <Plus className="h-4 w-4" /> Add to Board
                </button>
              </div>
            </form>

            {/* 3-Column Kanban Board */}
            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-3">
              {columns.map((col) => {
                const items = officeState.activities.filter(
                  (a) => a.stage === col.stage
                );
                return (
                  <div
                    key={col.stage}
                    className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div>
                        <h3 className={`text-sm font-extrabold ${col.accent}`}>
                          {col.label}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {col.subtitle}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-white">
                        {items.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-3">
                      {items.map((act: DailyActivity) => {
                        const linkedTodo = officeState.todos.find(
                          (t) => t.id === act.linkedTodoId
                        );
                        return (
                          <div
                            key={act.id}
                            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-3.5 shadow-md transition hover:border-slate-700"
                            style={{
                              borderLeftWidth: '5px',
                              borderLeftColor: act.colorTag,
                            }}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                                  <Clock className="mr-1 inline h-3 w-3" />
                                  {act.timeSlot} ({act.durationMinutes}m)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onDeleteActivity(act.id)}
                                  className="text-slate-500 transition hover:text-rose-400"
                                  title="Delete activity"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <h4 className="mt-2 text-sm font-extrabold text-white">
                                {act.title}
                              </h4>
                              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                                {act.description}
                              </p>
                              {linkedTodo && (
                                <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                                  <Link2 className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    TV Task: {linkedTodo.title}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons to Do / Complete Activity */}
                            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-900 pt-2.5">
                              {act.stage === 'planned' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundEngine.playChime('start');
                                    onUpdateStage(act.id, 'active');
                                  }}
                                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 shadow transition hover:bg-amber-400"
                                >
                                  <Play className="h-3.5 w-3.5 fill-current" />
                                  Do Activity Now
                                </button>
                              )}

                              {act.stage === 'active' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundEngine.playChime('complete');
                                      onUpdateStage(act.id, 'completed');
                                    }}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-slate-950 shadow transition hover:bg-emerald-400"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Mark Done
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateStage(act.id, 'planned')
                                    }
                                    className="rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white"
                                    title="Move back to Planned"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}

                              {act.stage === 'completed' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateStage(act.id, 'active')
                                  }
                                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-amber-300"
                                >
                                  <ArrowRight className="h-3 w-3" /> Re-open
                                  Activity
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Sticky Notes Pinboard Tab */
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            <form
              onSubmit={handleAddSticky}
              className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <input
                type="text"
                value={stickyText}
                onChange={(e) => setStickyText(e.target.value)}
                placeholder="Write a sticky note to pin on your 3D Office Board..."
                className="min-w-[240px] flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                {STICKY_COLORS.map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setStickyColor(sc)}
                    className={`h-7 w-7 rounded-lg border-2 transition ${
                      stickyColor === sc
                        ? 'scale-110 border-white shadow-lg'
                        : 'border-transparent opacity-75'
                    }`}
                    style={{ backgroundColor: sc }}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow hover:bg-amber-300"
              >
                <Plus className="h-4 w-4" /> Pin Sticky Note
              </button>
            </form>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {officeState.stickyNotes.map((note) => (
                <div
                  key={note.id}
                  className="relative flex min-h-[150px] flex-col justify-between rounded-2xl p-5 text-slate-950 shadow-xl transition hover:-translate-y-0.5"
                  style={{ backgroundColor: note.color }}
                >
                  <p className="text-sm font-bold leading-relaxed">
                    {note.text}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-2 text-[11px] font-bold opacity-75">
                    <span>— {note.author}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteStickyNote(note.id)}
                      className="rounded p-1 hover:bg-black/10"
                      title="Remove sticky note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
