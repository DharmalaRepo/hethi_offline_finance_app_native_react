import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image
} from 'react-native';
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

  const pickFile = async (type: string) => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
          multiple: false,
        });

        if (!result?.assets || result.assets.length === 0) {
          Alert.alert('No file selected');
          return;
        }

        const file = result.assets[0];
        const { uri, name } = file;

        const content = await FileSystem.readAsStringAsync(uri);
        const parsedJson = JSON.parse(content);

        setFileName(name);
        setJsonData(parsedJson);

        switch (type) {
          case 'categories':
            await importCategories(parsedJson.categories || []);
            break;
          case 'persons':
            await importPersons(parsedJson.persons || []);
            break;
          case 'accounts':
            await importAccounts(parsedJson.accounts || []);
            break;
          case 'monthlyOpeningBalances':
            await importMonthlyOpeningBalances(parsedJson.monthlyOpeningBalances || []);
            break;
          case 'transactions':
            await importTransactions(parsedJson.transactions || []);
            break;
          case 'recurringPayments':
            await importRecurringPayments(parsedJson.recurringPayments || []);
            break;
          case 'all':
          default:
            // Bulk save all if available
            await Promise.all([
              importCategories( parsedJson.categories || []),
              importPersons(parsedJson.persons || []),
              importAccounts( parsedJson.accounts || []),
              importMonthlyOpeningBalances(parsedJson.monthlyOpeningBalances || []),
              importTransactions(parsedJson.transactions || []),
              importRecurringPayments(parsedJson.recurringPayments || [])
            ]);
            break;
        }

        Alert.alert('Import Successful', `Data imported for: ${type}`);
    } catch (error) {
      console.error('Error importing:', error);
      Alert.alert('Error', 'Failed to import data.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.title}> 📥 Import Backup Data</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => pickFile('all')}>
        <Text style={styles.buttonText}>Import All Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickFile('categories')}>
        <Text style={styles.buttonText}>Import Categories</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickFile('persons')}>
        <Text style={styles.buttonText}>Import Persons</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickFile('accounts')}>
        <Text style={styles.buttonText}>Import Accounts</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickFile('monthlyOpeningBalances')}>
        <Text style={styles.buttonText}>Import Monthly Opening</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickFile('transactions')}>
        <Text style={styles.buttonText}>Import Transactions</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickFile('recurringPayments')}>
        <Text style={styles.buttonText}>Import Recurring Payments</Text>
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

        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9', flexGrow: 1 },
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
    elevation: 6,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 28, height: 28, resizeMode: 'contain', marginRight: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  button: {
    backgroundColor: '#007bff', padding: 12, borderRadius: 6, marginBottom: 10,
  },
  importAllBtn: {
    backgroundColor: '#28a745', padding: 12, borderRadius: 6, marginTop: 10,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  fileText: { marginVertical: 6, fontStyle: 'italic', textAlign: 'center', color: '#333' },
  previewBox: {
    backgroundColor: '#fff', padding: 14, borderRadius: 10, marginTop: 10, elevation: 2,
  },
  link: {
    color: '#007bff', fontWeight: 'bold', textAlign: 'center', paddingVertical: 6, fontSize: 15,
  },
});

export default ImportDataScreen;