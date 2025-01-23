import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getInstalledApps } from '../utils/AppLockModule';

const AppListScreen = () => {
  const [apps, setApps] = useState([]);
  const [lockedApps, setLockedApps] = useState({});

  useEffect(() => {
    const loadApps = async () => {
      const installedApps = await getInstalledApps();
      setApps(installedApps);

      const savedLockedApps = await AsyncStorage.getItem('lockedApps');
      setLockedApps(JSON.parse(savedLockedApps) || {});
    };

    loadApps();
  }, []);

  const toggleLock = async (packageName) => {
    const updatedLockedApps = {
      ...lockedApps,
      [packageName]: !lockedApps[packageName],
    };
    setLockedApps(updatedLockedApps);
    await AsyncStorage.setItem('lockedApps', JSON.stringify(updatedLockedApps));
  };

  return (
    <FlatList
      data={apps}
      keyExtractor={(item) => item.packageName}
      renderItem={({ item }) => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
          <Text>{item.name}</Text>
          <Switch
            value={!!lockedApps[item.packageName]}
            onValueChange={() => toggleLock(item.packageName)}
          />
        </View>
      )}
    />
  );
};

export default AppListScreen;
