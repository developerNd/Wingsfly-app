import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LifeGoal, SubGoal } from '../types/goals';

export interface SubGoalRequestData {
  title: string;
  description: string;
  completed: boolean;
  progress: number;
  start_date?: string | null;
  end_date?: string | null;
  due_date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration: number;
  is_temporary: boolean;
  parent_id: number | null;
  parent_type: string | null;
  priority: string;
  color?: string;
  icon?: string;
}

interface GoalRequestData {
  title: string;
  description?: string;
  category: string;
  priority: string;
  start_time?: string | null;
  end_time?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  duration?: number;
  is_temporary?: boolean;
  color?: string;
  icon?: string;
}

// const API_URL = 'http://10.0.2.2:8000/api';
const API_URL = 'https://api.wingsfly.in/api';


// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add interceptor to add token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const goalService = {
  createGoal: async (goal: Partial<GoalRequestData>): Promise<LifeGoal> => {
    try {
      console.log('Creating goal with data:', goal);
      const response = await api.post('/goals', {
        title: goal.title,
        description: goal.description || '',
        category: goal.category,
        priority: goal.priority,
        start_time: goal.start_time || null,
        end_time: goal.end_time || null,
        start_date: goal.start_date || null,
        end_date: goal.end_date || null,
        duration: goal.duration || 0,
        is_temporary: goal.is_temporary || false,
        color: goal.color,
        icon: goal.icon
      });
      return response.data;
    } catch (error) {
      console.error('Error creating goal:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
      }
      throw error;
    }
  },

  createSubGoal: async (goalId: number, subGoal: SubGoalRequestData): Promise<SubGoal> => {
    try {
      console.log('Received subGoal data:', subGoal);
      
      // If parent_id is set, this is a nested subgoal
      const endpoint = subGoal.parent_id 
        ? `/goals/subgoals/${subGoal.parent_id}/nested`
        : `/goals/${goalId}/subgoals`;

      console.log('Using endpoint:', endpoint);
      const response = await api.post(endpoint, subGoal);
      return response.data;
    } catch (error) {
      console.error('Error creating subgoal:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
      }
      throw error;
    }
  },

  getAllGoals: async (): Promise<LifeGoal[]> => {
    try {
      const response = await api.get('/goals');
      return response.data;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  getGoalDetails: async (goalId: number): Promise<LifeGoal> => {
    try {
      const response = await api.get(`/goals/${goalId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching goal details:', error);
      throw error;
    }
  },

  getSubGoalDetails: async (subgoalId: number): Promise<SubGoal> => {
    try {
      const response = await api.get(`/goals/subgoals/${subgoalId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subgoal details:', error);
      throw error;
    }
  },

  updateSubGoal: async (subgoalId: number, updates: Partial<SubGoal>): Promise<SubGoal> => {
    try {
      const response = await api.put(`/goals/subgoals/${subgoalId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating subgoal:', error);
      throw error;
    }
  },

  deleteSubGoal: async (subgoalId: number): Promise<void> => {
    try {
      await api.delete(`/goals/subgoals/${subgoalId}`);
    } catch (error) {
      console.error('Error deleting subgoal:', error);
      throw error;
    }
  },

  deleteGoal: async (goalId: number): Promise<void> => {
    try {
      await api.delete(`/goals/${goalId}`);
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  },

  updateGoal: async (goalId: number, updates: Partial<LifeGoal>): Promise<LifeGoal> => {
    try {
      const response = await api.put(`/goals/${goalId}`, updates);
      return response.data;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },

  // deleteSubGoal: async (subGoalId: number): Promise<void> => {
  //   try {
  //     await api.delete(`/goals/subgoals/${subGoalId}`);
  //   } catch (error) {
  //     console.error('Error deleting subgoal:', error);
  //     throw error;
  //   }
  // }
}; 