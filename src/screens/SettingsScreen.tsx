// src/screens/SettingsScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚙️ Settings</Text>
      <Text>This screen will allow you to:</Text>
      <Text>• Manage app preferences</Text>
      <Text>• Set currency, theme, and language</Text>
      <Text>• Manage backup, restore, reset options</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default SettingsScreen;