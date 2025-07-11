import { Transaction } from './Transaction';

export interface RecurringPayment {
  dueDate: string;
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  startDate: string; // 'YYYY-MM-DD'
  repeatEvery: string; // e.g., 'daily', 'weekly', 'monthly'
  endDate?: string;
  personName?: string;
  transactionTemplate?: any; // Optional future use
  repeatType?: string; // Optional future use
  createdAt: string;
  completedInstances?: string[]; // track which instances are completed (e.g., ['2025-07-05'])
}