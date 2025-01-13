import { TaskPriority } from './task';

export type SubGoal = {
  id: number;
  title: string;
  completed: boolean;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  description?: string;
  subGoals?: SubGoal[];
  progress: number;
  isTemporary?: boolean;
  priority?: TaskPriority;
  parent_id?: number | null;
  parent_type?: string | null;
};

export interface LifeGoal {
  id: number;
  title: string;
  description: string;
  progress: number;
  color: string;
  icon: string;
  subGoals: SubGoal[];
  isTemporary?: boolean;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  subGoalsCount?: number;
  priority?: TaskPriority;
} 