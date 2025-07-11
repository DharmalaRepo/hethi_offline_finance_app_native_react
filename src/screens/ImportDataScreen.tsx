import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Toast from 'react-native-toast-message';

import {
  importCategories,
  importPersons,
  importTransactions,
  importRecurringPayments,
  importAccounts,
  importMonthlyOpeningBalances,
} from '../services/mockDataService';

const ImportDataScreen = () => {
  const [jsonData, setJsonData] = useState<any | null>(null);
  const [fileName, setFileName] = useState('');

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileName(file.name);

        const fileContent = await FileSystem.readAsStringAsync(file.uri);
        const parsedData = JSON.parse(fileContent);
        setJsonData(parsedData);

        Toast.show({ type: 'success', text1: 'File Loaded Successfully' });
      }
    } catch (err: any) {
      console.error('File Read Error:', err);
      Toast.show({ type: 'error', text1: 'Failed to load file', text2: err?.message || '' });
    }
  };

  const handleImport = async () => {
    if (!jsonData) {
      Toast.show({ type: 'error', text1: 'No file loaded' });
      return;
    }

    try {
      await importCategories(jsonData.categories || []);
      await importPersons(jsonData.persons || []);
      await importAccounts(jsonData.accounts || []);
      await importMonthlyOpeningBalances(jsonData.monthlyOpeningBalances || []);
      await importTransactions(jsonData.transactions || []);
      await importRecurringPayments(jsonData.recurringPayments || []);
      Toast.show({ type: 'success', text1: 'Data Imported Successfully' });
    } catch (err: any) {
      console.error('Import Error:', err);
      Toast.show({ type: 'error', text1: 'Import Failed', text2: err.message });
    }
  };

  const handleSectionImport = async (key: string, fn: Function) => {
    if (!jsonData || !jsonData[key]) {
      Toast.show({ type: 'error', text1: `No ${key} data found` });
      return;
    }

    try {
      await fn(jsonData[key]);
      Toast.show({ type: 'success', text1: `${key} imported successfully` });
    } catch (err: any) {
      console.error(`${key} Import Error:`, err);
      Toast.show({ type: 'error', text1: `${key} import failed`, text2: err.message });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📥 Import Backup Data</Text>

      <TouchableOpacity style={styles.button} onPress={pickFile}>
        <Text style={styles.buttonText}>Select JSON File</Text>
      </TouchableOpacity>

      {fileName && <Text style={styles.fileText}>Loaded: {fileName}</Text>}

      {jsonData && (
        <View style={styles.previewBox}>
          <Text>✅ Categories: {jsonData.categories?.length || 0}</Text>
          <Text>✅ Persons: {jsonData.persons?.length || 0}</Text>
          <Text>✅ Accounts: {jsonData.accounts?.length || 0}</Text>
          <Text>✅ Monthly Opening: {jsonData.monthlyOpeningBalances?.length || 0}</Text>
          <Text>✅ Transactions: {jsonData.transactions?.length || 0}</Text>
          <Text>✅ Recurring Payments: {jsonData.recurringPayments?.length || 0}</Text>

          <TouchableOpacity style={styles.importAllBtn} onPress={handleImport}>
            <Text style={styles.buttonText}>🚀 Import All</Text>
          </TouchableOpacity>

          <View style={{ gap: 8, marginTop: 14 }}>
            <TouchableOpacity onPress={() => handleSectionImport('categories', importCategories)}>
              <Text style={styles.link}>Import Categories</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSectionImport('persons', importPersons)}>
              <Text style={styles.link}>Import Persons</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSectionImport('accounts', importAccounts)}>
              <Text style={styles.link}>Import Accounts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSectionImport('monthlyOpeningBalances', importMonthlyOpeningBalances)}>
              <Text style={styles.link}>Import Monthly Opening</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSectionImport('transactions', importTransactions)}>
              <Text style={styles.link}>Import Transactions</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSectionImport('recurringPayments', importRecurringPayments)}>
              <Text style={styles.link}>Import Recurring Payments</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#007bff', padding: 12, borderRadius: 6, marginBottom: 10 },
  importAllBtn: { backgroundColor: '#28a745', padding: 12, borderRadius: 6, marginTop: 10 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  fileText: { marginVertical: 6, fontStyle: 'italic', textAlign: 'center', color: '#333' },
  previewBox: { backgroundColor: '#fff', padding: 14, borderRadius: 10, marginTop: 10, elevation: 2 },
  link: { color: '#007bff', fontWeight: 'bold', textAlign: 'center', paddingVertical: 6, fontSize: 15 },
});

export default ImportDataScreen;