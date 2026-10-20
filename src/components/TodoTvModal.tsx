'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  OfficeState,
  PriorityLevel,
  TodoItem,
} from '@/types/office';
import {
  Tv,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Flame,
  Clock,
  Sparkles,
  X,
  Filter,
  CheckCheck,
} from 'lucide-react';
import { soundEngine } from '@/utils/soundEffects';

interface TodoTvModalProps {
  open: boolean;
  onClose: () => void;
  officeState: OfficeState;
  onAddTodo: (todo: {
    title: string;
    category: TodoItem['category'];
    priority: PriorityLevel;
    estimatedMinutes: number;
  }) => void;
  onToggleTodo: (todoId: string) => void;
  onDeleteTodo: (todoId: string) => void;
  onClearCompleted: () => void;
}

const PRIORITY_BADGE: Record<
  PriorityLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  critical: {
    label: 'CRITICAL',
    bg: 'bg-rose-500/20',
    text: 'text-rose-300',
    border: 'border-rose-500/40',
  },
  high: {
    label: 'HIGH',
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
  },
  medium: {
    label: 'MEDIUM',
    bg: 'bg-sky-500/20',
    text: 'text-sky-300',
    border: 'border-sky-500/40',
  },
  low: {
    label: 'LOW',
    bg: 'bg-slate-500/20',
    text: 'text-slate-300',
    border: 'border-slate-500/40',
  },
};

export default function TodoTvModal({
  open,
  onClose,
  officeState,
  onAddTodo,
  onToggleTodo,
  onDeleteTodo,
  onClearCompleted,
}: TodoTvModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TodoItem['category']>('Engineering');
  const [priority, setPriority] = useState<PriorityLevel>('high');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

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

  const totalCount = officeState.todos.length;
  const completedCount = officeState.todos.filter((t) => t.completed).length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTodos = officeState.todos.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    soundEngine.playChime('start');
    onAddTodo({
      title: title.trim(),
      category,
      priority,
      estimatedMinutes: Number(estimatedMinutes) || 25,
    });
    setTitle('');
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby="todo-tv-modal-title"
      onClose={onClose}
      className="m-auto w-full max-w-4xl rounded-3xl border-2 border-emerald-500/50 bg-slate-950 p-0 text-white shadow-[0_0_80px_rgba(16,185,129,0.25)] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[88vh] flex-col overflow-hidden">
        {/* Top Smart TV Bezel Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-emerald-950/50 to-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 shadow-inner">
              <Tv className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="todo-tv-modal-title"
                  className="text-lg font-extrabold tracking-wide text-white"
                >
                  85&quot; Executive Office Smart TV — Live To-Do Checklist
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                  4K Wall Display Synced
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Every task you add or check off here updates live on your 3D Office Wall TV
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 transition hover:border-slate-600 hover:text-white"
            title="Close TV Screen (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar & Metrics Strip */}
        <div className="grid grid-cols-1 gap-4 border-b border-slate-800/80 bg-slate-900/60 px-6 py-4 md:grid-cols-3">
          <div className="col-span-2 flex flex-col justify-center">
            <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="h-4 w-4" /> Daily To-Do Completion Rate
              </span>
              <span className="text-white">
                {completedCount} of {totalCount} Tasks Done ({progressPct}%)
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/90 px-3.5 py-2 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Est. Remaining
              </div>
              <div className="text-sm font-extrabold text-amber-400">
                {officeState.todos
                  .filter((t) => !t.completed)
                  .reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0)}{' '}
                mins
              </div>
            </div>
            {completedCount > 0 && (
              <button
                type="button"
                onClick={onClearCompleted}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-rose-500/40 hover:bg-rose-950/40 hover:text-rose-300"
              >
                <CheckCheck className="h-4 w-4" />
                Clear Done
              </button>
            )}
          </div>
        </div>

        {/* Add New To-Do Form */}
        <form
          onSubmit={handleSubmit}
          className="border-b border-slate-800 bg-slate-950 px-6 py-4"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a new item to your Office TV To-Do list..."
              className="min-w-[240px] flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
            />
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as TodoItem['category'])
              }
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-200 focus:border-emerald-400 focus:outline-none"
            >
              <option value="Deep Work">Deep Work</option>
              <option value="Engineering">Engineering</option>
              <option value="Admin">Admin</option>
              <option value="Meeting">Meeting</option>
              <option value="Personal">Personal</option>
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-200 focus:border-emerald-400 focus:outline-none"
            >
              <option value="critical">Critical Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <div className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-12 bg-transparent text-xs font-bold text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-400">m</span>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg transition hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4" /> Pin to TV
            </button>
          </div>
        </form>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between border-b border-slate-900 bg-slate-950/90 px-6 py-2.5">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            {(['all', 'pending', 'completed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1 text-xs font-bold capitalize transition ${
                  filter === f
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {f} (
                {f === 'all'
                  ? totalCount
                  : f === 'pending'
                  ? totalCount - completedCount
                  : completedCount}
                )
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400">
            Click any item to toggle completion on the 3D TV
          </span>
        </div>

        {/* Scrollable To-Do List */}
        <div className="flex-1 space-y-2.5 overflow-y-auto p-6">
          {filteredTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-12 text-center">
              <Tv className="h-10 w-10 text-slate-600" />
              <p className="mt-2 text-sm font-bold text-slate-300">
                No tasks in this view
              </p>
              <p className="text-xs text-slate-500">
                Add a task above to project it onto your Office Smart TV.
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => {
              const badge = PRIORITY_BADGE[todo.priority];
              return (
                <div
                  key={todo.id}
                  onClick={() => {
                    soundEngine.playChime(todo.completed ? 'click' : 'complete');
                    onToggleTodo(todo.id);
                  }}
                  className={`group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                    todo.completed
                      ? 'border-slate-800/80 bg-slate-900/40 opacity-65'
                      : 'border-slate-800 bg-slate-900/90 hover:border-emerald-500/50 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      className="text-emerald-400 transition group-hover:scale-110"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <Circle className="h-6 w-6 text-slate-500 group-hover:text-emerald-400" />
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          todo.completed
                            ? 'line-through text-slate-400'
                            : 'text-white'
                        }`}
                      >
                        {todo.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {todo.priority === 'critical' && (
                            <Flame className="mr-1 inline h-3 w-3" />
                          )}
                          {badge.label}
                        </span>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          {todo.category}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" /> {todo.estimatedMinutes}m
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTodo(todo.id);
                    }}
                    className="rounded-xl p-2 text-slate-500 opacity-70 transition hover:bg-rose-950/60 hover:text-rose-400 group-hover:opacity-100"
                    title="Remove Task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </dialog>
  );
}
