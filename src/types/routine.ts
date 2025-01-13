import { TaskPriority } from './task';

export type Activity = {
  id: number;
  title: string;
  description?: string;
  status: 'completed' | 'in_progress';
  scheduled_time?: string;
  duration?: number;
  priority?: TaskPriority;
  type?: string;
  category?: string;
  parent_title?: string;
};

export type SubRoutine = {
  id: number;
  title: string;
  description?: string;
  progress: number;
  time?: string;
  activities?: Activity[];
  priority?: TaskPriority;
};

export type Routine = {
  id: number;
  title: string;
  description: string;
  progress: number;
  color: string;
  icon: string;
  totalSubRoutines: number;
  isTemporary?: boolean;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  priority?: TaskPriority;
  subRoutines?: SubRoutine[];
};