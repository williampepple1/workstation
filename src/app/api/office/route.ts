import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INITIAL_OFFICE_STATE } from '@/data/initial-office';
import {
  ActivityStage,
  DailyActivity,
  OfficeState,
  PriorityLevel,
  QuickLink,
  StickyNote,
  TodoItem,
} from '@/types/office';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'office-db.json');

function readDb(): OfficeState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw) as OfficeState;
      return {
        ...INITIAL_OFFICE_STATE,
        ...parsed,
        todos: parsed.todos || INITIAL_OFFICE_STATE.todos,
        activities: parsed.activities || INITIAL_OFFICE_STATE.activities,
        stickyNotes: parsed.stickyNotes || INITIAL_OFFICE_STATE.stickyNotes,
        quickLinks: parsed.quickLinks || INITIAL_OFFICE_STATE.quickLinks,
        focusSession: parsed.focusSession || INITIAL_OFFICE_STATE.focusSession,
      };
    }
  } catch (err) {
    console.error('Error reading office DB, falling back to initial state:', err);
  }
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(INITIAL_OFFICE_STATE, null, 2),
      'utf8'
    );
  } catch (err) {
    console.error('Could not write initial office DB file:', err);
  }
  return structuredClone(INITIAL_OFFICE_STATE);
}

function writeDb(state: OfficeState): OfficeState {
  state.updatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf8');
  return state;
}

export async function GET() {
  const state = readDb();
  return NextResponse.json({ ok: true, data: state });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const state = readDb();

    if (action === 'sync_full_state' && body.state) {
      const updated = writeDb({
        ...state,
        ...body.state,
      });
      return NextResponse.json({ ok: true, data: updated });
    }

    if (action === 'add_todo') {
      const newTodo: TodoItem = {
        id: `todo-${Date.now()}`,
        title: String(body.title || 'New Task').trim(),
        category: body.category || 'Engineering',
        priority: (body.priority as PriorityLevel) || 'high',
        completed: false,
        estimatedMinutes: Number(body.estimatedMinutes) || 30,
        createdAt: new Date().toISOString(),
      };
      state.todos.unshift(newTodo);
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'toggle_todo') {
      const target = state.todos.find((t) => t.id === body.todoId);
      if (target) {
        target.completed = !target.completed;
        target.completedAt = target.completed
          ? new Date().toISOString()
          : undefined;
      }
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'delete_todo') {
      state.todos = state.todos.filter((t) => t.id !== body.todoId);
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'clear_completed_todos') {
      state.todos = state.todos.filter((t) => !t.completed);
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'add_activity') {
      const newAct: DailyActivity = {
        id: `act-${Date.now()}`,
        title: String(body.title || 'New Activity').trim(),
        description: String(body.description || '').trim(),
        timeSlot: String(body.timeSlot || '11:00 - 12:00').trim(),
        durationMinutes: Number(body.durationMinutes) || 60,
        stage: (body.stage as ActivityStage) || 'planned',
        colorTag: body.colorTag || '#38bdf8',
        linkedTodoId: body.linkedTodoId || undefined,
      };
      state.activities.push(newAct);
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'update_activity_stage') {
      const target = state.activities.find((a) => a.id === body.activityId);
      if (target) {
        const nextStage = body.stage as ActivityStage;
        target.stage = nextStage;
        if (nextStage === 'active') {
          target.startedAt = new Date().toISOString();
          state.focusSession = {
            ...state.focusSession,
            activeActivityId: target.id,
            activeActivityTitle: target.title,
            durationSeconds: (target.durationMinutes || 25) * 60,
            remainingSeconds: (target.durationMinutes || 25) * 60,
            isRunning: true,
          };
        } else if (nextStage === 'completed') {
          target.completedAt = new Date().toISOString();
          if (target.linkedTodoId) {
            const linked = state.todos.find(
              (t) => t.id === target.linkedTodoId
            );
            if (linked && !linked.completed) {
              linked.completed = true;
              linked.completedAt = new Date().toISOString();
            }
          }
          if (state.focusSession.activeActivityId === target.id) {
            state.focusSession.isRunning = false;
            state.focusSession.completedSessionsToday += 1;
          }
        }
      }
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'delete_activity') {
      state.activities = state.activities.filter(
        (a) => a.id !== body.activityId
      );
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'add_sticky_note') {
      const note: StickyNote = {
        id: `note-${Date.now()}`,
        text: String(body.text || '').trim(),
        color: body.color || '#fef08a',
        author: String(body.author || state.ownerName).trim(),
        createdAt: new Date().toISOString(),
      };
      state.stickyNotes.unshift(note);
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'delete_sticky_note') {
      state.stickyNotes = state.stickyNotes.filter(
        (n) => n.id !== body.noteId
      );
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'update_scratchpad') {
      state.scratchpadText = String(body.scratchpadText ?? '');
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'add_quick_link') {
      const link: QuickLink = {
        id: `link-${Date.now()}`,
        label: String(body.label || 'Resource').trim(),
        url: String(body.url || 'https://').trim(),
        category: String(body.category || 'Work').trim(),
      };
      state.quickLinks.push(link);
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'delete_quick_link') {
      state.quickLinks = state.quickLinks.filter((l) => l.id !== body.linkId);
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    if (action === 'update_focus_session') {
      state.focusSession = {
        ...state.focusSession,
        ...(body.focusSession || {}),
      };
      writeDb(state);
      return NextResponse.json({ ok: true, data: state });
    }

    return NextResponse.json(
      { ok: false, error: 'Unknown action' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Office API error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
