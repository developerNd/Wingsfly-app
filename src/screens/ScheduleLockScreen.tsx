import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  NativeModules,
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../theme';

const { AppLockModule } = NativeModules;

interface TimeSlot {
  id: string;
  startTime: string;  // Format: "HH:mm"
  endTime: string;    // Format: "HH:mm"
  isEnabled: boolean;
}

interface LockSchedule {
  id: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

// Update the Props type to make params optional
type Props = {
  route: {
    params?: {
      packageName?: string;
      appName?: string;
    };
  };
};

// Add this helper function before the component
const formatTime = (hour: number, minute: number): string => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const ScheduleLockScreen = ({ route }: Props) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    id: string;
    type: 'start' | 'end';
  } | null>(null);
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
      marginRight: 40,
    },
    addButton: {
      padding: 8,
    },
    headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerSaveButton: {
      padding: 8,
      marginLeft: 8,
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      marginTop: 16,
    },
    emptySubText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
      marginTop: 8,
    },
    timePickerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    timePickerContainer: {
      backgroundColor: 'white',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    timePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    headerButtonText: {
      fontSize: 16,
      color: '#666',
    },
    doneButton: {
      alignItems: 'flex-end',
    },
    doneButtonText: {
      color: '#007AFF',
      fontWeight: '600',
    },
    timePickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
    },
    timePreview: {
      alignItems: 'center',
      paddingVertical: 24,
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      marginBottom: 20,
    },
    selectedTimeLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    timePreviewText: {
      fontSize: 40,
      fontWeight: '600',
      color: '#333',
      letterSpacing: 2,
      marginBottom: 8,
    },
    timeDescription: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
    },
    pickerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
    },
    pickerColumn: {
      flex: 1,
      alignItems: 'center',
    },
    pickerLabel: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    picker: {
      width: 100,
      height: 180,
    },
    periodPicker: {
      width: 100,
      height: 180,
    },
    pickerItem: {
      fontSize: 22,
    },
  });

  useEffect(() => {
    loadTimeSlots();
  }, []);

  const loadTimeSlots = async () => {
    try {
      const schedules = await AppLockModule.getLockSchedules();
      console.log('Loaded lock schedules:', schedules);
      
      if (schedules && schedules.length > 0) {
        const slots = schedules.map((schedule: LockSchedule) => ({
          id: schedule.id || Date.now().toString(),
          startTime: formatTime(schedule.startHour, schedule.startMinute),
          endTime: formatTime(schedule.endHour, schedule.endMinute),
          isEnabled: true
        }));
        
        console.log('Setting saved lock time slots:', slots);
        setTimeSlots(slots);
      } else {
        console.log('No lock schedules found, setting default');
        const defaultSlot: TimeSlot = {
          id: Date.now().toString(),
          startTime: '09:00',
          endTime: '17:00',
          isEnabled: true
        };
        setTimeSlots([defaultSlot]);
      }
    } catch (error) {
      console.error('Error loading lock schedules:', error);
      const defaultSlot: TimeSlot = {
        id: Date.now().toString(),
        startTime: '09:00',
        endTime: '17:00',
        isEnabled: true
      };
      setTimeSlots([defaultSlot]);
    }
  };

  const saveTimeSlots = async (slots: TimeSlot[]) => {
    try {
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

      console.log('Saving lock schedules:', schedules);
      await AppLockModule.updateLockSchedules(schedules);

      // Verify the save
      const savedSchedules = await AppLockModule.getLockSchedules();
      console.log('Verified saved schedules:', savedSchedules);
    } catch (error) {
      console.error('Error saving lock schedules:', error);
      Alert.alert(
        'Error',
        'Failed to save lock schedules. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const addNewTimeSlot = () => {
    // If there are no existing slots, use default times
    // If there are existing slots, use the last slot's times as default
    const defaultSlot = timeSlots.length > 0 
      ? timeSlots[timeSlots.length - 1]
      : { startTime: '09:00', endTime: '17:00' };

    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      startTime: defaultSlot.startTime,
      endTime: defaultSlot.endTime,
      isEnabled: true,
    };

    // Add the new slot to existing slots instead of replacing them
    const updatedSlots = [...timeSlots, newSlot];
    setTimeSlots(updatedSlots);
    saveTimeSlots(updatedSlots);
  };

  const deleteTimeSlot = (id: string) => {
    Alert.alert(
      'Delete Time Slot',
      'Are you sure you want to delete this time slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedSlots = timeSlots.filter(slot => slot.id !== id);
            setTimeSlots(updatedSlots);
            saveTimeSlots(updatedSlots);
          },
        },
      ]
    );
  };

  const toggleTimeSlot = (id: string) => {
    const updatedSlots = timeSlots.map(slot =>
      slot.id === id ? { ...slot, isEnabled: !slot.isEnabled } : slot
    );
    setTimeSlots(updatedSlots);
    saveTimeSlots(updatedSlots);
  };

  const showTimePicker = (id: string, type: 'start' | 'end') => {
    const slot = timeSlots.find(s => s.id === id);
    if (slot) {
      const timeString = type === 'start' ? slot.startTime : slot.endTime;
      const [hours24, minutes] = timeString.split(':').map(num => parseInt(num, 10));
      
      // Convert 24h to 12h format
      const isPM = hours24 >= 12;
      const hours12 = hours24 % 12 || 12;
      
      setHour(hours12.toString().padStart(2, '0'));
      setMinute(minutes.toString().padStart(2, '0'));
      setPeriod(isPM ? 'PM' : 'AM');
      setSelectedSlot({ id, type });
      setShowPicker(true);
    }
  };

  const handleTimeSelect = (type: 'start' | 'end', hour: string, minute: string, period: string) => {
    if (!selectedSlot) return;
    
    // Convert to 24-hour format
    let hours24 = parseInt(hour);
    if (period === 'PM' && hours24 !== 12) hours24 += 12;
    if (period === 'AM' && hours24 === 12) hours24 = 0;
    
    // Format time string with padded values
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

  const getTimeDate = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  const formatTimeForDisplay = (time24: string) => {
    const [hours24, minutes] = time24.split(':').map(num => parseInt(num, 10));
    if (isNaN(hours24) || isNaN(minutes)) return '12:00 AM';
    
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Schedule Lock</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.addButton} onPress={addNewTimeSlot}>
            <Icon name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerSaveButton} onPress={handleSaveSchedule}>
            <Icon name="check" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Set times when the app should automatically lock. The app will be locked during these periods.
        </Text>

        {timeSlots.map(slot => (
          <View key={slot.id} style={styles.timeSlotContainer}>
            <View style={styles.timeSlotHeader}>
              <Text style={styles.timeSlotTitle}>Lock Period</Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => deleteTimeSlot(slot.id)}>
                <Icon name="delete-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>

            <View style={styles.timeContainer}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => {
                    setSelectedSlot({ id: slot.id, type: 'start' });
                    setShowPicker(true);
                  }}>
                  <Text style={styles.timeText}>
                    {formatTimeForDisplay(slot.startTime)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => {
                    setSelectedSlot({ id: slot.id, type: 'end' });
                    setShowPicker(true);
                  }}>
                  <Text style={styles.timeText}>
                    {formatTimeForDisplay(slot.endTime)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {timeSlots.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="schedule" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No Lock Schedules</Text>
            <Text style={styles.emptySubText}>
              Tap the + button to add a new lock schedule
            </Text>
          </View>
        )}
      </ScrollView>

      {showPicker && (
        <View style={styles.timePickerOverlay}>
          <View style={styles.timePickerContainer}>
            <View style={styles.timePickerHeader}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => setShowPicker(false)}>
                <Text style={styles.headerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.timePickerTitle}>
                {selectedSlot?.type === 'start' ? 'Start Time' : 'End Time'}
              </Text>
              <TouchableOpacity 
                style={[styles.headerButton, styles.doneButton]}
                onPress={() => {
                  if (selectedSlot) {
                    handleTimeSelect(selectedSlot.type, hour, minute, period);
                  }
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
                App will be {selectedSlot?.type === 'start' ? 'locked from' : 'unlocked after'} this time
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
                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => (
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
                  {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
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

export default ScheduleLockScreen; 