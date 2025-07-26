import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOGGLE_KEY = 'SHOW_SENSITIVE_DATA';

const AppContext = createContext({
  showSensitiveData: true,
  toggleSensitiveData: () => {},
});

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [showSensitiveData, setShowSensitiveData] = useState(true);

  useEffect(() => {
    const loadSetting = async () => {
      const stored = await AsyncStorage.getItem(TOGGLE_KEY);
      if (stored !== null) setShowSensitiveData(stored === 'true');
    };
    loadSetting();
  }, []);

  const toggleSensitiveData = async () => {
    const newValue = !showSensitiveData;
    setShowSensitiveData(newValue);
    await AsyncStorage.setItem(TOGGLE_KEY, newValue.toString());
  };

  return (
    <AppContext.Provider value={{ showSensitiveData, toggleSensitiveData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);