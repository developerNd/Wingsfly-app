import { Team } from '../types/team';

export const dummyTeams: Team[] = [
  {
    id: '1',
    goalId: 1,
    name: 'Career Growth Squad',
    description: 'Team focused on professional development and career advancement',
    members: [
      {
        id: 'u1',
        name: 'John Doe',
        role: 'leader',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        contribution: 85,
        joinedDate: '2024-01-01',
        achievements: ['First Milestone', 'Team Leader'],
        streak: 7
      },
      {
        id: 'u2',
        name: 'Jane Smith',
        role: 'member',
        avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
        contribution: 75,
        joinedDate: '2024-01-05',
        achievements: ['Active Contributor'],
        streak: 5
      }
    ],
    progress: 70,
    milestones: [
      {
        id: 'm1',
        title: 'Complete Certification',
        completed: true,
        dueDate: '2024-03-01'
      }
    ],
    leaderboard: [
      { userId: 'u1', score: 850, rank: 1 },
      { userId: 'u2', score: 750, rank: 2 }
    ],
    chatEnabled: true
  },
  {
    id: '2',
    goalId: 2,
    name: 'Financial Freedom',
    description: 'Group focused on achieving financial goals together',
    members: [
      {
        id: 'u3',
        name: 'John Doe',
        role: 'member',
        avatar: 'https://via.placeholder.com/40',
        contribution: 65,
        joinedDate: '2024-02-01',
        achievements: ['Savings Master'],
        streak: 4
      }
    ],
    progress: 45,
    milestones: [],
    leaderboard: [
      { userId: 'u3', score: 650, rank: 1 }
    ],
    chatEnabled: true
  }
]; 