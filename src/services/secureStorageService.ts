import EncryptedStorage from 'react-native-encrypted-storage';
import { Platform } from 'react-native';


console.log('EncryptedStorage test:', EncryptedStorage);

/*
export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    return await EncryptedStorage.getItem(key);
  } catch (error) {
    console.error('Error getting secure item', error);
    return null;
  }
};

export const setSecureItem = async (key: string, value: string) => {
  try {
    await EncryptedStorage.setItem(key, value);
  } catch (error) {
    console.error('Error setting secure item', error);
  }
};
*/


export const saveSecureItemInJson = async (key: string, value: any): Promise<void> => {
  try {
    await EncryptedStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Secure Storage Save Error:', error);
    throw error;
  }
};

export const getSecureItemInJsonFormat = async <T = any>(key: string): Promise<T | null> => {
  try {
    const item = await EncryptedStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Secure Storage Get Error:', error);
    return null;
  }
};

export const removeSecureItem = async (key: string): Promise<void> => {
  try {
    await EncryptedStorage.removeItem(key);
  } catch (error) {
    console.error('Secure Storage Remove Error:', error);
  }
};