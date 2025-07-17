import { Transaction } from './Transaction';

export interface RecurringPayment {
  dueDate: string;
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  subCategoryId: string;
  personId: string;
  accountId:string;
  note:string;
  type: 'income' | 'expense';
  startDate: string; // 'YYYY-MM-DD'
  frequency: string; // e.g., 'daily', 'weekly', 'monthly'
  endDate?: string;
  personName?: string;
  transactionTemplate?: any; // Optional future use
  repeatType?: string; // Optional future use
  createdAt: string;
  completedInstances?: string[];
  isTestData?: boolean;
}