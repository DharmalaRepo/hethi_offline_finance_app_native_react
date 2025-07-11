import { Account } from '../../models/Account';

const mockAccounts: Account[] = [
  { id: 'a1', name: 'Wallet', personalName: 'Shiva', bankName: '' },
  { id: 'a2', name: 'HDFC Bank', personalName: 'Anjali', bankName: 'HDFC' },
  { id: 'a3', name: 'Cash', personalName: 'Dad', bankName: '' }
];

export const AccountService = {
  async getAll(): Promise<Account[]> {
    return mockAccounts;
  }
};