import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  NativeModules,
  ToastAndroid,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

const { AppLockModule } = NativeModules;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ScheduleUnlock'>;
};

interface TimeSlot {
  id: string;
  startTime: string;  // Format: "HH:mm"
  endTime: string;    // Format: "HH:mm"
  isEnabled: boolean;
}

interface UnlockSchedule {
  id: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

const ScheduleUnlockScreen = ({ navigation }: Props) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    id: string;
    type: 'start' | 'end';
  } | null>(null);
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const navigationNative = useNavigation();
  const { colors } = useTheme();

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      // Load all unlock schedules
      const schedules = await AppLockModule.getUnlockSchedules();
      console.log('Loaded unlock schedules:', schedules);
      
      if (schedules && schedules.length > 0) {
        // Convert the schedules to TimeSlot format
        const slots = schedules.map((schedule: UnlockSchedule) => ({
          id: schedule.id || Date.now().toString(),
          startTime: formatTime(schedule.startHour, schedule.startMinute),
          endTime: formatTime(schedule.endHour, schedule.endMinute),
          isEnabled: true
        }));
        
        console.log('Setting saved unlock time slots:', slots);
        setTimeSlots(slots);
      } else {
        // If no schedules found, set default
        console.log('No unlock schedules found, setting default');
        const defaultSlot: TimeSlot = {
          id: Date.now().toString(),
          startTime: '12:00',
          endTime: '15:00',
          isEnabled: true
        };
        setTimeSlots([defaultSlot]);
      }
    } catch (error) {
      console.error('Error loading unlock schedules:', error);
      const defaultSlot: TimeSlot = {
        id: Date.now().toString(),
        startTime: '12:00',
        endTime: '15:00',
        isEnabled: true
      };
      setTimeSlots([defaultSlot]);
    }
  };

  const handleTimeSelect = (type: 'start' | 'end', hour: string, minute: string, period: string) => {
    if (!selectedSlot) return;
    
    // Convert to 24-hour format
    let hours24 = parseInt(hour);
    if (period === 'PM' && hours24 !== 12) hours24 += 12;
    if (period === 'AM' && hours24 === 12) hours24 = 0;
    
    const timeString = `${hours24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
    console.log(`Setting ${type} time to: ${timeString}`);
    
    const updatedSlots = timeSlots.map(slot => {
      if (slot.id === selectedSlot.id) {
        const newSlot = {
          ...slot,
          [type === 'start' ? 'startTime' : 'endTime']: timeString
        };
        console.log('Updated slot:', newSlot);
        return newSlot;
      }
      return slot;
    });
    
    setTimeSlots(updatedSlots);
    saveTimeSlots(updatedSlots);
    setShowPicker(false);
  };

  const saveTimeSlots = async (slots: TimeSlot[]) => {
    try {
      // Convert TimeSlots to the format expected by native module
      const schedules = slots.map(slot => {
        const [startHourStr, startMinuteStr] = slot.startTime.split(':');
        const [endHourStr, endMinuteStr] = slot.endTime.split(':');

        return {
          id: slot.id,
          startHour: parseInt(startHourStr || '0'),
          startMinute: parseInt(startMinuteStr || '0'),
          endHour: parseInt(endHourStr || '0'),
          endMinute: parseInt(endMinuteStr || '0')
        };
      });

      console.log('Saving unlock schedules:', schedules);
      await AppLockModule.updateUnlockSchedules(schedules);

      // Verify the save by reloading schedules
      const savedSchedules = await AppLockModule.getUnlockSchedules();
      console.log('Verified saved schedules:', savedSchedules);
    } catch (error) {
      console.error('Error saving unlock schedules:', error);
      Alert.alert(
        'Error',
        'Failed to save unlock schedules. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const addTimeSlot = () => {
    console.log('Adding new unlock time slot');
    const defaultSlot = timeSlots.length > 0 
      ? timeSlots[timeSlots.length - 1]
      : { startTime: '12:00', endTime: '15:00' };

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime: defaultSlot.startTime,
      endTime: defaultSlot.endTime,
      isEnabled: true,
    };
    console.log('New slot:', newSlot);

    const updatedSlots = [...timeSlots, newSlot];
    setTimeSlots(updatedSlots);
    saveTimeSlots(updatedSlots);
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(timeSlots.filter(slot => slot.id !== id));
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatTo12Hour = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const showTimePicker = (id: string, type: 'start' | 'end') => {
    setSelectedSlot({ id, type });
    setShowPicker(true);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleSaveSchedule = async () => {
    try {
      await saveTimeSlots(timeSlots);
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Schedules saved successfully', ToastAndroid.SHORT);
      } else {
        Alert.alert('Success', 'Schedules saved successfully');
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving schedules:', error);
      Alert.alert(
        'Error',
        'Failed to save schedules. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Schedule Unlock</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.addButton} onPress={addTimeSlot}>
            <Icon name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerSaveButton} onPress={handleSaveSchedule}>
            <Icon name="check" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.description, { color: colors.text }]}>
          Set times when the app should automatically unlock. The app will be accessible during these periods.
        </Text>

        {timeSlots.map((slot) => (
          <View key={slot.id} style={styles.timeSlotContainer}>
            <View style={styles.timeSlotHeader}>
              <Text style={[styles.timeSlotTitle, { color: colors.text }]}>Unlock Period</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeTimeSlot(slot.id)}
              >
                <Icon name="delete-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>

            <View style={styles.timeContainer}>
              <View style={styles.timeColumn}>
                <Text style={[styles.timeLabel, { color: colors.text }]}>Start Time</Text>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => showTimePicker(slot.id, 'start')}
                >
                  <Text style={[styles.timeText, { color: colors.text }]}>
                    {formatTo12Hour(slot.startTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeColumn}>
                <Text style={[styles.timeLabel, { color: colors.text }]}>End Time</Text>
                <TouchableOpacity 
                  style={styles.timeButton}
                  onPress={() => showTimePicker(slot.id, 'end')}
                >
                  <Text style={[styles.timeText, { color: colors.text }]}>
                    {formatTo12Hour(slot.endTime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {timeSlots.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="schedule" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No Unlock Schedules</Text>
            <Text style={styles.emptySubText}>
              Tap the + button to add a new unlock schedule
            </Text>
          </View>
        )}
      </ScrollView>

      {showPicker && selectedSlot && (
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerContainer}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => setShowPicker(false)}>
                <Text style={styles.headerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>
                {selectedSlot.type === 'start' ? 'Start Time' : 'End Time'}
              </Text>
              <TouchableOpacity 
                style={[styles.headerButton, styles.doneButton]}
                onPress={() => {
                  handleTimeSelect(selectedSlot.type, hour, minute, period);
                }}>
                <Text style={[styles.headerButtonText, styles.doneButtonText]}>Set Time</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timePreview}>
              <Text style={styles.selectedTimeLabel}>Selected Time</Text>
              <Text style={styles.timePreviewText}>
                {hour}:{minute} {period}
              </Text>
              <Text style={styles.timeDescription}>
                App will be {selectedSlot.type === 'start' ? 'unlocked from' : 'locked after'} this time
              </Text>
            </View>

            <View style={styles.pickerRow}>
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hours</Text>
                <Picker
                  selectedValue={hour}
                  onValueChange={setHour}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}>
                  {hours.map(h => (
                    <Picker.Item key={h} label={h} value={h} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minutes</Text>
                <Picker
                  selectedValue={minute}
                  onValueChange={setMinute}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}>
                  {minutes.map(m => (
                    <Picker.Item key={m} label={m} value={m} />
                  ))}
                </Picker>
              </View>

              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>AM/PM</Text>
                <Picker
                  selectedValue={period}
                  onValueChange={setPeriod}
                  style={styles.periodPicker}
                  itemStyle={styles.pickerItem}>
                  <Picker.Item label="AM" value="AM" />
                  <Picker.Item label="PM" value="PM" />
                </Picker>
              </View>
            </View>
          </View>
        </View>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSaveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  timeSlotContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSlotTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timeButton: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  addButton: {
    padding: 8,
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  picker: {
    height: 150,
    width: '100%',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  previewText: {
    fontSize: 18,
    fontWeight: '500',
  },
  timePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  timePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  timePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  doneButton: {
    padding: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  timePreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  timePreviewText: {
    fontSize: 18,
    fontWeight: '500',
  },
  timeDescription: {
    fontSize: 14,
    color: '#666',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerColumn: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerItem: {
    height: 50,
  },
  periodPicker: {
    height: 150,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
  },
});

export default ScheduleUnlockScreen; 