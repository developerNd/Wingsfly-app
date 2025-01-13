import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { dailyRoutines, getTodaysTasks } from '../data/tasksData';
import { Task, TaskPriority, TASK_PRIORITY } from '../types/task';
import AddTemporaryGoalModal from '../components/AddTemporaryGoalModal';
import { Activity, SubRoutine } from '../types/routine';
import { routineService, Routine } from '../services/routineService';
import api from '../services/api';
import notificationService from '../services/notificationService';

type Props = NativeStackScreenProps<RootStackParamList, 'DetailedRoutine'>;

const DetailedRoutineScreen = ({ route, navigation }: Props) => {
  const { routine: initialRoutine } = route.params;
  const [routine, setRoutine] = useState(initialRoutine);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddSubRoutineModal, setShowAddSubRoutineModal] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState<{ subRoutineId: number } | null>(null);
  const [showAddRoutineModal, setShowAddRoutineModal] = useState(false);

  useEffect(() => {
    loadRoutineDetails();
  }, []);

  const loadRoutineDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/routines/${routine.id}`);
      console.log('Loaded routine details:', response.data);
      
      const updatedRoutine = {
        ...routine,
        subRoutines: response.data.sub_routines || []
      };
      setRoutine(updatedRoutine);

      // Schedule notifications for routine activities
      const routineType = routine.title.toLowerCase().includes('morning') ? 'morning' : 
                         routine.title.toLowerCase().includes('evening') ? 'evening' : null;
      
      if (routineType) {
        const activities = updatedRoutine.subRoutines.flatMap((sr: SubRoutine) => sr.activities || []);
        await notificationService.scheduleAllRoutineNotifications([{
          title: routine.title,
          type: routineType,
          activities
        }]);
      }
    } catch (error) {
      console.error('Error loading routine details:', error);
      setError('Failed to load routine details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubRoutine = async (newSubRoutine: Partial<SubRoutine>) => {
    try {
      setLoading(true);
      setError(null);
      
      const timeString = newSubRoutine.time || '09:00';
      
      const createdSubRoutine = await routineService.createSubRoutine(routine.id, {
        ...newSubRoutine,
        progress: 0,
        time: timeString
      });

      console.log('Created subroutine:', createdSubRoutine);
      loadRoutineDetails();
      setShowAddSubRoutineModal(false);
    } catch (error) {
      console.error('Error adding subroutine:', error);
      setError('Failed to add subroutine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (newActivity: Partial<Activity>, subRoutineId: number) => {
    try {
      setLoading(true);
      setError(null);

      const createdActivity = await routineService.createActivity(
        routine.id,
        subRoutineId,
        {
          ...newActivity,
          status: 'in_progress',
          type: 'routine',
          category: routine.title,
          parent_title: routine.title,
          scheduled_time: newActivity.scheduled_time || '09:00'
        }
      );

      console.log('Created activity:', createdActivity);
      loadRoutineDetails();
      setShowAddActivityModal(null);
    } catch (error) {
      console.error('Error adding activity:', error);
      setError('Failed to add activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoutine = async (newRoutine: Partial<Routine>) => {
    try {
      setLoading(true);
      setError(null);
      
      const createdRoutine = await routineService.createRoutine({
        ...newRoutine,
        progress: 0,
        totalSubRoutines: 0
      });

      console.log('Created routine:', createdRoutine);
      // You might want to refresh the routines list here
      navigation.goBack(); // Go back to routines list
    } catch (error) {
      console.error('Error adding routine:', error);
      setError('Failed to add routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoutine = async () => {
    Alert.alert(
      "Delete Routine",
      "Are you sure you want to delete this routine? All sub-routines and activities within it will also be deleted. This action cannot be undone.",
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
              await routineService.deleteRoutine(routine.id);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting routine:', error);
              setError('Failed to delete routine. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteSubRoutine = async (subRoutineId: number) => {
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
              await routineService.deleteSubRoutine(routine.id, subRoutineId);
              await loadRoutineDetails();
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

  const renderTask = (task: Task) => (
    <TouchableOpacity
      key={task.id}
      style={styles.taskCard}
      onPress={() => navigation.navigate('WorkTracking', { task })}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTimeContainer}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.taskTime}>{task.scheduledTime}</Text>
        </View>
        <View style={styles.priorityBadge}>
          <Text style={styles.priorityText}>{task.priority}</Text>
        </View>
      </View>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskDescription}>{task.description}</Text>
      <View style={styles.taskFooter}>
        <Text style={styles.taskDuration}>{task.duration} min</Text>
        <Text style={styles.taskStatus}>{task.status}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSubRoutine = (subRoutine: SubRoutine) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => navigation.navigate('SubRoutine', {
        routineId: routine.id,
        subRoutineId: subRoutine.id,
        routineColor: routine.color
      })}
    >
      <LinearGradient
        colors={[`${routine.color}10`, `${routine.color}20`]}
        style={styles.taskGradient}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            {subRoutine.time && (
              <View style={[styles.taskTimeContainer, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                <Icon name="access-time" size={16} color={routine.color} />
                <Text style={[styles.taskTime, { color: routine.color }]}>
                  {subRoutine.time}
                </Text>
              </View>
            )}
            {subRoutine.progress === 100 ? (
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
            {subRoutine.priority && (
              <View style={[styles.priorityBadge, { 
                backgroundColor: subRoutine.priority === TASK_PRIORITY.HIGH ? '#FF4444' :
                               subRoutine.priority === TASK_PRIORITY.MEDIUM ? '#1A2980' : '#4CAF50'
              }]}>
                <Icon name="flag" size={14} color="#FFF" />
                <Text style={styles.priorityText}>{subRoutine.priority}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteSubRoutine(subRoutine.id);
            }}
          >
            <Icon name="delete" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.taskContent}>
          <View style={[styles.categoryIcon, { 
            backgroundColor: routine.color + '15',
            borderColor: routine.color + '30'
          }]}>
            <Icon name={routine.icon} size={24} color={routine.color} />
          </View>
          <View style={styles.taskInfo}>
            <Text style={[
              styles.taskTitle,
              { color: '#1A2980' },
              subRoutine.progress === 100 && styles.completedTaskTitle
            ]}>
              {subRoutine.title}
            </Text>
            {subRoutine.description && (
              <Text style={[
                styles.taskDescription,
                { color: 'rgba(26, 41, 128, 0.7)' },
                subRoutine.progress === 100 && styles.completedTaskDescription
              ]} numberOfLines={2}>
                {subRoutine.description}
              </Text>
            )}
            <View style={styles.taskFooter}>
              <View style={[styles.durationBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                <Icon name="trending-up" size={14} color={routine.color} />
                <Text style={[styles.taskDuration, { color: routine.color }]}>
                  {subRoutine.progress}% Complete
                </Text>
              </View>
              <View style={[styles.durationBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                <Icon name="folder" size={14} color={routine.color} />
                <Text style={[styles.taskDuration, { color: routine.color }]}>
                  {subRoutine.activities?.length || 0} Activities
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleSubRoutinePress = (subRoutine: SubRoutine) => {
    navigation.navigate('SubRoutine', {
      routineId: routine.id,
      subRoutineId: subRoutine.id,
      routineColor: routine.color
    });
  };

  const renderBreadcrumbs = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {routine.parentTitle?.split(' / ').map((title, index) => (
        <React.Fragment key={index}>
          <Text style={styles.breadcrumbText}>{title}</Text>
          <Icon name="chevron-right" size={16} color="#666" />
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A2980', '#26D0CE']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{routine.title}</Text>
          <View style={{ width: 40 }} /> {/* Placeholder for balance */}
        </View>

        {routine.parentTitle && (
          <View style={styles.breadcrumbContainer}>
            {renderBreadcrumbs()}
          </View>
        )}

        <View style={[styles.overallProgress, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <Text style={styles.overallTitle}>Overall Progress</Text>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${routine.progress}%`, backgroundColor: '#FFF' }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {routine.progress}% Complete
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                loadRoutineDetails();
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sub Routines</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddSubRoutineModal(true)}
          >
            <Icon name="add-circle" size={24} color="#FF6B00" />
            <Text style={styles.addButtonText}>Add Sub Routine</Text>
          </TouchableOpacity>
        </View>

        {routine.subRoutines?.length === 0 && (
          <Text style={styles.emptyText}>No sub routines yet. Add one to get started!</Text>
        )}

        {routine.subRoutines?.map(subRoutine => {
          console.log('Rendering subroutine:', subRoutine);
          return (
            <View key={subRoutine.id} style={styles.subRoutineContainer}>
              {renderSubRoutine(subRoutine)}
            </View>
          );
        })}
      </ScrollView>

      <AddTemporaryGoalModal
        visible={showAddSubRoutineModal}
        onClose={() => setShowAddSubRoutineModal(false)}
        onSave={handleAddSubRoutine}
        isSubRoutine={true}
        parentColor={routine.color}
        loading={loading}
      />

      <AddTemporaryGoalModal
        visible={!!showAddActivityModal}
        onClose={() => setShowAddActivityModal(null)}
        onSave={(newActivity) => handleAddActivity(newActivity, showAddActivityModal?.subRoutineId || 0)}
        isActivity={true}
        parentColor={routine.color}
        loading={loading}
      />

      <AddTemporaryGoalModal
        visible={showAddRoutineModal}
        onClose={() => setShowAddRoutineModal(false)}
        onSave={handleAddRoutine}
        isRoutine={true}
        loading={loading}
      />
    </View>
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
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
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
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
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
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  subRoutineContainer: {
    flex: 1,
    padding: 20,
  },
  subRoutineCard: {
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  subRoutineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  subRoutineInfo: {
    flex: 1,
  },
  subRoutineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2980',
  },
  subRoutineDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  subRoutineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  subRoutineProgress: {
    fontSize: 12,
    color: '#666',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subRoutinesCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  subRoutinesLabel: {
    fontSize: 12,
    color: '#666',
  },
});

export default DetailedRoutineScreen; 