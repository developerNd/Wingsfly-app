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
            headerShown: true,
            title: 'Work Tracking'
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 