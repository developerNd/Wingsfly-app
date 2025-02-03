import { SubGoal } from '../data/goalsData';
import { Task } from '../types/task';
import { SubRoutine } from '../types/routine';

type DetailedGoalParams = {
  goalId: number;
  title: string;
  description: string;
  progress: number;
  color: string;
  icon: string;
  subGoals?: SubGoal[];
  parentBreadcrumbs?: Array<{
    id: number;
    title: string;
    goalId: number;
    subGoals?: SubGoal[];
  }>;
  topLevelGoalId?: number;
  isSubGoal?: boolean;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Home: { 
    user: { 
      name: string; 
      email: string;
      phone?: string;
    }
  };
  Goals: undefined;
  Tasks: {
    initialTasks?: Task[];
    title?: string;
  };
  DetailedGoal: DetailedGoalParams;
  DetailedRoutine: {
    routine: {
      id: number;
      title: string;
      progress: number;
      color: string;
      icon: string;
      totalSubRoutines: number;
      description: string;
      parentTitle?: string;
      subRoutines?: SubRoutine[];
    };
  };
  SubRoutine: {
    routineId: number;
    subRoutineId: number;
    routineColor: string;
  };
  MainTabs: undefined;
  ShortPlayer: {
    short: {
      id: number;
      title: string;
      duration: string;
      thumbnail: string;
      views: string;
    };
  };
  MusicPlayer: {
    track: {
      id: number;
      title: string;
      duration: string;
    };
    category: {
      id: number;
      name: string;
      coverImage: string;
    };
  };
  WorkTracking: {
    task: Task;
    initialTimeElapsed?: number;
  };
  QuotesScreen: undefined;
  ShortScreen: {
    initialShortId: number;
  };
  GoalAnalysis: undefined;
  TeamManagement: { goalId: number | null };
  Leaderboard: undefined;
  Routines: undefined;
  AppLock: undefined;
  ScheduleSettings: undefined;
  Permissions: undefined;
  ScheduleLock: undefined;
  ScheduleUnlock: undefined;
  AppUnlockSchedule: {
    packageName: string;
    appName: string;
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 