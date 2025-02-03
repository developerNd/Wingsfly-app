import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import HomeScreen from '../screens/HomeScreen';
import GoalsScreen from '../screens/GoalsScreen';
import TasksScreen from '../screens/TasksScreen';
import RoutinesScreen from '../screens/RoutinesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import InspirationScreen from '../screens/InspirationScreen';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: insets.bottom + 20,
            left: 20,
            right: 20,
            padding: 10,
            paddingBottom: 20,
            marginHorizontal: 20,
            backgroundColor: '#FFFFFF',
            borderRadius: 15,
            height: 60,
            ...styles.shadow,
            zIndex: 1,
          },
          tabBarItemStyle: {
            padding: 5,
          },
          tabBarActiveTintColor: '#FF6B00',
          tabBarInactiveTintColor: '#666666',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <Icon name="home" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Goals"
          component={GoalsScreen}
          options={{
            tabBarLabel: 'Goals',
            tabBarIcon: ({ color }) => (
              <Icon name="flag" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Tasks"
          component={TasksScreen}
          options={{
            tabBarLabel: 'Tasks',
            tabBarIcon: ({ color }) => (
              <Icon name="list" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Routines"
          component={RoutinesScreen}
          options={{
            tabBarLabel: 'Routines',
            tabBarIcon: ({ color }) => (
              <Icon name="schedule" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Inspiration"
          component={InspirationScreen}
          options={{
            tabBarLabel: 'Inspire',
            tabBarIcon: ({ color }) => (
              <Icon name="lightbulb" size={24} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }) => (
              <Icon name="settings" size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default BottomTabNavigator; 