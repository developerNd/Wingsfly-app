import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'ShortPlayer'>;

const ShortPlayerScreen = ({ route }: Props) => {
  const navigation = useNavigation();
  const { short } = route.params;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: short.thumbnail }}
        style={styles.video}
      />
      
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="close" size={28} color="#FFF" />
      </TouchableOpacity>

      <View style={styles.controls}>
        <View style={styles.shortInfo}>
          <Text style={styles.title}>{short.title}</Text>
          <Text style={styles.views}>{short.views} views</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="favorite-border" size={28} color="#FFF" />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="share" size={28} color="#FFF" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width,
    height: height,
    backgroundColor: '#1a1a1a',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  shortInfo: {
    marginBottom: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  views: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#FFF',
    marginTop: 8,
    fontSize: 12,
  },
});

export default ShortPlayerScreen; 