import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { lifeGoals } from '../data/goalsData';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type AnalysisPeriod = 'day' | 'week' | 'month' | 'year';
type AnalysisType = 'overall' | 'specific';

type GoalData = {
  [key: number]: {
    completion: number[];
    trend: {
      day: number[];
      week: number[];
      month: number[];
      year: number[];
    };
    tasks: {
      completed: number;
      inProgress: number;
      upcoming: number;
      overdue: number;
    };
  };
};

const timeFilterData = {
  day: {
    labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
    data: [30, 45, 60, 80, 85, 90]
  },
  week: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [85, 75, 82, 90, 88, 95, 92]
  },
  month: {
    labels: ['W1', 'W2', 'W3', 'W4'],
    data: [78, 85, 90, 88]
  },
  year: {
    labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
    data: [65, 70, 75, 80, 85, 90]
  }
};

const goalSpecificData: GoalData = {
  1: { // Career Growth
    completion: [75, 15, 10],
    trend: {
      day: [40, 55, 65, 75, 80, 85],
      week: [70, 75, 78, 82, 85, 88, 90],
      month: [65, 75, 85, 90],
      year: [50, 60, 70, 75, 80, 85]
    },
    tasks: {
      completed: 12,
      inProgress: 5,
      upcoming: 3,
      overdue: 2
    }
  },
  2: { // Financial Freedom
    completion: [60, 25, 15],
    trend: {
      day: [30, 40, 50, 60, 65, 70],
      week: [60, 65, 70, 72, 75, 78, 80],
      month: [55, 65, 75, 80],
      year: [40, 50, 60, 65, 70, 75]
    },
    tasks: {
      completed: 8,
      inProgress: 7,
      upcoming: 5,
      overdue: 3
    }
  },
  3: { // Health & Fitness
    completion: [85, 10, 5],
    trend: {
      day: [50, 60, 70, 80, 85, 90],
      week: [80, 82, 85, 87, 90, 92, 95],
      month: [75, 80, 85, 90],
      year: [60, 70, 80, 85, 90, 95]
    },
    tasks: {
      completed: 15,
      inProgress: 3,
      upcoming: 2,
      overdue: 1
    }
  }
};

const GoalAnalysisScreen = () => {
  const navigation = useNavigation();
  const [period, setPeriod] = useState<AnalysisPeriod>('week');
  const [analysisType, setAnalysisType] = useState<AnalysisType>('overall');
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);

  const handleShareAchievement = async () => {
    // TODO: Implement sharing functionality
    console.log('Share achievement');
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity 
        style={[styles.periodButton, period === 'day' && styles.activePeriod]}
        onPress={() => setPeriod('day')}
      >
        <Text style={[styles.periodText, period === 'day' && styles.activePeriodText]}>Day</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.periodButton, period === 'week' && styles.activePeriod]}
        onPress={() => setPeriod('week')}
      >
        <Text style={[styles.periodText, period === 'week' && styles.activePeriodText]}>Week</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.periodButton, period === 'month' && styles.activePeriod]}
        onPress={() => setPeriod('month')}
      >
        <Text style={[styles.periodText, period === 'month' && styles.activePeriodText]}>Month</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.periodButton, period === 'year' && styles.activePeriod]}
        onPress={() => setPeriod('year')}
      >
        <Text style={[styles.periodText, period === 'year' && styles.activePeriodText]}>Year</Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverallProgress = () => {
    const progressData = selectedGoal && goalSpecificData[selectedGoal]
      ? [
          {
            name: 'Completed',
            population: goalSpecificData[selectedGoal].completion[0],
            color: '#4CAF50',
            legendFontColor: '#7F7F7F',
          },
          {
            name: 'In Progress',
            population: goalSpecificData[selectedGoal].completion[1],
            color: '#FFC107',
            legendFontColor: '#7F7F7F',
          },
          {
            name: 'Not Started',
            population: goalSpecificData[selectedGoal].completion[2],
            color: '#F44336',
            legendFontColor: '#7F7F7F',
          },
        ]
      : [
          {
            name: 'Completed',
            population: 75,
            color: '#4CAF50',
            legendFontColor: '#7F7F7F',
          },
          {
            name: 'In Progress',
            population: 15,
            color: '#FFC107',
            legendFontColor: '#7F7F7F',
          },
          {
            name: 'Not Started',
            population: 10,
            color: '#F44336',
            legendFontColor: '#7F7F7F',
          },
        ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Progress</Text>
        <PieChart
          data={progressData}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#FFF',
            backgroundGradientFrom: '#FFF',
            backgroundGradientTo: '#FFF',
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </View>
    );
  };

  const renderCompletionTrend = () => {
    const periodData = selectedGoal && goalSpecificData[selectedGoal]
      ? {
          labels: timeFilterData[period].labels,
          data: goalSpecificData[selectedGoal].trend[period]
        }
      : timeFilterData[period];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completion Trend</Text>
        <LineChart
          data={{
            labels: periodData.labels,
            datasets: [{
              data: periodData.data
            }]
          }}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#FFF',
            backgroundGradientFrom: '#FFF',
            backgroundGradientTo: '#FFF',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 107, 0, ${opacity})`,
            style: { borderRadius: 16 }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>
    );
  };

  const renderGoalBreakdown = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Goal Breakdown</Text>
      <BarChart
        data={{
          labels: ['Career', 'Finance', 'Health', 'Personal', 'Travel'],
          datasets: [{
            data: [80, 65, 90, 75, 60]
          }]
        }}
        width={width - 40}
        height={220}
        yAxisLabel="%"
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#FFF',
          backgroundGradientFrom: '#FFF',
          backgroundGradientTo: '#FFF',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 107, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          }
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
    </View>
  );

  const renderGoalStats = () => {
    if (!selectedGoal || !goalSpecificData[selectedGoal]) return null;

    const stats = goalSpecificData[selectedGoal].tasks;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Task Statistics</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F44336' }]}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSocialActions = () => (
    <View style={styles.socialActions}>
      <TouchableOpacity 
        style={styles.socialButton}
        onPress={() => handleShareAchievement()}
      >
        <Icon name="share" size={24} color="#FF6B00" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.socialButton}
        onPress={() => navigation.navigate('TeamManagement', { goalId: selectedGoal })}
      >
        <Icon name="group" size={24} color="#FF6B00" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.socialButton}
        onPress={() => navigation.navigate('Leaderboard')}
      >
        <Icon name="leaderboard" size={24} color="#FF6B00" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Analysis</Text>
        {renderSocialActions()}
      </View>

      {renderPeriodSelector()}

      <View style={styles.typeSelector}>
        <TouchableOpacity 
          style={[styles.typeButton, analysisType === 'overall' && styles.activeType]}
          onPress={() => setAnalysisType('overall')}
        >
          <Text style={[styles.typeText, analysisType === 'overall' && styles.activeTypeText]}>
            Overall Analysis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeButton, analysisType === 'specific' && styles.activeType]}
          onPress={() => setAnalysisType('specific')}
        >
          <Text style={[styles.typeText, analysisType === 'specific' && styles.activeTypeText]}>
            Goal Specific
          </Text>
        </TouchableOpacity>
      </View>

      {analysisType === 'overall' ? (
        <>
          {renderOverallProgress()}
          {renderCompletionTrend()}
          {renderGoalBreakdown()}
        </>
      ) : (
        <>
          <View style={styles.goalSelector}>
            {lifeGoals.map(goal => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalButton,
                  selectedGoal === goal.id && { backgroundColor: goal.color }
                ]}
                onPress={() => setSelectedGoal(goal.id)}
              >
                <Icon 
                  name={goal.icon} 
                  size={24} 
                  color={selectedGoal === goal.id ? '#FFF' : goal.color} 
                />
                <Text style={[
                  styles.goalButtonText,
                  selectedGoal === goal.id && { color: '#FFF' }
                ]}>
                  {goal.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedGoal && (
            <>
              {renderOverallProgress()}
              {renderCompletionTrend()}
              {renderGoalStats()}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activePeriod: {
    backgroundColor: '#FF6B00',
  },
  periodText: {
    color: '#666',
    fontSize: 14,
  },
  activePeriodText: {
    color: '#FFF',
  },
  typeSelector: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 8,
    alignItems: 'center',
  },
  activeType: {
    backgroundColor: '#FF6B00',
  },
  typeText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTypeText: {
    color: '#FFF',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  goalSelector: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    width: '30%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FF6B00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  socialActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  socialButton: {
    padding: 8,
  },
});

export default GoalAnalysisScreen; 