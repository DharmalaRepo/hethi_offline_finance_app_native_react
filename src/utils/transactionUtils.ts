import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { Transaction } from '../models/Transaction';
import * as mockDataService from '../services/mockDataService';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import uuid from 'react-native-uuid';
import Toast from 'react-native-toast-message';
import { normalizeText } from './textUtils';

export const ensureAccount = async (accountName: string): Promise<Account> => {
  const accounts = await mockDataService.getAccounts();
  let account = accounts.find(a => normalizeText(a.name) === normalizeText(accountName));

  if (!account) {
    const newAccount: Account = {
      id: uuid.v4().toString(),
      name: accountName,
      personalName: 'SELF', // or any logic you want
      bankName: 'CASH',     // or prompt user if needed
    };

    await mockDataService.addAccount(newAccount);
    return newAccount;
  }

  return account;
};



export const ensurePerson = async (personName: string): Promise<Person> => {
  const persons = await mockDataService.getPersons();
  let person = persons.find(p => normalizeText(p.name) === normalizeText(personName));

  if (!person) {
    const newPerson: Person = {
      id: uuid.v4().toString(),
      name: personName,
    };
    await mockDataService.addPerson(newPerson);
    return newPerson;
  }

  return person;
};

export const ensureCategoryAndSubCategory = async (
  categoryName: string,
  subCategoryName?: string
): Promise<{ category: Category; subCategory?: SubCategory }> => {
  const allCategories = await mockDataService.getCategories();

  // Step 1: Check or Create Category
  let category = allCategories.find(
    c => normalizeText(c.name) === normalizeText(categoryName)
  );

  if (!category) {
    const newCategory: Category = {
      id: uuid.v4().toString(),
      name: categoryName,
      subcategories: [],
    };
    await mockDataService.addCategory(newCategory);
    category = newCategory;
  }

  // Step 2: Check or Create SubCategory (if provided)
  let subCategory: SubCategory | undefined;

  if (subCategoryName) {
    const subcategories = category.subcategories || [];

    subCategory = subcategories.find(
      s => normalizeText(s.name) === normalizeText(subCategoryName)
    );

    if (!subCategory) {
      const newSubCategory: SubCategory = {
        id: uuid.v4().toString(),
        name: subCategoryName,
        categoryId: category.id, 
      };
      subCategory = await mockDataService.addSubCategory(category.id, newSubCategory);

      // Update in-memory category object for return
      category.subcategories?.push(subCategory);
    }
  }

  return { category, subCategory };
};

export const matchCategoryFromNotes = (
  notes: string,
  categories: Category[]
): { category: Category | null; subCategory: SubCategory | null } => {
  const lowerNote = normalizeText(notes);
  let matchedCategory: Category | null = null;
  let matchedSubCategory: SubCategory | null = null;

  for (const category of categories) {
    if (lowerNote.includes(normalizeText(category.name))) {
      matchedCategory = category;

      if (category.subcategories?.length) {
        for (const sub of category.subcategories) {
          if (lowerNote.includes(normalizeText(sub.name))) {
            matchedSubCategory = sub;
            break;
          }
        }
      }

      if (matchedSubCategory) break;
    }
  }

  return { category: matchedCategory, subCategory: matchedSubCategory };
};


  export const generateUniqueId = (): string => {
    return '_' + Math.random().toString(36).substr(2, 9);
  };


  // ✅ showToast
export const showToast = (
    type: 'success' | 'error' | 'warning',
    message: string
  ) => {
    Toast.show({
      type: type,
      text1: message,
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  };


export const validateTransactionData = ({
  type,
  amount,
  date,
}: {
  type: 'income' | 'expense';
  amount: number;
  date: string;
}): { valid: boolean; message?: string } => {
  if (!type || !['income', 'expense'].includes(type)) {
    return { valid: false, message: 'Invalid transaction type' };
  }

  if (isNaN(amount) || amount <= 0) {
    return { valid: false, message: 'Amount must be a number greater than 0' };
  }

  if (!date) {
    return { valid: false, message: 'Transaction date is required' };
  }

  return { valid: true };
};

// ✅ autoDetectFromNotes
export const autoDetectFromNotes = (
  note: string,
  categories: Category[]
): { category?: Category; subCategory?: SubCategory } => {
  const lowerNote = normalizeText(note);

  let matchedCategory: Category | undefined;
  let matchedSubCategory: SubCategory | undefined;

  for (const category of categories) {
    const catName = normalizeText(category.name);

    if (lowerNote.includes(catName) || catName.includes(lowerNote)) {
      matchedCategory = category;

      if (category.subcategories) {
        for (const sub of category.subcategories) {
          const subName = normalizeText(sub.name);
          if (lowerNote.includes(subName) || subName.includes(lowerNote)) {
            matchedSubCategory = sub;
            break;
          }
        }
      }

      break; // break after first matched category
    } else {
      // Still check subcategories even if category doesn’t match
      if (category.subcategories) {
        for (const sub of category.subcategories) {
          const subName = normalizeText(sub.name);
          if (lowerNote.includes(subName) || subName.includes(lowerNote)) {
            matchedCategory = category;
            matchedSubCategory = sub;
            break;
          }
        }
      }
    }

    if (matchedCategory || matchedSubCategory) break;
  }

  return { category: matchedCategory, subCategory: matchedSubCategory };
};