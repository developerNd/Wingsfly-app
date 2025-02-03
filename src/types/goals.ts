import { TaskPriority } from './task';

export interface SubGoal {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  progress: number;
  dueDate: string | undefined;
  startDate: string | undefined;
  endDate: string | undefined;
  startTime: string | undefined;
  start_time: string | undefined;
  endTime: string | undefined;
  end_time: string | undefined;
  duration: number;
  isTemporary: boolean;
  subGoals?: SubGoal[];
  priority: string;
  color?: string;
  icon?: string;
}

export interface LifeGoal {
  id: number;
  title: string;
  description: string;
  progress: number;
  color: string;
  icon: string;
  subGoals: SubGoal[];
  isTemporary?: boolean;
  is_temporary?: boolean;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  subGoalsCount?: number;
  priority?: TaskPriority;
  category: string;
} 