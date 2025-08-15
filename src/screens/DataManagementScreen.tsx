import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ToastAndroid, Image } from 'react-native';
import uuid from 'react-native-uuid';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { RecurringPayment } from '../models/RecurringPayment';
import {
  saveClosingBalances, saveOpeningBalances,
  addCategory, addSubCategory, addPerson, saveTransaction,
  getFallbackTransactionValues, addCategories, addPersons, addTransactions, addRecurringPayments,
  saveCategories, savePersons, saveTransactions, saveRecurringPayments, clearAllData
} from '../services/mockDataService';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';
import { useAppData } from '../context/AppDataProvider';

export async function loadPredefinedCategories(): Promise<Category[]> {
  const data: { name: string; subNames: string[] }[] = [
    { name: 'Utilities', subNames: ['Power', 'Internet', 'Mobile Rec', 'Gas', 'Dish', 'Maintenance', 'Milk', 'Maid', 'Car Clean', 'Prop Tax'] },
    { name: 'Shopping', subNames: ['CLOTHS'] },
    { name: 'Repairs', subNames: [] },
    { name: 'Services', subNames: ['UC'] },
    { name: 'P Money', subNames: [] },
    { name: 'P Care', subNames: ['Saloon', 'Parlour', 'Laundry'] },
    { name: 'Entertainment', subNames: ['NETFLIX', 'PRIME', 'HOT-STAR', 'MOVIES'] },
    { name: 'Medical', subNames: ['Consulting', 'Medicine', 'Test'] },
    { name: 'Loan', subNames: ['Home', 'Top Up', 'Personal'] },
    { name: 'Invest.', subNames: [] },
    { name: 'Insurance', subNames: [] },
    { name: 'Income', subNames: [] },
    { name: 'Groceries', subNames: ['ONLINE', 'OFFLINE'] },
    { name: 'GIFTS', subNames: [] },
    { name: 'Donations', subNames: [] },
    { name: 'Dining', subNames: ['Restaurant', 'Online', 'Party'] },
    { name: 'Commute', subNames: ['Diesel', 'CAB', 'PETORL'] },
    { name: 'CC BILLS', subNames: [] },
    { name: 'Baby Care', subNames: ['Diapers', 'Food', 'Toys', 'Cloths'] },
  ];

  const categories: Category[] = data.map(catData => {
    const catId = uuid.v4().toString();
    const subcategories: SubCategory[] = catData.subNames.map(subName => ({
      id: uuid.v4().toString(),
      name: subName,
      categoryId: catId,
    }));

    return {
      id: catId,
      name: catData.name,
      subcategories,
    };
  });

  return categories;
}

export async function importPredefinedCategories(
  selection: Record<string, { catChecked: boolean; subs: Record<string, boolean> }>
): Promise<void> {
  const predefs = await loadPredefinedCategories();

  for (const cat of predefs) {
    const sel = selection[cat.name];
    if (!sel) continue;

    // Skip if nothing chosen: neither whole category nor any specific sub
    const anySubChosen = Object.values(sel.subs || {}).some(Boolean);
    if (!sel.catChecked && !anySubChosen) continue;

    // Create the category in storage
    const newCategoryId = uuid.v4().toString();
    await addCategory({  name: cat.name, subcategories: [] });

    // Create subcategories
    const subsToImport =
      sel.catChecked
        ? (cat.subcategories || []).map(s => s.name) // all subs
        : Object.entries(sel.subs || {})
            .filter(([, checked]) => checked)
            .map(([subName]) => subName);            // only checked subs

    for (const subName of subsToImport) {
      await addSubCategory(newCategoryId, { name: subName });
    }
  }
}

  const CONFIRM_PHRASE = 'delete data';

  const DataManagementScreen = () => {

     const {
    persons,
    categories,
    subcategories,
    transactions,
    recurringPayments,
    monthlyOpeningBalance,
    monthlyClosingBalance,
    reloadAppData,
    dataVersion,
    updateCategories,
    bumpVersion,
  } = useAppData();

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
      await addCategories(testCategories);
      updateCategories();
      bumpVersion();
      console.log('✅ Test categories loaded');

      const persons: Person[] = [
        { id: uuid.v4().toString(), name: 'SHIVA', accounts: [], isTestData: true },
        { id: uuid.v4().toString(), name: 'JOHN', accounts: [], isTestData: true },
        { id: uuid.v4().toString(), name: 'PRANAVI', accounts: [], isTestData: true },
      ];

      (persons[0].accounts ??= []).push({ id: uuid.v4().toString(), paymentMode: 'HDFC', personId: persons[0].id, isTestData: true });
      (persons[0].accounts ??= []).push({ id: uuid.v4().toString(), paymentMode: 'CASH', personId: persons[0].id, isTestData: true });
      (persons[1].accounts ??= []).push({ id: uuid.v4().toString(), paymentMode: 'ICICI', personId: persons[1].id, isTestData: true });
      (persons[1].accounts ??= []).push({ id: uuid.v4().toString(), paymentMode: 'UPI', personId: persons[1].id, isTestData: true });
      (persons[2].accounts ??= []).push({ id: uuid.v4().toString(), paymentMode: 'CASH', personId: persons[2].id, isTestData: true });



      await addPersons(persons);

      const transactions: Transaction[] = generateSampleTransactions(testCategories, persons);
      await addTransactions(transactions);

      const recurringPayments: RecurringPayment[] = [
        {
          id: uuid.v4().toString(),
          title: 'Gold Investment - SHIVA',
          type: 'expense',
          amount: 5000,
          categoryId: testCategories[0].id,       // Replace with actual ID
          subCategoryId: 'GOLD_SUB_ID',       // Replace with actual ID
          personId: persons[0].id,               // Replace with actual ID
          accountId: persons[0].accounts[0].id,               // Replace with actual ID
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
          title: 'RD Investment - JOHN',
          type: 'expense',
          amount: 8000,
          categoryId: testCategories[1].id,
          subCategoryId: 'RD_SUB_ID',
          personId: persons[1].id,
          accountId: persons[1].accounts[0].id,
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
          title: 'Monthly Clothes - PRANAVI',
          type: 'expense',
          amount: 2000,
          categoryId: testCategories[1].id,
          subCategoryId: 'CLOTHS_SUB_ID',
          personId: persons[2].id,
          accountId: persons[2].accounts[0].id,
          note: 'Monthly clothing shopping',
          frequency: 'monthly',
          startDate: '2024-01-01',
          dueDate: '2024-01-01',
          endDate: '2025-12-31',
          isTestData: true,
          createdAt: new Date().toISOString(),
        },
      ];
      await addRecurringPayments(recurringPayments);

      generateSampleMonthlyBalances();

      ToastAndroid.show('Test data loaded successfully.', ToastAndroid.SHORT);
    };

    const generateSampleMonthlyBalances = async () => {
      const now = new Date();

      const openingBalances: MonthlyOpeningBalance[] = [];
      const closingBalances: MonthlyClosingBalance[] = [];

      const start = new Date(2024, 1); // Feb 2024
      const end = new Date(now.getFullYear(), now.getMonth());

      for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
        const year = d.getFullYear() + '';
        const mon = d.getMonth() + 1; // 1-based
        const month = mon + ''; // 1-based

        persons.forEach(person => {
          const accounts = person.accounts || [];
          accounts.forEach((account: Account) => {
            const opening: MonthlyOpeningBalance = {
              id: uuid.v4().toString(),
              personId: person.id,
              accountId: account.id,
              year,
              month,
              amount: 5000 + Math.floor(Math.random() * 1000),
              createdAt: new Date().toISOString(),
            };
            const closing: MonthlyClosingBalance = {
              id: uuid.v4().toString(),
              personId: person.id,
              accountId: account.id,
              year,
              month,
              amount: 8000 + Math.floor(Math.random() * 1000),
              createdAt: new Date().toISOString(),
            };
            openingBalances.push(opening);
            closingBalances.push(closing);
          });
        });
      }

      saveOpeningBalances(openingBalances);
      saveClosingBalances(closingBalances);
    };


    const generateSampleTransactions = (
      categories: Category[],
      persons: Person[]
    ): Transaction[] => {
      const now = new Date();
      const start = new Date(2024, 1); // Feb 2024 (0-based month index)

      const transactions: Transaction[] = [];

      let income = 0;
      let expense = 0;

      const monthsDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;

      for (let m = 0; m < monthsDiff; m++) {
        const date = new Date(start.getFullYear(), start.getMonth() + m, 1);

        // Add 2 income entries
        for (let j = 0; j < 2; j++) {
          const person = persons[(m + j) % persons.length];
          const account = person.accounts?.[0] ?? {
            id: 'P_MISC_ACC',
            personId: person.id,
            paymentMode: 'FallbackAccount',
          };
          const category = categories.find(c => c.name.toLowerCase().includes('income')) ?? categories[0];
          const subcategory = category.subcategories?.[0] ?? {
            id: 'MISC_SUB',
            name: 'Misc Income',
            categoryId: category.id,
          };

          const txn: Transaction = {
            id: uuid.v4().toString(),
            type: 'income',
            amount: 7000 + m * 150,
            date: new Date(date.getFullYear(), date.getMonth(), j + 1).toISOString().split('T')[0],
            categoryId: category.id,
            subCategoryId: subcategory.id,
            personId: person.id,
            accountId: account.id,
            isTestData: true,
            createdAt: new Date().toISOString(),
          };
          transactions.push(txn);
          income += txn.amount;
        }

        // Add 12 expense entries
        for (let k = 0; k < 12; k++) {
          const person = persons[(m + k) % persons.length];
          const account = person.accounts?.[0] ?? {
            id: 'P_MISC_ACC',
            personId: person.id,
            paymentMode: 'FallbackAccount',
          };
          const category = categories.find(c => c.name.toLowerCase().includes('expense')) ?? categories[k % categories.length];
          const subcategory = category.subcategories?.[k % (category.subcategories?.length || 1)] ?? {
            id: 'MISC_SUB',
            name: 'Misc Expense',
            categoryId: category.id,
          };

          const txn: Transaction = {
            id: uuid.v4().toString(),
            type: 'expense',
            amount: 2000 + (k * 50),
            date: new Date(date.getFullYear(), date.getMonth(), (k % 28) + 1).toISOString().split('T')[0],
            categoryId: category.id,
            subCategoryId: subcategory.id,
            personId: person.id,
            accountId: account.id,
            isReversible: k === 0, // Make first one reversible
            isSettled: false,
            dueDate: k === 0 ? new Date(date.getFullYear(), date.getMonth(), 28).toISOString().split('T')[0] : undefined,
            isTestData: true,
            createdAt: new Date().toISOString(),
          };
          transactions.push(txn);
          expense += txn.amount;
        }
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
      const cats = categories.filter(cat => !cat.isTestData);
      const pers = persons.filter(p => !p.isTestData);
      const txns = transactions.filter(t => !t.isTestData);
      const recurs = recurringPayments.filter(r => !r.isTestData);

      await saveCategories(cats);
      await savePersons(pers);
      await saveTransactions(txns);
      await saveRecurringPayments(recurs);
      showToast('Test data deleted');
      bumpVersion();
    };

    const deleteCategories = async () => {
      let misc = categories.find(c => c.name.toLowerCase() === 'misc');
      let miscSub = misc?.subcategories?.find((s: SubCategory) => s.name.toLowerCase() === 'misc_sub');

      if (!misc || !miscSub) {
        showToast('MISC and MISC_SUB not found. Creating...');
        const newCategory = await addCategory({ name: 'MISC', subcategories: [] });
        const newSub = await addSubCategory(newCategory.id, { name: 'MISC_SUB' });

        reloadAppData();
        misc = categories.find(c => c.name.toLowerCase() === 'misc')!;
        miscSub = misc?.subcategories?.find((s: SubCategory) => s.name.toLowerCase() === 'misc_sub')!;
      }

      if (!misc || !miscSub) {
        showToast('Failed to create or retrieve MISC/MISC_SUB. Aborting.');
        return;
      }

      const filtered = categories.filter(c => c.name.toLowerCase() === 'misc');
      await saveCategories(filtered);
      reloadAppData();
      const updated = transactions.map(t => ({
        ...t,
        categoryId: misc.id,
        subCategoryId: miscSub.id,
      }));
      await saveTransactions(updated);

      showToast('Categories deleted and transactions mapped to MISC');
    };

    const deletePersons = async () => {
      const misc = persons.find(p => p.name.toLowerCase() === 'p_misc');
      const miscAcc = misc?.accounts?.find((a: Account) => a.paymentMode.toLowerCase() === 'p_misc_acc');
      if (!misc || !miscAcc) {
        showToast('P_MISC and P_MISC_ACC not found. Cannot proceed.');
        return;
      }

      await savePersons(persons.filter(p => p.name.toLowerCase() === 'p_misc'));
      reloadAppData();


      const updated = transactions.map(t => ({
        ...t,
        personId: misc.id,
        accountId: miscAcc.id,
      }));
      await saveTransactions(updated);
      reloadAppData();
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
      clearAllData();
      showToast('All data wiped');
    };

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
            <Text style={styles.title}> Data Management</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={loadTestData}>
          <Text style={styles.buttonText}>1. Load Test Data</Text>
        </TouchableOpacity>


        <Text style={styles.label}>Type "{CONFIRM_PHRASE}" to confirm destructive actions:</Text>
        <TextInput
          value={confirmationText}
          onChangeText={setConfirmationText}
          placeholder="Type delete data"
          style={styles.input}
        />

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
      backgroundColor: '#0a66e4',
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

    heading: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
      color: '#2c3e50',
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
  });

  export default DataManagementScreen;