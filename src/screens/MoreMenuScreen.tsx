import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '../navigation/routes';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 columns with spacing

const menuItems = [
  { label: 'PIN Protection', icon: 'lock-closed-outline', screen: 'SetPin' },
  { label: 'Setup Wizard', icon: 'settings-outline', screen: 'SetupWizard' },
  { label: 'Manage Persons', icon: 'people-outline', screen: 'Persons' },
  { label: 'Manage Categories', icon: 'pricetags-outline', screen: 'Categories' },
  { label: 'Track Returns', icon: 'swap-horizontal-outline', screen: 'ReversibleTransactions' },
  { label: 'Recurring Payments', icon: 'repeat-outline', screen: 'RecurringPayments' },  
  { label: 'Import Data', icon: 'cloud-download-outline', screen: 'ImportData' },
  { label: 'Export Data', icon: 'cloud-upload-outline', screen: 'ExportData' },
  { label: 'Data Management', icon: 'server-outline', screen: 'DataManagement' },
  { label: 'Optional Expenses', icon: 'server-outline', screen: 'OptionalExpenses' },
  
  
];

const MoreMenuScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
               <View style={styles.headerLeft}>
                  <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
                  <Text style={styles.title}> Menu Items</Text>
                </View>       
            </View> 
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
  screen: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
    color: '#222',
  },
   header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#0984e3',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  marginBottom: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 6, // For Android
  // Optional: Use gradient background with expo-linear-gradient
},
headerLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},

headerRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10, // Optional for spacing (or use marginRight)
},

logo: {
  width: 28,
  height: 28,
  resizeMode: 'contain',
  marginRight: 8,
},

title: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#fff',
},
  subtext: {
    fontSize: 14,
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
});

export default MoreMenuScreen;