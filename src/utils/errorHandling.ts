import { AxiosError } from 'axios';
import { Alert } from 'react-native';

export const handleApiError = (error: any, customMessage?: string): string => {
  if (error?.code === 'ERR_NETWORK') {
    return 'Network error. Please check your internet connection.';
  }

  if (error instanceof AxiosError) {
    const status = error.response?.status;
    switch (status) {
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 422:
        return error.response?.data?.message || 'Validation error.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return customMessage || 'Something went wrong. Please try again.';
    }
  }

  return customMessage || 'An unexpected error occurred.';
};

export const showErrorAlert = (
  error: any, 
  title = 'Error',
  customMessage?: string,
  onRetry?: () => void
) => {
  const message = handleApiError(error, customMessage);
  
  Alert.alert(
    title,
    message,
    onRetry ? [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retry', onPress: onRetry }
    ] : [
      { text: 'OK' }
    ]
  );
}; 