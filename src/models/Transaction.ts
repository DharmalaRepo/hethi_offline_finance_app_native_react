export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  subCategoryId?: string;
  personId: string;
  accountId?: string;
  note?: string;
  isReversible?: boolean;
  isSettled?: boolean;
  reverseTransactionId?: string;
  fromOrToPersonName?: string;
  dueDate?: string;
  isAutoReverseEntry?: boolean;
  originalTransactionId?: string;
  isRecurring?: boolean;
  recurringId?: string;
  createdAt: string;
  updatedAt?: string;
  isTestData?: boolean;
  isOptional?: boolean;
}