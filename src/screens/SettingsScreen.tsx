import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const SettingsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const settingsOptions = [
    { id: 1, title: 'Account', icon: 'person-outline' },
    { id: 2, title: 'Notifications', icon: 'notifications-none' },
    { id: 3, title: 'Appearance', icon: 'palette' },
    { id: 4, title: 'Privacy & Security', icon: 'security' },
    { id: 5, title: 'Help & Support', icon: 'help-outline' },
    { id: 6, title: 'About', icon: 'info-outline' },
    { id: 7, title: 'App Lock', icon: 'lock-outline' },
    { id: 8, title: 'Permissions', icon: 'admin-panel-settings' },
  ];

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['token', 'userData']);
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleOptionPress = (id: number) => {
    switch (id) {
      case 7:
        navigation.navigate('AppLock');
        break;
      case 8:
        navigation.navigate('Permissions');
        break;
      // ... handle other options
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView>
        {settingsOptions.map((option) => (
          <TouchableOpacity 
            key={option.id} 
            style={styles.optionItem}
            onPress={() => handleOptionPress(option.id)}
          >
            <Icon name={option.icon} size={24} color="#333" />
            <Text style={styles.optionText}>{option.title}</Text>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 15,
  },
});

export default SettingsScreen; 