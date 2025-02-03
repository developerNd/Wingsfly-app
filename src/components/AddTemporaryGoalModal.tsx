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
import { categories } from '../data/categories';
import { handleApiError } from '../utils/errorHandling';

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

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (newGoal: Partial<LifeGoal>) => void;
  categories: Array<{ id: string; name: string; icon: string; color: string; }>;
  loading: boolean;
  isSubGoal?: boolean;
  isRoutine?: boolean;
  isActivity?: boolean;
  parentColor?: string;
  requireCategory?: boolean;
  requirePriority?: boolean;
  validateTime?: boolean;
}

const AddTemporaryGoalModal = ({ 
  visible, 
  onClose, 
  onSave, 
  isSubGoal, 
  isRoutine,
  isActivity,
  parentColor, 
  loading,
  categories = [],
  requireCategory = false,
  requirePriority = false,
  validateTime = false
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
  const [category, setCategory] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleSave = async () => {
    try {
      const newErrors: {[key: string]: string} = {};
      
      if (!title.trim()) {
        newErrors.title = 'Title is required';
      }
      if (requireCategory && !category) {
        newErrors.category = 'Category is required';
      }
      if (requirePriority && !priority) {
        newErrors.priority = 'Priority is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      const newGoal = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        color: categories.find(c => c.id === category)?.color || '#1A2980',
        icon: categories.find(c => c.id === category)?.icon || 'star',
        start_time: startTime?.toLocaleTimeString(),
        end_time: endTime?.toLocaleTimeString(),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        duration: startTime && endTime ? 
          Math.floor((endTime.getTime() - startTime.getTime()) / 60000) : 0,
        is_temporary: false
      };
      
      console.log('Submitting goal:', newGoal);
      await onSave(newGoal);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      const errorMessage = handleApiError(error, 'Failed to save goal');
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

            <View style={styles.categorySelector}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      category === cat.id && styles.selectedCategoryChip,
                      { borderColor: cat.color }
                    ]}
                    onPress={() => setCategory(cat.id)}
                  >
                    <Icon name={cat.icon} size={16} color={category === cat.id ? '#FFF' : cat.color} />
                    <Text style={[
                      styles.categoryText,
                      category === cat.id && styles.selectedCategoryText,
                      { color: category === cat.id ? '#FFF' : cat.color }
                    ]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
            </View>

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

            {errors.submit && (
              <Text style={styles.errorText}>{errors.submit}</Text>
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
  categorySelector: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
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
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 8,
  },
  dateInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 8,
  },
});

export default AddTemporaryGoalModal; 