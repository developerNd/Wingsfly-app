import { NativeModules } from 'react-native';
const { AppLockModule } = NativeModules;

export const getInstalledApps = async () => {
  try {
    const apps = await AppLockModule.getInstalledApps();
    console.log(apps);
    return apps;
  } catch (error) {
    console.error('Error fetching apps:', error);
    return [];
  }
};
