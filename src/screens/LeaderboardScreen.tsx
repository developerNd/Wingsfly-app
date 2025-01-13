import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';

const leaderboardData = [
  { id: '1', name: 'John Doe', score: 1200, avatar: 'https://via.placeholder.com/40' },
  { id: '2', name: 'Jane Smith', score: 1150, avatar: 'https://via.placeholder.com/40' },
  { id: '3', name: 'Mike Johnson', score: 1100, avatar: 'https://via.placeholder.com/40' },
];

const LeaderboardScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterButton}>
          <Text>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text>All Time</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={leaderboardData}
        renderItem={({ item, index }) => (
          <View style={styles.leaderboardItem}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userScore}>{item.score} points</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    padding: 10,
  },
  filterButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfo: {
    flexDirection: 'column',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userScore: {
    fontSize: 14,
    color: 'gray',
  },
});

export default LeaderboardScreen; 