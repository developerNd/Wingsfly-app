export type WorkMode = 'timer' | 'pomodoro';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export const TASK_PRIORITY = {
  HIGH: 'HIGH' as TaskPriority,
  MEDIUM: 'MEDIUM' as TaskPriority,
  LOW: 'LOW' as TaskPriority,
} as const;

export interface Task {
  id: number;
  title: string;
  description: string;
  scheduledDate: Date;
  scheduledTime: string;
  duration: number;
  priority: TaskPriority;
  status: 'completed' | 'in_progress';
  category: string;
  type: string;
  parentTitle: string;
  reminderTime?: Date;
  parentId?: number;
  routineId?: number;
  subRoutineId?: number;
}

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export interface WorkSession {
  id: number;
  taskId: number;
  startTime: Date;
  endTime?: Date;
  duration: number;
  mode: WorkMode;
  pomodoroSettings?: PomodoroSettings;
} 