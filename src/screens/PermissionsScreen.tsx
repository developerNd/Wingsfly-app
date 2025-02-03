import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  NativeModules,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { AppLockModule } = NativeModules;

const PermissionsScreen = () => {
  const navigation = useNavigation();
  const [permissions, setPermissions] = useState({
    accessibility: false,
    usageStats: false,
    overlay: false,
  });

  const checkPermissions = async () => {
    try {
      const accessibilityEnabled = await AppLockModule.isAccessibilityServiceEnabled();
      const usageStatsEnabled = await AppLockModule.isUsageStatsPermissionGranted();
      const overlayEnabled = await AppLockModule.canDrawOverlays();

      setPermissions({
        accessibility: accessibilityEnabled,
        usageStats: usageStatsEnabled,
        overlay: overlayEnabled,
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  // Check permissions when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkPermissions();
      const checkInterval = setInterval(checkPermissions, 1000);
      return () => clearInterval(checkInterval);
    }, [])
  );

  const openAccessibilitySettings = async () => {
    if (Platform.OS === 'android') {
      try {
        await AppLockModule.openAccessibilitySettings();
      } catch (error) {
        console.error('Error opening accessibility settings:', error);
      }
    }
  };

  const openUsageAccess = async () => {
    if (Platform.OS === 'android') {
      try {
        await AppLockModule.openUsageAccessSettings();
      } catch (error) {
        console.error('Error opening usage access settings:', error);
      }
    }
  };

  const openOverlaySettings = async () => {
    if (Platform.OS === 'android') {
      try {
        await AppLockModule.openOverlaySettings();
      } catch (error) {
        console.error('Error opening overlay settings:', error);
      }
    }
  };

  const renderPermissionItem = (
    title: string,
    description: string,
    isGranted: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.permissionItem} onPress={onPress}>
      <View style={styles.permissionHeader}>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Icon
          name={isGranted ? "check-circle" : "error"}
          size={24}
          color={isGranted ? "#4CAF50" : "#FF9800"}
        />
      </View>
      <Text style={styles.permissionDescription}>{description}</Text>
      <TouchableOpacity 
        style={[
          styles.grantButton,
          { backgroundColor: isGranted ? '#E0E0E0' : '#2196F3' }
        ]}
        onPress={onPress}
        disabled={isGranted}
      >
        <Text style={[
          styles.grantButtonText,
          { color: isGranted ? '#666666' : '#FFFFFF' }
        ]}>
          {isGranted ? 'Granted' : 'Grant Permission'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.title}>App Permissions</Text>
      </View>

      <ScrollView style={styles.content}>
        {renderPermissionItem(
          'Accessibility Service',
          'Required to monitor and lock apps when they are opened',
          permissions.accessibility,
          openAccessibilitySettings
        )}

        {renderPermissionItem(
          'Usage Access',
          'Required to detect which apps are being used',
          permissions.usageStats,
          openUsageAccess
        )}

        {renderPermissionItem(
          'Display over Other Apps',
          'Required to show lock screen over other apps',
          permissions.overlay,
          openOverlaySettings
        )}

        <Text style={styles.note}>
          Note: These permissions are required for the app lock feature to work properly.
          The app does not collect or share any personal data.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  permissionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  grantButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  grantButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default PermissionsScreen; 