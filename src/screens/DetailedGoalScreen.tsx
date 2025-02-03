import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SubGoal } from '../types/goals';
import { formatTime } from '../utils/dateUtils';
import { Task } from '../types/task';
import { TASK_PRIORITY } from '../data/tasksData';
import { getTodaysTasks } from '../data/tasksData';
import AddTemporaryGoalModal from '../components/AddTemporaryGoalModal';
import { goalService, SubGoalRequestData } from '../services/goalService';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'DetailedGoal'>;

type Breadcrumb = {
  id: number;
  title: string;
  goalId: number;
  subGoals?: SubGoal[];
};

const formatDueDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDateTime = (timeStr: string) => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', { 
      month: 'short', 
    day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  } catch (e) {
    return timeStr;
  }
};

const getBackgroundColors = (priority: string) => {
  switch (priority) {
    case 'HIGH':
      return ['#FFE5E5', '#FFF0F0']; // Light red
    case 'MEDIUM':
      return ['#E5F6FF', '#F0FAFF']; // Light blue
    case 'LOW':
      return ['#E5FFE7', '#F0FFF2']; // Light green
    default:
      return ['#FFF5E5', '#FFFAF0']; // Light yellow
  }
};

const getAccentColor = (priority: string) => {
  switch (priority) {
    case 'HIGH':
      return '#FF4444';
    case 'MEDIUM':
      return '#1A2980';
    case 'LOW':
      return '#4CAF50';
    default:
      return '#FFC107';
  }
};

const DetailedGoalScreen = ({ route, navigation }: Props) => {
  const { 
    goalId, 
    title, 
    description, 
    progress: initialProgress, 
    color, 
    icon, 
    subGoals: initialSubGoals, 
    parentBreadcrumbs = [],
    topLevelGoalId
  } = route.params;

  const originalGoalId = topLevelGoalId || goalId;

  const [showAddModal, setShowAddModal] = useState<{ parentId: number; isTopLevel: boolean } | null>(null);
  const [subGoals, setSubGoals] = useState<SubGoal[]>(initialSubGoals || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    loadSubGoals();
  }, [goalId]);

  // Add useFocusEffect to reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadSubGoals();
    }, [])
  );

  const transformSubGoal = (subGoal: any): SubGoal => ({
    id: subGoal.id,
    title: subGoal.title,
    description: subGoal.description,
    completed: subGoal.completed,
    progress: subGoal.progress,
    startDate: subGoal.start_date, 
    endDate: subGoal.end_date,   
    dueDate: subGoal.due_date,
    startTime: subGoal.start_time,
    endTime: subGoal.end_time,
    start_time: subGoal.start_time,
    end_time: subGoal.end_time,
    duration: subGoal.duration,
    isTemporary: subGoal.is_temporary,
    priority: subGoal.priority || TASK_PRIORITY.MEDIUM,
    subGoals: (subGoal.sub_goals || subGoal.subGoals) ? (subGoal.sub_goals || subGoal.subGoals).map(transformSubGoal) : [],
  });

  const calculateProgress = (subGoals: SubGoal[]): number => {
    let totalSubgoals = 0;
    let completedSubgoals = 0;

    const countSubgoals = (subgoals: SubGoal[]) => {
      subgoals.forEach(subgoal => {
        totalSubgoals++;
        if (subgoal.completed) {
          completedSubgoals++;
        }
        if (subgoal.subGoals && subgoal.subGoals.length > 0) {
          countSubgoals(subgoal.subGoals);
        }
      });
    };

    countSubgoals(subGoals);
    return totalSubgoals > 0 ? Math.round((completedSubgoals / totalSubgoals) * 100) : 0;
  };

  const loadSubGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response: any;
      if (route.params.isSubGoal) {
        response = await goalService.getSubGoalDetails(goalId);
      } else {
        response = await goalService.getGoalDetails(goalId);
      }
      
      console.log('Response:', response);
      const transformedSubGoals = response.sub_goals ? response.sub_goals.map(transformSubGoal) : [];
      
      // Calculate and update progress
      const newProgress = calculateProgress(transformedSubGoals);
      const currentProgress = progress || initialProgress;
      if (newProgress !== currentProgress) {
        // Update the progress in the parent goal/subgoal
        if (route.params.isSubGoal) {
          await goalService.updateSubGoal(goalId, { progress: newProgress });
        } else {
          await goalService.updateGoal(goalId, { progress: newProgress });
        }
      }

      setSubGoals(transformedSubGoals);
      setProgress(newProgress);
    } catch (err) {
      console.error('Error loading subgoals:', err);
      setError('Failed to load subgoals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubGoalPress = async (subGoal: SubGoal) => {
    if (subGoal.subGoals && subGoal.subGoals.length > 0) {
      const newBreadcrumbs = [
        ...parentBreadcrumbs,
        { id: goalId, title, goalId, subGoals }
      ];

      // Just navigate with the existing subgoal data
      navigation.push('DetailedGoal', {
        goalId: subGoal.id,
        title: subGoal.title,
        description: subGoal.description || '',
        progress: subGoal.progress,
        color: color,
        icon: icon,
        subGoals: subGoal.subGoals,  // Use existing subgoals data
        parentBreadcrumbs: newBreadcrumbs,
        topLevelGoalId: originalGoalId,
        isSubGoal: true
      });
    }
  };

  const findParentSubGoal = (subGoals: SubGoal[], targetId: number): SubGoal | null => {
    for (const sg of subGoals) {
      if (sg.id === targetId) {
        return sg;
      }
      if (sg.subGoals && sg.subGoals.length > 0) {
        const found = findParentSubGoal(sg.subGoals, targetId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  const formatTime = (timeStr: string | undefined) => {
    if (!timeStr) return undefined;
    try {
      const [hours, minutes] = timeStr.split(':');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    } catch (e) {
      return undefined;
    }
  };

  const updateNestedSubGoals = (subGoals: SubGoal[], parentId: number, transformedSubGoal: SubGoal): SubGoal[] => {
    return subGoals.map(sg => {
      if (sg.id === parentId) {
        return {
          ...sg,
          subGoals: [...(sg.subGoals || []), transformedSubGoal],
        };
      }
      if (sg.subGoals && sg.subGoals.length > 0) {
        return {
          ...sg,
          subGoals: updateNestedSubGoals(sg.subGoals, parentId, transformedSubGoal),
        };
      }
      return sg;
    });
  };

  const handleAddSubGoal = async (newGoal: Partial<SubGoal>, parentId: number) => {
    try {
      setLoading(true);
      setError(null);

      const isTopLevel = parentId === originalGoalId;

      // Convert time format from "6:53:07 PM" to "18:53"
      const convertTime = (timeStr: string | null | undefined) => {
        if (!timeStr) return null;
        try {
          const [time, period] = timeStr.split(' ');
          const [hours, minutes] = time.split(':');
          let hour = parseInt(hours);
          
          if (period === 'PM' && hour !== 12) hour += 12;
          if (period === 'AM' && hour === 12) hour = 0;
          
          return `${hour.toString().padStart(2, '0')}:${minutes}`;
        } catch (error) {
          console.error('Time conversion error:', error);
          return timeStr; // Return original string if conversion fails
        }
      };

      // Calculate duration in minutes based on start and end date/time
      const calculateDuration = () => {
        if (!newGoal.startDate || !newGoal.endDate || !newGoal.start_time || !newGoal.end_time) {
          return 0;
        }

        const startDateTime = new Date(`${newGoal.startDate}T${convertTime(newGoal.start_time)}`);
        const endDateTime = new Date(`${newGoal.endDate}T${convertTime(newGoal.end_time)}`);
        
        return Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 60000);
      };

      const subGoalData: SubGoalRequestData = {
        title: newGoal.title || '',
        description: newGoal.description || '',
        completed: false,
        progress: 0,
        start_date: newGoal.startDate || null,
        end_date: newGoal.endDate || null,
        due_date: newGoal.dueDate || null,
        start_time: convertTime(newGoal.start_time || newGoal.startTime),
        end_time: convertTime(newGoal.end_time || newGoal.endTime),
        duration: calculateDuration(),
        is_temporary: false,
        parent_id: isTopLevel ? null : parentId,
        parent_type: isTopLevel ? null : 'App\\Models\\SubGoal',
        priority: newGoal.priority || TASK_PRIORITY.MEDIUM,
        color: newGoal.color || '#1A2980',
        icon: newGoal.icon || 'star'
      };

      console.log('Submitting subgoal data:', subGoalData);
      const createdSubGoal = await goalService.createSubGoal(originalGoalId, subGoalData);
      const transformedSubGoal = transformSubGoal(createdSubGoal);
      
      // Update local state with proper nesting
      let updatedSubGoals: SubGoal[];
      if (isTopLevel) {
        updatedSubGoals = [...subGoals, transformedSubGoal];
      } else {
        updatedSubGoals = updateNestedSubGoals(subGoals, parentId, transformedSubGoal);
      }

      setSubGoals(updatedSubGoals);
      setShowAddModal(null);

    } catch (error) {
      console.error('Error creating subgoal:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || 'Failed to create subgoal. Please try again.');
      } else {
        setError('Failed to create subgoal. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async () => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal? All sub-goals within it will also be deleted. This action cannot be undone.",
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
              await goalService.deleteGoal(goalId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting goal:', error);
              setError('Failed to delete goal. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteSubGoal = async (subGoalId: number) => {
    Alert.alert(
      "Delete Sub-Goal",
      "Are you sure you want to delete this sub-goal? All nested sub-goals within it will also be deleted. This action cannot be undone.",
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
              await goalService.deleteSubGoal(subGoalId);
              // Update local state by filtering out the deleted subgoal
              setSubGoals(prevSubGoals => 
                prevSubGoals.filter(sg => {
                  // Remove the subgoal and its nested subgoals
                  if (sg.id === subGoalId) return false;
                  // Keep subgoals that don't match the deleted ID
                  return true;
                })
              );
            } catch (error) {
              console.error('Error deleting sub-goal:', error);
              setError('Failed to delete sub-goal. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderBreadcrumbs = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.breadcrumbsContainer}
      contentContainerStyle={styles.breadcrumbsContent}
    >
      <TouchableOpacity 
        onPress={() => navigation.navigate('Home', { user: { name: '', email: '', phone: undefined } })}
        style={styles.breadcrumbItem}
      >
        <Icon name="home" size={16} color="#666" style={styles.breadcrumbIcon} />
      </TouchableOpacity>
      {parentBreadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          <Icon name="chevron-right" size={16} color="#666" style={styles.breadcrumbIcon} />
          <TouchableOpacity 
            style={styles.breadcrumbItem}
            onPress={() => {
              navigation.pop(parentBreadcrumbs.length - index);
            }}
          >
            <Text style={styles.breadcrumbText}>{crumb.title}</Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
      {parentBreadcrumbs.length > 0 && (
        <Icon name="chevron-right" size={16} color="#666" style={styles.breadcrumbIcon} />
      )}
      <View style={styles.breadcrumbItem}>
        <Text style={[styles.breadcrumbText, styles.currentBreadcrumb]}>{title}</Text>
      </View>
    </ScrollView>
  );

  const renderEndSubGoal = (subGoal: SubGoal) => (
    <TouchableOpacity 
      key={subGoal.id}
      style={[
        styles.taskCard,
        subGoal.completed && styles.completedTaskCard
      ]}
      onPress={() => navigation.navigate('WorkTracking', { 
        task: {
          id: subGoal.id,
          title: subGoal.title,
          description: subGoal.description || '',
          scheduledDate: subGoal.dueDate ? new Date(subGoal.dueDate) : new Date(),
          scheduledTime: subGoal.startTime || '',
          duration: subGoal.duration || 0,
          priority: subGoal.priority || TASK_PRIORITY.MEDIUM,
          status: subGoal.completed ? 'completed' : 'in_progress',
          category: title,
          type: 'goal',
          parentTitle: title
        } as Task
      })}
    >
      <LinearGradient
        colors={[`${color}10`, `${color}20`]}
        style={styles.taskGradient}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskHeaderLeft}>
            {(subGoal.startTime || subGoal.endTime) && (
              <View style={[styles.taskTimeContainer, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                <Icon name="access-time" size={16} color={color} />
                <Text style={[styles.taskTime, { color }]}>
                  {subGoal.startTime ? formatDateTime(subGoal.startTime) : ''}
                  {subGoal.endTime ? ` - ${formatDateTime(subGoal.endTime)}` : ''}
                </Text>
              </View>
            )}
            {subGoal.completed ? (
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
            <View style={[styles.priorityBadge, { 
              backgroundColor: subGoal.priority === TASK_PRIORITY.HIGH ? '#FF4444' :
                             subGoal.priority === TASK_PRIORITY.MEDIUM ? '#1A2980' : '#4CAF50'
            }]}>
              <Icon name="flag" size={14} color="#FFF" />
              <Text style={styles.priorityText}>{subGoal.priority || TASK_PRIORITY.MEDIUM}</Text>
            </View>
          </View>
        </View>

        <View style={styles.taskContent}>
          <View style={[styles.categoryIcon, { 
            backgroundColor: color + '15',
            borderColor: color + '30'
          }]}>
            <Icon name={icon} size={24} color={color} />
          </View>
          <View style={styles.taskInfo}>
            <Text style={[
              styles.taskTitle,
              { color: '#1A2980' },
              subGoal.completed && styles.completedTaskTitle
            ]}>
              {subGoal.title}
            </Text>
            {subGoal.description && (
              <Text style={[
                styles.taskDescription,
                { color: 'rgba(26, 41, 128, 0.7)' },
                subGoal.completed && styles.completedTaskDescription
              ]} numberOfLines={2}>
                {subGoal.description}
              </Text>
            )}
            <View style={styles.taskFooter}>
              {subGoal.duration && (
                <View style={[styles.durationBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                  <Icon name="schedule" size={14} color={color} />
                  <Text style={[styles.taskDuration, { color }]}>
                    {subGoal.duration ? `${subGoal.duration} min` : ''}
                  </Text>
                </View>
              )}
              {subGoal.dueDate && (
                <View style={[styles.dueDateBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                  <Icon name="event" size={14} color={color} />
                  <Text style={[styles.taskDueDate, { color }]}>
                    {subGoal.dueDate ? `Due: ${formatDueDate(subGoal.dueDate)}` : ''}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <TouchableOpacity 
                style={[styles.addSubGoalButton, { 
                  backgroundColor: color + '15',
                }]}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowAddModal({ parentId: subGoal.id, isTopLevel: false });
                }}
              >
                <Icon name="add-circle" size={20} color={color} />
                <Text style={[styles.addSubGoalText, { color }]}>
                  Add Sub Goal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteSubGoal(subGoal.id);
                }}
              >
                <Icon name="delete" size={20} color="#FF4444" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderSubGoal = (subGoal: SubGoal) => {
    if (!subGoal.subGoals || subGoal.subGoals.length === 0) {
      return (
        <View key={subGoal.id} style={styles.subGoalContainer}>
          {renderEndSubGoal(subGoal)}
        </View>
      );
    }

    return (
      <View key={subGoal.id} style={styles.subGoalContainer}>
        <TouchableOpacity 
          style={[
            styles.taskCard,
            subGoal.completed && styles.completedTaskCard
          ]}
          onPress={() => handleSubGoalPress(subGoal)}
        >
          <LinearGradient
            colors={[`${color}10`, `${color}20`]}
            style={styles.taskGradient}
          >
            <View style={styles.taskHeader}>
              <View style={styles.taskHeaderLeft}>
                {subGoal.completed ? (
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
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteSubGoal(subGoal.id);
                }}
              >
                <Icon name="delete" size={20} color="#FF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.taskContent}>
              <View style={[styles.categoryIcon, { 
                backgroundColor: color + '15',
                borderColor: color + '30'
              }]}>
                <Icon name={icon} size={24} color={color} />
              </View>
              <View style={styles.taskInfo}>
                <Text style={[
                  styles.taskTitle,
                  subGoal.completed && styles.completedTaskTitle
                ]}>
                  {subGoal.title}
                </Text>
                {subGoal.description && (
                  <Text style={[
                    styles.taskDescription,
                    subGoal.completed && styles.completedTaskDescription
                  ]} numberOfLines={2}>
                    {subGoal.description}
                  </Text>
                )}
                <View style={styles.taskFooter}>
                  {subGoal.duration && (
                    <View style={[styles.durationBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                      <Icon name="schedule" size={14} color={color} />
                      <Text style={[styles.taskDuration, { color }]}>
                        {subGoal.duration ? `${subGoal.duration} min` : ''}
                      </Text>
                    </View>
                  )}
                  {subGoal.dueDate && (
                    <View style={[styles.dueDateBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                      <Icon name="event" size={14} color={color} />
                      <Text style={[styles.taskDueDate, { color }]}>
                        {subGoal.dueDate ? `Due: ${formatDueDate(subGoal.dueDate)}` : ''}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.durationBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                    <Icon name="folder" size={14} color={color} />
                    <Text style={[styles.taskDuration, { color }]}>
                      {subGoal.subGoals.length} Sub Goals
                    </Text>
                  </View>
                </View>                       
                <TouchableOpacity 
                  style={[styles.addSubGoalButton, { 
                    backgroundColor: color + '15',
                    marginTop: 12
                  }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setShowAddModal({ parentId: subGoal.id, isTopLevel: false });
                  }}
                >
                  <Icon name="add-circle" size={20} color={color} />
                  <Text style={[styles.addSubGoalText, { color }]}>
                    Add Sub Goal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#1A2980', '#26D0CE']}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>

        {renderBreadcrumbs()}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setError(null)}
            >
              <Text style={styles.retryButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.heroSection}>
              <View style={[styles.iconContainer, { backgroundColor: color }]}>
                <Icon name={icon} size={40} color="#FFF" />
              </View>

              <View style={styles.infoSection}>
                {description && (
                  <Text style={styles.description}>{description}</Text>
                )}
                <View style={styles.progressSection}>
                  <Text style={styles.progressTitle}>Overall Progress</Text>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progress || initialProgress}%`, backgroundColor: color }]} />
                  </View>
                  <Text style={[styles.progressText, { color }]}>{progress || initialProgress}% Completed</Text>
                </View>
              </View>
            </View>

            <View style={styles.subGoalsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sub Goals</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => setShowAddModal({ parentId: goalId, isTopLevel: true })}
                >
                  <Icon name="add-circle" size={24} color="#FF6B00" />
                  <Text style={styles.addButtonText}>Add Sub Goal</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF6B00" />
                </View>
              ) : (
                subGoals?.map(renderSubGoal)
              )}
            </View>
          </View>
        </ScrollView>

        <AddTemporaryGoalModal
          visible={showAddModal !== null}
          onClose={() => setShowAddModal(null)}
          onSave={(newGoal) => {
            if (showAddModal) {
              handleAddSubGoal(newGoal, showAddModal.parentId);
            }
          }}
          isSubGoal
          parentColor={color}
          loading={loading}
          categories={[]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  breadcrumbsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  breadcrumbsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breadcrumbIcon: {
    marginHorizontal: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#666',
  },
  currentBreadcrumb: {
    color: '#333',
    fontWeight: '500',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
    color: '#FFF',
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    padding: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  progressSection: {
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2980',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Poppins-Medium',
  },
  infoSection: {
    borderRadius: 12,
  },
  subGoalsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  subGoalContainer: {
    marginBottom: 12,
  },
  subGoalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 4,
  },
  subGoalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subGoalInfo: {
    marginLeft: 12,
    flex: 1,
  },
  subGoalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subGoalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  subGoalProgressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  subGoalProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  expandButton: {
    padding: 4,
  },
  subGoalsCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  taskCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 0,
  },
  taskGradient: {
    padding: 20,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  taskTime: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  completedText: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: 'Poppins-Medium',
  },
  todoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  todoText: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: 'Poppins-Medium',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
    color: '#1A2980',
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginBottom: 12,
    lineHeight: 20,
    color: 'rgba(26, 41, 128, 0.7)',
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  taskDuration: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  taskDueDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  completedTaskCard: {
    opacity: 0.8,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: 'rgba(26, 41, 128, 0.6)',
  },
  completedTaskDescription: {
    textDecorationLine: 'line-through',
    color: 'rgba(26, 41, 128, 0.4)',
  },
  addSubGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  addSubGoalText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '50%',
  },
  addButtonText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    flexShrink: 1,
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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  dateContainer: {
    marginTop: 8,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  subGoalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  priorityText: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: 'Poppins-Medium',
  },
  subGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  subGoalHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2980',
  },
});

export default DetailedGoalScreen; 