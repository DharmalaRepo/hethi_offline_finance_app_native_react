import { Transaction } from '../models/Transaction';

export interface ParsedTransaction {
  date: string;         // YYYY-MM-DD
  description: string;
  amount: number;
  type: 'income' | 'expense';
}

/**
 * Detects whether a string is a valid date (DD/MM/YYYY or DD-MM-YYYY).
 */
function parseDate(raw: string): string | null {
  const match = raw.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Detects amount in a line, including formats like `1,234.56`, `1234.56 CR`, `-1234.00`.
 */
function extractAmount(line: string): { amount: number; type: 'income' | 'expense' } | null {
  const amountRegex = /([\-\+]?\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})(\s*CR)?/i;
  const match = line.match(amountRegex);

  if (!match) return null;

  const rawAmount = match[1].replace(/,/g, '');
  const isCredit = /CR/i.test(match[2] || '');
  const amount = parseFloat(rawAmount);

  return {
    amount,
    type: isCredit || amount > 0 ? 'income' : 'expense',
  };
}

/**
 * Main parser that accepts OCR lines and returns parsed transactions.
 */
export function parseTransactionsFromText(lines: string[]): ParsedTransaction[] {
  const results: ParsedTransaction[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const date = parseDate(trimmed);
    const amountInfo = extractAmount(trimmed);

    if (date && amountInfo) {
      const description = trimmed
        .replace(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/, '')     // remove date
        .replace(/([\-\+]?\d{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})(\s*CR)?/i, '') // remove amount
        .trim();

      results.push({
        date,
        description,
        amount: amountInfo.amount,
        type: amountInfo.type,
      });
    }
  }

  return results;
}