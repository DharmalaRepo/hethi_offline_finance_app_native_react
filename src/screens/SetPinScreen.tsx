// src/screens/SetPinScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SetPinScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 Set App PIN</Text>
      <Text>This screen will allow you to:</Text>
      <Text>• Set or change your app security PIN</Text>
      <Text>• Protect access to sensitive sections like Vault or Settings</Text>
      <Text>• Prompt for PIN on app launch if enabled</Text>
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

export default SetPinScreen;