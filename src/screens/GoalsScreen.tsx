import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useNavigation } from '@react-navigation/native';
import { lifeGoals } from '../data/goalsData';
import AddTemporaryGoalModal from '../components/AddTemporaryGoalModal';
import { goalService } from '../services/goalService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { LifeGoal } from '../types/goals';
import { categories } from '../data/categories';
import { handleApiError, showErrorAlert } from '../utils/errorHandling';
import NetworkErrorBoundary from '../components/NetworkErrorBoundary';
import { TASK_PRIORITY } from '../data/tasksData';

const GoalsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [goals, setGoals] = useState<LifeGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadGoals();
  }, []);

  const handleDeleteGoal = async (goalId: number) => {
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
              setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalId));
            } catch (err) {
              console.error('Error deleting goal:', err);
              showErrorAlert(err, 'Delete Error', 'Failed to delete goal');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const calculateGoalProgress = (goal: any) => {
    let totalSubgoals = 0;
    let completedSubgoals = 0;

    const countSubgoals = (subgoals: any[]) => {
      subgoals.forEach(subgoal => {
        totalSubgoals++;
        if (subgoal.completed) {
          completedSubgoals++;
        }
        // Check for both formats
        const nestedSubgoals = subgoal.sub_goals || subgoal.subGoals;
        if (nestedSubgoals && nestedSubgoals.length > 0) {
          countSubgoals(nestedSubgoals);
        }
      });
    };

    // Check for both formats
    const goalSubgoals = goal.sub_goals || goal.subGoals;
    if (goalSubgoals && goalSubgoals.length > 0) {
      countSubgoals(goalSubgoals);
    }

    return {
      totalCount: totalSubgoals,
      progress: totalSubgoals > 0 ? Math.round((completedSubgoals / totalSubgoals) * 100) : 0
    };
  };

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedGoals = await goalService.getAllGoals();
      
      const transformedGoals = fetchedGoals.map(goal => {
        const { totalCount, progress } = calculateGoalProgress(goal);
        return {
          ...goal,
          subGoalsCount: totalCount,
          progress: progress
        } as LifeGoal;
      });

      setGoals(transformedGoals);
    } catch (err) {
      console.error('Error loading goals:', err);
      const errorMessage = handleApiError(err, 'Failed to load goals');
      setError(errorMessage);
      showErrorAlert(err, 'Load Error', 'Failed to load goals', loadGoals);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (newGoal: Partial<LifeGoal>) => {
    try {
      // Convert time format from "7:13:29 PM" to "19:13"
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
          return timeStr;
        }
      };

      // Calculate duration
      const calculateDuration = () => {
        if (!newGoal.startDate || !newGoal.endDate || !newGoal.start_time || !newGoal.end_time) {
          return 0;
        }
        const startDateTime = new Date(`${newGoal.startDate}T${convertTime(newGoal.start_time)}`);
        const endDateTime = new Date(`${newGoal.endDate}T${convertTime(newGoal.end_time)}`);
        return Math.floor((endDateTime.getTime() - startDateTime.getTime()) / 60000);
      };

      // Validate time if provided
      if (newGoal.startTime && newGoal.endTime) {
        const startTime = new Date(`1970-01-01T${convertTime(newGoal.startTime)}`);
        const endTime = new Date(`1970-01-01T${convertTime(newGoal.endTime)}`);
        
        if (endTime <= startTime) {
          Alert.alert('Invalid Time', 'End time must be after start time');
          return;
        }
      }

      // Rest of validation...
      if (!newGoal.title || !newGoal.category || !newGoal.priority) {
        Alert.alert('Missing Fields', 'Please fill in all required fields');
        return;
      }

      setLoading(true);
      setError(null);

      const goalData = {
        ...newGoal,
        priority: newGoal.priority || TASK_PRIORITY.MEDIUM,
        category: newGoal.category,
        start_time: convertTime(newGoal.start_time || newGoal.startTime),
        end_time: convertTime(newGoal.end_time || newGoal.endTime),
        start_date: newGoal.startDate,
        end_date: newGoal.endDate,
        duration: calculateDuration(),
        is_temporary: newGoal.is_temporary || false
      };

      const createdGoal = await goalService.createGoal(goalData);
      
      const { totalCount, progress } = calculateGoalProgress(createdGoal);
      const transformedGoal = {
        ...createdGoal,
        subGoalsCount: totalCount,
        progress: progress
      };

      setGoals(prevGoals => [...prevGoals, transformedGoal]);
      setShowAddModal(false);
    } catch (err) {
      console.error('Error creating goal:', err);
      showErrorAlert(err, 'Add Goal Error', 'Failed to create goal');
    } finally {
      setLoading(false);
    }
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

  // Add this effect to refresh goals when returning to the screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadGoals();
    });

    return unsubscribe;
  }, [navigation]);

  const getBackgroundColors = (color: string) => {
    // Create lighter versions of the colors for better contrast
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

  const filteredGoals = useMemo(() => {
    if (selectedCategory === 'all') return goals;
    return goals.filter(goal => goal.category === selectedCategory);
  }, [goals, selectedCategory]);

  const CategorySelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryContainer}
    >
      <TouchableOpacity
        style={[
          styles.categoryChip,
          selectedCategory === 'all' && styles.selectedCategoryChip
        ]}
        onPress={() => setSelectedCategory('all')}
      >
        <Text style={[
          styles.categoryText,
          selectedCategory === 'all' && styles.selectedCategoryText
        ]}>All</Text>
      </TouchableOpacity>
      {categories.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.selectedCategoryChip
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Icon name={category.icon} size={16} color={selectedCategory === category.id ? '#FFF' : '#1A2980'} />
          <Text style={[
            styles.categoryText,
            selectedCategory === category.id && styles.selectedCategoryText
          ]}>{category.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient colors={['#1A2980', '#26D0CE']} style={styles.header}>
          <Text style={styles.headerTitle}>Goals</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="add-circle" size={24} color="#1A2980" />
            <Text style={styles.addButtonText}>Add Goal</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* <CategorySelector /> */}

        {error ? (
          <NetworkErrorBoundary 
            error={error} 
            onRetry={loadGoals}
          />
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredGoals.map((goal) => (
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
                    <View style={[styles.iconContainer, { 
                      backgroundColor: goal.color + '15',
                      borderColor: goal.color + '30'
                    }]}>
                      <Icon name={goal.icon} size={24} color={goal.color} />
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={[styles.goalTitle, { color: '#1A2980' }]}>{goal.title}</Text>
                      <Text style={[styles.goalDescription, { 
                        color: 'rgba(26, 41, 128, 0.7)'
                      }]}>{goal.description}</Text>
                    </View>
                  </View>

                  <View style={styles.goalFooter}>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { width: `${goal.progress}%`, backgroundColor: goal.color }]} />
                    </View>
                    <View style={styles.statsContainer}>
                      <View style={[styles.statBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                        <Icon name="trending-up" size={14} color={goal.color} />
                        <Text style={[styles.progressText, { color: goal.color }]}>
                          {goal.progress}% Complete
                        </Text>
                      </View>
                      <View style={[styles.statBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                        <Icon name="format-list-bulleted" size={14} color={goal.color} />
                        <Text style={[styles.subGoalsText, { color: goal.color }]}>
                          {goal.subGoalsCount} Sub Goals
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteGoal(goal.id);
                      }}
                    >
                      <Icon name="delete" size={20} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <AddTemporaryGoalModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddGoal}
          categories={categories}
          loading={loading}
          requireCategory={true}
          requirePriority={true}
          validateTime={true}
        />
      </View>
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
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#1A2980',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  goalCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  goalGradient: {
    padding: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
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
    marginBottom: 6,
    fontFamily: 'Poppins-SemiBold',
  },
  goalDescription: {
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  goalFooter: {
    marginTop: 16,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    width: '50%', // This should be dynamic based on progress
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  subGoalsText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
    marginTop: 12,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 41, 128, 0.1)',
    marginRight: 8,
    gap: 6,
  },
  selectedCategoryChip: {
    backgroundColor: '#1A2980',
  },
  categoryText: {
    fontSize: 14,
    color: '#1A2980',
    fontFamily: 'Poppins-Medium',
  },
  selectedCategoryText: {
    color: '#FFF',
  },
});

export default GoalsScreen; 