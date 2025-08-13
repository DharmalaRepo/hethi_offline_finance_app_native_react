import React, { useEffect, useState } from 'react';
import AddTransactionForm from './AddTransactionForm';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { useAppData } from '../context/AppDataProvider';

const AddTransactionScreen = () => {

  const {
      persons,
      categories,
      subcategories,
      accounts,
      transactions,
      recurringPayments,
          monthlyOpeningBalance,
          monthlyClosingBalance,
      reloadAppData,
    } = useAppData();

  useEffect(() => {
    // Load from local storage or service
    loadData();
  }, []);

  const loadData = async () => {
    reloadAppData();
  };

  const handleSave = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
  const newTransaction: Transaction = {
    ...tx,
    id: '1234', // or use uuid()
    createdAt: new Date().toISOString(),
  };

  // Save or update logic...
};

  return (
    <AddTransactionForm
      categories={categories}
      persons={persons}
      accounts={accounts}
      onSave={handleSave}
    />
  );
};

export default AddTransactionScreen;