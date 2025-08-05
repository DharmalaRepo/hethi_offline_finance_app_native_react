import { Account } from '../../models/Account';

const mockAccounts: Account[] = [
  {
    id: 'a1', paymentMode: 'Wallet',
    personId: ''
  }
];

export const AccountService = {
  async getAll(): Promise<Account[]> {
    return mockAccounts;
  }
};