import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const InspirationScreen = () => {
  const navigation = useNavigation();

  const musicCategories = [
    {
      id: 1,
      name: "Deep Focus",
      description: "Instrumental concentration music",
      coverImage: "https://picsum.photos/200/200",
      tracks: [
        { id: 1, title: "Deep Concentration", duration: "5:30" },
        { id: 2, title: "Study Time", duration: "4:45" },
      ]
    },
    {
      id: 2,
      name: "Meditation",
      description: "Peaceful ambient sounds",
      coverImage: "https://picsum.photos/200/200?random=2",
      tracks: [
        { id: 1, title: "Ocean Waves", duration: "10:00" },
        { id: 2, title: "Forest Sounds", duration: "8:30" },
      ]
    },
  ];

  const inspirationalVideos = [
    {
      id: 1,
      title: "Finding Your Purpose",
      duration: "3:45",
      thumbnail: "https://picsum.photos/400/300",
      author: "Motivational Speaker",
      views: "1.2M"
    },
    {
      id: 2,
      title: "Overcoming Challenges",
      duration: "5:20",
      thumbnail: "https://picsum.photos/400/300?random=2",
      author: "Life Coach",
      views: "890K"
    },
  ];

  const inspirationalShorts = [
    {
      id: 1,
      title: "Morning Motivation",
      duration: "0:30",
      thumbnail: "https://picsum.photos/200/350?random=3",
      views: "2.5M"
    },
    {
      id: 2,
      title: "Quick Workout",
      duration: "0:45",
      thumbnail: "https://picsum.photos/200/350?random=4",
      views: "1.8M"
    },
    {
      id: 3,
      title: "Mindfulness Break",
      duration: "0:60",
      thumbnail: "https://picsum.photos/200/350?random=5",
      views: "3.2M"
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#1A2980', '#26D0CE']} style={styles.header}>
        <Text style={styles.headerTitle}>Inspiration</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quoteSection}>
          <View style={styles.quoteHeader}>
            <Text style={styles.sectionTitle}>Today's Inspiration</Text>
            <TouchableOpacity style={styles.refreshButton}>
              <Icon name="refresh" size={24} color="#1A2980" />
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={['#E5F6FF', '#F0FAFF']}
            style={styles.quoteCard}
          >
            <Icon name="format-quote" size={32} color="#1A2980" />
            <Text style={styles.quoteText}>
              "Success is not final, failure is not fatal: it is the courage to continue that counts."
            </Text>
            <Text style={styles.quoteAuthor}>- Winston Churchill</Text>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shorts</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAll}>See All</Text>
              <Icon name="chevron-right" size={20} color="#1A2980" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shortsContainer}
          >
            {inspirationalShorts.map((short) => (
              <TouchableOpacity 
                key={short.id} 
                style={styles.shortCard}
                onPress={() => navigation.navigate('ShortPlayer', { short })}
              >
                <View style={styles.shortThumbnailContainer}>
                  <Image 
                    source={{ uri: short.thumbnail }} 
                    style={styles.shortThumbnail}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.shortGradient}
                  >
                    <View style={styles.shortInfo}>
                      <View style={styles.shortDuration}>
                        <View style={styles.playButton}>
                          <Icon name="play-circle-filled" size={24} color="#FFF" />
                        </View>
                        <Text style={styles.durationText}>{short.duration}</Text>
                      </View>
                      <Text style={styles.shortTitle} numberOfLines={2}>
                        {short.title}
                      </Text>
                      <View style={styles.viewsContainer}>
                        <Icon name="visibility" size={14} color="#FFF" />
                        <Text style={styles.shortViews}>{short.views} views</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Inspirational Stories</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAll}>See All</Text>
              <Icon name="chevron-right" size={20} color="#1A2980" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesContainer}
          >
            {inspirationalVideos.map((video) => (
              <TouchableOpacity key={video.id} style={styles.videoCard}>
                <View style={styles.thumbnailContainer}>
                  <Image 
                    source={{ uri: video.thumbnail }} 
                    style={styles.thumbnail}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.videoGradient}
                  >
                    <View style={styles.videoInfo}>
                      <View style={styles.videoStats}>
                        <View style={styles.playButton}>
                          <Icon name="play-circle-filled" size={24} color="#FFF" />
                        </View>
                        <Text style={styles.durationText}>{video.duration}</Text>
                      </View>
                      <Text style={styles.videoTitle} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <View style={styles.authorContainer}>
                        <View style={styles.authorAvatar}>
                          <Icon name="person" size={14} color="#FFF" />
                        </View>
                        <Text style={styles.authorText}>{video.author}</Text>
                        <View style={styles.viewsWrapper}>
                          <Icon name="visibility" size={14} color="#FFF" />
                          <Text style={styles.viewsText}>{video.views}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Focus Music</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {musicCategories.map((category) => (
            <LinearGradient
              key={category.id}
              colors={['#E5F6FF', '#F0FAFF']}
              style={styles.musicCategory}
            >
              <Image 
                source={{ uri: category.coverImage }} 
                style={styles.categoryImage}
              />
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{category.name}</Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
                <View style={styles.trackList}>
                  {category.tracks.map((track) => (
                    <TouchableOpacity 
                      key={track.id}
                      style={styles.trackItem}
                      onPress={() => navigation.navigate('MusicPlayer', { 
                        track, 
                        category 
                      })}
                    >
                      <View style={styles.trackInfo}>
                        <View style={styles.playIconContainer}>
                          <Icon 
                            name="play-arrow"
                            size={20} 
                            color="#1A2980" 
                          />
                        </View>
                        <Text style={styles.trackTitle}>{track.title}</Text>
                      </View>
                      <Text style={styles.trackDuration}>{track.duration}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </LinearGradient>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
  },
  section: {
    padding: 20,
  },
  quoteSection: {
    padding: 20,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 41, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteCard: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  quoteText: {
    fontSize: 18,
    color: '#1A2980',
    fontStyle: 'italic',
    lineHeight: 28,
    marginVertical: 12,
    fontFamily: 'Poppins-Regular',
  },
  quoteAuthor: {
    fontSize: 14,
    color: '#1A2980',
    textAlign: 'right',
    fontFamily: 'Poppins-Medium',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A2980',
    fontFamily: 'Poppins-SemiBold',
  },
  seeAll: {
    fontSize: 14,
    color: '#1A2980',
    fontFamily: 'Poppins-Medium',
  },
  videoCard: {
    width: width * 0.75,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#FFF',
  },
  thumbnailContainer: {
    position: 'relative',
    aspectRatio: 16/9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#E1E1E1',
  },
  videoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 16,
    justifyContent: 'flex-end',
  },
  videoInfo: {
    gap: 8,
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 22,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
  viewsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: 'Poppins-Regular',
  },
  durationText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  musicCategory: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#D1D1D1',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 15,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2980',
    fontFamily: 'Poppins-SemiBold',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  trackList: {
    marginTop: 12,
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 41, 128, 0.1)',
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 41, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackTitle: {
    fontSize: 14,
    color: '#1A2980',
    fontFamily: 'Poppins-Medium',
  },
  trackDuration: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  shortCard: {
    width: 180,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#FFF',
  },
  shortThumbnailContainer: {
    position: 'relative',
    aspectRatio: 9/16,
  },
  shortThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#E1E1E1',
  },
  shortGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 12,
    justifyContent: 'flex-end',
  },
  shortInfo: {
    gap: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  shortDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shortTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 18,
  },
  shortViews: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: 'Poppins-Regular',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 41, 128, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  shortsContainer: {
    paddingLeft: 20,
    paddingRight: 5,
  },
  storiesContainer: {
    paddingLeft: 20,
    paddingRight: 5,
  },
});

export default InspirationScreen; 