// ReportsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import ReportsView from './ReportsView';
import { getAllTransactions } from '../services/mockDataService';
import { Transaction } from '../models/Transaction';


interface ReportsViewProps {
  transactions: Transaction[];
}


const ReportsScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const txs = await getAllTransactions();
        setTransactions(txs);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      }
    };

    loadData();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {transactions.length > 0 ? (
        <ReportsView />
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 50 }}>No transactions found</Text>
      )}
    </View>
  );
};

export default ReportsScreen;