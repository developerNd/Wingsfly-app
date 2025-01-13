import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, TextInput, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Team, TeamMember } from '../types/team';
import { dummyTeams } from '../data/teamsData';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

type TeamManagementRouteProp = RouteProp<RootStackParamList, 'TeamManagement'>;

const dummyUsers = [
  {
    id: 'u4',
    name: 'Sarah Wilson',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    role: 'member' as const,
    achievements: ['Top Performer', 'Quick Learner'],
  },
  {
    id: 'u5',
    name: 'Mike Brown',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    role: 'member' as const,
    achievements: ['Team Player', 'Goal Setter'],
  },
  // Add more dummy users
];

const TeamManagementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<TeamManagementRouteProp>();
  const [isCreating, setIsCreating] = useState(!route.params?.goalId);
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const renderMemberItem = ({ item }: { item: TeamMember }) => (
    <View style={styles.memberCard}>
      <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>{item.role}</Text>
        <View style={styles.achievementContainer}>
          {item.achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementBadge}>
              <Text style={styles.achievementText}>{achievement}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.memberStats}>
        <Text style={styles.contributionText}>{item.contribution}%</Text>
        <Text style={styles.streakText}>{item.streak} day streak</Text>
      </View>
    </View>
  );

  const renderCreateTeam = () => (
    <View style={styles.createContainer}>
      <TextInput
        style={styles.input}
        placeholder="Team Name"
        value={teamName}
        onChangeText={setTeamName}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Team Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />
      <Text style={styles.sectionTitle}>Add Members</Text>
      <FlatList
        data={dummyUsers}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.userSelectCard}
            onPress={() => {
              if (selectedMembers.includes(item.id)) {
                setSelectedMembers(prev => prev.filter(id => id !== item.id));
              } else {
                setSelectedMembers(prev => [...prev, item.id]);
              }
            }}
          >
            <Image source={{ uri: item.avatar }} style={styles.userAvatar} />
            <Text style={styles.userName}>{item.name}</Text>
            <Icon 
              name={selectedMembers.includes(item.id) ? "check-circle" : "radio-button-unchecked"} 
              size={24} 
              color="#FF6B00" 
            />
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
      />
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => {
          // Handle team creation
          console.log('Create team:', { teamName, description, selectedMembers });
        }}
      >
        <Text style={styles.createButtonText}>Create Team</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isCreating ? 'Create New Team' : 'Team Management'}
          </Text>
          {!isCreating && (
            <TouchableOpacity>
              <Icon name="more-vert" size={24} color="#333" />
            </TouchableOpacity>
          )}
        </View>
        
        {isCreating ? (
          <FlatList
            style={styles.scrollContent}
            ListHeaderComponent={renderCreateTeam}
            data={[]}
            renderItem={null}
          />
        ) : (
          <FlatList
            style={styles.scrollContent}
            data={route.params?.goalId ? dummyTeams.find(t => t.goalId === route.params?.goalId)?.members : []}
            renderItem={renderMemberItem}
            keyExtractor={item => item.id}
            ListHeaderComponent={() => (
              <View style={styles.teamHeader}>
                <Text style={styles.teamName}>
                  {dummyTeams.find(t => t.goalId === route.params?.goalId)?.name}
                </Text>
                <Text style={styles.teamDescription}>
                  {dummyTeams.find(t => t.goalId === route.params?.goalId)?.description}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
    color: '#333',
  },
  createContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  userSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F8F8',
    marginBottom: 8,
    borderRadius: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#FF6B00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  contributionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  streakText: {
    fontSize: 14,
    color: '#666',
  },
  achievementContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  achievementBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  achievementText: {
    fontSize: 12,
    color: '#666',
  },
  teamHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  teamName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  teamDescription: {
    fontSize: 16,
    color: '#666',
  },
});

export default TeamManagementScreen; 