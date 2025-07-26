import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../navigation/routes';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 columns with spacing

const menuItems = [
  { label: 'PIN Protection', icon: 'lock-closed-outline', screen: 'SetPin' },
  { label: 'Manage Persons', icon: 'people-outline', screen: 'Persons' },
  { label: 'Manage Categories', icon: 'pricetags-outline', screen: 'Categories' },
  { label: 'Reversible Transactions', icon: 'swap-horizontal-outline', screen: 'ReversibleTransactions' },
  { label: 'Recurring Payments', icon: 'repeat-outline', screen: 'RecurringPayments' },
  { label: 'Data Management', icon: 'server-outline', screen: 'DataManagement' },
  { label: 'Import Data', icon: 'cloud-download-outline', screen: 'ImportData' },
  { label: 'Export Data', icon: 'cloud-upload-outline', screen: 'ExportData' },
  { label: 'Setup Wizard', icon: 'settings-outline', screen: 'SetupWizard' },
  { label: 'Lock Screen', icon: 'settings-outline', screen: 'LockScreen' },
];

const MoreMenuScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.subtext}>Manage additional features & settings</Text>
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen as any)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={28} color="#fff" />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#e6f0ff',
  },
  subtext: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4, // for Android
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 2,                // 🆕 Add this
    borderColor: 'blue',
  },
  iconContainer: {
    backgroundColor: '#0984e3',
    padding: 12,
    borderRadius: 50,
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    textAlign: 'center',
  },
});

export default MoreMenuScreen;