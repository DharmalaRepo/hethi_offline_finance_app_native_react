// utils/balanceSheetUtils.ts
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';

type Txn = {
  id: string;
  date: string;          // ISO or yyyy-mm-dd
  amount: number;
  type?: string;         // 'income' | 'expense' | 'credit' | 'debit' | etc.
  categoryId?: string;
  subCategoryId?: string;
  personId?: string;
  accountId?: string;
  isPending?: boolean;   // true if transaction is pending
};

const pad2 = (n: number | string) => String(n).padStart(2, '0');
const ymKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

// ---- FILTERS ---------------------------------------------------------------

export function getFilteredBalances<T extends MonthlyOpeningBalance | MonthlyClosingBalance>(
  all: T[],
  yearStr: string,
  monthStr: string,
  personId?: string,
  accountId?: string
): T[] {
  // compare on strings but normalize month padding to be safe
  const y = String(yearStr);
  const m = pad2(monthStr);
  return (all ?? []).filter(b =>
    String(b.year) === y &&
    pad2(b.month) === m &&
    (!personId || b.personId === personId) &&
    (!accountId || b.accountId === accountId)
  );
}

export function getFilteredTransactions(
  txns: Txn[],
  yearStr: string,
  monthStr: string,
  personId?: string,
  accountId?: string
): Txn[] {
  const targetYM = `${String(yearStr)}-${pad2(monthStr)}`;
  return (txns ?? []).filter(t => {
    const d = new Date(t.date);
    if (isNaN(d.getTime())) return false;
    if (ymKey(d) !== targetYM) return false;
    if (personId && t.personId !== personId) return false;
    if (accountId && t.accountId !== accountId) return false;
    return true;
  });
}

// ---- SUMMARIES -------------------------------------------------------------

// If your data uses other type labels, map them here
function classifyType(t: Txn): 'income' | 'expense' | 'unknown' {
  const raw = (t.type ?? '').toString().toLowerCase();
  if (raw === 'income' || raw === 'credit' || raw === 'cr') return 'income';
  if (raw === 'expense' || raw === 'debit' || raw === 'dr') return 'expense';
  // If you want to infer by sign, uncomment:
  // if (t.amount >= 0) return 'income';
  // if (t.amount < 0) return 'expense';
  return 'unknown';
}

export function calculateSummary(
  txns: Txn[],
  opening: MonthlyOpeningBalance[],
  closing: MonthlyClosingBalance[],
  _filter: { year: string; month: string; personId?: string; accountId?: string }
) {
  const openingBalance = (opening ?? []).reduce((s, b) => s + (b.amount || 0), 0);
  const closingBalance = (closing ?? []).reduce((s, b) => s + (b.amount || 0), 0);

  let totalIncome = 0;
  let totalExpense = 0;

   let pendingIncome = 0;
  let pendingExpense = 0;

  
for (const t of txns ?? []) {
  const amount = Number(t.amount) || 0;
  const kind = classifyType(t);

  if (kind === 'income') {
    totalIncome += amount;
    if (t.isPending) {
      pendingIncome += amount;
    }
  } 
  else if (kind === 'expense') {
    totalExpense += amount;
    if (t.isPending) {
      pendingExpense += amount;
    }
  }
}

  // difference = Opening + Income - Expense - Closing
  const difference = openingBalance + totalIncome - totalExpense - closingBalance;

  return { openingBalance, totalIncome, pendingIncome, totalExpense, pendingExpense, closingBalance, difference };
}

// (optional) used by your UI sections
export function generatePersonAccountSummary<T extends MonthlyOpeningBalance | MonthlyClosingBalance>(
  balances: T[],
  personId?: string,
  accountId?: string
) {
  const byPerson: Record<string, { personId: string; accounts: { accountId: string; amount: number }[]; totalAmount: number }> = {};
  for (const b of balances ?? []) {
    if (personId && b.personId !== personId) continue;
    if (accountId && b.accountId !== accountId) continue;

    if (!byPerson[b.personId]) {
      byPerson[b.personId] = { personId: b.personId, accounts: [], totalAmount: 0 };
    }
    byPerson[b.personId].accounts.push({ accountId: b.accountId, amount: b.amount });
    byPerson[b.personId].totalAmount += b.amount;
  }
  return Object.values(byPerson);
}