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
};

export type LifeGoal = {
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
};

export const lifeGoals: LifeGoal[] = [
  {
    id: 1,
    title: 'Career Growth',
    description: 'Become a Senior Developer',
    progress: 45,
    color: '#4CAF50',
    icon: 'work',
    subGoals: [
      {
        id: 101,
        title: 'Learn new framework',
        completed: true,
        progress: 100,
        dueDate: '2024-04-01',
        subGoals: [
          {
            id: 1011,
            title: 'Complete React Course',
            completed: true,
            progress: 100,
            dueDate: '2024-12-10',
          },
          {
            id: 1012,
            title: 'Build Practice Project',
            completed: true,
            progress: 100,
            dueDate: '2024-03-30',
          }
        ]
      },
      {
        id: 102,
        title: 'Complete certification',
        completed: false,
        progress: 30,
        dueDate: '2024-05-15',
        subGoals: [
          {
            id: 1021,
            title: 'Study Materials',
            completed: true,
            progress: 100,
            dueDate: '2024-04-30',
          },
          {
            id: 1022,
            title: 'Practice Tests',
            completed: false,
            progress: 0,
            dueDate: '2024-05-10',
          }
        ]
      }
    ]
  },
  {
    id: 2,
    title: 'Financial Freedom',
    description: 'Save for retirement',
    progress: 30,
    color: '#9C27B0',
    icon: 'account-balance',
    subGoals: [
      {
        id: 201,
        title: 'Build Emergency Fund',
        description: 'Save 6 months of expenses',
        completed: true,
        progress: 100,
        dueDate: '2024-03-15',
        subGoals: [
          {
            id: 2011,
            title: 'Calculate Monthly Expenses',
            completed: true,
            progress: 100,
            dueDate: '2024-01-15',
            subGoals: [
              {
                id: 20111,
                title: 'Track Daily Expenses',
                completed: true,
                progress: 100,
                dueDate: '2024-01-01',
                subGoals: [
                  {
                    id: 201111,
                    title: 'Install Expense App',
                    completed: true,
                    progress: 100,
                    dueDate: '2023-12-25',
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 202,
        title: 'Investment Portfolio',
        description: 'Diversify investments',
        completed: false,
        progress: 40,
        dueDate: '2024-06-30',
        subGoals: [
          {
            id: 2021,
            title: 'Research Investment Options',
            completed: true,
            progress: 100,
            dueDate: '2024-04-15',
            subGoals: [
              {
                id: 20211,
                title: 'Study Stock Market',
                completed: true,
                progress: 100,
                dueDate: '2024-03-15',
                subGoals: [
                  {
                    id: 202111,
                    title: 'Complete Investment Course',
                    completed: true,
                    progress: 100,
                    dueDate: '2024-02-28',
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 203,
        title: 'Retirement Planning',
        description: 'Set up retirement accounts',
        completed: false,
        progress: 20,
        dueDate: '2024-12-31',
        subGoals: [
          {
            id: 2031,
            title: 'Research Retirement Accounts',
            completed: true,
            progress: 100,
            dueDate: '2024-05-15',
            subGoals: [
              {
                id: 20311,
                title: 'Compare 401k Options',
                completed: false,
                progress: 50,
                dueDate: '2024-04-30',
                subGoals: [
                  {
                    id: 203111,
                    title: 'Meet Financial Advisor',
                    completed: false,
                    progress: 0,
                    dueDate: '2024-04-15',
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 3,
    title: 'Health & Fitness',
    description: 'Run a marathon',
    progress: 65,
    color: '#FF9800',
    icon: 'fitness-center',
    subGoals: [
      { id: 301, title: 'Start 5K training', completed: true, progress: 100, dueDate: '2024-03-01' },
      { id: 302, title: 'Complete 10K race', completed: true, progress: 100, dueDate: '2024-04-15' },
      { id: 303, title: 'Half marathon prep', completed: false, progress: 0, dueDate: '2024-06-01' },
    ],
  },
  {
    id: 4,
    title: 'Personal Growth',
    description: 'Learn new skills',
    progress: 50,
    color: '#2196F3',
    icon: 'psychology',
    subGoals: [
      { id: 401, title: 'Read 12 books', completed: true,  progress: 100, dueDate: '2024-12-31' },
      { id: 402, title: 'Learn a language', completed: false, progress: 0, dueDate: '2024-06-30' },
      { id: 403, title: 'Take online courses', completed: false, progress: 0, dueDate: '2024-09-01' },
    ],
  },
  {
    id: 5,
    title: 'Travel Goals',
    description: 'Visit 10 countries',
    progress: 25,
    color: '#E91E63',
    icon: 'flight',
    subGoals: [
      { id: 501, title: 'Plan first trip', completed: true, progress: 100, dueDate: '2024-05-01' },
      { id: 502, title: 'Get passport renewed', completed: false, progress: 0, dueDate: '2024-04-15' },
      { id: 503, title: 'Save travel fund', completed: false, progress: 0, dueDate: '2024-07-01' },
    ],
  },
]; 