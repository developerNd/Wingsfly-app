import React from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularTimerProps {
  duration: number; // Total duration in seconds
  elapsed: number; // Elapsed time in seconds
  size: number; // Size of the circle
  strokeWidth: number; // Width of the progress bar
  isBreak: boolean; // Whether it's break time
  children?: React.ReactNode; // For inner content
}

const CircularTimer = ({
  duration,
  elapsed,
  size,
  strokeWidth,
  isBreak,
  children,
}: CircularTimerProps) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate progress
  const progress = 1 - (elapsed / duration);
  const strokeDashoffset = circumference * progress;

  // Colors based on mode
  const colors = isBreak ? {
    background: '#4CAF50',
    progress: '#81C784',
    text: '#2E7D32'
  } : {
    background: '#FF6B00',
    progress: '#FF9B4D',
    text: '#CC5500'
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.background}
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.progress}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
    transform: [{ rotateZ: '0deg' }],
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CircularTimer; 