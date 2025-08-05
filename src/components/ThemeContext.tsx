import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { AppSettings } from '../models/AppSettings';
import { getAppSettings, saveAppSettings } from '../services/mockDataService';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme } from '@react-navigation/native';

type ThemeContextType = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  paperTheme: typeof MD3LightTheme;
  navTheme: typeof NavigationLightTheme;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  paperTheme: MD3LightTheme,
  navTheme: NavigationLightTheme,
});

export const useThemeContext = () => useContext(ThemeContext);

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const fetchSettings = async () => {
      const settings: AppSettings = await getAppSettings();
      if (settings.theme === 'dark' || settings.theme === 'light') {
        setTheme(settings.theme);
      }
    };
    fetchSettings();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    const settings = await getAppSettings();
    await saveAppSettings({ ...settings, theme: newTheme });
  };

  const paperTheme = theme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const navTheme = theme === 'dark' ? NavigationDarkTheme : NavigationLightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, paperTheme, navTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;