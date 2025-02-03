import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface Props {
  error: string;
  onRetry: () => void;
}

const NetworkErrorBoundary = ({ error, onRetry }: Props) => {
  return (
    <View style={styles.container}>
      <Icon name="error-outline" size={48} color="#FF4444" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Icon name="refresh" size={20} color="#FFF" />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    margin: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginVertical: 12,
    fontFamily: 'Poppins-Regular',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2980',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
});

export default NetworkErrorBoundary; 