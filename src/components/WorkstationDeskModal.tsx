'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  FocusSessionState,
  OfficeState,
} from '@/types/office';
import {
  Monitor,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Plus,
  Trash2,
  FileText,
  Save,
  X,
  Timer,
  Coffee,
  Zap,
} from 'lucide-react';
import { soundEngine } from '@/utils/soundEffects';

interface WorkstationDeskModalProps {
  open: boolean;
  onClose: () => void;
  officeState: OfficeState;
  ambientPlaying: boolean;
  onToggleAmbient: () => void;
  onUpdateScratchpad: (text: string) => void;
  onAddQuickLink: (link: {
    label: string;
    url: string;
    category: string;
  }) => void;
  onDeleteQuickLink: (linkId: string) => void;
  onUpdateFocusSession: (patch: Partial<FocusSessionState>) => void;
}

export default function WorkstationDeskModal({
  open,
  onClose,
  officeState,
  ambientPlaying,
  onToggleAmbient,
  onUpdateScratchpad,
  onAddQuickLink,
  onDeleteQuickLink,
  onUpdateFocusSession,
}: WorkstationDeskModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [scratchpad, setScratchpad] = useState(officeState.scratchpadText);
  const [savedIndicator, setSavedIndicator] = useState(false);

  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkCat, setLinkCat] = useState('Cloud');

  useEffect(() => {
    setScratchpad(officeState.scratchpadText);
  }, [officeState.scratchpadText]);

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

  const fs = officeState.focusSession;
  const mins = Math.floor(fs.remainingSeconds / 60);
  const secs = fs.remainingSeconds % 60;
  const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(
    2,
    '0'
  )}`;

  const handleSaveNotes = () => {
    soundEngine.playChime('click');
    onUpdateScratchpad(scratchpad);
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 2000);
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    const normalizedUrl = linkUrl.startsWith('http')
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;
    onAddQuickLink({
      label: linkLabel.trim(),
      url: normalizedUrl,
      category: linkCat,
    });
    setLinkLabel('');
    setLinkUrl('');
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby="workstation-desk-modal-title"
      onClose={onClose}
      className="m-auto w-full max-w-5xl rounded-3xl border-2 border-amber-500/50 bg-slate-950 p-0 text-white shadow-[0_0_80px_rgba(245,158,11,0.22)] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[88vh] flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/20 text-amber-400">
              <Monitor className="h-6 w-6" />
            </div>
            <div>
              <h2
                id="workstation-desk-modal-title"
                className="text-lg font-extrabold tracking-wide text-white"
              >
                Executive Command Desk — Dual-Monitor Workstation
              </h2>
              <p className="text-xs text-slate-400">
                Pomodoro Deep-Work Timer, Cloud Scratchpad Notes, Quick Launchers &amp; Ambient Focus Audio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleAmbient}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition ${
                ambientPlaying
                  ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300 shadow'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              {ambientPlaying ? (
                <>
                  <Volume2 className="h-4 w-4 animate-pulse text-emerald-400" />
                  <span>Ambient Focus Sound: ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 text-slate-400" />
                  <span>Ambient Focus Sound: OFF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 transition hover:text-white"
              title="Leave Desk (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Grid: Left = Pomodoro & Quick Links, Right = Executive Scratchpad */}
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 md:grid-cols-12">
          {/* Left 5 columns: Pomodoro Timer & Quick Links */}
          <div className="flex flex-col gap-5 md:col-span-5">
            {/* Pomodoro Card */}
            <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  <Timer className="h-4 w-4" /> Focus Session Timer
                </span>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                  {fs.completedSessionsToday} Sessions Done Today
                </span>
              </div>

              <div className="my-4 text-center">
                <div className="font-mono text-5xl font-black tracking-wider text-white">
                  {timeDisplay}
                </div>
                <p className="mt-1.5 truncate text-xs font-semibold text-sky-300">
                  {fs.activeActivityTitle || 'General Deep Work Sprint'}
                </p>
              </div>

              {/* Mode Presets */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                {[
                  {
                    id: 'pomodoro',
                    label: '25m Pomodoro',
                    sec: 25 * 60,
                    icon: Zap,
                  },
                  {
                    id: 'deep-work',
                    label: '50m Deep Work',
                    sec: 50 * 60,
                    icon: Monitor,
                  },
                  {
                    id: 'short-break',
                    label: '10m Break',
                    sec: 10 * 60,
                    icon: Coffee,
                  },
                ].map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playChime('click');
                        onUpdateFocusSession({
                          mode: preset.id as FocusSessionState['mode'],
                          durationSeconds: preset.sec,
                          remainingSeconds: preset.sec,
                          isRunning: false,
                        });
                      }}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2 text-[11px] font-bold transition ${
                        fs.mode === preset.id
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playChime(fs.isRunning ? 'click' : 'start');
                    onUpdateFocusSession({ isRunning: !fs.isRunning });
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold text-slate-950 shadow transition ${
                    fs.isRunning
                      ? 'bg-rose-400 hover:bg-rose-300'
                      : 'bg-amber-400 hover:bg-amber-300'
                  }`}
                >
                  {fs.isRunning ? (
                    <>
                      <Pause className="h-4 w-4 fill-current" /> Pause Timer
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" /> Start Focus
                      Timer
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateFocusSession({
                      remainingSeconds: fs.durationSeconds,
                      isRunning: false,
                    })
                  }
                  className="rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-slate-300 hover:text-white"
                  title="Reset Timer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Quick Links Launcher */}
            <div className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Workstation Quick Bookmarks
              </h3>
              <div className="mb-3 grid grid-cols-2 gap-2">
                {officeState.quickLinks.map((link) => (
                  <div
                    key={link.id}
                    className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 transition hover:border-amber-500/40"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 truncate text-xs font-bold text-sky-300 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => onDeleteQuickLink(link.id)}
                      className="text-slate-600 opacity-0 transition hover:text-rose-400 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddLink} className="mt-auto flex gap-1.5">
                <input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Label..."
                  className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-slate-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Right 7 columns: Executive Cloud Scratchpad */}
          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:col-span-7">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white">
                  Executive Desk Scratchpad &amp; Daily Log
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 shadow transition hover:bg-emerald-400"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savedIndicator ? 'Saved to Cloud!' : 'Save Notes'}</span>
              </button>
            </div>

            <textarea
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
              rows={14}
              placeholder="Write architecture notes, meeting takeaways, or daily thoughts here..."
              className="w-full flex-1 resize-none rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </dialog>
  );
}
