// src/components/MainLayout.tsx
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

interface Props {
  children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ children }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome to Personal Finance Tracking App</Text>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>{children}</View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© All rights reserved. Dharmala Hethi Pranavi Reddy</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 14,
    backgroundColor: '#007bff',
  },
  headerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingBottom: 60, // to avoid overlapping footer
  },
  footer: {
    padding: 10,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#777',
  },
});

export default MainLayout;