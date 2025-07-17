import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { RecurringPayment } from '../models/RecurringPayment';
import  * as transactionUtils  from '../utils/transactionUtils';
import uuid from 'react-native-uuid';
import { normalizeText } from '../utils/textUtils';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';
import { saveSecureItem, getSecureItem } from './secureStorageService'; 

const CATEGORY_KEY = 'categories';
const PERSON_KEY = 'persons';
const ACCOUNT_KEY = 'accounts';
const TRANSACTION_KEY = 'transactions';
const RECURRINGPAYEMENTS_KEY= 'recurringPayments';
const OPENING_BALANCES_KEY = 'monthly_opening_balances';
const CLOSING_BALANCES_KEY = 'monthly_closing_balances';

export const getCategories = async (): Promise<Category[]> => {
  const data = await AsyncStorage.getItem(CATEGORY_KEY);
  return data ? JSON.parse(data) : [];
};


export const getAllSubCategories = async (): Promise<SubCategory[]> => {
  try {
    const categories = await getAllCategories();

    const allSubCategories: SubCategory[] = categories.flatMap((cat) =>
      (cat.subcategories || []).map((sub: any) => ({
        ...sub,
        categoryId: cat.id,
      }))
    );

    return allSubCategories;
  } catch (error) {
    console.error('[getAllSubCategories] Failed:', error);
    return [];
  }
};

// At the bottom of mockDataService.ts
export const getSubCategoriesByCategoryId = async (input: { categoryId: string}): Promise<SubCategory[]> => {
  const subcategories = await getAllSubCategories();
  return subcategories.filter(sc => sc.categoryId === input.categoryId);
};

export const addPerson = async (input: { name: string }): Promise<Person> => {
  try {
    const stored = await AsyncStorage.getItem(PERSON_KEY);
    const persons: Person[] = stored ? JSON.parse(stored) : [];

    const newPerson: Person = {
      id: uuid.v4().toString(),
      name: input.name,
      accounts: [],
    };

    persons.push(newPerson);
    await AsyncStorage.setItem(PERSON_KEY, JSON.stringify(persons));

    return newPerson;
  } catch (error) {
    console.error('Error saving person:', error);
    throw error;
  }
};
export const addAccountToPerson = async (
  personId: string,
  accountInput: { accountTypeOrName: string }
): Promise<Account> => {
  const raw = await AsyncStorage.getItem(PERSON_KEY);
  const persons: Person[] = raw ? JSON.parse(raw) : [];

  const personIndex = persons.findIndex(p => p.id === personId);
  if (personIndex === -1) {
    throw new Error('Person not found');
  }

  const person = persons[personIndex];
  if (!person.accounts) {
    person.accounts = [];
  }

  const normalized = accountInput.accountTypeOrName.trim().toLowerCase();
  const existing = person.accounts.find(
    acc => acc.accountTypeOrName.trim().toLowerCase() === normalized
  );

  if (existing) return existing;

  const newAccount: Account = {
    id: uuid.v4().toString(),
    personId: personId,
    accountTypeOrName: accountInput.accountTypeOrName,
  };

  person.accounts.push(newAccount);
  persons[personIndex] = person;

  await AsyncStorage.setItem(PERSON_KEY, JSON.stringify(persons));

  return newAccount;
};


export const addCategory = async (
  categoryInput: { name: string; subcategories?: SubCategory[] }
): Promise<Category> => {
  const allCategories = await getAllCategories();
  const normalizedName = categoryInput.name.trim().toLowerCase();

  // ✅ Avoid duplicate names
  const existing = allCategories.find(cat => cat.name.trim().toLowerCase() === normalizedName);
  if (existing) {
    throw new Error('Category already exists');
  }

  const newCategory: Category = {
    id: uuid.v4().toString(),
    name: categoryInput.name.trim(),
    subcategories: categoryInput.subcategories || [],
  };

  const updated = [...allCategories, newCategory];
  await AsyncStorage.setItem(CATEGORY_KEY, JSON.stringify(updated));

  return newCategory;
};

export const addSubCategory = async (
  categoryId: string,
  subCategoryInput: { name: string }
): Promise<SubCategory> => {
  const categories: Category[] = await getCategories();
  const category = categories.find(cat => cat.id === categoryId);

  if (!category) {
    throw new Error('Category not found');
  }

  if (!category.subcategories) {
    category.subcategories = [];
  }

  const normalizedName = normalizeText(subCategoryInput.name);
  const existing = category.subcategories.find(
    sub => normalizeText(sub.name) === normalizedName
  );

  if (existing) return existing;

  const newSubCategory: SubCategory = {
    id: uuid.v4().toString(),
    name: subCategoryInput.name,
    categoryId: categoryId,
  };

  category.subcategories.push(newSubCategory);

  await AsyncStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));

  return newSubCategory;
};

export const getPersons = async (): Promise<Person[]> => {
  const data = await AsyncStorage.getItem(PERSON_KEY);
  return data ? JSON.parse(data) : [];
};

export const getAccounts = async (): Promise<Account[]> => {
  const data = await AsyncStorage.getItem(ACCOUNT_KEY);
  return data ? JSON.parse(data) : [];
};

// --- Transactions ---
export const saveTransaction = async (tx: Transaction): Promise<void> => {
  try {
    const existing = await getAllTransactions();
    const updated = [...existing, tx];
    await AsyncStorage.setItem(TRANSACTION_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Storage Error:', err);
    throw err;
  }
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const json = await AsyncStorage.getItem(TRANSACTION_KEY);
  return json ? JSON.parse(json) : [];
};

export const getTransactionsForMonth = async (year: number, month: number): Promise<Transaction[]> => {
  const all = await getAllTransactions();
  return all.filter(txn => {
    const txnDate = new Date(txn.date);
    return txnDate.getFullYear() === year && txnDate.getMonth() === month;
  });
};
export const getMonthlySummary = async (year: number, month: number) => {
  const txns = await getTransactionsForMonth(year, month);
  const income = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  return {
    income,
    expense,
    savings: income - expense,
  };
};

export const getCategoryWiseData = async (year: number, month: number) => {
  const txns = await getTransactionsForMonth(year, month);
  const result: { [key: string]: number } = {};
  txns.forEach(t => {
    if (t.type === 'expense') {
      result[t.categoryId] = (result[t.categoryId] || 0) + t.amount;
    }
  });
  return result;
};

export const getComparisonBetweenMonths = async (
  month1: string, // format 'YYYY-MM'
  month2: string
): Promise<[Transaction[], Transaction[]]> => {
  const all = await getAllTransactions();
  const [txns1, txns2] = [month1, month2].map(m =>
    all.filter(t => t.date.startsWith(m))
  );
  return [txns1, txns2];
};


export const updateTransaction = async (updated: Transaction) => {
  const existing = await getAllTransactions();
  const updatedList = existing.map((tx) =>
    tx.id === updated.id ? { ...tx, ...updated } : tx
  );
  await AsyncStorage.setItem(TRANSACTION_KEY, JSON.stringify(updatedList));
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const existing = await getAllTransactions();
  const newList = existing.filter((tx) => tx.id !== id);
  await AsyncStorage.setItem(TRANSACTION_KEY, JSON.stringify(newList));
};

export const exportAllData = async (): Promise<any> => {
  const [categories, persons, transactions, recurringPayments] = await Promise.all([
    getAllCategories(),
    getAllPersons(),
    getAllTransactions(),
    getAllRecurringPayments(),
  ]);

  return {
    categories,
    persons,
    transactions,
    recurringPayments,
  };
};

export const getAllCategories = async (): Promise<Category[]> => {
  const raw = await AsyncStorage.getItem(CATEGORY_KEY);
  return raw ? JSON.parse(raw) : [];
};



export const getAllPersons = async (): Promise<Person[]> => {
  const raw = await AsyncStorage.getItem(PERSON_KEY);
  return raw ? JSON.parse(raw) : [];
};


export const getAllRecurringPayments = async (): Promise<RecurringPayment[]> => {
  const raw = await AsyncStorage.getItem(RECURRINGPAYEMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
};

// Utility: remove duplicates based on ID
const mergeUniqueById = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
  const map = new Map<string, T>();
  [...existing, ...incoming].forEach(item => map.set(item.id, item));
  return Array.from(map.values());
};

export const importCategories = async (data: Category[]): Promise<void> => {
  try {
    const existingStr = await AsyncStorage.getItem(CATEGORY_KEY);
    const existing: Category[] = existingStr ? JSON.parse(existingStr) : [];
    const merged = mergeUniqueById(existing, data);
    await AsyncStorage.setItem(CATEGORY_KEY, JSON.stringify(merged));
    console.log(`✅ Imported ${data.length} categories.`);
  } catch (err) {
    console.error('❌ Error importing categories:', err);
    throw err;
  }
};

export const importPersons = async (data: Person[]): Promise<void> => {
  try {
    const existingStr = await AsyncStorage.getItem(PERSON_KEY);
    const existing: Person[] = existingStr ? JSON.parse(existingStr) : [];
    const merged = mergeUniqueById(existing, data);
    await AsyncStorage.setItem(PERSON_KEY, JSON.stringify(merged));
    console.log(`✅ Imported ${data.length} persons.`);
  } catch (err) {
    console.error('❌ Error importing persons:', err);
    throw err;
  }
};

export const importTransactions = async (data: Transaction[]): Promise<void> => {
  try {
    const existingStr = await AsyncStorage.getItem(TRANSACTION_KEY);
    const existing: Transaction[] = existingStr ? JSON.parse(existingStr) : [];
    const merged = mergeUniqueById(existing, data);
    await AsyncStorage.setItem(TRANSACTION_KEY, JSON.stringify(merged));
    console.log(`✅ Imported ${data.length} transactions.`);
  } catch (err) {
    console.error('❌ Error importing transactions:', err);
    throw err;
  }
};

export const importRecurringPayments = async (data: RecurringPayment[]): Promise<void> => {
  try {
    const existingStr = await AsyncStorage.getItem(RECURRINGPAYEMENTS_KEY);
    const existing: RecurringPayment[] = existingStr ? JSON.parse(existingStr) : [];
    const merged = mergeUniqueById(existing, data);
    await AsyncStorage.setItem(RECURRINGPAYEMENTS_KEY, JSON.stringify(merged));
    console.log(`✅ Imported ${data.length} recurring payments.`);
  } catch (err) {
    console.error('❌ Error importing recurring payments:', err);
    throw err;
  }
};

export const importAccounts = async (data: Account[]): Promise<void> => {
  try {
    const existingStr = await AsyncStorage.getItem(ACCOUNT_KEY);
    const existing: Account[] = existingStr ? JSON.parse(existingStr) : [];
    const merged = mergeUniqueById(existing, data);
    await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(merged));
    console.log(`✅ Imported ${data.length} accounts.`);
  } catch (err) {
    console.error('❌ Error importing accounts:', err);
    throw err;
  }
};

export const importMonthlyOpeningBalances = async (data: MonthlyOpeningBalance[]): Promise<void> => {
  try {
    const existingStr = await AsyncStorage.getItem(OPENING_BALANCES_KEY);
    const existing: MonthlyOpeningBalance[] = existingStr ? JSON.parse(existingStr) : [];
    const merged = mergeUniqueById(existing, data);
    await AsyncStorage.setItem(OPENING_BALANCES_KEY, JSON.stringify(merged));
    console.log(`✅ Imported ${data.length} monthly opening balances.`);
  } catch (err) {
    console.error('❌ Error importing monthly opening balances:', err);
    throw err;
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      CATEGORY_KEY,
      PERSON_KEY,
      ACCOUNT_KEY,
      TRANSACTION_KEY,
      RECURRINGPAYEMENTS_KEY,
      OPENING_BALANCES_KEY,
    ]);
    console.log('✅ Cleared all data.');
  } catch (err) {
    console.error('❌ Error clearing data:', err);
    throw err;
  }
};

export const getAllMonthlyOpeningBalances = async (): Promise<MonthlyOpeningBalance[]> => {
  const json = await AsyncStorage.getItem(OPENING_BALANCES_KEY);
  return json ? JSON.parse(json) : [];
};

/**
 * Ensures fallback values are available for a transaction.
 * Returns fallback category, subcategory, person, and account if required.
 */
export const getFallbackTransactionValues = async ({
  category,
  subCategory,
  person,
  account,
}: {
  category?: Category | null;
  subCategory?: SubCategory | null;
  person?: Person | null;
  account?: Account | null;
}) => {
  let fallbackCategory: Category | undefined = undefined;
  let fallbackSubCategory: SubCategory | undefined = undefined;
  let fallbackPerson: Person | undefined = undefined;
  let fallbackAccount: Account | undefined = undefined;

  // --- 1. Category Fallback ---
  if (!category) {
    const allCategories = await getAllCategories();
    fallbackCategory = allCategories.find(c => c.name.trim().toLowerCase() === 'misc');

    if (!fallbackCategory) {
      fallbackCategory = await addCategory({
        name: 'MISC',
      });
    }

    // --- 2. SubCategory Fallback ---
    const existingSub = fallbackCategory.subcategories?.find(
      s => s.name.trim().toLowerCase() === 'sub_misc'
    );

    if (existingSub) {
      fallbackSubCategory = existingSub;
    } else {
      fallbackSubCategory = await addSubCategory(fallbackCategory.id, { name: 'SUB_MISC' });
    }
  }

  // --- 3. Person Fallback ---
  if (!person) {
    const allPersons = await getAllPersons();
    fallbackPerson = allPersons.find(p => p.name.trim().toLowerCase() === 'p_misc');

    if (!fallbackPerson) {
      fallbackPerson = await addPerson({ name: 'P_MISC' });
    }

    // --- 4. Account Fallback ---
    const existingAccount = fallbackPerson.accounts?.find(
      acc => acc.accountTypeOrName.trim().toLowerCase() === 'p_misc_acc'
    );

    if (existingAccount) {
      fallbackAccount = existingAccount;
    } else {
      fallbackAccount = await addAccountToPerson(fallbackPerson.id, {
        accountTypeOrName: 'P_MISC_ACC',
      });
    }
  }

  return {
    fallbackCategory,
    fallbackSubCategory,
    fallbackPerson,
    fallbackAccount,
  };

};

// 1. Save Categories
  export const saveCategories = async (categories: Category[]) => {
    try {
      await AsyncStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('[saveCategories] Error:', error);
    }
  };

  // 2. Save Persons
  export const savePersons = async (persons: Person[]) => {
    try {
      await AsyncStorage.setItem(PERSON_KEY, JSON.stringify(persons));
    } catch (error) {
      console.error('[savePersons] Error:', error);
    }
  };

  // 3. Save Transactions
  export const saveTransactions = async (transactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem(TRANSACTION_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('[saveTransactions] Error:', error);
    }
  };

  // 4. Save Recurring Payments
  export const saveRecurringPayments = async (recurringPayments: RecurringPayment[]) => {
    try {
      await AsyncStorage.setItem(RECURRINGPAYEMENTS_KEY, JSON.stringify(recurringPayments));
    } catch (error) {
      console.error('[saveRecurringPayments] Error:', error);
    }
  };


export const getOpeningBalances = async (): Promise<MonthlyOpeningBalance[]> => {
  try {
    const data = await AsyncStorage.getItem(OPENING_BALANCES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error reading opening balances', err);
    return [];
  }
};

export const saveOpeningBalances = async (balances: MonthlyOpeningBalance[]): Promise<void> => {
  await AsyncStorage.setItem(OPENING_BALANCES_KEY, JSON.stringify(balances));
};

export const getClosingBalances = async (): Promise<MonthlyClosingBalance[]> => {
  const data = await AsyncStorage.getItem(CLOSING_BALANCES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveClosingBalances = async (balances: MonthlyClosingBalance[]): Promise<void> => {
  await AsyncStorage.setItem(CLOSING_BALANCES_KEY, JSON.stringify(balances));
};