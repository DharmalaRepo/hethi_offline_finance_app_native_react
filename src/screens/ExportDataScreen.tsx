import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  exportAllData,
  getAllCategories,
  getAllPersons,
  getAllTransactions,
  getAllRecurringPayments,
} from '../services/mockDataService';

const ExportDataScreen = () => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: string) => {
    setExporting(true);
    try {
      let data: any;
      switch (type) {
        case 'all':
          data = await exportAllData();
          break;
        case 'categories':
          data = await getAllCategories();
          break;
        case 'persons':
          data = await getAllPersons();
          break;
        case 'transactions':
          data = await getAllTransactions();
          break;
        case 'recurring':
          data = await getAllRecurringPayments();
          break;
        default:
          throw new Error('Invalid export type');
      }

      const fileUri = `${FileSystem.documentDirectory}${type}_export.json`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: `Export ${type} data`,
      });
    } catch (err: any) {
      console.error('Export failed', err);
      Alert.alert('Error', 'Failed to export data: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Export Data</Text>
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
  container: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#007bff',
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