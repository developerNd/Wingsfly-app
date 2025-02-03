import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  NativeModules,
  Dimensions,
} from 'react-native';
import { Task } from '../types/task';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const { TimerModule } = NativeModules;

const GlobalTaskIndicator = () => {
  const [runningTask, setRunningTask] = useState<Task | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const navigation = useNavigation();

  const checkRunningTask = async () => {
    try {
      console.log('[GlobalTaskIndicator] Checking running task...');
      const taskInfo = await TimerModule.getRunningTaskInfo();
      console.log('[GlobalTaskIndicator] Received taskInfo:', taskInfo);
      
      if (taskInfo && taskInfo.taskId) {
        const formattedTask: Task = {
          id: parseInt(taskInfo.taskId),
          title: taskInfo.title,
          description: taskInfo.description,
          status: 'in_progress',
          scheduledDate: new Date(),
          scheduledTime: taskInfo.scheduledTime || '00:00',
          duration: taskInfo.duration || 30,
          priority: taskInfo.priority || 'MEDIUM',
          category: taskInfo.category || 'task',
          type: taskInfo.type || 'task',
          parentTitle: taskInfo.parentTitle || ''
        };

        console.log('[GlobalTaskIndicator] Formatted task:', formattedTask);
        
        // Only update if task info has changed
        if (!runningTask || runningTask.id.toString() !== taskInfo.taskId || timeElapsed !== taskInfo.timeElapsed) {
          setRunningTask(formattedTask);
          setTimeElapsed(taskInfo.timeElapsed || 0);
        }
      } else if (runningTask) {
        console.log('[GlobalTaskIndicator] No running task, clearing state');
        setRunningTask(null);
        setTimeElapsed(0);
      }
    } catch (error) {
      console.error('[GlobalTaskIndicator] Error:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const checkTask = async () => {
      if (mounted) {
        await checkRunningTask();
      }
    };

    checkTask();
    const interval = setInterval(checkTask, 1000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!runningTask) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => navigation.navigate('WorkTracking', { 
          task: runningTask,
          initialTimeElapsed: timeElapsed 
        })}
      >
        <View style={styles.content}>
          <Icon name="timer" size={24} color="#FFF" />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {runningTask.title}
            </Text>
            <Text style={styles.subtitle}>{formatTime(timeElapsed)}</Text>
          </View>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => TimerModule.stopForegroundService()}
          >
            <Icon name="stop" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  container: {
    width: width - 32,
    backgroundColor: '#1A2980',
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginBottom: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: '#BDE3FF',
    fontSize: 12,
    marginTop: 2,
  },
  stopButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
});

export default GlobalTaskIndicator; 