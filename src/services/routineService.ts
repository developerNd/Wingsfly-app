import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubRoutine, Activity } from '../types/routine';
import api from './api';
import { TaskPriority } from '../types/task';

export interface Routine {
  id: number;
  title: string;
  description: string;
  progress: number;
  color: string;
  icon: string;
  subRoutines: SubRoutine[];
  totalSubRoutines: number;
  parentTitle?: string;
  priority?: TaskPriority;
}

const transformRoutineResponse = (data: any): Routine => ({
  id: data.id,
  title: data.title,
  description: data.description,
  progress: data.progress,
  color: data.color,
  icon: data.icon,
  subRoutines: data.sub_routines || [],
  totalSubRoutines: data.total_sub_routines,
  parentTitle: data.parent_title,
  priority: data.priority
});

export const routineService = {
  createRoutine: async (routine: Partial<Routine>): Promise<Routine> => {
    try {
      const response = await api.post('/routines', routine);
      return transformRoutineResponse(response.data);
    } catch (error) {
      console.error('Error creating routine:', error);
      throw error;
    }
  },

  createSubRoutine: async (routineId: number, subRoutine: Partial<SubRoutine>): Promise<SubRoutine> => {
    try {
      const response = await api.post(`/routines/${routineId}/subroutines`, subRoutine);
      return response.data;
    } catch (error) {
      console.error('Error creating subroutine:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
      }
      throw error;
    }
  },

  createActivity: async (routineId: number, subRoutineId: number, activity: Partial<Activity>): Promise<Activity> => {
    try {
      const response = await api.post(`/routines/${routineId}/subroutines/${subRoutineId}/activities`, activity);
      return response.data;
    } catch (error) {
      console.error('Error creating activity:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
      }
      throw error;
    }
  },

  getAllRoutines: async (): Promise<Routine[]> => {
    try {
      const response = await api.get('/routines');
      return response.data.map(transformRoutineResponse);
    } catch (error) {
      console.error('Error fetching routines:', error);
      throw error;
    }
  },

  getRoutineDetails: async (routineId: number): Promise<Routine> => {
    try {
      const response = await api.get(`/routines/${routineId}`);
      return transformRoutineResponse(response.data);
    } catch (error) {
      console.error('Error fetching routine details:', error);
      throw error;
    }
  },

  getSubRoutineDetails: async (routineId: number, subRoutineId: number): Promise<SubRoutine> => {
    try {
      const response = await api.get(`/routines/${routineId}/subroutines/${subRoutineId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subroutine details:', error);
      throw error;
    }
  },

  updateRoutineProgress: async (routineId: number, progress: number): Promise<void> => {
    try {
      await api.patch(`/routines/${routineId}/progress`, { progress });
    } catch (error) {
      console.error('Error updating routine progress:', error);
      throw error;
    }
  },

  updateSubRoutineProgress: async (routineId: number, subRoutineId: number, progress: number): Promise<void> => {
    try {
      await api.patch(`/routines/${routineId}/subroutines/${subRoutineId}/progress`, { progress });
    } catch (error) {
      console.error('Error updating subroutine progress:', error);
      throw error;
    }
  },

  updateActivityStatus: async (
    routineId: number, 
    subRoutineId: number, 
    activityId: number, 
    status: 'completed' | 'in_progress'
  ): Promise<void> => {
    try {
      await api.patch(
        `/routines/${routineId}/subroutines/${subRoutineId}/activities/${activityId}/status`, 
        { status }
      );
    } catch (error) {
      console.error('Error updating activity status:', error);
      throw error;
    }
  },

  deleteRoutine: async (routineId: number): Promise<void> => {
    try {
      await api.delete(`/routines/${routineId}`);
    } catch (error) {
      console.error('Error deleting routine:', error);
      throw error;
    }
  },

  deleteSubRoutine: async (routineId: number, subRoutineId: number): Promise<void> => {
    try {
      await api.delete(`/routines/${routineId}/subroutines/${subRoutineId}`);
    } catch (error) {
      console.error('Error deleting subroutine:', error);
      throw error;
    }
  },

  deleteActivity: async (routineId: number, subRoutineId: number, activityId: number): Promise<void> => {
    try {
      await api.delete(`/routines/${routineId}/subroutines/${subRoutineId}/activities/${activityId}`);
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }
}; 