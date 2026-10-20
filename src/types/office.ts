export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type TodoStatus = 'todo' | 'in_progress' | 'done';

export interface TodoItem {
  id: string;
  title: string;
  category: 'Deep Work' | 'Engineering' | 'Admin' | 'Personal' | 'Meeting';
  priority: PriorityLevel;
  completed: boolean;
  estimatedMinutes: number;
  createdAt: string;
  completedAt?: string;
}

export type ActivityStage = 'planned' | 'active' | 'completed';

export interface DailyActivity {
  id: string;
  title: string;
  description: string;
  timeSlot: string; // e.g. "09:00 - 10:30"
  durationMinutes: number;
  stage: ActivityStage;
  colorTag: string; // hex color for board card
  linkedTodoId?: string;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface StickyNote {
  id: string;
  text: string;
  color: '#fef08a' | '#bae6fd' | '#bbf7d0' | '#fecdd3' | '#e9d5ff';
  author: string;
  createdAt: string;
}

export interface QuickLink {
  id: string;
  label: string;
  url: string;
  category: string;
}

export interface FocusSessionState {
  activeActivityId: string | null;
  activeActivityTitle: string;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  mode: 'pomodoro' | 'deep-work' | 'short-break';
  completedSessionsToday: number;
}

export interface OfficeState {
  officeName: string;
  ownerName: string;
  dailyMotto: string;
  todos: TodoItem[];
  activities: DailyActivity[];
  stickyNotes: StickyNote[];
  scratchpadText: string;
  quickLinks: QuickLink[];
  focusSession: FocusSessionState;
  updatedAt: string;
}

export type InteractiveStationId =
  | 'todo-tv'
  | 'activity-board'
  | 'workstation-desk'
  | 'focus-lounge'
  | 'reception-kiosk';

export interface StationHotspot {
  id: InteractiveStationId;
  name: string;
  subtitle: string;
  room: string;
  position: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
  standPos: { x: number; z: number; rotY: number };
  accentColor: string;
}
