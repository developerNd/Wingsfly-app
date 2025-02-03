import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BottomTabNavigator from './BottomTabNavigator';
import DetailedGoalScreen from '../screens/DetailedGoalScreen';
import DetailedRoutineScreen from '../screens/DetailedRoutineScreen';
import GoalsScreen from '../screens/GoalsScreen';
import TasksScreen from '../screens/TasksScreen';
import ShortPlayerScreen from '../screens/ShortPlayerScreen';
import MusicPlayerScreen from '../screens/MusicPlayerScreen';
import WorkTrackingScreen from '../screens/WorkTrackingScreen';
import SubRoutineScreen from '../screens/SubRoutineScreen';
import QuotesScreen from '../screens/QuotesScreen';
import ShortScreen from '../screens/ShortScreen';
import GoalAnalysisScreen from '../screens/GoalAnalysisScreen';
import TeamManagementScreen from '../screens/TeamManagementScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import AppLockScreen from '../screens/AppLockScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import ScheduleLockScreen from '../screens/ScheduleLockScreen';
import ScheduleSettingsScreen from '../screens/ScheduleSettingsScreen';
import AppUnlockScheduleScreen from '../screens/AppUnlockScheduleScreen';
import ScheduleUnlockScreen from '../screens/ScheduleUnlockScreen';
import { TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={BottomTabNavigator} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
        <Stack.Screen name="Tasks" component={TasksScreen} />
        <Stack.Screen name="DetailedGoal" component={DetailedGoalScreen} />
        <Stack.Screen name="DetailedRoutine" component={DetailedRoutineScreen} />
        <Stack.Screen 
          name="ShortPlayer" 
          component={ShortPlayerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MusicPlayer" 
          component={MusicPlayerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="WorkTracking" 
          component={WorkTrackingScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="SubRoutine" 
          component={SubRoutineScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="QuotesScreen" component={QuotesScreen} />
        <Stack.Screen 
          name="ShortScreen" 
          component={ShortScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="GoalAnalysis" 
          component={GoalAnalysisScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="TeamManagement" component={TeamManagementScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="AppLock" component={AppLockScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen 
          name="ScheduleLock" 
          component={ScheduleLockScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ScheduleSettings" 
          component={ScheduleSettingsScreen}
          options={({ navigation }) => ({
            headerShown: true,
            title: 'Schedule Settings',
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '600',
              color: '#333',
            },
            headerStyle: {
              backgroundColor: '#FFFFFF',
              ...Platform.select({
                android: { elevation: 0 },
                ios: { shadowOpacity: 0 }
              }),
            },
            headerLeft: () => (
              <TouchableOpacity
                style={{ marginLeft: 16 }}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen 
          name="AppUnlockSchedule" 
          component={AppUnlockScheduleScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="ScheduleUnlock" 
          component={ScheduleUnlockScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 