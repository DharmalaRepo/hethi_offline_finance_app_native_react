// src/context/AppDataProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Person } from '../models/Person';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { RecurringPayment } from '../models/RecurringPayment';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';
import {
  getAllPersons_, getAllCategories_, getAllSubCategories_, getAllAccounts_, getAllTransactions_,
  getAllRecurringPayments_, getAllOpeningBalances_, getAllClosingBalances_, getAppSettings_
} from '../services/mockDataService';
import { useFocusEffect } from '@react-navigation/native';

interface AppDataContextType {
  persons: Person[];
  categories: Category[];
  subcategories: SubCategory[];
  accounts: Account[];
  transactions: Transaction[];
  recurringPayments: RecurringPayment[];
  monthlyOpeningBalance: MonthlyOpeningBalance[];
  monthlyClosingBalance: MonthlyClosingBalance[];
  
  reloadAppData: () => Promise<void>;

  // Updated: parameter is optional now
  updateTransactions: (txns?: Transaction[]) => void;
  updatePersons: (pers?: Person[]) => void;
  updateCategories: (cats?: Category[]) => void;
  updateSubcategories: (subs?: SubCategory[]) => void;
  updateAccounts: (accs?: Account[]) => void;
  updateRecurringPayments: (rec?: RecurringPayment[]) => void;
  updateMonthlyOpeningBalance: (mb?: MonthlyOpeningBalance[]) => void;
  updateMonthlyClosingBalance: (mb?: MonthlyClosingBalance[]) => void;
  bumpVersion: () => void;
  // Also keep this to manually trigger refresh if needed
  notifyDataChanged?: () => void;

  dataVersion: number;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);


export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [monthlyOpeningBalance, setMonthlyOpeningBalance] = useState<MonthlyOpeningBalance[]>([]);
  const [monthlyClosingBalance, setMonthlyClosingBalance] = useState<MonthlyClosingBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  const bumpVersion = () => {
    console.log("🔄 Data version before, ", dataVersion);
  setDataVersion(prev => {
    console.log("🔄 bumpVersion: before =", prev);
    const next = prev + 1;
    console.log("🔄 bumpVersion: after  =", next);
    return next;
  });
  console.log("🔄 Data version bumped to", dataVersion);
};

  // ---- Load everything once, and again whenever dataVersion changes

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        await loadAppData();        // <- your existing bulk loader
        if (cancelled) return;
      } catch (e) {
        console.error('loadAppData failed', e);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [dataVersion]);


  // ---- Update helpers (arg is optional)
  function updateTransactions(next?: Transaction[]) {
    if (next) setTransactions(next);
    bumpVersion();
  }

  function updatePersons(next?: Person[]) {
    if (next) setPersons(next);
    bumpVersion();
  }

  function updateCategories(next?: Category[]) {
    if (next) setCategories(next);
    bumpVersion();
  }

  function updateSubcategories(next?: SubCategory[]) {
    if (next) setSubcategories(next);
    bumpVersion();
  }

  function updateAccounts(next?: Account[]) {
    if (next) setAccounts(next);
    bumpVersion();
  }

  function updateRecurringPayments(next?: RecurringPayment[]) {
    if (next) setRecurringPayments(next);
    bumpVersion();
  }

  function updateMonthlyOpeningBalance(next?: MonthlyOpeningBalance[]) {
    if (next) setMonthlyOpeningBalance(next);
    bumpVersion();
  }

  function updateMonthlyClosingBalance(next?: MonthlyClosingBalance[]) {
    if (next) setMonthlyClosingBalance(next);
    bumpVersion();
  }

  // also expose a generic trigger if you like:
  function notifyDataChanged() {
    bumpVersion();
  }

  const loadAppData = async () => {
    try {
      const [p, c, sc, a, t, r, ob, cb] = await Promise.all([
        getAllPersons_(),
        getAllCategories_(),
        getAllSubCategories_(),
        getAllAccounts_(),
        getAllTransactions_(),
        getAllRecurringPayments_(),
        getAllOpeningBalances_(),
        getAllClosingBalances_(),
      ]);

      setPersons(p || []);
      setCategories(c || []);
      setSubcategories(sc || []);
      setAccounts(a || []);
      setTransactions(t || []);
      setRecurringPayments(r || []);
      setMonthlyOpeningBalance(ob || []);
      setMonthlyClosingBalance(cb || []);
    } catch (error) {
      console.error('Error loading app data:', error); // ← ADD THIS
    } finally {
      setIsLoading(false);
    }
    console.log('App data loaded successfully');
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadAppData();
      } catch (error) {
        console.error('Failed to load app data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);


  return (
    <AppDataContext.Provider
      value={{
        persons,
        categories,
        subcategories,
        accounts,
        transactions,
        recurringPayments,
        monthlyOpeningBalance,
        monthlyClosingBalance,
        reloadAppData: loadAppData,
        updateTransactions,
        updatePersons,
        updateCategories,
        updateSubcategories,
        updateAccounts,
        updateRecurringPayments,
        updateMonthlyOpeningBalance,
        updateMonthlyClosingBalance,
        bumpVersion,
        dataVersion,
      }}
    >
      {isLoading ? <Text style={{ padding: 20 }}>Loading App Data... Now</Text> : children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};