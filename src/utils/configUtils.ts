// src/utils/configUtils.ts

import { getCategories, getPersons } from '../services/mockDataService';
import { Category } from '../models/Category';
import { Person } from '../models/Person';

let categoriesCache: Category[] = [];
let personsCache: Person[] = [];

export const preloadConfigData = async () => {
  categoriesCache = await getCategories();
  personsCache = await getPersons();
};

export const resolveCategoryName = (categoryId: string): string => {
  const category = categoriesCache.find(c => c.id === categoryId);
  return category ? category.name : 'Unknown Category';
};

export const resolveSubCategoryName = (categoryId: string, subCategoryId?: string): string => {
  const category = categoriesCache.find(c => c.id === categoryId);
  if (!category || !subCategoryId) return '';
  const sub = category.subcategories?.find(sc => sc.id === subCategoryId);
  return sub ? sub.name : subCategoryId; // fallback to ID if name is missing
};

export const resolvePersonName = (personId: string): string => {
  const person = personsCache.find(p => p.id === personId);
  return person ? person.name : 'Unknown Person';
};