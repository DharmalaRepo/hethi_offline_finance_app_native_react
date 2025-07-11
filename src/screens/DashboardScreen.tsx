// DashboardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import DashboardView from './DashboardView';
import {
  getAccounts,
  getAllCategories,
  getAllMonthlyOpeningBalances,
  getAllPersons,
  getAllRecurringPayments,
  getAllTransactions,
} from '../services/mockDataService';

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [accounts, categories, persons, monthlyOpeningBalances, recurringPayments, transactions] =
          await Promise.all([
            getAccounts(),
            getAllCategories(),
            getAllPersons(),
            getAllMonthlyOpeningBalances(),
            getAllRecurringPayments(),
            getAllTransactions(),
          ]);

        setData({
          accounts,
          categories,
          persons,
          monthlyOpeningBalances,
          recurringPayments,
          transactions,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Loading...</Text>
      ) : (
        <DashboardView {...data} />
      )}
    </View>
  );
};

export default DashboardScreen;
