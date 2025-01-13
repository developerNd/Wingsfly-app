import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { Short, shorts } from '../data/shortsData';

const { width, height } = Dimensions.get('window');

const ShortScreen = () => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderShort = ({ item, index }: { item: Short; index: number }) => (
    <View style={styles.shortContainer}>
      <View style={[styles.video, { backgroundColor: index % 2 === 0 ? '#4CAF50' : '#2196F3' }]}>
        <Image 
          source={{ uri: item.thumbnail }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      </View>
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.rightControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="favorite-border" size={30} color="#FFF" />
            <Text style={styles.controlText}>{item.likes}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="comment" size={30} color="#FFF" />
            <Text style={styles.controlText}>Comment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="share" size={30} color="#FFF" />
            <Text style={styles.controlText}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomInfo}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <View style={styles.authorContainer}>
            <Image 
              source={{ uri: 'AUTHOR_AVATAR_URL' }}
              style={styles.authorAvatar}
            />
            <Text style={styles.authorName}>{item.author}</Text>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={shorts}
        renderItem={renderShort}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  shortContainer: {
    width,
    height,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  rightControls: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    alignItems: 'center',
  },
  controlButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  controlText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
  },
  bottomInfo: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  authorName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  followButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

export default ShortScreen; 