import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { RecurringPayment } from '../models/RecurringPayment';
import { OpeningBalance } from '../models/MonthlyOpeningBalance';
import  * as transactionUtils  from '../utils/transactionUtils';
import uuid from 'react-native-uuid';
import { normalizeText } from '../utils/textUtils';

const CATEGORY_KEY = 'categories';
const PERSON_KEY = 'persons';
const ACCOUNT_KEY = 'accounts';
const TRANSACTION_KEY = 'transactions';
const RECURRINGPAYEMENTS_KEY= 'recurringPayments';
const OPENINGBALANCE_KEY= 'monthlyOpeningBalances';

export const getCategories = async (): Promise<Category[]> => {
  const data = await AsyncStorage.getItem(CATEGORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const addPerson = async (input: { name: string }): Promise<Person> => {
  try {
    const stored = await AsyncStorage.getItem(PERSON_KEY);
    const persons: Person[] = stored ? JSON.parse(stored) : [];

    const newPerson: Person = {
      id: uuid.v4().toString(),
      name: input.name,
    };

    persons.push(newPerson);
    await AsyncStorage.setItem(PERSON_KEY, JSON.stringify(persons));

    return newPerson;
  } catch (error) {
    console.error('Error saving person:', error);
    throw error;
  }
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

export const addAccount = async ({
  name,
  bankName = '',
  personalName = 'SELF',
}: {
  name: string;
  bankName?: string;
  personalName?: string;
}): Promise<Account> => {
  try {
    const accounts = await getAccounts();
    const newAccount: Account = {
      id: uuid.v4().toString(),
      name,
      bankName,
      personalName,
    };
    accounts.push(newAccount);
    await AsyncStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
    return newAccount;
  } catch (error) {
    console.error('Error saving account:', error);
    throw error;
  }
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

export const importMonthlyOpeningBalances = async (data: OpeningBalance[]): Promise<void> => {
  try {
    const existingStr = await AsyncStorage.getItem(OPENINGBALANCE_KEY);
    const existing: OpeningBalance[] = existingStr ? JSON.parse(existingStr) : [];
    const merged = mergeUniqueById(existing, data);
    await AsyncStorage.setItem(OPENINGBALANCE_KEY, JSON.stringify(merged));
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
      OPENINGBALANCE_KEY,
    ]);
    console.log('✅ Cleared all data.');
  } catch (err) {
    console.error('❌ Error clearing data:', err);
    throw err;
  }
};

export const getAllMonthlyOpeningBalances = async (): Promise<OpeningBalance[]> => {
  const json = await AsyncStorage.getItem(OPENINGBALANCE_KEY);
  return json ? JSON.parse(json) : [];
};

