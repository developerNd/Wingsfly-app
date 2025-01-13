import { Task, TaskPriority, WorkMode, PomodoroSettings } from '../types/task';
import { LifeGoal, SubGoal } from '../types/goals';
import { lifeGoals } from './goalsData';

export const TASK_PRIORITY = {
  HIGH: 'HIGH' as TaskPriority,
  MEDIUM: 'MEDIUM' as TaskPriority,
  LOW: 'LOW' as TaskPriority,
} as const;

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

export const dailyRoutines = [
  {
    id: 1,
    title: 'Morning Routine',
    description: 'Start the day right',
    icon: '🌅',
    progress: 0,
    color: '#4CAF50',
    subRoutines: [
      {
        id: 101,
        title: 'Exercise',
        description: 'Morning workout session',
        progress: 75,
        time: '6:00 AM',
        color: '#4CAF50',
        icon: 'fitness-center',
        tasks: [
          {
            id: 1001,
            title: 'Morning Meditation',
            description: 'Start with 10 minutes meditation',
            scheduledDate: new Date(),
            scheduledTime: '06:00',
            duration: 10,
            priority: TASK_PRIORITY.HIGH,
            status: 'in_progress' as const,
            category: 'Exercise',
            type: 'routine',
            parentTitle: 'Exercise'
          },
          {
            id: 1002,
            title: 'Yoga Session',
            description: '30 minutes workout',
            scheduledDate: new Date(),
            scheduledTime: '06:15',
            duration: 30,
            priority: TASK_PRIORITY.HIGH,
            status: 'in_progress' as const,
            category: 'Exercise',
            type: 'routine',
            parentTitle: 'Morning Routine'
          }
        ]
      },
      {
        id: 102,
        title: 'Mindfulness',
        description: 'Meditation practice',
        progress: 60,
        time: '6:45 AM',
        color: '#9C27B0',
        icon: 'self-improvement',
        tasks: [
          // ... mindfulness tasks
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Evening Routine',
    description: 'Wind down properly',
    icon: '🌙',
    progress: 0,
    tasks: [
      {
        id: 2001,
        title: 'Review Today\'s Goals',
        description: 'Check progress on daily goals',
        scheduledDate: new Date(),
        scheduledTime: '20:00',
        duration: 15,
        priority: TASK_PRIORITY.MEDIUM,
        status: 'in_progress' as const,
        category: 'Evening Routine',
        type: 'routine',
        parentTitle: 'Evening Routine'
      },
      {
        id: 2002,
        title: 'Plan Tomorrow',
        description: 'Set goals for tomorrow',
        scheduledDate: new Date(),
        scheduledTime: '20:30',
        duration: 15,
        priority: TASK_PRIORITY.MEDIUM,
        status: 'in_progress' as const,
        category: 'Evening Routine',
        type: 'routine',
        parentTitle: 'Evening Routine'
      }
    ]
  }
];

// Combine both routine tasks and life goal tasks
export const tasks: Task[] = [
  // Add routine tasks
  ...dailyRoutines.flatMap(routine => 
    routine.subRoutines?.flatMap(subRoutine => subRoutine.tasks || []) || []
  ),
  
  // Add life goal tasks
  ...lifeGoals.flatMap(goal => 
    flattenSubGoals(goal.subGoals).map(subGoal => ({
      id: subGoal.id,
      title: subGoal.title,
      description: subGoal.description || '',
      scheduledDate: subGoal.dueDate ? new Date(subGoal.dueDate) : new Date(),
      scheduledTime: subGoal.startTime || '',
      duration: subGoal.duration || 0,
      priority: subGoal.priority || TASK_PRIORITY.MEDIUM,
      status: subGoal.completed ? ('completed' as const) : ('in_progress' as const),
      category: goal.title,
      type: 'goal',
      parentTitle: goal.title,
    }))
  )
];

// Helper function to flatten nested subgoals
function flattenSubGoals(subGoals: SubGoal[]): SubGoal[] {
  return subGoals.reduce((flat: SubGoal[], subGoal) => {
    const flattened = [subGoal];
    if (subGoal.subGoals) {
      flattened.push(...flattenSubGoals(subGoal.subGoals));
    }
    return [...flat, ...flattened];
  }, []);
}

export function getTodaysTasks(): Task[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return tasks.filter(task => {
    const taskDate = new Date(task.scheduledDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
}

export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'HIGH': return '#FF4444';
    case 'MEDIUM': return '#FFB041';
    case 'LOW': return '#4CAF50';
    default: return '#666666';
  }
}

export function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Career Growth': 'work',
    'Financial Freedom': 'account-balance',
    'Health & Fitness': 'fitness-center',
    'Morning Routine': 'wb-sunny',
    'Evening Routine': 'nights-stay',
    // Add more mappings as needed
  };
  return iconMap[category] || 'label';
} 