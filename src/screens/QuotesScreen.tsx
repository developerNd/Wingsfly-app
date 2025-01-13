import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Share,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface Quote {
  id: number;
  text: string;
  author: string;
  backgroundColor: string;
}

const quotes: Quote[] = [
  {
    id: 1,
    text: "The word Yoga means union. That means you consciously obliterate the boundaries of individuality and reverberate with the rest of the cosmos.",
    author: "Sadhguru",
    backgroundColor: '#4CAF50'
  },
  {
    id: 2,
    text: "Life is not about finding yourself. Life is about creating yourself.",
    author: "Sadhguru",
    backgroundColor: '#2196F3'
  },
  {
    id: 3,
    text: "If you resist change, you resist life. The only way to experience life is to allow change to happen.",
    author: "Sadhguru",
    backgroundColor: '#9C27B0'
  },
  {
    id: 4,
    text: "The only way to experience true wellbeing is to turn inward. This is what yoga means – not up, not out, but in.",
    author: "Sadhguru",
    backgroundColor: '#FF9800'
  },
  {
    id: 5,
    text: "Your thoughts and emotions are the drama that you create in your mind. You can make it a comedy or a tragedy.",
    author: "Sadhguru",
    backgroundColor: '#E91E63'
  },
  {
    id: 6,
    text: "The significance of the spiritual process is not to achieve peace, but to become an explosion of consciousness.",
    author: "Sadhguru",
    backgroundColor: '#3F51B5'
  }
];

const QuotesScreen = () => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      if (currentIndex < quotes.length - 1) {
        setCurrentIndex(currentIndex + 1);
        flatListRef.current?.scrollToIndex({
          index: currentIndex + 1,
          animated: true,
        });
      } else {
        setCurrentIndex(0);
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: true,
        });
      }
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleShare = async (quote: Quote) => {
    try {
      await Share.share({
        message: `"${quote.text}" - ${quote.author}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderQuote = ({ item }: { item: Quote }) => (
    <View style={[styles.slide, { backgroundColor: item.backgroundColor }]}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Icon name="format-quote" size={40} color="#FFF" style={styles.quoteIcon} />
        <Text style={styles.quoteText}>{item.text}</Text>
        <Text style={styles.author}>- {item.author}</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => handleShare(item)}
        >
          <Icon name="share" size={20} color="#FFF" style={styles.shareIcon} />
          <Text style={styles.shareButtonText}>Share this quote</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="close" size={24} color="#FFF" />
      </TouchableOpacity>
      
      <FlatList
        ref={flatListRef}
        data={quotes}
        renderItem={renderQuote}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        keyExtractor={item => item.id.toString()}
      />

      <View style={styles.pagination}>
        {quotes.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotWidth, opacity },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slide: {
    width,
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  quoteIcon: {
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 24,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 36,
    fontWeight: '300',
    marginBottom: 20,
  },
  author: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'right',
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    width: '100%',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
    marginHorizontal: 4,
  },
});

export default QuotesScreen; 