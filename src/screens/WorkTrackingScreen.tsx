import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Task, WorkMode, PomodoroSettings } from '../types/task';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import CircularTimer from '../components/CircularTimer';
import { goalService } from '../services/goalService';
import { routineService } from '../services/routineService';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkTracking'>;

const defaultPomodoroSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const { width } = Dimensions.get('window');

const WorkTrackingScreen = ({ route, navigation }: Props) => {
  const { task: serializedTask } = route.params;
  
  // Deserialize the dates
  const task = {
    ...serializedTask,
    scheduledDate: new Date(serializedTask.scheduledDate),
    reminderTime: serializedTask.reminderTime ? new Date(serializedTask.reminderTime) : undefined,
  };

  const [mode, setMode] = useState<WorkMode>('timer');
  const [showSettings, setShowSettings] = useState(false);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(defaultPomodoroSettings);
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentSession, setCurrentSession] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  useEffect(() => {
    // Initialize timeRemaining only for pomodoro mode
    if (mode === 'pomodoro') {
      setTimeRemaining(getCurrentDuration());
    }
  }, [mode, isBreak, currentSession, pomodoroSettings]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        if (mode === 'pomodoro') {
          // Countdown for pomodoro
          setTimeRemaining((prev) => {
            const newTime = prev - 1;
            if (newTime <= 0) {
              handleSessionComplete();
              return 0;
            }
            return newTime;
          });
        } else {
          // Count up for regular timer
          setTimeElapsed(prev => prev + 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const handleSessionComplete = () => {
    setIsRunning(false);

    if (mode === 'pomodoro') {
      if (isBreak) {
        setIsBreak(false);
        setCurrentSession(prev => prev + 1);
        Alert.alert('Break Complete', 'Ready to start working?', [
          { 
            text: 'Start', 
            onPress: () => {
              setTimeRemaining(pomodoroSettings.workDuration * 60);
              setIsRunning(true);
            }
          }
        ]);
      } else {
        setIsBreak(true);
        const breakDuration = currentSession % pomodoroSettings.sessionsBeforeLongBreak === 0
          ? pomodoroSettings.longBreakDuration
          : pomodoroSettings.shortBreakDuration;
        Alert.alert('Work Session Complete', 'Time for a break!', [
          { 
            text: 'Start Break', 
            onPress: () => {
              setTimeRemaining(breakDuration * 60);
              setIsRunning(true);
            }
          }
        ]);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = (duration: number) => {
    // Handle completion
    navigation.goBack();
  };

  const handleModeChange = (newMode: WorkMode) => {
    if (isRunning) {
      Alert.alert(
        'Change Mode',
        'Changing mode will reset your current session. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              setMode(newMode);
              if (newMode === 'pomodoro') {
                setTimeRemaining(pomodoroSettings.workDuration * 60);
                setTimeElapsed(0);
              } else {
                setTimeElapsed(0);
              }
              setIsRunning(false);
              setCurrentSession(1);
              setIsBreak(false);
            }
          },
        ]
      );
    } else {
      setMode(newMode);
      if (newMode === 'pomodoro') {
        setTimeRemaining(pomodoroSettings.workDuration * 60);
        setTimeElapsed(0);
      } else {
        setTimeElapsed(0);
      }
    }
  };

  const getCurrentDuration = (): number => {
    if (mode === 'pomodoro') {
      return (isBreak 
        ? (currentSession % pomodoroSettings.sessionsBeforeLongBreak === 0 
          ? pomodoroSettings.longBreakDuration 
          : pomodoroSettings.shortBreakDuration)
        : pomodoroSettings.workDuration) * 60; // Convert to seconds
    }
    return task.duration * 60; // Convert to seconds
  };

  const handleTaskCompletion = () => {
    setShowCompletionModal(true);
  };

  const confirmTaskCompletion = async () => {
    try {
      if (task.type === 'routine' && task.routineId && task.subRoutineId) {
        // Handle activity completion
        await routineService.updateActivityStatus(
          task.routineId,
          task.subRoutineId,
          task.id,
          'completed'
        );

        // Get updated subroutine details to calculate progress
        const subroutine = await routineService.getSubRoutineDetails(task.routineId, task.subRoutineId);
        
        // Calculate subroutine progress based on completed activities
        const totalActivities = subroutine.activities?.length || 0;
        const completedActivities = subroutine.activities?.filter(a => a.status === 'completed').length || 0;
        const subroutineProgress = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

        // Update subroutine progress
        await routineService.updateSubRoutineProgress(task.routineId, task.subRoutineId, subroutineProgress);

        // Get routine details to calculate overall progress
        const routine = await routineService.getRoutineDetails(task.routineId);
        const totalSubroutines = routine.subRoutines?.length || 0;
        const subroutineProgresses = routine.subRoutines?.map(sr => sr.progress) || [];
        const routineProgress = totalSubroutines > 0 
          ? Math.round(subroutineProgresses.reduce((acc, curr) => acc + curr, 0) / totalSubroutines)
          : 0;

        // Update routine progress
        await routineService.updateRoutineProgress(task.routineId, routineProgress);
      } else {
        // Handle subgoal completion
        await goalService.updateSubGoal(task.id, {
          completed: true,
          progress: 100
        });
      }

      setShowCompletionModal(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert(
        'Error',
        'Failed to complete task. Please try again.',
        [{ text: 'OK', onPress: () => setShowCompletionModal(false) }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDescription}>{task.description}</Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'timer' && styles.modeButtonActive]}
            onPress={() => handleModeChange('timer')}
          >
            <Icon name="timer" size={24} color={mode === 'timer' ? '#FFF' : '#BDE3FF'} />
            <Text style={[styles.modeText, mode === 'timer' && styles.modeTextActive]}>Timer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeButton, mode === 'pomodoro' && styles.modeButtonActive]}
            onPress={() => handleModeChange('pomodoro')}
          >
            <Icon name="schedule" size={24} color={mode === 'pomodoro' ? '#FFF' : '#BDE3FF'} />
            <Text style={[styles.modeText, mode === 'pomodoro' && styles.modeTextActive]}>Pomodoro</Text>
          </TouchableOpacity>
        </View>

        {/* Timer Section */}
        <View style={styles.timerSection}>
          <CircularTimer
            duration={getCurrentDuration()}
            elapsed={mode === 'pomodoro' ? getCurrentDuration() - timeRemaining : timeElapsed}
            size={280}
            strokeWidth={20}
            isBreak={isBreak}
          >
            <Text style={styles.timer}>
              {mode === 'pomodoro' ? formatTime(timeRemaining) : formatTime(timeElapsed)}
            </Text>
            {mode === 'pomodoro' && (
              <Text style={styles.sessionInfo}>
                Session {currentSession} - {isBreak ? 'Break' : 'Work'}
              </Text>
            )}
          </CircularTimer>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlSection}>
          <TouchableOpacity 
            style={[styles.controlButton, isRunning ? styles.pauseButton : styles.playButton]}
            onPress={() => setIsRunning(!isRunning)}
          >
            <Icon 
              name={isRunning ? 'pause' : 'play-arrow'} 
              size={32} 
              color="#FFF" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => handleComplete(timeRemaining / 60)}
          >
            <Icon name="stop" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Settings Button */}
        {mode === 'pomodoro' && (
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
          >
            <Icon name="settings" size={24} color="#FFF" />
            <Text style={styles.settingsText}>Settings</Text>
          </TouchableOpacity>
        )}

        {/* Complete Task Button */}
        <TouchableOpacity 
          style={styles.completeButton}
          onPress={handleTaskCompletion}
        >
          <Icon name="check-circle" size={24} color="#FFF" />
          <Text style={styles.completeButtonText}>Mark as Completed</Text>
        </TouchableOpacity>
      </View>

      {/* Pomodoro Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pomodoro Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Work Duration (minutes)</Text>
              <TextInput
                style={styles.settingInput}
                value={pomodoroSettings.workDuration.toString()}
                onChangeText={(value) => setPomodoroSettings(prev => ({
                  ...prev,
                  workDuration: parseInt(value) || prev.workDuration
                }))}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Short Break (minutes)</Text>
              <TextInput
                style={styles.settingInput}
                value={pomodoroSettings.shortBreakDuration.toString()}
                onChangeText={(value) => setPomodoroSettings(prev => ({
                  ...prev,
                  shortBreakDuration: parseInt(value) || prev.shortBreakDuration
                }))}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Long Break (minutes)</Text>
              <TextInput
                style={styles.settingInput}
                value={pomodoroSettings.longBreakDuration.toString()}
                onChangeText={(value) => setPomodoroSettings(prev => ({
                  ...prev,
                  longBreakDuration: parseInt(value) || prev.longBreakDuration
                }))}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Sessions before Long Break</Text>
              <TextInput
                style={styles.settingInput}
                value={pomodoroSettings.sessionsBeforeLongBreak.toString()}
                onChangeText={(value) => setPomodoroSettings(prev => ({
                  ...prev,
                  sessionsBeforeLongBreak: parseInt(value) || prev.sessionsBeforeLongBreak
                }))}
                keyboardType="number-pad"
              />
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Task Completion Confirmation Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.completionModalContainer}>
          <View style={styles.completionModalContent}>
            <View style={styles.completionIconContainer}>
              <Icon name="check-circle" size={60} color="#4CAF50" />
            </View>
            
            <Text style={styles.completionTitle}>Complete Task?</Text>
            <Text style={styles.completionDescription}>
              Are you sure you want to mark this task as completed? This action cannot be undone.
            </Text>

            <View style={styles.completionButtons}>
              <TouchableOpacity 
                style={[styles.completionButton, styles.cancelButton]}
                onPress={() => setShowCompletionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.completionButton, styles.confirmButton]}
                onPress={confirmTaskCompletion}
              >
                <Text style={styles.confirmButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2980',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  taskTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  taskDescription: {
    fontSize: 16,
    color: '#BDE3FF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  timerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: -40, // Adjust this value to fine-tune vertical centering
  },
  timer: {
    fontSize: 64,
    fontWeight: '200',
    color: '#FFF',
    marginBottom: 8,
  },
  sessionInfo: {
    fontSize: 18,
    color: '#BDE3FF',
    marginTop: 8,
  },
  controlSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 20,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FF6B00',
  },
  resetButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    padding: 4,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeText: {
    marginLeft: 8,
    color: '#BDE3FF',
    fontSize: 16,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#FFF',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginBottom: 20,
  },
  settingsText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 16,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginBottom: 30,
  },
  completeButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
  },
  saveButton: {
    backgroundColor: '#1A2980',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  completionModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
  },
  completionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  completionDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  completionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  completionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default WorkTrackingScreen; 