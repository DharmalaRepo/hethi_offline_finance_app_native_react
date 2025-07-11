// LogTransactionScreen.tsx
import React from 'react';
import { View, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import LogTransactionForm from './LogTransactionForm';

const LogTransactionScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <LogTransactionForm />
      </ScrollView>
    </SafeAreaView>
  );
};

export default LogTransactionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
});