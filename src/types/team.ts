export type Milestone = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
};

export type LeaderboardEntry = {
  userId: string;
  score: number;
  rank: number;
};

export type TeamMember = {
  id: string;
  name: string;
  role: 'leader' | 'member';
  avatar: string;
  contribution: number;
  joinedDate: string;
  achievements: string[];
  streak: number;
};

export type Team = {
  id: string;
  goalId: number;
  name: string;
  description: string;
  members: TeamMember[];
  progress: number;
  milestones: Milestone[];
  leaderboard: LeaderboardEntry[];
  chatEnabled: boolean;
}; 