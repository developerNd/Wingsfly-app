import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Task, TaskPriority } from '../types/task';
import { getPriorityColor, getCategoryIcon } from '../data/tasksData';
import { goalService } from '../services/goalService';
import { LifeGoal } from '../data/goalsData';
import notificationService from '../services/notificationService';
import notifee, { AndroidImportance, TriggerType, EventType } from '@notifee/react-native';

type TasksScreenRouteProp = RouteProp<RootStackParamList, 'Tasks'>;

type FilterType = 'all' | 'today' | 'tomorrow' | 'upcoming';
type StatusType = 'all' | 'completed' | 'in_progress';

const TasksScreen = () => {
  const route = useRoute<TasksScreenRouteProp>();
  const navigation = useNavigation();
  const [tasks, setTasks] = useState<Task[]>(route.params?.initialTasks || []);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusType>('all');
  const [loading, setLoading] = useState(false);

  // Set up notification action handlers
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS && detail.pressAction) {
        switch (detail.pressAction.id) {
          case 'available':
            Alert.alert('Confirmed', 'You confirmed your availability for the task.');
            break;
          case 'reschedule':
            Alert.alert('Reschedule', 'Opening reschedule options...', [
              {
                text: 'Later Today',
                onPress: () => console.log('Reschedule for later today')
              },
              {
                text: 'Tomorrow',
                onPress: () => console.log('Reschedule for tomorrow')
              },
              {
                text: 'Cancel',
                style: 'cancel'
              }
            ]);
            break;
        }
      }
    });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused, loading tasks...');
      if (route.params?.initialTasks) {
        console.log('Using initial tasks:', route.params.initialTasks);
        setTasks(route.params.initialTasks);
        applyFilters(route.params.initialTasks);
      } else {
        loadAllTasks();
      }
    }, [route.params?.initialTasks])
  );

  useEffect(() => {
    console.log('Filters or tasks changed, reapplying filters...');
    applyFilters();
  }, [tasks, activeFilter, statusFilter]);

  const loadAllTasks = async () => {
    try {
      setLoading(true);
      const response = await goalService.getAllGoals();
      const goals = (response as any).data || response;
      console.log('Goals API response:', goals);
      const allTasks: Task[] = [];

      goals.forEach((goal: { id: string; title: string; sub_goals?: any[]; subGoals?: any[] }) => {
        console.log('Processing goal:', goal);
        const subGoals = goal.sub_goals || goal.subGoals;
        if (subGoals && Array.isArray(subGoals)) {
          subGoals.forEach(subGoal => {
            console.log('Processing subgoal:', subGoal);
            // Only add end subgoals (those without further subgoals)
            if (!subGoal.sub_goals?.length && !subGoal.subGoals?.length) {
              allTasks.push({
                id: subGoal.id,
                title: subGoal.title,
                description: subGoal.description || '',
                scheduledDate: new Date(subGoal.start_time || subGoal.due_date),
                scheduledTime: subGoal.start_time ? 
                  new Date(subGoal.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) 
                  : '09:00',
                duration: subGoal.duration || 30,
                priority: 'MEDIUM',
                status: subGoal.completed ? 'completed' : 'in_progress',
                category: 'goal',
                type: 'goal',
                parentTitle: goal.title
              });
            }
          });
        }
      });

      console.log('All tasks loaded:', allTasks);
      setTasks(allTasks);
      applyFilters(allTasks);

      // Schedule notifications for all tasks
      await notificationService.scheduleAllTaskNotifications(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (taskList = tasks) => {
    let filtered = [...taskList];
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    console.log('Applying filters:', { activeFilter, statusFilter });
    console.log('Initial tasks count:', filtered.length);

    // Apply date filter
    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(task => {
          const taskDate = task.scheduledDate.toISOString().split('T')[0];
          console.log('Comparing task date:', taskDate, 'with today:', today);
          return taskDate === today;
        });
        break;
      case 'tomorrow':
        filtered = filtered.filter(task => {
          const taskDate = task.scheduledDate.toISOString().split('T')[0];
          return taskDate === tomorrow;
        });
        break;
      case 'upcoming':
        filtered = filtered.filter(task => {
          const taskDate = task.scheduledDate.toISOString().split('T')[0];
          return taskDate > tomorrow;
        });
        break;
    }

    console.log('After date filter:', filtered.length);

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    console.log('After status filter:', filtered.length);

    // Sort by scheduled time
    filtered.sort((a, b) => {
      const timeA = a.scheduledTime.split(':').map(Number);
      const timeB = b.scheduledTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });

    console.log('Final filtered tasks:', filtered);
    setFilteredTasks(filtered);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const period = Number(hours) >= 12 ? 'PM' : 'AM';
    const formattedHours = Number(hours) % 12 || 12;
    return `${formattedHours}:${minutes} ${period}`;
  };

  const renderFilterChips = () => (
    <View style={styles.filtersContainer}>
      <TouchableOpacity 
        style={[styles.filterChip, activeFilter === 'all' && styles.activeFilterChip]}
        onPress={() => setActiveFilter('all')}
      >
        <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
          All Tasks
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterChip, activeFilter === 'today' && styles.activeFilterChip]}
        onPress={() => setActiveFilter('today')}
      >
        <Text style={[styles.filterText, activeFilter === 'today' && styles.activeFilterText]}>
          Today
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterChip, activeFilter === 'tomorrow' && styles.activeFilterChip]}
        onPress={() => setActiveFilter('tomorrow')}
      >
        <Text style={[styles.filterText, activeFilter === 'tomorrow' && styles.activeFilterText]}>
          Tomorrow
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.filterChip, activeFilter === 'upcoming' && styles.activeFilterChip]}
        onPress={() => setActiveFilter('upcoming')}
      >
        <Text style={[styles.filterText, activeFilter === 'upcoming' && styles.activeFilterText]}>
          Upcoming
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatusFilter = () => (
    <View style={styles.statusFilterContainer}>
      <TouchableOpacity 
        style={[styles.statusChip, statusFilter === 'all' && styles.activeStatusChip]}
        onPress={() => setStatusFilter('all')}
      >
        <Text style={[styles.statusText, statusFilter === 'all' && styles.activeStatusText]}>
          All
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.statusChip, statusFilter === 'in_progress' && styles.activeStatusChip]}
        onPress={() => setStatusFilter('in_progress')}
      >
        <Text style={[styles.statusText, statusFilter === 'in_progress' && styles.activeStatusText]}>
          In Progress
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.statusChip, statusFilter === 'completed' && styles.activeStatusChip]}
        onPress={() => setStatusFilter('completed')}
      >
        <Text style={[styles.statusText, statusFilter === 'completed' && styles.activeStatusText]}>
          Completed
        </Text>
      </TouchableOpacity>
    </View>
  );

  const testNotification = async () => {
    try {
      // Create a test task scheduled for 10 hours from now
      const scheduledTime = new Date(Date.now() + 60);
      const formattedTime = scheduledTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      // Create categories for Android (similar to iOS action buttons)
      await notifee.createChannel({
        id: 'task-reminders-custom',
        name: 'Task Reminders with Actions',
        importance: AndroidImportance.HIGH,
        sound: 'warning_notification', // Make sure to add this sound file in android/app/src/main/res/raw/
        vibration: true,
      });

      // Schedule notification for 10 minutes before the task (9 hours and 50 minutes from now)
      const notificationTime = new Date(Date.now() + (10 * 60 * 60 - 10 * 60) * 1000);

      await notifee.createTriggerNotification(
        {
          id: 'test-scheduled',
          title: '🎯 Upcoming Task: Project Meeting',
          body: `Your task is scheduled for ${formattedTime}. Are you available?`,
          android: {
            channelId: 'task-reminders-custom',
            importance: AndroidImportance.HIGH,
            sound: 'warning_notification',
            pressAction: {
              id: 'default',
            },
            actions: [
              {
                title: '✅ I\'m Available',
                pressAction: {
                  id: 'available',
                },
              },
              {
                title: '❌ Reschedule',
                pressAction: {
                  id: 'reschedule',
                },
              },
            ],
          },
          ios: {
            sound: 'notification_sound.wav',
            categoryId: 'task-reminder',
            attachments: [{
              url: 'calendar',
              thumbnailTime: 10,
            }],
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: notificationTime.getTime(),
        },
      );

      // Set up iOS notification categories with action buttons
      await notifee.setNotificationCategories([
        {
          id: 'task-reminder',
          actions: [
            {
              id: 'available',
              title: '✅ I\'m Available',
            },
            {
              id: 'reschedule',
              title: '❌ Reschedule',
              destructive: true,
            },
          ],
        },
      ]);

      // Also show an immediate test notification
      await notifee.displayNotification({
        id: 'test-immediate',
        title: '🔔 Notification Test',
        body: 'A task notification has been scheduled for 10 hours from now',
        android: {
          channelId: 'task-reminders-custom',
          importance: AndroidImportance.HIGH,
          sound: 'warning_notification',
          pressAction: {
            id: 'default',
          },
          actions: [
            {
              title: '✅ I\'m Available',
              pressAction: {
                id: 'available',
              },
            },
            {
              title: '❌ Reschedule',
              pressAction: {
                id: 'reschedule',
              },
            },
          ],
        },
        ios: {
          sound: 'notification_sound.wav',
          categoryId: 'task-reminder',
        },
      });

      Alert.alert(
        'Test Notification Scheduled',
        `A task notification has been scheduled for ${formattedTime} (10 minutes before the task).\n\nYou'll also see an immediate test notification with the same style.`
      );
    } catch (error) {
      console.error('Error testing notifications:', error);
      Alert.alert('Error', 'Failed to schedule test notification');
    }
  };

  const getBackgroundColors = (priority: TaskPriority) => {
    const baseColor = getPriorityColor(priority);
    // Create lighter versions of the colors for better contrast
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

  const getAccentColor = (priority: TaskPriority) => {
    // Return original priority colors for accents
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#1A2980', '#26D0CE']} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{route.params?.title || 'Tasks'}</Text>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testNotification}
        >
          <Icon name="notifications" size={24} color="#1A2980" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.filtersSection}>
        {renderFilterChips()}
        {renderStatusFilter()}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.centerContent}>
            <Icon name="event-busy" size={64} color="#1A2980" />
            <Text style={styles.emptyText}>No tasks found</Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const accentColor = getAccentColor(task.priority);
            return (
              <TouchableOpacity 
                key={task.id} 
                style={[
                  styles.taskCard,
                  task.status === 'completed' && styles.completedTaskCard
                ]}
                onPress={() => navigation.navigate('WorkTracking', { task })}
              >
                <LinearGradient 
                  colors={getBackgroundColors(task.priority)}
                  style={styles.taskGradient}
                >
                  <View style={styles.taskHeader}>
                    <View style={styles.taskHeaderLeft}>
                      <View style={[styles.taskTimeContainer, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                        <Icon name="access-time" size={16} color={accentColor} />
                        <Text style={[styles.taskTime, { color: accentColor }]}>{formatTime(task.scheduledTime)}</Text>
                      </View>
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
                    </View>
                    <View style={[styles.priorityBadge, { backgroundColor: accentColor }]}>
                      <Text style={styles.priorityText}>{task.priority}</Text>
                    </View>
                  </View>

                  <View style={styles.taskContent}>
                    <View style={[styles.categoryIcon, { 
                      backgroundColor: accentColor + '15',
                      borderColor: accentColor + '30'
                    }]}>
                      <Icon name={getCategoryIcon(task.category)} size={24} color={accentColor} />
                    </View>
                    <View style={styles.taskInfo}>
                      <Text style={[
                        styles.taskTitle, 
                        { color: '#1A2980' },
                        task.status === 'completed' && styles.completedTaskTitle
                      ]}>
                        {task.title}
                      </Text>
                      <Text style={[
                        styles.taskDescription, 
                        { color: 'rgba(26, 41, 128, 0.7)' },
                        task.status === 'completed' && styles.completedTaskDescription
                      ]} numberOfLines={1}>
                        {task.description}
                      </Text>
                      <View style={styles.taskFooter}>
                        <View style={[styles.durationBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                          <Icon name="schedule" size={14} color={accentColor} />
                          <Text style={[styles.taskDuration, { color: accentColor }]}>{task.duration} min</Text>
                        </View>
                        <View style={[styles.parentBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                          <Icon name="folder" size={14} color={accentColor} />
                          <Text style={[styles.parentTitle, { color: accentColor }]}>{task.parentTitle}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
  },
  testButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersSection: {
    backgroundColor: '#FFF',
    paddingTop: 16,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 41, 128, 0.1)',
    marginRight: 10,
    minWidth: 90,
    alignItems: 'center',
  },
  activeFilterChip: {
    backgroundColor: '#1A2980',
  },
  filterText: {
    color: '#1A2980',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  activeFilterText: {
    color: '#FFF',
  },
  statusFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(26, 41, 128, 0.1)',
  },
  activeStatusChip: {
    backgroundColor: '#1A2980',
  },
  statusText: {
    color: '#1A2980',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  activeStatusText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#1A2980',
    fontFamily: 'Poppins-Medium',
    marginTop: 12,
  },
  emptyText: {
    marginTop: 16,
    color: '#1A2980',
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
  },
  taskCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  priorityText: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontFamily: 'Poppins-SemiBold',
    color: '#FFF',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: 'Poppins-SemiBold',
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
  durationBadge: {
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
  parentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  parentTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
});

export default TasksScreen; 