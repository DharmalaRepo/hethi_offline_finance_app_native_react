import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert, Image
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  exportAllData,
} from '../services/mockDataService';

import CryptoJS from 'crypto-js';
import { useAppData } from '../context/AppDataProvider';

const ENCRYPTION_KEY = 'HETHI_DATA_ENCRYPTION_KEY';

const ExportDataScreen = () => {
  const [exporting, setExporting] = useState(false);


    const {
      persons,
      categories,
      subcategories,
      transactions,
      recurringPayments,
      monthlyOpeningBalance,
      monthlyClosingBalance,
      reloadAppData,
    } = useAppData();

  const encryptData = (data: string): string => {
    try {
      const hashedKey = CryptoJS.SHA256(ENCRYPTION_KEY).toString();
      const encrypted = CryptoJS.AES.encrypt(data, hashedKey).toString();
      return encrypted;
    } catch (err) {
      console.error("Encryption error:", err);
      throw new Error("Encryption failed");
    }
  };

  const decryptData = (encrypted: string, key: string): string => {
    const hashedKey = CryptoJS.SHA256(key).toString();
    const bytes = CryptoJS.AES.decrypt(encrypted, hashedKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  };

  const handleExport = async (type: string) => {
    setExporting(true);

    try {
      let data: any;
      switch (type) {
        case 'all':
          data = await exportAllData();
          break;
        case 'categories':
          data = categories;
          break;
        case 'persons':
          data = persons;
          break;
        case 'transactions':
          data = transactions;
          break;
        case 'recurring':
          data = recurringPayments;
          break;
        default:
          throw new Error('Invalid export type');
      }

      // Step 1: Stringify the data
      const jsonString = JSON.stringify(data, null, 2);

      if (!jsonString) {
        throw new Error('Encryption failed');
      }


      // Step 3: Save encrypted data to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileUri = `${FileSystem.documentDirectory}${type}_export_${timestamp}.json`;
      await FileSystem.writeAsStringAsync(fileUri, jsonString);

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: `Export ${type} data`,
      });
      Alert.alert('Exported', `Your ${type} data was exported successfully.`);
    } catch (err: any) {
      console.error('Export failed', err);
      Alert.alert('Error', 'Failed to export data: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.title}> Export Data</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => handleExport('all')} disabled={exporting}>
        <Text style={styles.buttonText}>Export All Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => handleExport('categories')} disabled={exporting}>
        <Text style={styles.buttonText}>Export Categories</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => handleExport('persons')} disabled={exporting}>
        <Text style={styles.buttonText}>Export Persons</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => handleExport('transactions')} disabled={exporting}>
        <Text style={styles.buttonText}>Export Transactions</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => handleExport('recurring')} disabled={exporting}>
        <Text style={styles.buttonText}>Export Recurring Payments</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9', flexGrow: 1 },
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
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#2c3e50',
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
  button: {
    width: '90%',
    backgroundColor: '#007bff',
    padding: 14,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExportDataScreen;