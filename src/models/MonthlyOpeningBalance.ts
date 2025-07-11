export interface OpeningBalance {
  id: string;
  personId: string;
  accountId: string;
  month: string; // yyyy-mm format
  amount: number;
  note?: string;
}