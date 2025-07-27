// src/screens/ReversibleTransactionsScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { getAllTransactions, updateTransaction, saveTransaction } from '../services/mockDataService';
import { Transaction } from '../models/Transaction';
import { resolveCategoryName, resolvePersonName, resolveSubCategoryName } from '../utils/configUtils';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import { useAppContext  } from '../context/AppContext';



const ReversibleTransactionsScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { showSensitiveData, toggleSensitiveData } = useAppContext(); // ✅ Use global toggle

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

    const TableHeader = () => (
  <View style={[styles.tableRow, styles.tableHeader]}>
    <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Person</Text>
    <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Category</Text>
    <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Subcategory</Text>
    <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Amount</Text>
    <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>Due</Text>
    <Text style={styles.tableCell}></Text>
  </View>
);

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


const renderItem = ({ item }: { item: Transaction }) => {
  const isIncome = item.type === 'income';
  const amountColor = isIncome ? '#2ecc71' : '#e74c3c';

  return (
    <TouchableOpacity
      onPress={() => handleSettle(item)}
      style={styles.tableRow}
    >
      <Text style={[styles.tableCell, { flex: 1 }]}>
        {resolvePersonName(item.personId)}
      </Text>
      <Text style={[styles.tableCell, { flex: 1 }]}>
        {resolveCategoryName(item.categoryId)}
      </Text>
      <Text style={[styles.tableCell, { flex: 1 }]}>
        {item.subCategoryId ? resolveSubCategoryName(item.categoryId, item.subCategoryId) : '—'}
      </Text>
      <Text style={[styles.tableCell, { flex: 1, color: amountColor }]}>
        {showSensitiveData ? `₹${item.amount}` : '₹****'}
      </Text>
      <Text style={[styles.tableCell, { flex: 1 }]}>
        {item.dueDate || 'N/A'}
      </Text>
      <Ionicons name="chevron-forward-outline" size={18} color="#555" />
    </TouchableOpacity>
  );
};

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
                <View style={styles.header}>
                         <View style={styles.headerLeft}>
                            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
                            <Text style={styles.title}> Actionable Transactions</Text>
                          </View>   
                          <View style={styles.headerRight}>
                            <TouchableOpacity onPress={refresh} style={styles.iconButton}>
                              <Ionicons name="refresh" size={22} color="#e6f0ff" />
                            </TouchableOpacity>
                          </View>      
                      </View> 

      {transactions.length === 0 ? (
        <Text style={styles.noData}>All dues are settled! 🎉</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<TableHeader />}
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
iconButton: {
  marginLeft: 12,
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
  },cardBox: {
  borderRadius: 10,
  padding: 12,
  marginVertical: 8,
  marginHorizontal: 12,
  backgroundColor: '#f5f6fa',
  elevation: 2,
  shadowColor: '#999',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
},

rowBetween: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},

amountText: {
  fontSize: 18,
  fontWeight: 'bold',
},

infoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 6,
},

infoBox: {
  flex: 1,
  marginRight: 10,
},
value: {
  fontSize: 14,
  fontWeight: '500',
  color: '#333',
},
tableRow: {
  flexDirection: 'row',
  paddingVertical: 10,
  paddingHorizontal: 12,
  borderBottomWidth: 1,
  borderColor: '#e0e0e0',
  alignItems: 'center',
  backgroundColor: '#fff',
},

tableHeader: {
  backgroundColor: '#e6f0ff',
  borderTopLeftRadius: 6,
  borderTopRightRadius: 6,
},
tableCell: {
  fontSize: 12,
  color: '#333',
  paddingHorizontal: 4,
}
});