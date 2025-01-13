import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAppSelector } from '../hooks/useRedux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { lifeGoals, LifeGoal } from '../data/goalsData';
import AddTemporaryGoalModal from '../components/AddTemporaryGoalModal';
import { getTodaysTasks, getPriorityColor, getCategoryIcon } from '../data/tasksData';
import { AuthState } from '../types/auth';
import { shorts } from '../data/shortsData';
import { dummyTeams } from '../data/teamsData';
import { Team } from '../types/team';
import { routineService, type Routine } from '../services/routineService';
import { goalService } from '../services/goalService';
import { Task } from '../types/task';
import { SubGoal } from '../data/goalsData';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAppSelector((state: { auth: AuthState }) => state.auth);
  const [showAddModal, setShowAddModal] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<LifeGoal[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadRoutines();
      loadGoals();
      loadTodaysTasks();
    }, [])
  );

  const loadRoutines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routineService.getAllRoutines();
      setRoutines(data);
    } catch (error) {
      console.error('Error loading routines:', error);
      setError('Failed to load routines. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      const data = await goalService.getAllGoals();
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadTodaysTasks = async () => {
    try {
      const response = await goalService.getAllGoals();
      const goals = (response as any).data || response;
      console.log('Goals response:', goals);
      
      const endSubGoals: Task[] = [];
      const today = new Date().toISOString().split('T')[0];
      console.log('Today:', today);

      // Process each goal
      for (const goal of goals) {
        console.log('Processing goal:', goal.title, 'SubGoals:', goal.sub_goals);
        
        const processSubGoals = (subGoals: any[], parentTitle: string) => {
          if (!subGoals || !Array.isArray(subGoals)) return;
          
          subGoals.forEach(subGoal => {
            console.log('Checking subgoal:', subGoal.title, 'Start time:', subGoal.start_time, 'Due date:', subGoal.due_date);
            
            if (!subGoal.sub_goals || subGoal.sub_goals.length === 0) {
              // Check if scheduled for today using start_time
              const startDate = subGoal.start_time?.split('T')[0];
              const dueDate = subGoal.due_date?.split('T')[0];
              
              // Check if either start_time or due_date matches today
              if (startDate === today || dueDate === today) {
                endSubGoals.push({
                  id: subGoal.id,
                  title: subGoal.title,
                  description: subGoal.description || '',
                  scheduledDate: new Date(subGoal.start_time || subGoal.due_date),
                  scheduledTime: subGoal.start_time ? new Date(subGoal.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '09:00',
                  duration: subGoal.duration || 30,
                  priority: 'MEDIUM',
                  status: subGoal.completed ? 'completed' : 'in_progress',
                  category: 'goal',
                  type: 'goal',
                  parentTitle: parentTitle
                });
              }
            } else {
              processSubGoals(subGoal.sub_goals, subGoal.title);
            }
          });
        };

        if (goal.sub_goals) {
          processSubGoals(goal.sub_goals, goal.title);
        }
      }

      // Sort tasks by scheduled time
      endSubGoals.sort((a, b) => {
        const timeA = a.scheduledTime.split(':').map(Number);
        const timeB = b.scheduledTime.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });

      console.log('Found end subgoals:', endSubGoals);
      setTodaysTasks(endSubGoals);
    } catch (error) {
      console.error('Error loading today\'s tasks:', error);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const period = Number(hours) >= 12 ? 'PM' : 'AM';
    const formattedHours = Number(hours) % 12 || 12;
    return `${formattedHours}:${minutes} ${period}`;
  };

  const handleGoalPress = (goal: typeof lifeGoals[0]) => {
    navigation.navigate('DetailedGoal', {
      goalId: goal.id,
      title: goal.title,
      description: goal.description,
      progress: goal.progress,
      color: goal.color,
      icon: goal.icon,
      subGoals: goal.subGoals,
    });
  };

  const handleAddTemporaryGoal = async (newGoal: Partial<LifeGoal>) => {
    try {
      setLoading(true);
      const createdGoal = await goalService.createGoal({
        ...newGoal,
        progress: 0,
        subGoals: []
      });
      console.log('Created goal:', createdGoal);
      setShowAddModal(false);
      loadGoals(); // Refresh the goals list
    } catch (error) {
      console.error('Error adding goal:', error);
      setError('Failed to add goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTeamsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Teams</Text>
        <TouchableOpacity 
          style={styles.createTeamButton}
          onPress={() => navigation.navigate('TeamManagement', { goalId: null })}
        >
          <Icon name="add" size={20} color="#FF6B00" />
          <Text style={styles.createTeamText}>Create Team</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.teamsContainer}
        >
        {dummyTeams.map(team => (
          <TouchableOpacity 
            key={team.id}
            style={styles.teamCard}
            onPress={() => navigation.navigate('TeamManagement', { goalId: team.goalId })}
          >
            <View style={styles.teamHeader}>
              <Text style={styles.teamName}>{team.name}</Text>
              <View style={styles.teamProgress}>
                <Text style={styles.teamProgressText}>{team.progress}%</Text>
              </View>
            </View>
            <Text style={styles.teamDescription} numberOfLines={2}>
              {team.description}
            </Text>
            <View style={styles.teamMembers}>
              {team.members.slice(0, 3).map(member => (
                <Image 
                  key={member.id}
                  source={{ uri: member.avatar }}
                  style={styles.memberAvatar}
                />
              ))}
              {team.members.length > 3 && (
                <View style={styles.moreMembersCircle}>
                  <Text style={styles.moreMembersText}>+{team.members.length - 3}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTodaysTasks = () => {
    const displayTasks = todaysTasks.slice(0, 5);
    const hasMoreTasks = todaysTasks.length > 5;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Tasks', { 
              initialTasks: todaysTasks,
              title: "Today's Tasks"
            })}
          >
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {displayTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="event-available" size={40} color="#666" />
            <Text style={styles.emptyStateText}>No tasks scheduled for today</Text>
          </View>
        ) : (
          <>
            {displayTasks.map((task) => (
              <TouchableOpacity 
                key={task.id} 
                style={styles.taskCard}
                onPress={() => navigation.navigate('WorkTracking', { task })}
              >
                <View style={styles.taskHeader}>
                  <View style={styles.taskTimeContainer}>
                    <Icon name="access-time" size={16} color="#666" />
                    <Text style={styles.taskTime}>{formatTime(task.scheduledTime)}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
                    <Text style={styles.priorityText}>{task.priority}</Text>
                  </View>
                </View>

                <View style={styles.taskContent}>
                  <View style={[styles.categoryIcon, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                    <Icon name={getCategoryIcon(task.category)} size={24} color={getPriorityColor(task.priority)} />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDescription} numberOfLines={1}>
                      {task.description}
                    </Text>
                    <View style={styles.taskFooter}>
                      <Text style={styles.taskDuration}>{task.duration} min</Text>
                      <Text style={styles.taskCategory}>{task.category}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {hasMoreTasks && (
              <TouchableOpacity 
                style={styles.moreTasksButton}
                onPress={() => navigation.navigate('Tasks', { 
                  initialTasks: todaysTasks,
                  title: "Today's Tasks"
                })}
              >
                <Text style={styles.moreTasksText}>+{todaysTasks.length - 5} more tasks</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  const getBackgroundColors = (color: string) => {
    switch (color) {
      case '#FF4444': // Red
        return ['#FFE5E5', '#FFF0F0'];
      case '#4CAF50': // Green
        return ['#E5FFE7', '#F0FFF2'];
      case '#2196F3': // Blue
        return ['#E5F6FF', '#F0FAFF'];
      case '#FFC107': // Yellow
        return ['#FFF5E5', '#FFFAF0'];
      default:
        return ['#E5F6FF', '#F0FAFF'];
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#1A2980', '#26D0CE']} style={styles.header}>
          <View style={styles.userInfo}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/100' }} 
              style={styles.avatar} 
            />
            <View>
              <Text style={styles.welcomeText}>Welcome Back,</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.analysisButton}
              onPress={() => navigation.navigate('GoalAnalysis')}
            >
              <Icon name="analytics" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <Icon name="notifications-none" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.quoteContainer}>
          <LinearGradient 
            colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']} 
            style={styles.quoteContent}
          >
            <Icon name="format-quote" size={24} color="#1A2980" />
            <Text style={styles.quoteText}>
              "The word Yoga means union. That means you consciously obliterate the boundaries of individuality and reverberate with the rest of the cosmos."
            </Text>
            <Text style={styles.quoteAuthor}>- Sadhguru</Text>
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => navigation.navigate('QuotesScreen')}
            >
              <Text style={styles.startButtonText}>Start Your Day</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Routines</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => navigation.navigate('Routines')}
            >
              <Text style={styles.seeAll}>See All</Text>
              <Icon name="chevron-right" size={20} color="#1A2980" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.routinesContainer}
          >
            {routines.map((routine) => (
              <TouchableOpacity
                key={routine.id}
                style={styles.routineCard}
                onPress={() => navigation.navigate('DetailedRoutine', { routine })}
              >
                <LinearGradient 
                  colors={getBackgroundColors(routine.color)}
                  style={styles.routineGradient}
                >
                  <View style={[styles.routineIconContainer, { 
                    backgroundColor: routine.color + '15',
                    borderColor: routine.color + '30'
                  }]}>
                    <Icon name={routine.icon} size={24} color={routine.color} />
                  </View>
                  <Text style={[styles.routineTitle, { color: '#1A2980' }]}>{routine.title}</Text>
                  <View style={styles.routineProgressContainer}>
                    <View style={[styles.routineProgressBar, { backgroundColor: routine.color }]} />
                  </View>
                  <View style={styles.routineStats}>
                    <View style={[styles.routineStatBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                      <Icon name="trending-up" size={14} color={routine.color} />
                      <Text style={[styles.routineProgressText, { color: routine.color }]}>
                        {routine.progress}% Complete
                      </Text>
                    </View>
                    <View style={[styles.routineStatBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                      <Icon name="repeat" size={14} color={routine.color} />
                      <Text style={[styles.routineStepsText, { color: routine.color }]}>
                        {routine.totalSubRoutines || 0} Steps
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderTodaysTasks()}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Motivational Shorts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {shorts.map((short) => (
              <TouchableOpacity 
                key={short.id} 
                style={styles.shortCard}
                onPress={() => navigation.navigate('ShortScreen', { initialShortId: short.id })}
              >
                <Image 
                  source={{ uri: short.thumbnail }} 
                  style={styles.shortThumbnail}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.shortGradient}
                >
                  <Text style={styles.shortTitle} numberOfLines={2}>
                    {short.title}
                  </Text>
                  <View style={styles.shortStats}>
                    <Text style={styles.shortViews}>{short.views} views</Text>
                    <Text style={styles.shortLikes}>{short.likes} likes</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Life Goals</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Icon name="add-circle" size={24} color="#1A2980" />
              <Text style={styles.addButtonText}>Add Goal</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.goalsContainer}
          >
            {goals.map((goal) => (
              <TouchableOpacity 
                key={goal.id} 
                style={styles.goalCard}
                onPress={() => handleGoalPress(goal)}
              >
                <LinearGradient 
                  colors={getBackgroundColors(goal.color)}
                  style={styles.goalGradient}
                >
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIconContainer, { 
                      backgroundColor: goal.color + '15',
                      borderColor: goal.color + '30'
                    }]}>
                      <Icon name={goal.icon} size={24} color={goal.color} />
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={[styles.goalTitle, { color: '#1A2980' }]}>{goal.title}</Text>
                      <Text style={[styles.goalDescription, { 
                        color: 'rgba(26, 41, 128, 0.7)'
                      }]} numberOfLines={2}>{goal.description}</Text>
                    </View>
                  </View>

                  <View style={styles.goalFooter}>
                    <View style={styles.goalProgressContainer}>
                      <View style={[styles.goalProgressBar, { backgroundColor: goal.color }]} />
                    </View>
                    <View style={styles.goalStats}>
                      <View style={[styles.goalStatBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                        <Icon name="trending-up" size={14} color={goal.color} />
                        <Text style={[styles.goalProgressText, { color: goal.color }]}>
                          {goal.progress}% Complete
                        </Text>
                      </View>
                      <View style={[styles.goalStatBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                        <Icon name="format-list-bulleted" size={14} color={goal.color} />
                        <Text style={[styles.goalSubtasksText, { color: goal.color }]}>
                          {goal.subGoals?.length || 0} Sub Goals
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {renderTeamsSection()}

        <AddTemporaryGoalModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddTemporaryGoal}
          loading={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  welcomeText: {
    fontSize: 14,
    color: '#E0E0E0',
    fontFamily: 'Poppins-Regular',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisButton: {
    marginRight: 16,
  },
  notificationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A2980',
    fontFamily: 'Poppins-SemiBold',
  },
  seeAll: {
    fontSize: 14,
    color: '#26D0CE',
    fontFamily: 'Poppins-Medium',
  },
  routineCard: {
    width: 280,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#FFF',
  },
  routineGradient: {
    padding: 20,
  },
  routineIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  routineTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  routineProgressContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    marginBottom: 12,
  },
  routineProgressBar: {
    height: '100%',
    borderRadius: 3,
    width: '50%', // This should be dynamic based on progress
  },
  routineStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
  routineStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  routineProgressText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  routineStepsText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  goalCard: {
    width: 320,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#FFF',
  },
  goalGradient: {
    padding: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  goalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  goalDescription: {
    fontSize: 14,
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  goalFooter: {
    gap: 12,
  },
  goalProgressContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
  },
  goalProgressBar: {
    height: '100%',
    borderRadius: 3,
    width: '50%', // This should be dynamic based on progress
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
  goalStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  goalProgressText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  goalSubtasksText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  quoteContainer: {
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  quoteContent: {
    padding: 20,
  },
  quoteText: {
    fontSize: 16,
    color: '#1A2980',
    fontStyle: 'italic',
    lineHeight: 24,
    marginVertical: 10,
    fontFamily: 'Poppins-Italic',
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#26D0CE',
    textAlign: 'right',
    fontFamily: 'Poppins-Medium',
  },
  startButton: {
    backgroundColor: '#1A2980',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  taskCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTime: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  priorityText: {
    color: '#FFF',
    fontSize: 12,
    textTransform: 'capitalize',
    fontFamily: 'Poppins-Medium',
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
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2980',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDuration: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  taskCategory: {
    fontSize: 12,
    color: '#FFF',
    backgroundColor: '#26D0CE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontFamily: 'Poppins-Medium',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  emptyStateText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  shortCard: {
    width: 200,
    height: 250,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  shortThumbnail: {
    width: '100%',
    height: '100%',
  },
  shortGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 15,
  },
  shortTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  shortStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shortViews: {
    fontSize: 12,
    color: '#E0E0E0',
    fontFamily: 'Poppins-Regular',
  },
  shortLikes: {
    fontSize: 12,
    color: '#E0E0E0',
    fontFamily: 'Poppins-Regular',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 41, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#1A2980',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    fontFamily: 'Poppins-Medium',
  },
  teamCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    marginRight: 16,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2980',
    fontFamily: 'Poppins-SemiBold',
  },
  teamProgress: {
    backgroundColor: 'rgba(38, 208, 206, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  teamProgressText: {
    fontSize: 12,
    color: '#26D0CE',
    fontFamily: 'Poppins-Medium',
  },
  teamDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
  },
  teamMembers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: -12,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  moreMembersCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  moreMembersText: {
    fontSize: 12,
    color: '#1A2980',
    fontFamily: 'Poppins-Medium',
  },
  createTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 41, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  createTeamText: {
    color: '#1A2980',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    fontFamily: 'Poppins-Medium',
  },
  moreTasksButton: {
    backgroundColor: 'rgba(26, 41, 128, 0.1)',
    padding: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 15,
  },
  moreTasksText: {
    color: '#1A2980',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 41, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  routinesContainer: {
    paddingLeft: 20,
    paddingRight: 5,
    paddingTop:5,
    paddingBottom:5
  },
  goalsContainer: {
    paddingLeft: 20,
    paddingRight: 5,
    paddingTop:5,
    paddingBottom:5
  },
  teamsContainer: {
    paddingLeft: 20,
    paddingRight: 5,
    paddingTop:5,
    paddingBottom:5
  },
});

export default HomeScreen; 