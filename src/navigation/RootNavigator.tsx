// src/navigation/RootNavigator.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';

const RootNavigator = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Welcome to Personal Finance Tracking App
        </Text>
      </View>

      {/* MAIN NAVIGATION */}
      <View style={styles.content}>
        <NavigationContainer>
          <BottomTabNavigator />
        </NavigationContainer>
      </View>


      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © All rights reserved. Dharmala Hethi Pranavi Reddy - HETHI SOLUTIONS.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    overflow: 'hidden', // ensures footer remains fixed
  },
  footer: {
    backgroundColor: '#e6f0ff',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#cce0ff',
  },
  footerText: {
    fontSize: 12,
    color: '#000', // Black
    fontWeight: 'bold',
  },
});

export default RootNavigator;