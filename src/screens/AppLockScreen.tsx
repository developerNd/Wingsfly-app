import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Switch,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  NativeModules,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getInstalledApps } from '../utils/AppLockModule';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

const { AppLockModule } = NativeModules;

interface AppInfo {
  id: string;
  appName: string;
  packageName: string;
  isLocked: boolean;
  isSystemApp: boolean;
  isDistracting: boolean;
  lockType: 'always' | 'scheduled_lock' | 'scheduled_unlock';
}

// Keywords that indicate potentially distracting apps
const DISTRACTING_KEYWORDS = [
  'game',
  'social',
  'video',
  'chat',
  'dating',
  'music',
  'stream',
  'play',
  'entertainment',
  'movie',
  'tube',
  'tiktok',
  'snap',
  'insta',
  'face',
  'tweet',
  'gram',
  'netflix',
  'prime',
  'spotify',
  'discord'
];


// Only include these system apps
const RELEVANT_APPS = [
  'com.android.chrome',
  'com.google.android.youtube',
  'com.google.android.apps.youtube.music',
  'com.google.android.gm',
  'com.google.android.calendar',
  'com.google.android.apps.photos',
  'com.google.android.apps.maps',
  'com.google.android.apps.docs',
  'com.google.android.apps.messaging',
  'com.google.android.dialer',
  'com.google.android.contacts',
  'com.google.android.deskclock',
  'com.android.camera2',
  'com.android.gallery3d',
];

const AppLockScreen = () => {
  const navigation = useNavigation();
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [showOnlyDistracting, setShowOnlyDistracting] = useState(false);
  const [loading, setLoading] = useState(true);

  const isDistracting = (packageName: string | undefined, appName: string | undefined): boolean => {
    // Return false if either packageName or appName is undefined
    if (!packageName || !appName) {
      return false;
    }

    const lowerPackage = packageName.toLowerCase();
    const lowerName = appName.toLowerCase();

    // System apps aren't distracting
    if (lowerPackage.startsWith('com.android.') || 
        lowerPackage.startsWith('android') ||
        lowerPackage === 'com.wingsfly') {
      return false;
    }

    // Common social/entertainment app packages
    if (lowerPackage.includes('facebook') ||
        lowerPackage.includes('instagram') ||
        lowerPackage.includes('tiktok') ||
        lowerPackage.includes('twitter') ||
        lowerPackage.includes('snap') ||
        lowerPackage.includes('youtube') ||
        lowerPackage.includes('netflix') ||
        lowerPackage.includes('spotify')) {
      return true;
    }

    return DISTRACTING_KEYWORDS.some(keyword => 
      lowerPackage.includes(keyword) || lowerName.includes(keyword)
    );
  };

  const isSystemApp = (packageName: string): boolean => {
    return (packageName.startsWith('com.android.') || 
            packageName.startsWith('com.google.android.') ||
            packageName.startsWith('android'));
  };

  const shouldShowApp = (packageName: string): boolean => {
    if (!packageName) return false;
    
    // Include specifically relevant system apps
    if (RELEVANT_APPS.includes(packageName)) {
      return true;
    }

    // Exclude system apps and our own app
    if (packageName.startsWith('com.android.') || 
        packageName.startsWith('com.google.android.') ||
        packageName === 'com.wingsfly') {
      return false;
    }

    // Exclude common system-related packages
    const excludePatterns = [
      'systemui',
      'provider',
      'bluetooth',
      'telephony',
      'settings',
      'keyboard',
      'launcher',
      'overlay',
      'service',
      'permission',
      'package',
      'printer',
      'security',
      'emulation',
      'theme',
      'config',
      'backup',
      'carrier',
      'network',
      'wifi',
      'media.module',
    ];

    return !excludePatterns.some(pattern => packageName.toLowerCase().includes(pattern));
  };

  useEffect(() => {
    loadApps();
  }, []);

  // Add focus listener to reload apps when returning to screen
  useFocusEffect(
    React.useCallback(() => {
      loadApps();
    }, [])
  );

  const loadApps = async () => {
    try {
      setLoading(true);
      const installedPackages = await getInstalledApps();
      console.log('Installed apps:', installedPackages);

      const savedLockStates = await AsyncStorage.getItem('appLockStates');
      const lockStates = savedLockStates ? JSON.parse(savedLockStates) : {};

      // Convert package names to AppInfo objects
      const appsWithLockState = installedPackages
        .filter((packageName: string) => packageName && shouldShowApp(packageName))
        .map((packageName: string) => ({
          id: packageName,
          packageName,
          appName: packageName.split('.').pop() || packageName, // Simple name from package
          isLocked: lockStates[packageName]?.isLocked || false,
          lockType: lockStates[packageName]?.lockType || 'always',
          isSystemApp: packageName.startsWith('com.android.') || packageName.startsWith('com.google.android.'),
          isDistracting: isDistracting(packageName, packageName.split('.').pop() || packageName),
        }))
        .sort((a: AppInfo, b: AppInfo) => {
          if (a.isDistracting && !b.isDistracting) return -1;
          if (!a.isDistracting && b.isDistracting) return 1;
          return a.appName.localeCompare(b.appName);
        });

      console.log('Final processed apps:', appsWithLockState);
      setApps(appsWithLockState);
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAppLockStates = async (updatedApps: AppInfo[]) => {
    try {
      const lockStates = updatedApps.reduce((acc, app) => ({
        ...acc,
        [app.packageName]: {
          isLocked: app.isLocked,
          lockType: app.lockType,
        },
      }), {});

      await AsyncStorage.setItem('appLockStates', JSON.stringify(lockStates));
    } catch (error) {
      console.error('Error saving app lock states:', error);
    }
  };

  const toggleAppLock = async (packageName: string) => {
    const updatedApps = apps.map(app => {
      if (app.packageName === packageName) {
        return {
          ...app,
          isLocked: !app.isLocked,
          lockType: !app.isLocked ? 'always' : app.lockType, // Keep existing lock type if unlocking
        };
      }
      return app;
    });

    setApps(updatedApps);
    await saveAppLockStates(updatedApps);

    // Update native module
    try {
      const app = updatedApps.find(a => a.packageName === packageName);
      if (app) {
        await AppLockModule.updateAppLockTypes(packageName, app.isLocked ? app.lockType : 'none');
      }
    } catch (error) {
      console.error('Error updating native lock state:', error);
    }
  };

  const updateLockType = async (packageName: string, lockType: 'always' | 'scheduled_lock' | 'scheduled_unlock') => {
    const updatedApps = apps.map(app => {
      if (app.packageName === packageName) {
        return {
          ...app,
          lockType,
        };
      }
      return app;
    });

    setApps(updatedApps);
    await saveAppLockStates(updatedApps);

    try {
      await AppLockModule.updateAppLockTypes(packageName, lockType);
    } catch (error) {
      console.error('Error updating lock type:', error);
    }
  };

  // Add this function to handle schedule updates
  const handleScheduleUpdate = async (packageName: string, lockType: string) => {
    try {
      // Just update the lock type
      await updateLockType(packageName, 'scheduled_lock' as 'always' | 'scheduled_lock' | 'scheduled_unlock');
    } catch (error) {
      console.error('Error updating app lock schedule:', error);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.title}>App Lock</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.filterContainer}>
        <Text style={styles.filterText}>Show only distracting apps</Text>
        <Switch
          value={showOnlyDistracting}
          onValueChange={setShowOnlyDistracting}
          trackColor={{ false: '#E0E0E0', true: '#81D4FA' }}
          thumbColor={showOnlyDistracting ? '#2196F3' : '#FFFFFF'}
          ios_backgroundColor="#E0E0E0"
        />
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: AppInfo }) => (
    <TouchableOpacity 
      style={[styles.appItem, item.isDistracting && styles.distractingApp]}
      onPress={() => toggleAppLock(item.packageName)}
    >
      <View style={styles.appHeader}>
        <View style={styles.appIconContainer}>
          <Icon name="android" size={24} color="#666666" />
        </View>
        <View style={styles.appInfo}>
          <View style={styles.appTitleContainer}>
            <Text style={styles.appName}>{item.appName}</Text>
            <Text style={styles.packageName}>{item.packageName}</Text>
            {item.isDistracting && (
              <View style={styles.distractingLabelContainer}>
                <Icon name="warning" size={12} color="#FF9800" />
                <Text style={styles.distractingLabel}>Potentially Distracting</Text>
              </View>
            )}
          </View>
          <Switch
            value={item.isLocked}
            onValueChange={() => toggleAppLock(item.packageName)}
            trackColor={{ false: '#E0E0E0', true: '#81D4FA' }}
            thumbColor={item.isLocked ? '#2196F3' : '#FFFFFF'}
          />
        </View>
      </View>

      {item.isLocked && (
        <View style={styles.lockOptionsContainer}>
          <Text style={styles.lockOptionsLabel}>Lock Mode:</Text>
          <View style={styles.lockTypeSelector}>
            <TouchableOpacity
              style={[
                styles.lockTypeButton,
                item.lockType === 'always' && styles.activeLockType
              ]}
              onPress={() => updateLockType(item.packageName, 'always')}
            >
              <Icon 
                name="lock" 
                size={16} 
                color={item.lockType === 'always' ? '#FFFFFF' : '#666666'} 
              />
              <Text style={[
                styles.lockTypeText,
                item.lockType === 'always' && styles.activeLockTypeText
              ]}>Always</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.lockTypeButton,
                item.lockType === 'scheduled_lock' && styles.activeLockType
              ]}
              onPress={() => handleScheduleUpdate(item.packageName, 'scheduled_lock')}
            >
              <Icon 
                name="schedule" 
                size={16} 
                color={item.lockType === 'scheduled_lock' ? '#FFFFFF' : '#666666'} 
              />
              <Text style={[
                styles.lockTypeText,
                item.lockType === 'scheduled_lock' && styles.activeLockTypeText
              ]}>Lock Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.lockTypeButton,
                item.lockType === 'scheduled_unlock' && styles.activeLockType
              ]}
              onPress={() => updateLockType(item.packageName, 'scheduled_unlock')}
            >
              <Icon 
                name="lock-open" 
                size={16} 
                color={item.lockType === 'scheduled_unlock' ? '#FFFFFF' : '#666666'} 
              />
              <Text style={[
                styles.lockTypeText,
                item.lockType === 'scheduled_unlock' && styles.activeLockTypeText
              ]}>Unlock Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />
      <View style={styles.container}>
        {renderHeader()}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : (
          <FlatList
            data={showOnlyDistracting ? apps.filter(app => app.isDistracting) : apps}
            renderItem={renderItem}
            keyExtractor={(item) => item.packageName}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 0,
  },
  filterText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    width: '100%',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appInfo: {
    flex: 1,
    marginRight: 12,
  },
  appTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  packageName: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  distractingApp: {
    backgroundColor: '#FFF8E1',
  },
  distractingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distractingLabel: {
    fontSize: 11,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '500',
  },
  lockOptionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  lockOptionsLabel: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  lockTypeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  lockTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    gap: 4,
  },
  activeLockType: {
    backgroundColor: '#2196F3',
  },
  lockTypeText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  activeLockTypeText: {
    color: '#FFFFFF',
  },
  separator: {
    height: 8,
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
});

export default AppLockScreen; 