export interface MonthlyBalanceSheet {
  id: string;
  month: string;
  personId: string;
  accountId: string;
  openingBalance: number;
  income: number;
  expense: number;
  closingBalance: number;
  delta: number; // derived = closing - (opening + income - expense)
  status: 'balanced' | 'untracked' | 'adhoc' | 'mismatch';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}