export interface Account {
  id: string;
  personId: string; // e.g., "Dad's Account"
  currentBalance?: number;
  notes?: string;
  bankName?: string;
}