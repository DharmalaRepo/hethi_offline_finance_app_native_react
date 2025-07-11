export interface Account {
  id: string;
  name: string; // e.g., HDFC Bank
  personalName: string; // e.g., "Dad's Account"
  currentBalance?: number;
  notes?: string;
  bankName?: string;
}