import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'MusicPlayer'>;

const MusicPlayerScreen = ({ route }: Props) => {
  const navigation = useNavigation();
  const { track, category } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Image
        source={{ uri: category.coverImage }}
        style={styles.albumArt}
      />

      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{track.title}</Text>
        <Text style={styles.categoryName}>{category.name}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progress, { width: '30%' }]} />
        <View style={styles.timingContainer}>
          <Text style={styles.timing}>1:30</Text>
          <Text style={styles.timing}>{track.duration}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity>
          <Icon name="skip-previous" size={40} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Icon 
            name={isPlaying ? "pause" : "play-arrow"} 
            size={50} 
            color="#FF6B00" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Icon name="skip-next" size={40} color="#333" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  albumArt: {
    width: width - 80,
    height: width - 80,
    borderRadius: 20,
    backgroundColor: '#E1E1E1',
    marginBottom: 40,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#666',
  },
  progressBar: {
    width: width - 80,
    height: 4,
    backgroundColor: '#E1E1E1',
    borderRadius: 2,
    marginBottom: 10,
  },
  progress: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
  timingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  timing: {
    fontSize: 12,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 40,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default MusicPlayerScreen; 