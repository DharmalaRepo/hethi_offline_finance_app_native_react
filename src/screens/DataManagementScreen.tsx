import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { Category } from '../models/Category';
import {  SubCategory } from '../models/SubCategory';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { RecurringPayment } from '../models/RecurringPayment';
import { getCategories, getPersons, getAllTransactions, getAllRecurringPayments, getAllCategories, 
  getAllPersons, getAccounts, addCategory, addSubCategory, addPerson, saveTransaction, 
  getFallbackTransactionValues, saveCategories, savePersons, saveTransactions, saveRecurringPayments } from '../services/mockDataService';


const CATEGORY_KEY = 'categories';
const PERSON_KEY = 'persons';
const ACCOUNT_KEY = 'accounts';
const TRANSACTION_KEY = 'transactions';
const RECURRINGPAYEMENTS_KEY= 'recurringPayments';
const OPENINGBALANCE_KEY= 'monthlyOpeningBalances';
const CONFIRM_PHRASE = 'delete data';

const DataManagementScreen = () => {
  const [confirmationText, setConfirmationText] = useState('');

  const confirmAction = (action: () => void) => {
    if (confirmationText.toLowerCase() === 'delete data') {
      action();
      setConfirmationText('');
    } else {
      ToastAndroid.show('Confirmation text does not match. Cannot proceed.', ToastAndroid.SHORT);
    }
  };

  const showConfirmation = (title: string, action: () => void) => {
    Alert.alert(
      title,
      'Type "delete data" to confirm:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => confirmAction(action),
        },
      ],
      { cancelable: true }
    );
  };

  const saveToStorage = async (key: string, data: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  };

  const loadTestData = async () => {
    const testCategories: Category[] = [
      {
        id: uuid.v4().toString(),
        name: 'SALARY',
        subcategories: [
          { id: uuid.v4().toString(), name: 'SELF', categoryId: '' },
          { id: uuid.v4().toString(), name: 'FAMILY', categoryId: '' },
        ],
        isTestData: true,
      },
      {
        id: uuid.v4().toString(),
        name: 'SHOPPING',
        subcategories: [
          { id: uuid.v4().toString(), name: 'CLOTHS', categoryId: '' },
          { id: uuid.v4().toString(), name: 'GOLD', categoryId: '' },
          { id: uuid.v4().toString(), name: 'GIFTS', categoryId: '' },
        ],
        isTestData: true,
      },
      {
        id: uuid.v4().toString(),
        name: 'INVESTMENTS',
        subcategories: [
          { id: uuid.v4().toString(), name: 'GOLD', categoryId: '' },
          { id: uuid.v4().toString(), name: 'MF', categoryId: '' },
          { id: uuid.v4().toString(), name: 'RD', categoryId: '' },
        ],
        isTestData: true,
      },
    ];

    testCategories.forEach(cat => cat.subcategories?.forEach(sub => sub.categoryId = cat.id));
    await saveToStorage(CATEGORY_KEY, testCategories);

    const persons: Person[] = [
      { id: uuid.v4().toString(), name: 'SHIVA', accounts: [], isTestData: true },
      { id: uuid.v4().toString(), name: 'SANGI', accounts: [], isTestData: true },
      { id: uuid.v4().toString(), name: 'HETHI', accounts: [], isTestData: true },
    ];

    (persons[0].accounts??= []).push({ id: uuid.v4().toString(), accountTypeOrName: 'HDFC', personId: persons[0].id, isTestData: true });
    (persons[0].accounts??= []).push({ id: uuid.v4().toString(), accountTypeOrName: 'CASH', personId: persons[0].id, isTestData: true });
    (persons[1].accounts??= []).push({ id: uuid.v4().toString(), accountTypeOrName: 'ICICI', personId: persons[1].id, isTestData: true });
    (persons[1].accounts??= []).push({ id: uuid.v4().toString(), accountTypeOrName: 'UPI', personId: persons[1].id, isTestData: true });
    (persons[2].accounts??= []).push({ id: uuid.v4().toString(), accountTypeOrName: 'CASH', personId: persons[2].id, isTestData: true });



    await saveToStorage(PERSON_KEY, persons);

    const transactions: Transaction[] = generateSampleTransactions(persons, testCategories);
    await saveToStorage(TRANSACTION_KEY, transactions);

    const recurringPayments: RecurringPayment[] = [
  {
    id: uuid.v4().toString(),
    title: 'Gold Investment - SHIVA',
    type: 'expense',
    amount: 5000,
    categoryId: 'INVESTMENTS_ID',       // Replace with actual ID
    subCategoryId: 'GOLD_SUB_ID',       // Replace with actual ID
    personId: 'SHIVA_ID',               // Replace with actual ID
    accountId: 'HDFC_ID',               // Replace with actual ID
    note: 'Monthly Gold Investment',
    frequency: 'monthly',
    startDate: '2024-01-01',
    dueDate: '2024-01-01',
    endDate: '2026-01-01',
    isTestData: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuid.v4().toString(),
    title: 'RD Investment - SANGI',
    type: 'expense',
    amount: 8000,
    categoryId: 'INVESTMENTS_ID',
    subCategoryId: 'RD_SUB_ID',
    personId: 'SANGI_ID',
    accountId: 'ICICI_ID',
    note: 'Semi-annual RD investment',
    frequency: 'semi-annually',
    startDate: '2024-01-01',
    dueDate: '2024-01-01',
    endDate: '2026-01-01',
    isTestData: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuid.v4().toString(),
    title: 'Monthly Clothes - HETHI',
    type: 'expense',
    amount: 2000,
    categoryId: 'SHOPPING_ID',
    subCategoryId: 'CLOTHS_SUB_ID',
    personId: 'HETHI_ID',
    accountId: 'CASH_HETHI_ID',
    note: 'Monthly clothing shopping',
    frequency: 'monthly',
    startDate: '2024-01-01',
    dueDate: '2024-01-01',
    endDate: '2025-12-31',
    isTestData: true,
    createdAt: new Date().toISOString(),
  },
];
    
    await saveToStorage(RECURRINGPAYEMENTS_KEY, recurringPayments);
    ToastAndroid.show('Test data loaded successfully.', ToastAndroid.SHORT);
  };

  const generateSampleTransactions = (persons: Person[], categories: Category[]): Transaction[] => {
    const transactions: Transaction[] = [];
    const now = new Date();
    let income = 0;
    let expense = 0;

    for (let i = 0; i < 25; i++) {
      const isIncome = i % 5 === 0;
      const person = persons[i % persons.length];
      // Fallback to first account or default
      const account = person.accounts?.[0] ?? {
        id: 'P_MISC_ACC',
        personId: person.id,
        accountTypeOrName: 'FallbackAccount',
      };
      const category = categories[i % categories.length];
        // Fallback to first subcategory or default
      const subcategory = category.subcategories?.[i % (category.subcategories?.length || 1)] ?? {
        id: 'MISC_SUB',
        name: 'Misc Subcategory',
        categoryId: category.id,
      };

      const amount = isIncome ? 8000 : 2500 + (i * 100);
      if (isIncome) income += amount; else expense += amount;

      transactions.push({
        id: uuid.v4().toString(),
        type: isIncome ? 'income' : 'expense',
        amount,
        date: new Date(now.getTime() - i * 86400000).toISOString().split('T')[0],
        categoryId: category.id,
        subCategoryId: subcategory.id,
        personId: person.id,
        accountId: account.id,
        createdAt: new Date().toISOString(),
        isTestData: true,
      } as Transaction);
    }

    return transactions;
  };

  const showToast = (msg: string) => ToastAndroid.show(msg, ToastAndroid.SHORT);

  const confirmAndRun = (action: () => void) => {
    if (confirmationText.trim().toLowerCase() !== CONFIRM_PHRASE) {
      showToast('Confirmation text does not match. Action aborted.');
      return;
    }
    action();
    setConfirmationText('');
  };

  const deleteTestData = async () => {
    const cats = (await getAllCategories()).filter(cat => !cat.isTestData);
    const persons = (await getAllPersons()).filter(p => !p.isTestData);
    const txns = (await getAllTransactions()).filter(t => !t.isTestData);
    const recurs = (await getAllRecurringPayments()).filter(r => !r.isTestData);

    await saveCategories(cats);
    await savePersons(persons);
    await saveTransactions(txns);
    await saveRecurringPayments(recurs);
    showToast('Test data deleted');
  };

  const deleteCategories = async () => {
    let categories = await getAllCategories();
    const misc = categories.find(c => c.name.toLowerCase() === 'misc');
    const miscSub = misc?.subcategories?.find(s => s.name.toLowerCase() === 'misc_sub');
    if (!misc || !miscSub) {
      showToast('MISC and MISC_SUB not found. Cannot proceed.');
      return;
    }
    categories = categories.filter(c => c.name.toLowerCase() === 'misc');
    await saveCategories(categories);

    const txns = await getAllTransactions();
    const updated = txns.map(t => ({
      ...t,
      categoryId: misc.id,
      subCategoryId: miscSub.id,
    }));
    await saveTransactions(updated);
    showToast('Categories deleted and transactions mapped to MISC');
  };

  const deletePersons = async () => {
    let persons = await getAllPersons();
    const misc = persons.find(p => p.name.toLowerCase() === 'p_misc');
    const miscAcc = misc?.accounts?.find(a => a.accountTypeOrName.toLowerCase() === 'p_misc_acc');
    if (!misc || !miscAcc) {
      showToast('P_MISC and P_MISC_ACC not found. Cannot proceed.');
      return;
    }
    persons = persons.filter(p => p.name.toLowerCase() === 'p_misc');
    await savePersons(persons);

    const txns = await getAllTransactions();
    const updated = txns.map(t => ({
      ...t,
      personId: misc.id,
      accountId: miscAcc.id,
    }));
    await saveTransactions(updated);
    showToast('Persons deleted and transactions mapped to P_MISC');
  };

  const deleteTransactions = async () => {
    await saveTransactions([]);
    showToast('All transactions deleted');
  };

  const deleteRecurring = async () => {
    await saveRecurringPayments([]);
    showToast('All recurring payments deleted');
  };

  const deleteAll = async () => {
    await AsyncStorage.multiRemove([
      CATEGORY_KEY,
      PERSON_KEY,
      TRANSACTION_KEY,
      RECURRINGPAYEMENTS_KEY,
      OPENINGBALANCE_KEY,
    ]);
    showToast('All data wiped');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Data Management</Text>
      <TextInput
        placeholder="Type 'delete data' to confirm"
        style={styles.input}
        value={confirmationText}
        onChangeText={setConfirmationText}
      />
      <TouchableOpacity style={styles.button} onPress={loadTestData}>
        <Text style={styles.buttonText}>1. Load Test Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => showConfirmation('Delete Test Data', async () => {
        // add delete logic for isTestData = true only
      })}>
        <Text style={styles.buttonText}>2. Delete Test Data</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Type "{CONFIRM_PHRASE}" to confirm destructive actions:</Text>
      <TextInput
        value={confirmationText}
        onChangeText={setConfirmationText}
        placeholder="Type delete data"
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={async () => { /* Load test data handler here */ }}>
        <Text style={styles.btnText}>1. Load Test Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => confirmAndRun(deleteTestData)}>
        <Text style={styles.btnText}>2. Delete Test Data</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => confirmAndRun(deleteCategories)}>
        <Text style={styles.btnText}>3. Delete Categories & Subcategories</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => confirmAndRun(deletePersons)}>
        <Text style={styles.btnText}>4. Delete Persons & Accounts</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => confirmAndRun(deleteTransactions)}>
        <Text style={styles.btnText}>5. Delete Transactions</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => confirmAndRun(deleteRecurring)}>
        <Text style={styles.btnText}>6. Delete Recurring Payments</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: 'darkred' }]} onPress={() => confirmAndRun(deleteAll)}>
        <Text style={styles.btnText}>7. Delete EVERYTHING</Text>
      </TouchableOpacity>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#005BBB',
    padding: 12,
    marginVertical: 6,
    borderRadius: 6,
  },
  buttonText: { color: '#fff', fontSize: 16 },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
});

export default DataManagementScreen;