// balanceSheetUtils.ts
import { Transaction } from '../models/Transaction';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';

export const calculateSummary = (
  transactions: Transaction[],
  openingBalances: MonthlyOpeningBalance[],
  closingBalances: MonthlyClosingBalance[],
  filters: {
    year: string;
    month: string;
    personId?: string;
    accountId?: string;
  }
) => {
  const { year, month, personId, accountId } = filters;

  const filterMatch = (entry: any) => {
    return (
      entry.year === year &&
      entry.month === month &&
      (!personId || entry.personId === personId) &&
      (!accountId || entry.accountId === accountId)
    );
  };

  const filteredOpening = openingBalances.filter(filterMatch);
  const filteredClosing = closingBalances.filter(filterMatch);
  const filteredTxns = transactions.filter(txn => {
    const txnDate = new Date(txn.date);
    return (
      txnDate.getFullYear().toString() === year &&
      (txnDate.getMonth() + 1).toString().padStart(2, '0') === month &&
      (!personId || txn.personId === personId) &&
      (!accountId || txn.accountId === accountId)
    );
  });

  const totalIncome = filteredTxns
    .filter(txn => txn.type === 'income')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalExpense = filteredTxns
    .filter(txn => txn.type === 'expense')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const openingBalance = filteredOpening.reduce((sum, b) => sum + b.amount, 0);
  const closingBalance = filteredClosing.reduce((sum, b) => sum + b.amount, 0);

  const difference =
    closingBalance - (openingBalance + totalIncome - totalExpense);

  return {
    openingBalance,
    totalIncome,
    totalExpense,
    closingBalance,
    difference,
  };
};


export const getUniqueYearsMonths = (transactions: Transaction[]) => {
  const years = new Set<string>();
  const months = new Set<string>();

  transactions.forEach(txn => {
    const txnDate = new Date(txn.date);
    years.add(txnDate.getFullYear().toString());
    months.add((txnDate.getMonth() + 1).toString().padStart(2, '0'));
  });

  return {
    years: Array.from(years).sort(),
    months: Array.from(months).sort()
  };
};

export const getFilteredBalances = <T extends { year: string; month: string; personId: string; accountId: string }>(
  balances: T[],
  year: string,
  month: string,
  personId?: string,
  accountId?: string
): T[] => {
  return balances.filter(b => {
    return (
      b.year === year &&
      b.month === month &&
      (!personId || b.personId === personId) &&
      (!accountId || b.accountId === accountId)
    );
  });
};


export const getFilteredTransactions = (
  transactions: Transaction[],
  year: string,
  month: string,
  personId?: string,
  accountId?: string
): Transaction[] => {
  return transactions.filter(txn => {
    const txnDate = new Date(txn.date);
    const txnYear = txnDate.getFullYear().toString();
    const txnMonth = (txnDate.getMonth() + 1).toString().padStart(2, '0');

    return (
      txnYear === year &&
      txnMonth === month &&
      (!personId || txn.personId === personId) &&
      (!accountId || txn.accountId === accountId)
    );
  });
};

interface PersonAccountSummary {
  personId: string;
  totalAmount: number;
  accounts: {
    accountId: string;
    amount: number;
  }[];
}

/**
 * Groups balances by person and then by account to be used in Balance Sheet UI.
 */
export function generatePersonAccountSummary(
  balances: MonthlyOpeningBalance[] | MonthlyClosingBalance[],
  personId?: string,
  accountId?: string
): PersonAccountSummary[] {
  const map: { [personId: string]: { [accountId: string]: number } } = {};

  for (const entry of balances) {
    if (personId && entry.personId !== personId) continue;
    if (accountId && entry.accountId !== accountId) continue;

    if (!map[entry.personId]) {
      map[entry.personId] = {};
    }

    if (!map[entry.personId][entry.accountId]) {
      map[entry.personId][entry.accountId] = 0;
    }

    map[entry.personId][entry.accountId] += entry.amount;
  }

  const result: PersonAccountSummary[] = [];

  for (const personId of Object.keys(map)) {
    const accounts = Object.entries(map[personId]).map(([accountId, amount]) => ({
      accountId,
      amount,
    }));

    const totalAmount = accounts.reduce((sum, acc) => sum + acc.amount, 0);

    result.push({
      personId,
      totalAmount,
      accounts,
    });
  }

  return result;
}