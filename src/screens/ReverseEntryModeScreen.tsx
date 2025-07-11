// src/screens/ReverseEntryModeScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReverseEntryModeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔁 Reverse Entry Mode</Text>
      <Text>This screen will allow you to:</Text>
      <Text>• Toggle automatic creation of reverse transactions</Text>
      <Text>• Enable or disable "Power Mode"</Text>
      <Text>• Reverse entries like Payable/Receivable easily</Text>
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

export default ReverseEntryModeScreen;