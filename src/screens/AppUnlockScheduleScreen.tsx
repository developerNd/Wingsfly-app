import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  NativeModules,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { AppLockModule } = NativeModules;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AppUnlockSchedule'>;
  route: {
    params: {
      packageName: string;
      appName: string;
    };
  };
};

const AppUnlockScheduleScreen = ({ navigation, route }: Props) => {
  const { packageName, appName } = route.params;
  const [showPicker, setShowPicker] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<'start' | 'end' | null>(null);
  const [schedule, setSchedule] = useState({
    startHour: 0,
    startMinute: 0,
    endHour: 0,
    endMinute: 0,
  });

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const times = await AppLockModule.getAppUnlockSchedule(packageName);
      setSchedule(times);
    } catch (error) {
      console.error('Error loading app unlock schedule:', error);
    }
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    
    if (selectedDate && currentEdit) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      
      const newSchedule = { ...schedule };
      if (currentEdit === 'start') {
        newSchedule.startHour = hour;
        newSchedule.startMinute = minute;
      } else {
        newSchedule.endHour = hour;
        newSchedule.endMinute = minute;
      }
      
      setSchedule(newSchedule);
      await saveSchedule(newSchedule);
    }
  };

  const saveSchedule = async (newSchedule: typeof schedule) => {
    try {
      await AppLockModule.updateAppUnlockSchedule(
        packageName,
        newSchedule.startHour,
        newSchedule.startMinute,
        newSchedule.endHour,
        newSchedule.endMinute
      );
    } catch (error) {
      console.error('Error saving app unlock schedule:', error);
    }
  };

  const renderTimeButton = (title: string, hour: number, minute: number, type: 'start' | 'end') => (
    <View style={styles.timeContainer}>
      <Text style={styles.timeLabel}>{title}</Text>
      <TouchableOpacity 
        style={styles.timeButton}
        onPress={() => {
          setCurrentEdit(type);
          setShowPicker(true);
        }}
      >
        <Text style={styles.timeText}>
          {`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{appName}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Set specific unlock times for this app. The app will be locked outside these hours.
        </Text>

        {renderTimeButton(
          'Unlock Start Time',
          schedule.startHour,
          schedule.startMinute,
          'start'
        )}
        {renderTimeButton(
          'Unlock End Time',
          schedule.endHour,
          schedule.endMinute,
          'end'
        )}
      </View>

      {showPicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 16,
    color: '#333',
  },
  timeButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default AppUnlockScheduleScreen; 