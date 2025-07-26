// src/screens/ReversibleTransactionsScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getAllTransactions, updateTransaction, saveTransaction } from '../services/mockDataService';
import { Transaction } from '../models/Transaction';
import { resolveCategoryName, resolvePersonName, resolveSubCategoryName } from '../utils/configUtils';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';

const ReversibleTransactionsScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {    
    loadData();
  }, []);

  const loadData = async () => {
      const all = await getAllTransactions();
      const filtered = all.filter(t => t.isReversible && !t.isSettled);
      setTransactions(filtered);
    };

  const refresh = async () => {
    await loadData();
  };

  const markAsSettled = async (txn: Transaction) => {
    Alert.alert('Mark as Settled', 'Are you sure you want to mark this as settled?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Settle',
        style: 'destructive',
        onPress: async () => {
          await updateTransaction({ ...txn, isSettled: true });
          setTransactions(prev => prev.filter(t => t.id !== txn.id));
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity onPress={() => handleSettle(item)} style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[styles.amount, item.type === 'income' ? styles.income : styles.expense]}>
          ₹{item.amount}
        </Text>
        <Ionicons name="checkmark-done-outline" size={20} color="#1a3c70" />
      </View>
      <Text style={styles.label}>Category: {resolveCategoryName(item.categoryId)}</Text>
      {item.subCategoryId && <Text style={styles.label}>Sub: {resolveSubCategoryName(item.categoryId, item.subCategoryId)}</Text>}
      <Text style={styles.label}>Person: {resolvePersonName(item.personId)}</Text>
      {item.fromOrToPersonName && <Text style={styles.label}>From/To: {(item.fromOrToPersonName)}</Text>}
      <Text style={styles.label}>Due Date: {item.dueDate || 'N/A'}</Text>
      <Text style={styles.label}>Date: {item.date}</Text>
    </TouchableOpacity>
  );

  const handleSettle = (txn: Transaction) => {
  Alert.alert(
    'Mark as Settled',
    'Do you want to auto-create a reverse transaction entry as well?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Just Mark Settled',
        onPress: async () => {
          await updateTransaction({ ...txn, isSettled: true });
          refresh();
        },
      },
      {
        text: 'Mark & Add Reverse Entry',
        onPress: async () => {
          const today = new Date().toISOString().slice(0, 10);
          const reverseTxn: Transaction = {
            id: uuid.v4().toString(),
            type: txn.type === 'income' ? 'expense' : 'income',
            amount: txn.amount,
            date: today,
            categoryId: txn.categoryId,
            subCategoryId: txn.subCategoryId,
            personId: txn.personId,
            accountId: txn.accountId,
            fromOrToPersonName: txn.fromOrToPersonName,
            isReversible: false,
            isSettled: true,
            isAutoReverseEntry: true,
            originalTransactionId: txn.id,
            createdAt: today,
          };

          await saveTransaction(reverseTxn);
          //console.log('Reverse transaction saved:', reverseTxn);
          await updateTransaction({ ...txn, isSettled: true });
          refresh();
        },
      },
    ]
  );
};

  return (
    <View style={styles.container}>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>Actionable Transactions</Text>
            <TouchableOpacity
                    onPress={refresh}
                    style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#007bff',
                      borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#e6f0ff', }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginRight: 6, }}>
                      ⟳
                    </Text>
                    <Text style={{ fontSize: 14, color: '#007bff' }}>Reload</Text>
            </TouchableOpacity>
          </View>

      {transactions.length === 0 ? (
        <Text style={styles.noData}>All dues are settled! 🎉</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
};

export default ReversibleTransactionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6ff',
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a3c70',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: '#1a3c70',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3,
  },
  label: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  income: {
    color: 'green',
  },
  expense: {
    color: 'red',
  },
  noData: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
    color: 'grey',
  },
});