export interface Account {
  id: string;
  personId: string;
  paymentMode: string;  // CASH or ICICI or HDFC or UPI
  notes?: string;
  isTestData?: boolean;
}