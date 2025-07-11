import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../navigation/routes';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
  { label: 'PIN Protection', icon: 'lock-closed-outline', screen: 'SetPin' },
  { label: 'Reports', icon: 'folder-outline', screen: 'Reports' },
  { label: 'Monthly Opening Balances', icon: 'calendar-outline', screen: 'MonthlyOpeningBalance' },
  { label: 'Reversible Transactions', icon: 'swap-horizontal-outline', screen: 'ReversibleTransactions' },
  { label: 'Current Balances', icon: 'cash-outline', screen: 'CurrentBalances' },
  { label: 'Recurring Payments', icon: 'repeat-outline', screen: 'RecurringPayments' },
  { label: 'Import Data', icon: 'cloud-download-outline', screen: 'ImportData' },
  { label: 'Export Data', icon: 'cloud-upload-outline', screen: 'ExportData' },
  { label: 'Settings / Setup Wizard', icon: 'settings-outline', screen: 'SetupWizard' },
];

const MoreMenuScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.subtext}>Manage additional features & settings:</Text>

      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuButton}
          onPress={() => navigation.navigate(item.screen as any)}
        >
          <Ionicons name={item.icon as any} size={22} color="#fff" style={styles.icon} />
          <Text style={styles.menuText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f2f2f2',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 20,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0984e3',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  icon: {
    marginRight: 14,
  },
  menuText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default MoreMenuScreen;