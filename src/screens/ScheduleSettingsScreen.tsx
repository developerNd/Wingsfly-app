import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  NativeModules,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { AppLockModule } = NativeModules;

interface TimeSettings {
  scheduledLockStartHour: number;
  scheduledLockStartMinute: number;
  scheduledLockEndHour: number;
  scheduledLockEndMinute: number;
  scheduledUnlockStartHour: number;
  scheduledUnlockStartMinute: number;
  scheduledUnlockEndHour: number;
  scheduledUnlockEndMinute: number;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ScheduleSettings'>;
};

const ScheduleSettingsScreen = ({ navigation }: Props) => {
  const [settings, setSettings] = useState<TimeSettings>({
    scheduledLockStartHour: 0,
    scheduledLockStartMinute: 0,
    scheduledLockEndHour: 0,
    scheduledLockEndMinute: 0,
    scheduledUnlockStartHour: 0,
    scheduledUnlockStartMinute: 0,
    scheduledUnlockEndHour: 0,
    scheduledUnlockEndMinute: 0,
  });

  const [showPicker, setShowPicker] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<keyof TimeSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const times = await AppLockModule.getScheduleTimes();
      setSettings(times);
    } catch (error) {
      console.error('Error loading schedule times:', error);
    }
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    
    if (selectedDate && currentEdit) {
      const hour = selectedDate.getHours();
      const minute = selectedDate.getMinutes();
      
      const newSettings = { ...settings };
      if (currentEdit.includes('Hour')) {
        newSettings[currentEdit] = hour;
      } else {
        newSettings[currentEdit] = minute;
      }
      
      setSettings(newSettings);
      await saveSettings(newSettings);
    }
  };

  const saveSettings = async (newSettings: TimeSettings) => {
    try {
      await AppLockModule.updateScheduleTimes(
        newSettings.scheduledLockStartHour,
        newSettings.scheduledLockStartMinute,
        newSettings.scheduledLockEndHour,
        newSettings.scheduledLockEndMinute,
        newSettings.scheduledUnlockStartHour,
        newSettings.scheduledUnlockStartMinute,
        newSettings.scheduledUnlockEndHour,
        newSettings.scheduledUnlockEndMinute
      );
    } catch (error) {
      console.error('Error saving schedule times:', error);
    }
  };

  const renderTimeButton = (title: string, hour: number, minute: number, hourKey: keyof TimeSettings, minuteKey: keyof TimeSettings) => (
    <View style={styles.timeContainer}>
      <Text style={styles.timeLabel}>{title}</Text>
      <TouchableOpacity 
        style={styles.timeButton}
        onPress={() => {
          setCurrentEdit(hourKey);
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
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Settings</Text>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduled Lock Times</Text>
          {renderTimeButton(
            'Start Time',
            settings.scheduledLockStartHour,
            settings.scheduledLockStartMinute,
            'scheduledLockStartHour',
            'scheduledLockStartMinute'
          )}
          {renderTimeButton(
            'End Time',
            settings.scheduledLockEndHour,
            settings.scheduledLockEndMinute,
            'scheduledLockEndHour',
            'scheduledLockEndMinute'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scheduled Unlock Times</Text>
          {renderTimeButton(
            'Start Time',
            settings.scheduledUnlockStartHour,
            settings.scheduledUnlockStartMinute,
            'scheduledUnlockStartHour',
            'scheduledUnlockStartMinute'
          )}
          {renderTimeButton(
            'End Time',
            settings.scheduledUnlockEndHour,
            settings.scheduledUnlockEndMinute,
            'scheduledUnlockEndHour',
            'scheduledUnlockEndMinute'
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 16,
    color: '#666',
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

export default ScheduleSettingsScreen; 