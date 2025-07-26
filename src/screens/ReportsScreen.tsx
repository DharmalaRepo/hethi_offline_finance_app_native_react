import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getAllTransactions } from '../services/mockDataService';
import { Transaction } from '../models/Transaction';
import ReportsView from './ReportsView';

const ReportsScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const data = await getAllTransactions();
      setTransactions(data);
      setLoading(false);
    };
    fetchTransactions();
  }, [ ]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
        <ReportsView />
    </View>
  );
};

export default ReportsScreen;