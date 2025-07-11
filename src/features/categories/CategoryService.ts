import { Category } from '../../models/Category';

const mockCategories: Category[] = [
  { id: 'cat1', name: 'Groceries', subCategories: [{ id: 'sub1', name: 'Vegetables' }, { id: 'sub2', name: 'Fruits' }] },
  { id: 'cat2', name: 'Utilities', subCategories: [{ id: 'sub3', name: 'Electricity' }] },
  { id: 'cat3', name: 'Entertainment' }
];

export const CategoryService = {
  async getAll(): Promise<Category[]> {
    return mockCategories;
  }
};