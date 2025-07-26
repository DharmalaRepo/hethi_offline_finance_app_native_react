import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { AppSettings } from '../models/AppSettings';
import { RecurringPayment } from '../models/RecurringPayment';
import  * as transactionUtils  from '../utils/transactionUtils';
import uuid from 'react-native-uuid';
import { normalizeText } from '../utils/textUtils';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';
import { saveSecureItemInJson, removeSecureItem, getSecureItemInJsonFormat, setSecureItem } from './secureStorageService';


const CATEGORY_KEY = 'categories';
const PERSON_KEY = 'persons';
const ACCOUNT_KEY = 'accounts';
const TRANSACTION_KEY = 'transactions';
const RECURRINGPAYEMENTS_KEY= 'recurringPayments';
const OPENING_BALANCES_KEY = 'monthly_opening_balances';
const CLOSING_BALANCES_KEY = 'monthly_closing_balances';
const PIN_KEY = 'user_pin';
const SECURITY_QUESTION_KEY = 'security_question';
const SECURITY_ANSWER_KEY = 'security_answer';
const APP_SETTINGS_KEY = 'APP_SETTINGS';
const PIN_ATTEMPT_KEY = 'pin_failed_attempts';
const PIN_LOCK_UNTIL_KEY = 'pin_lock_until';

//Categories

export const getCategories = async (): Promise<Category[]> => {
  try {
    const data = await getSecureItemInJsonFormat<Category[]>(CATEGORY_KEY);
    return data || [];
  } catch (error) {
    console.error('getCategories: Error fetching categories', error);
    return [];
  }
};

export const getAllSubCategories = async (): Promise<SubCategory[]> => {
  try {
    const categories = await getCategories(); // should already use secure retrieval

    const allSubCategories: SubCategory[] = categories.flatMap((category) =>
      (category.subcategories || []).map((sub) => ({
        ...sub,
        categoryId: category.id,
      }))
    );

    return allSubCategories;
  } catch (error) {
    console.error('[getAllSubCategories] Failed:', error);
    return [];
  }
};

export const getSubCategoriesByCategoryId = async (
  input: { categoryId: string }
): Promise<SubCategory[]> => {
  try {
    const subcategories = await getAllSubCategories();
    const filtered = subcategories.filter(sc => sc.categoryId === input.categoryId);
    return filtered;
  } catch (error) {
    console.error('[getSubCategoriesByCategoryId] Failed:', error);
    return [];
  }
};

export const addCategory = async (
  categoryInput: { name: string; subcategories?: SubCategory[] }
): Promise<Category> => {
  try {
    const allCategories: Category[] = await getSecureItemInJsonFormat<Category[]>(CATEGORY_KEY) || [];
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
    await saveSecureItemInJson(CATEGORY_KEY, updated);

    return newCategory;
  } catch (error) {
    console.error('[addCategory] Failed:', error);
    throw error;
  }
};

export const addSubCategory = async (
  categoryId: string,
  subCategoryInput: { name: string }
): Promise<SubCategory> => {
  try {
    const categories: Category[] = await getSecureItemInJsonFormat<Category[]>(CATEGORY_KEY) || [];
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

    await saveSecureItemInJson(CATEGORY_KEY, categories);

    return newSubCategory;
  } catch (error) {
    console.error('[addSubCategory] Failed:', error);
    throw error;
  }
};

// 1. Save Categories
export const saveCategories = async (categories: Category[]) => {
  try {
    await setSecureItem(CATEGORY_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('[saveCategories] Error:', error);
  }
};


//Persons and accounts

export const getAllPersons = async (): Promise<Person[]> => {
  try {
    const data = await getSecureItemInJsonFormat<Person[]>(PERSON_KEY);
    return data || [];
  } catch (error) {
    console.error('[getAllPersons] Failed to retrieve persons:', error);
    return [];
  }
};


export const getPersons = async (): Promise<Person[]> => {
  try {
    const data = await getSecureItemInJsonFormat<Person[]>(PERSON_KEY);

    return data || [];
  } catch (error) {
    console.error('[getPersons1] Failed to fetch persons:', error);
    return [];
  }
};

export const getAccounts = async (): Promise<Account[]> => {
  try {
    const data = await getSecureItemInJsonFormat<Account[]>(ACCOUNT_KEY);
    return data || [];
  } catch (error) {
    console.error('[getAccounts] Failed to fetch accounts:', error);
    return [];
  }
};

export const addPerson = async (input: { name: string }): Promise<Person> => {
  try {
    const persons: Person[] = await getSecureItemInJsonFormat<Person[]>(PERSON_KEY) || [];

    const newPerson: Person = {
      id: uuid.v4().toString(),
      name: input.name,
      accounts: [],
    };

    const updatedPersons = [...persons, newPerson];
    await saveToStorageSecured(PERSON_KEY, updatedPersons);
    return newPerson;
  } catch (error) {
    console.error('[addPerson] Failed to add person:', error);
    throw error;
  }
};

 // 2. Save Persons
export const savePersons = async (persons: Person[]) => {
  try {
    await setSecureItem(PERSON_KEY, JSON.stringify(persons));
  } catch (error) {
    console.error('[savePersons] Error:', error);
  }
};



export const addAccountToPerson = async (
  personId: string,
  accountInput: { accountTypeOrName: string }
): Promise<Account> => {
  try {
    const persons: Person[] = await getSecureItemInJsonFormat<Person[]>(PERSON_KEY) || [];

    const personIndex = persons.findIndex(p => p.id === personId);
    if (personIndex === -1) {
      throw new Error('Person not found');
    }

    const person = persons[personIndex];
    person.accounts = person.accounts || [];

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

    await saveSecureItemInJson(PERSON_KEY, persons);
    return newAccount;
  } catch (error) {
    console.error('[addAccountToPerson] Failed:', error);
    throw error;
  }
};


// Transactions

export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactions = await getSecureItemInJsonFormat<Transaction[]>(TRANSACTION_KEY);
    //console.log(transactions?transactions.length:0, 'transactions found');
    return transactions || [];
  } catch (error) {
    console.error('[getAllTransactions] Failed to retrieve:', error);
    return [];
  }
};

export const getTransactionsForMonth = async (
  year: number,
  month: number
): Promise<Transaction[]> => {
  try {
    const all = await getAllTransactions();

    return all.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate.getFullYear() === year && txnDate.getMonth() === month;
    });
  } catch (error) {
    console.error('[getTransactionsForMonth] Failed:', error);
    return [];
  }
};

export const saveTransaction = async (tx: Transaction): Promise<void> => {
  try {
    const existing = await getAllTransactions();
    const updated = [...existing, tx];
    await saveToStorageSecured(TRANSACTION_KEY, updated);
  } catch (err) {
    console.error('[saveTransaction] Storage Error:', err);
    throw err;
  }
};

 // 3. Save Transactions
export const saveTransactions = async (transactions: Transaction[]) => {
  try {
    await setSecureItem(TRANSACTION_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('[saveTransactions] Error:', error);
  }
};



export const updateTransaction = async (updated: Transaction): Promise<void> => {
  try {
    const existing = await getAllTransactions();

    const updatedList = existing.map(tx =>
      tx.id === updated.id ? { ...tx, ...updated } : tx
    );

    await saveToStorageSecured(TRANSACTION_KEY, updatedList);
  } catch (error) {
    console.error('[updateTransaction] Failed to update transaction:', error);
    throw error;
  }
};


export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    const existing: Transaction[] = await getAllTransactions();

    const newList = existing.filter(tx => tx.id !== id);

    await saveToStorageSecured(TRANSACTION_KEY, newList);
  } catch (error) {
    console.error('[deleteTransaction] Failed to delete transaction:', error);
    throw error;
  }
};


// Recurring payments

export const getAllRecurringPayments = async (): Promise<RecurringPayment[]> => {
  try {
    const data = await getSecureItemInJsonFormat<RecurringPayment[]>(RECURRINGPAYEMENTS_KEY);
    return data || [];
  } catch (error) {
    console.error('[getAllRecurringPayments] Failed to retrieve recurring payments:', error);
    return [];
  }
};

  // 4. Save Recurring Payments
export const saveRecurringPayments = async (recurringPayments: RecurringPayment[]) => {
  try {
    await setSecureItem(RECURRINGPAYEMENTS_KEY, JSON.stringify(recurringPayments));
  } catch (error) {
    console.error('[saveRecurringPayments] Error:', error);
  }
};

// Balance sheets

// 1. Get Opening Balances
export const getOpeningBalances = async (): Promise<MonthlyOpeningBalance[]> => {
  try {
    const data = await getSecureItemInJsonFormat<MonthlyOpeningBalance[]>(OPENING_BALANCES_KEY);
    return data || [];
  } catch (err) {
    console.error('Error reading opening balances', err);
    return [];
  }
};

// 2. Save Opening Balances
export const saveOpeningBalances = async (balances: MonthlyOpeningBalance[]): Promise<void> => {
  try {
    await setSecureItem(OPENING_BALANCES_KEY, JSON.stringify(balances));
  } catch (err) {
    console.error('Error saving opening balances', err);
  }
};

// 3. Get Closing Balances
export const getClosingBalances = async (): Promise<MonthlyClosingBalance[]> => {
  try {
    const data = await getSecureItemInJsonFormat<MonthlyClosingBalance[]>(CLOSING_BALANCES_KEY);
    return data || [];
  } catch (err) {
    console.error('Error reading closing balances', err);
    return [];
  }
};

// 4. Save Closing Balances
export const saveClosingBalances = async (balances: MonthlyClosingBalance[]): Promise<void> => {
  try {
    await setSecureItem(CLOSING_BALANCES_KEY, JSON.stringify(balances));
  } catch (err) {
    console.error('Error saving closing balances', err);
  }
};

//Imports and Exports

export const importCategories = async (data: Category[]): Promise<void> => {
  try {
    const existing: Category[] = await getSecureItemInJsonFormat<Category[]>(CATEGORY_KEY) || [];
    const merged = mergeUniqueById(existing, data);
    await saveToStorageSecured(CATEGORY_KEY, merged);
  } catch (err) {
    console.error('❌ Error importing categories:', err);
    throw err;
  }
};

export const importPersons = async (data: Person[]): Promise<void> => {
  try {
    const existing: Person[] = await getSecureItemInJsonFormat<Person[]>(PERSON_KEY) || [];
    const merged = mergeUniqueById(existing, data);
    await saveToStorageSecured(PERSON_KEY, merged);
  } catch (err) {
    console.error('❌ Error importing persons:', err);
    throw err;
  }
};

export const importTransactions = async (data: Transaction[]): Promise<void> => {
  try {
    const existing: Transaction[] = await getSecureItemInJsonFormat<Transaction[]>(TRANSACTION_KEY) || [];
    const merged = mergeUniqueById(existing, data);
    await saveToStorageSecured(TRANSACTION_KEY, merged);

  } catch (err) {
    console.error('❌ Error importing transactions:', err);
    throw err;
  }
};


export const importRecurringPayments = async (data: RecurringPayment[]): Promise<void> => {
  try {
    const existing: RecurringPayment[] =
      (await getSecureItemInJsonFormat<RecurringPayment[]>(RECURRINGPAYEMENTS_KEY)) || [];

    const merged = mergeUniqueById(existing, data);
    await saveToStorageSecured(RECURRINGPAYEMENTS_KEY, merged);
  } catch (err) {
    console.error('❌ Error importing recurring payments:', err);
    throw err;
  }
};

export const importAccounts = async (data: Account[]): Promise<void> => {
  try {
    const existing: Account[] =
      (await getSecureItemInJsonFormat<Account[]>(ACCOUNT_KEY)) || [];

    const merged = mergeUniqueById(existing, data);
    await saveToStorageSecured(ACCOUNT_KEY, merged);
  } catch (err) {
    console.error('❌ Error importing accounts:', err);
    throw err;
  }
};


export const importMonthlyOpeningBalances = async (data: MonthlyOpeningBalance[]): Promise<void> => {
  try {
    const existing: MonthlyOpeningBalance[] =
      (await getSecureItemInJsonFormat<MonthlyOpeningBalance[]>(OPENING_BALANCES_KEY)) || [];

    const merged = mergeUniqueById(existing, data);
    await saveToStorageSecured(OPENING_BALANCES_KEY, merged);


  } catch (err) {
    console.error('❌ Error importing monthly opening balances:', err);
    throw err;
  }
};




// App settings

export const getAppSettings = async (): Promise<AppSettings> => {
  const raw = await getSecureItemInJsonFormat(APP_SETTINGS_KEY);
    return raw ;
};

export const saveAppSettings = async (settings: AppSettings): Promise<void> => {
  try {
    await saveToStorageSecured(APP_SETTINGS_KEY, settings);
  } catch (err) {
    console.error('Failed to save app settings:', err);
    throw err;
  }
};

export const clearAppSettings = async (): Promise<void> => {
  try {
    await removeSecureItem(APP_SETTINGS_KEY);
  } catch (err) {
    console.error('Failed to clear app settings:', err);
    throw err;
  }
};


// Data

export const exportAllData = async (): Promise<any> => {
  try {
    const [categories, persons, transactions, recurringPayments] = await Promise.all([
      getCategories(),
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
  } catch (error) {
    console.error('[exportAllData] Failed to export data:', error);
    throw error;
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await Promise.all([
      removeSecureItem(CATEGORY_KEY),
      removeSecureItem(PERSON_KEY),
      removeSecureItem(ACCOUNT_KEY),
      removeSecureItem(TRANSACTION_KEY),
      removeSecureItem(RECURRINGPAYEMENTS_KEY),
      removeSecureItem(OPENING_BALANCES_KEY),
      removeSecureItem(CLOSING_BALANCES_KEY),
    ]);

  } catch (err) {
    console.error('❌ Error clearing data (secured):', err);
    throw err;
  }
};

// PIN protection
export const savePin = async (pin: string) => {
  await saveToStorageSecured(PIN_KEY, pin);
};

export const getPin = async () => {
  return await getSecureItemInJsonFormat(PIN_KEY);
};

export const validatePin = async (input: string) => {
  const stored = await getPin();
  return stored||'' === input;
};

export const saveSecurityQA = async (question: string, answer: string) => {
  await saveToStorageSecured(SECURITY_QUESTION_KEY, question);
  await saveToStorageSecured(SECURITY_ANSWER_KEY, answer.toLowerCase().trim());
};

export const getSecurityQA = async () => {
  const question = await getSecureItemInJsonFormat(SECURITY_QUESTION_KEY);
  return question || '';
};

export const validateSecurityAnswer = async (answer: string) => {
  const correct = await getSecureItemInJsonFormat(SECURITY_ANSWER_KEY);
  return correct === answer.toLowerCase().trim();
};

export const clearSecurityData = async () => {
  await removeSecureItem(PIN_KEY);
  await removeSecureItem(SECURITY_QUESTION_KEY);
  await removeSecureItem(SECURITY_ANSWER_KEY);
};

export const getPinFailedAttempts = async (): Promise<number> => {
  const raw = await getSecureItemInJsonFormat(PIN_ATTEMPT_KEY);
  return raw ? parseInt(raw) : 0;
};

export const setPinFailedAttempts = async (attempts: number) => {
  await setSecureItem(PIN_ATTEMPT_KEY, attempts.toString());
};

export const getPinLockUntil = async (): Promise<number | null> => {
  const raw = await getSecureItemInJsonFormat(PIN_LOCK_UNTIL_KEY);
  return raw ? parseInt(raw) : null;
};

export const setPinLockUntil = async (timestamp: number) => {
  await setSecureItem(PIN_LOCK_UNTIL_KEY, timestamp.toString());
};

export const clearPinAttempts = async () => {
  await removeSecureItem(PIN_ATTEMPT_KEY);
  await removeSecureItem(PIN_LOCK_UNTIL_KEY);
};

//Common methods

// Utility: remove duplicates based on ID
const mergeUniqueById = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
  const map = new Map<string, T>();
  [...existing, ...incoming].forEach(item => map.set(item.id, item));
  return Array.from(map.values());
};

export const saveToStorageSecured = async (key: string, data: any) => {
  try {

    await setSecureItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save data for key: ${key}`, error);
    throw new Error('Secure save failed');
  }
};

export const getCategoryWiseData = async (year: number, month: number): Promise<{ [key: string]: number }> => {
  try {
    const txns = await getTransactionsForMonth(year, month);
    const result: { [key: string]: number } = {};

    txns.forEach(t => {
      if (t.type === 'expense') {
        result[t.categoryId] = (result[t.categoryId] || 0) + t.amount;
      }
    });

    return result;
  } catch (error) {
    console.error('[getCategoryWiseData] Failed:', error);
    return {};
  }
};

export const getMonthlySummary = async (year: number, month: number) => {
  try {
    const txns = await getTransactionsForMonth(year, month);

    const income = txns
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = txns
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      savings: income - expense,
    };
  } catch (error) {
    console.error('[getMonthlySummary] Failed:', error);
    return {
      income: 0,
      expense: 0,
      savings: 0,
    };
  }
};


export const getComparisonBetweenMonths = async (
  month1: string, // format 'YYYY-MM'
  month2: string
): Promise<[Transaction[], Transaction[]]> => {
  try {
    const all = await getAllTransactions();

    const [txns1, txns2] = [month1, month2].map(m =>
      all.filter(t => t.date.startsWith(m))
    );

    return [txns1, txns2];
  } catch (error) {
    console.error('[getComparisonBetweenMonths] Failed:', error);
    return [[], []];
  }
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
    const allCategories = await getCategories();
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
