import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ThemeProvider, { useThemeContext } from './src/components/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import RootNavigator from './src/navigation/RootNavigator';

const ThemedApp = () => {
  const { paperTheme } = useThemeContext();

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <RootNavigator />
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