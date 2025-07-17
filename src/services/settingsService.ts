import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings } from '../models/AppSettings';

const APP_SETTINGS_KEY = 'APP_SETTINGS';

export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    const raw = await AsyncStorage.getItem(APP_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to load app settings:', err);
    return {};
  }
};

export const saveAppSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save app settings:', err);
    throw err;
  }
};

export const clearAppSettings = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(APP_SETTINGS_KEY);
  } catch (err) {
    console.error('Failed to clear app settings:', err);
    throw err;
  }
};