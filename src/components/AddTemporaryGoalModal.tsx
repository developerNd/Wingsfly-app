import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LifeGoal, SubGoal } from '../types/goals';
import { Routine, Activity } from '../types/routine';
import { TASK_PRIORITY } from '../data/tasksData';

const AVAILABLE_ICONS = [
  'event', 'work', 'school', 'fitness-center', 'local-library',
  'flight', 'shopping-cart', 'music-note', 'brush', 'restaurant',
  'directions-run', 'laptop', 'favorite', 'language', 'attach-money'
];

const AVAILABLE_COLORS = [
  '#FF6B00', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
  '#E91E63', '#00BCD4', '#FFC107', '#607D8B', '#8BC34A'
];

const PRIORITY_COLORS = {
  [TASK_PRIORITY.HIGH]: '#FF4444',
  [TASK_PRIORITY.MEDIUM]: '#1A2980',
  [TASK_PRIORITY.LOW]: '#4CAF50',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (goal: Partial<LifeGoal | SubGoal | Routine | Activity>) => void;
  isSubGoal?: boolean;
  isSubRoutine?: boolean;
  isActivity?: boolean;
  isRoutine?: boolean;
  parentColor?: string;
  loading?: boolean;
};

const AddTemporaryGoalModal = ({ 
  visible, 
  onClose, 
  onSave, 
  isSubGoal, 
  isRoutine,
  isActivity,
  parentColor, 
  loading 
}: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('event');
  const [selectedColor, setSelectedColor] = useState('#FF6B00');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [priority, setPriority] = useState(TASK_PRIORITY.MEDIUM);

  const handleSave = () => {
    if (isActivity) {
      const newItem: Partial<Activity> = {
        title,
        description,
        scheduled_time: startTime ? startTime.toTimeString().split(' ')[0] : undefined,
        duration: startTime && endTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 60000) : 0,
        priority,
      };
      onSave(newItem);
    } else {
      const newItem: Partial<LifeGoal | SubGoal | Routine> = {
        title,
        description,
        progress: 0,
        ...(isSubGoal ? {} : {
          color: selectedColor,
          icon: selectedIcon,
        }),
        isTemporary: true,
        dueDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
        startTime: startTime ? startTime.toTimeString().split(' ')[0] : undefined,
        endTime: endTime ? endTime.toTimeString().split(' ')[0] : undefined,
        duration: startTime && endTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 60000) : undefined,
        priority,
        ...(isRoutine ? {
          totalSubRoutines: 0,
        } : {
          subGoals: [],
        }),
      };
      onSave(newItem);
    }
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(new Date());
    setEndTime(new Date());
    setPriority(TASK_PRIORITY.MEDIUM);
  };

  const renderIconItem = ({ item: icon }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.iconItem,
        selectedIcon === icon && { backgroundColor: selectedColor }
      ]}
      onPress={() => setSelectedIcon(icon)}
    >
      <Icon 
        name={icon} 
        size={24} 
        color={selectedIcon === icon ? '#FFF' : '#666'} 
      />
    </TouchableOpacity>
  );

  const renderColorItem = ({ item: color }: { item: string }) => (
    <TouchableOpacity
      style={[styles.colorItem, { backgroundColor: color }]}
      onPress={() => setSelectedColor(color)}
    >
      {selectedColor === color && (
        <Icon name="check" size={20} color="#FFF" />
      )}
    </TouchableOpacity>
  );

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDate(false);
      setShowEndDate(false);
      setShowStartTime(false);
      setShowEndTime(false);
    }

    if (selectedDate) {
      if (showStartDate) setStartDate(selectedDate);
      if (showEndDate) setEndDate(selectedDate);
      if (showStartTime) setStartTime(selectedDate);
      if (showEndTime) setEndTime(selectedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isActivity ? 'Add Activity' : isRoutine ? 'Add Routine' : isSubGoal ? 'Add Sub Goal' : 'Add Goal'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={isActivity ? "Activity Title" : "Goal Title"}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {!isSubGoal && !isActivity && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Choose Icon</Text>
                  <FlatList
                    data={AVAILABLE_ICONS}
                    renderItem={renderIconItem}
                    keyExtractor={item => item}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.iconList}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Choose Color</Text>
                  <FlatList
                    data={AVAILABLE_COLORS}
                    renderItem={renderColorItem}
                    keyExtractor={item => item}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.colorList}
                  />
                </View>
              </>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Priority</Text>
              <View style={styles.priorityContainer}>
                {Object.values(TASK_PRIORITY).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityButton,
                      priority === p && { backgroundColor: PRIORITY_COLORS[p] }
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[
                      styles.priorityText,
                      priority === p && styles.priorityTextSelected
                    ]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {!isActivity && (
              <>
                <View style={styles.dateTimeSection}>
                  <Text style={styles.sectionTitle}>Start</Text>
                  <TouchableOpacity 
                    style={styles.dateTimeButton}
                    onPress={() => setShowStartDate(true)}
                  >
                    <Icon name="calendar-today" size={20} color="#666" />
                    <Text style={styles.dateTimeText}>
                      {startDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.dateTimeButton}
                    onPress={() => setShowStartTime(true)}
                  >
                    <Icon name="access-time" size={20} color="#666" />
                    <Text style={styles.dateTimeText}>
                      {startTime.toLocaleTimeString()}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateTimeSection}>
                  <Text style={styles.sectionTitle}>End</Text>
                  <TouchableOpacity 
                    style={styles.dateTimeButton}
                    onPress={() => setShowEndDate(true)}
                  >
                    <Icon name="calendar-today" size={20} color="#666" />
                    <Text style={styles.dateTimeText}>
                      {endDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.dateTimeButton}
                    onPress={() => setShowEndTime(true)}
                  >
                    <Icon name="access-time" size={20} color="#666" />
                    <Text style={styles.dateTimeText}>
                      {endTime.toLocaleTimeString()}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {isActivity && (
              <>
                <View style={styles.dateTimeSection}>
                  <Text style={styles.sectionTitle}>Time</Text>
                  <TouchableOpacity 
                    style={styles.dateTimeButton}
                    onPress={() => setShowStartTime(true)}
                  >
                    <Icon name="access-time" size={20} color="#666" />
                    <Text style={styles.dateTimeText}>
                      {startTime.toLocaleTimeString()}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateTimeSection}>
                  <Text style={styles.sectionTitle}>Duration (minutes)</Text>
                  <TouchableOpacity 
                    style={styles.dateTimeButton}
                    onPress={() => setShowEndTime(true)}
                  >
                    <Icon name="timer" size={20} color="#666" />
                    <Text style={styles.dateTimeText}>
                      {startTime && endTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 60000) : 0} minutes
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {(showStartDate || showEndDate || showStartTime || showEndTime) && (
              <DateTimePicker
                testID="dateTimePicker"
                value={
                  showStartDate ? startDate :
                  showEndDate ? endDate :
                  showStartTime ? startTime : endTime
                }
                mode={showStartDate || showEndDate ? 'date' : 'time'}
                is24Hour={true}
                onChange={onDateChange}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              />
            )}

            <TouchableOpacity 
              style={[
                styles.saveButton, 
                isSubGoal && { backgroundColor: parentColor },
                loading && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isActivity ? 'Add Activity' : isRoutine ? 'Add Routine' : isSubGoal ? 'Add Sub Goal' : 'Add Goal'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateTimeSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 25,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  iconList: {
    marginTop: 10,
  },
  iconItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  colorList: {
    marginTop: 10,
  },
  colorItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
  },
  doneDateButton: {
    backgroundColor: '#FF6B00',
    padding: 8,
    borderRadius: 4,
  },
  doneDateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#666',
  },
  priorityTextSelected: {
    color: '#FFF',
  },
});

export default AddTemporaryGoalModal; 