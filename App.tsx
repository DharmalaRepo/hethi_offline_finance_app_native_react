import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ThemeProvider, { useThemeContext } from './src/components/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';
import { AppProvider } from './src/context/AppContext';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/NavigationService';
import { PermissionsAndroid, Platform } from 'react-native';
import { AppState, AppStateStatus } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { View, Text, ToastAndroid } from 'react-native';

const rnBiometrics = new ReactNativeBiometrics();
declare const global: any;


const ThemedApp = () => {
  const { paperTheme } = useThemeContext();


 useEffect(() => {
  if (global.ErrorUtils && typeof global.ErrorUtils.setGlobalHandler === 'function') {
    global.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      console.log('Global Error:', error.message);
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(
          `Unexpected error occurred:\n${error.message}`,
          ToastAndroid.LONG,
          ToastAndroid.CENTER
        );
      }
    });
  } else {
    console.warn('Global Error Handler not available');
  }
}, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      const { available } = await rnBiometrics.isSensorAvailable();
      if (available) {
        const result = await rnBiometrics.simplePrompt({ promptMessage: 'Unlock with biometrics' });
        if (!result.success) {
          // Optionally exit or lock app
        }
      }
    }
  };

useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          ]);

          console.log('Permission results:', granted);
        } catch (err) {
          console.warn('Permission error:', err);
        }
      }
    };

    requestPermissions();
  }, []);

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <AppProvider>
            <RootNavigator />
          </AppProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}