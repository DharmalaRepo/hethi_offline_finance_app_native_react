import EncryptedStorage from 'react-native-encrypted-storage';

export const saveSecureItem = async (key: string, value: any): Promise<void> => {
  try {
    await EncryptedStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Secure Storage Save Error:', error);
    throw error;
  }
};

export const getSecureItem = async <T = any>(key: string): Promise<T | null> => {
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