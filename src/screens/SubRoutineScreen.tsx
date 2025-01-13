import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Task } from '../types/task';
import AddTemporaryGoalModal from '../components/AddTemporaryGoalModal';
import { routineService } from '../services/routineService';
import { Activity, SubRoutine } from '../types/routine';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, 'SubRoutine'>;

const SubRoutineScreen = ({ route, navigation }: Props) => {
  const { routineId, subRoutineId, routineColor } = route.params;
  const [subRoutine, setSubRoutine] = useState<SubRoutine | null>(null);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadSubRoutineDetails();
    }, [routineId, subRoutineId])
  );

  const loadSubRoutineDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await routineService.getSubRoutineDetails(routineId, subRoutineId);
      console.log('Loaded subroutine details:', details);
      console.log('Activities:', details.activities);
      setSubRoutine(details);
    } catch (error) {
      console.error('Error loading subroutine details:', error);
      setError('Failed to load subroutine details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (newActivity: Partial<Activity>) => {
    try {
      setLoading(true);
      setError(null);

      const activityData: Partial<Activity> = {
        title: newActivity.title || '',
        description: newActivity.description || '',
        status: 'in_progress' as const,
        type: 'routine',
        category: subRoutine?.title || '',
        parent_title: subRoutine?.title || '',
        scheduled_time: newActivity.scheduled_time || '09:00',
        duration: newActivity.duration || 0,
        priority: newActivity.priority || 'MEDIUM'
      };

      const createdActivity = await routineService.createActivity(
        routineId,
        subRoutineId,
        activityData
      );

      console.log('Created activity:', createdActivity);
      await loadSubRoutineDetails();
      setShowAddActivityModal(false);
    } catch (error) {
      console.error('Error adding activity:', error);
      setError('Failed to add activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              setError(null);
              await routineService.deleteActivity(routineId, subRoutineId, activityId);
              await loadSubRoutineDetails();
            } catch (error) {
              console.error('Error deleting activity:', error);
              setError('Failed to delete activity. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteSubRoutine = async () => {
    Alert.alert(
      "Delete Sub-Routine",
      "Are you sure you want to delete this sub-routine? All activities within it will also be deleted. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              setError(null);
              await routineService.deleteSubRoutine(routineId, subRoutineId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting sub-routine:', error);
              setError('Failed to delete sub-routine. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleActivityCompletion = async (activity: Activity) => {
    try {
      const newStatus = activity.status === 'completed' ? 'in_progress' : 'completed';
      await routineService.updateActivityStatus(routineId, subRoutineId, activity.id, newStatus);
      
      // Update local state
      setSubRoutine(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          activities: (prev.activities || []).map(a => 
            a.id === activity.id ? { ...a, status: newStatus } : a
          )
        };
      });

      // Calculate and update subroutine progress
      const updatedSubroutine = await routineService.getSubRoutineDetails(routineId, subRoutineId);
      const totalActivities = updatedSubroutine.activities?.length || 0;
      const completedActivities = updatedSubroutine.activities?.filter(a => a.status === 'completed').length || 0;
      const subroutineProgress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;
      await routineService.updateSubRoutineProgress(routineId, subRoutineId, subroutineProgress);

      // Get routine details and update overall progress
      const routine = await routineService.getRoutineDetails(routineId);
      const totalSubroutines = routine.subRoutines?.length || 0;
      const subroutineProgresses = routine.subRoutines?.map(sr => sr.progress) || [];
      const routineProgress = totalSubroutines > 0 
        ? Math.round(subroutineProgresses.reduce((acc, curr) => acc + curr, 0) / totalSubroutines)
        : 0;
      await routineService.updateRoutineProgress(routineId, routineProgress);

    } catch (error) {
      console.error('Error updating activity status:', error);
      Alert.alert('Error', 'Failed to update activity status');
    }
  };

  const renderTask = (task: Task) => (
    <TouchableOpacity
      key={task.id}
      style={styles.taskCard}
      onPress={() => navigation.navigate('WorkTracking', { task })}
    >
      <View style={[styles.taskGradient, { backgroundColor: `${routineColor}10` }]}>
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            {task.scheduledTime && (
              <View style={[styles.taskTimeContainer, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                <Icon name="access-time" size={16} color={routineColor} />
                <Text style={[styles.taskTime, { color: routineColor }]}>
                  {task.scheduledTime}
                </Text>
              </View>
            )}
            {task.status === 'completed' ? (
              <View style={[styles.completedBadge, { backgroundColor: '#4CAF50' }]}>
                <Icon name="check-circle" size={14} color="#FFF" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            ) : (
              <View style={[styles.todoBadge, { backgroundColor: '#FF6B00' }]}>
                <Icon name="schedule" size={14} color="#FFF" />
                <Text style={styles.todoText}>To Do</Text>
              </View>
            )}
            {task.priority && (
              <View style={[styles.priorityBadge, { 
                backgroundColor: task.priority === 'HIGH' ? '#FF4444' :
                               task.priority === 'MEDIUM' ? '#1A2980' : '#4CAF50'
              }]}>
                <Icon name="flag" size={14} color="#FFF" />
                <Text style={styles.priorityText}>{task.priority}</Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: task.status === 'completed' ? '#4CAF5020' : '#FF6B0020' }]}
              onPress={(e) => {
                e.stopPropagation();
                handleActivityCompletion(task as Activity);
              }}
            >
              <Icon
                name={task.status === 'completed' ? 'check-circle' : 'radio-button-unchecked'}
                size={24}
                color={task.status === 'completed' ? '#4CAF50' : '#FF6B00'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteActivity(task.id);
              }}
            >
              <Icon name="delete" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.taskContent}>
          <View style={[styles.categoryIcon, { 
            backgroundColor: routineColor + '15',
            borderColor: routineColor + '30'
          }]}>
            <Icon name="task-alt" size={24} color={routineColor} />
          </View>
          <View style={styles.taskInfo}>
            <Text style={[
              styles.taskTitle,
              { color: '#1A2980' },
              task.status === 'completed' && styles.completedTaskTitle
            ]}>
              {task.title}
            </Text>
            {task.description && (
              <Text style={[
                styles.taskDescription,
                { color: 'rgba(26, 41, 128, 0.7)' },
                task.status === 'completed' && styles.completedTaskDescription
              ]} numberOfLines={2}>
                {task.description}
              </Text>
            )}
            <View style={styles.taskFooter}>
              {task.duration && (
                <View style={[styles.durationBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                  <Icon name="timer" size={14} color={routineColor} />
                  <Text style={[styles.taskDuration, { color: routineColor }]}>
                    {task.duration} min
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !subRoutine) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={routineColor || '#FF6B00'} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#1A2980', '#26D0CE']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{subRoutine?.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.breadcrumbContainer}>
          <Text style={styles.breadcrumbText}>Routine / {subRoutine?.title}</Text>
        </View>
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
          style={styles.overallProgress}
        >
          <Text style={styles.overallTitle}>Overall Progress</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${subRoutine?.progress || 0}%`, backgroundColor: '#FFF' }]} />
          </View>
          <Text style={styles.progressText}>{subRoutine?.progress || 0}% Complete</Text>
        </LinearGradient>
      </LinearGradient>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              loadSubRoutineDetails();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddActivityModal(true)}
          >
            <Icon name="add-task" size={24} color="#FF6B00" />
            <Text style={styles.addButtonText}>Add Activity</Text>
          </TouchableOpacity>
        </View>

        {subRoutine?.activities && subRoutine.activities.length > 0 ? (
          subRoutine.activities.map(activity => renderTask({
            ...activity,
            type: 'routine',
            routineId: routineId,
            subRoutineId: subRoutineId,
            scheduledDate: new Date(),
            scheduledTime: activity.scheduled_time || '',
          } as Task))
        ) : (
          <Text style={styles.emptyText}>No activities yet. Add one to get started!</Text>
        )}
      </View>

      <AddTemporaryGoalModal
        visible={showAddActivityModal}
        onClose={() => setShowAddActivityModal(false)}
        onSave={handleAddActivity}
        isActivity={true}
        parentColor={route.params.routineColor}
        loading={loading}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  breadcrumbText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  overallProgress: {
    margin: 20,
    padding: 16,
    borderRadius: 15,
  },
  overallTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '40%',
  },
  addButtonText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    flexShrink: 1,
  },
  taskCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskGradient: {
    borderRadius: 12,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  taskTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  completedText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  todoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  todoText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  completedTaskDescription: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  taskDuration: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskStatus: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#D32F2F',
    flex: 1,
    marginRight: 8,
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubRoutineScreen; 