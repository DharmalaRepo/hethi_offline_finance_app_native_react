import React, { useEffect, useState } from 'react';
import AddTransactionForm from './AddTransactionForm';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { getCategories, getPersons, getAccounts } from '../services/mockDataService';

const AddTransactionScreen = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    // Load from local storage or service
    loadData();
  }, []);

  const loadData = async () => {
    const loadedCategories = await getCategories(); // mockDataService or real
    const loadedPersons = await getPersons();
    const loadedAccounts = await getAccounts();

    setCategories(loadedCategories || []);
    setPersons(loadedPersons || []);
    setAccounts(loadedAccounts || []);
  };

  const handleSave = (transaction: Transaction) => {
    console.log('Transaction Saved:', transaction);
    // Save to local storage or backend
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