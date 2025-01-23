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

const { AppLockModule } = NativeModules;

interface AppInfo {
  appName: string;
  packageName: string;
  isLocked: boolean;
  isSystemApp: boolean;
  isDistracting: boolean;
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

  const isDistracting = (packageName: string, appName: string): boolean => {
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
    // Always show specifically relevant apps
    if (RELEVANT_APPS.includes(packageName)) {
      return true;
    }

    // Show if it's not a system app and not our own app
    return !isSystemApp(packageName) && packageName !== 'com.wingsfly';
  };

  const loadApps = async () => {
    try {
      const lockedApps = await AsyncStorage.getItem('lockedApps');
      const lockedAppsSet = new Set(lockedApps ? JSON.parse(lockedApps) : []);

      const allApps = await getInstalledApps();
      
      // Format all apps data
      const formattedApps = allApps
        .filter(shouldShowApp)
        .map((packageName: string) => {
          const appName = packageName.split('.').pop() || packageName;
          const isDistractingApp = isDistracting(packageName, appName);
          
          return {
            appName: appName
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim(),
            packageName,
            isLocked: lockedAppsSet.has(packageName),
            isSystemApp: isSystemApp(packageName),
            isDistracting: isDistractingApp
          };
        });

      setApps(formattedApps.sort((a: AppInfo, b: AppInfo ) => {
        // Sort distracting apps first, then by name
        if (a.isDistracting && !b.isDistracting) return -1;
        if (!a.isDistracting && b.isDistracting) return 1;
        return a.appName.localeCompare(b.appName);
      }));
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const toggleAppLock = async (packageName: string) => {
    try {
      const lockedApps = await AsyncStorage.getItem('lockedApps');
      const lockedAppsSet = new Set(lockedApps ? JSON.parse(lockedApps) : []);
      
      if (lockedAppsSet.has(packageName)) {
        lockedAppsSet.delete(packageName);
        console.log(`Unlocked app: ${packageName}`);
      } else {
        lockedAppsSet.add(packageName);
        console.log(`Locked app: ${packageName}`);
      }
      
      const lockedAppsArray = [...lockedAppsSet];
      
      // Save to both AsyncStorage and SharedPreferences
      await Promise.all([
        AsyncStorage.setItem('lockedApps', JSON.stringify(lockedAppsArray)),
        AppLockModule.updateLockedApps(lockedAppsArray)
      ]);
      
      console.log('Current locked apps:', lockedAppsArray);
      
      setApps(prevApps => 
        prevApps.map(app => 
          app.packageName === packageName 
            ? { ...app, isLocked: !app.isLocked }
            : app
        )
      );
    } catch (error) {
      console.error('Error toggling app lock:', error);
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
      style={[
        styles.appItem,
        item.isDistracting && styles.distractingApp
      ]}
      onPress={() => toggleAppLock(item.packageName)}
      activeOpacity={0.7}
    >
      <View style={styles.appIconContainer}>
        <Icon 
          name={item.isDistracting ? "warning" : "android"} 
          size={32} 
          color={item.isDistracting ? "#FF9800" : "#4CAF50"} 
        />
      </View>
      <View style={styles.appInfo}>
        <Text style={styles.appName} numberOfLines={1}>
          {item.appName}
        </Text>
        <Text style={styles.packageName} numberOfLines={1}>
          {item.packageName}
        </Text>
        {item.isDistracting && (
          <View style={styles.distractingLabelContainer}>
            <Icon name="error-outline" size={12} color="#FF9800" />
            <Text style={styles.distractingLabel}>Distracting App</Text>
          </View>
        )}
      </View>
      <View style={styles.switchContainer}>
        <Switch
          value={item.isLocked}
          onValueChange={() => toggleAppLock(item.packageName)}
          trackColor={{ false: '#E0E0E0', true: '#81D4FA' }}
          thumbColor={item.isLocked ? '#2196F3' : '#FFFFFF'}
          ios_backgroundColor="#E0E0E0"
        />
        <Text style={[
          styles.lockStatus,
          { color: item.isLocked ? '#2196F3' : '#666666' }
        ]}>
          {item.isLocked ? 'Locked' : 'Unlocked'}
        </Text>
      </View>
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
            keyExtractor={item => item.packageName}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
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
  switchContainer: {
    alignItems: 'center',
  },
  lockStatus: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  separator: {
    height: 8,
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
});

export default AppLockScreen; 