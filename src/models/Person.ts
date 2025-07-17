export interface Person {
  id: string;
  name: string;
  accounts: Account[];
  isTestData?: boolean;
}