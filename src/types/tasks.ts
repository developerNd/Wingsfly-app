export type Task = {
  id: number;
  title: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Completed' | 'In Progress' | 'Not Started';
  category: string;
  type: string;
  parentTitle: string;
}; 