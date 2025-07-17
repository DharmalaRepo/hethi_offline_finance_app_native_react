export interface MonthlyClosingBalance {
  id: string;
  month: string;
  year: string;
  personId: string;
  accountId: string;
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}