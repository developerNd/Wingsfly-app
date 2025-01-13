import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import AddTemporaryGoalModal from '../components/AddTemporaryGoalModal';
import { routineService, Routine } from '../services/routineService';

const RoutinesScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadRoutines();
    }, [])
  );

  useEffect(() => {
    loadRoutines();
  }, []);

  const handleDeleteRoutine = async (routineId: number) => {
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
              await routineService.deleteRoutine(routineId);
              await loadRoutines(); // Refresh the routines list
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

  const loadRoutines = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await routineService.getAllRoutines();
      
      // Update each routine's progress based on its subroutines
      const updatedRoutines = await Promise.all(data.map(async (routine) => {
        // Get detailed routine info to access subroutines
        const detailedRoutine = await routineService.getRoutineDetails(routine.id);
        const totalSubroutines = detailedRoutine.subRoutines?.length || 0;
        const subroutineProgresses = detailedRoutine.subRoutines?.map(sr => sr.progress) || [];
        const routineProgress = totalSubroutines > 0 
          ? Math.round(subroutineProgresses.reduce((acc, curr) => acc + curr, 0) / totalSubroutines)
          : 0;

        return {
          ...routine,
          progress: routineProgress,
          totalSubRoutines: totalSubroutines
        };
      }));

      setRoutines(updatedRoutines);
    } catch (error) {
      console.error('Error loading routines:', error);
      setError('Failed to load routines. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoutinePress = (routine: { id: number; title: string; progress: number; icon: string; color: string }) => {
    navigation.navigate('DetailedRoutine', {
      routine: {
        ...routine,
        totalSubRoutines: 3,
        description: 'Daily routine for better productivity',
      },
    });
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
      setShowAddModal(false);
      loadRoutines(); // Refresh the routines list
    } catch (error) {
      console.error('Error adding routine:', error);
      setError('Failed to add routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient colors={['#1A2980', '#26D0CE']} style={styles.header}>
          <Text style={styles.headerTitle}>My Routines</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="add-circle" size={24} color="#1A2980" />
            <Text style={styles.addButtonText}>Add Routine</Text>
          </TouchableOpacity>
        </LinearGradient>

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
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {routines.map((routine) => (
            <TouchableOpacity 
              key={routine.id} 
              style={styles.routineCard}
              onPress={() => handleRoutinePress(routine)}
            >
              <LinearGradient 
                colors={getBackgroundColors(routine.color)}
                style={styles.routineGradient}
              >
                <View style={styles.routineHeader}>
                  <View style={[styles.iconContainer, { 
                    backgroundColor: routine.color + '15',
                    borderColor: routine.color + '30'
                  }]}>
                    <Icon name={routine.icon} size={24} color={routine.color} />
                  </View>
                  <View style={styles.routineInfo}>
                    <Text style={[styles.routineTitle, { color: '#1A2980' }]}>{routine.title}</Text>
                    <View style={styles.progressContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { 
                            backgroundColor: routine.color,
                            width: `${routine.progress}%`
                          }
                        ]} 
                      />
                    </View>
                    <View style={styles.statsContainer}>
                      <View style={[styles.statBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                        <Icon name="trending-up" size={14} color={routine.color} />
                        <Text style={[styles.progressText, { color: routine.color }]}>
                          {routine.progress}% Complete
                        </Text>
                      </View>
                      <View style={[styles.statBadge, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                        <Icon name="repeat" size={14} color={routine.color} />
                        <Text style={[styles.subRoutinesText, { color: routine.color }]}>
                          {routine.totalSubRoutines || 0} Steps
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: 'rgba(255, 68, 68, 0.1)' }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteRoutine(routine.id);
                      }}
                    >
                      <Icon name="delete" size={20} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <AddTemporaryGoalModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddRoutine}
          isRoutine={true}
          loading={loading}
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
  content: {
    flex: 1,
    padding: 20,
  },
  routineCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  routineGradient: {
    padding: 20,
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  routineInfo: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
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
  subRoutinesText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    margin: 20,
    padding: 16,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    color: '#D32F2F',
    flex: 1,
    marginRight: 12,
    fontFamily: 'Poppins-Medium',
  },
  retryButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
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
});

export default RoutinesScreen; 