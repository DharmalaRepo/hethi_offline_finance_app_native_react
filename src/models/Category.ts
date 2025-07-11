import { SubCategory } from './SubCategory';

export interface Category {
  id: string;
  name: string;
  parentCategoryId?: string; 
  subcategories?: SubCategory[];
}