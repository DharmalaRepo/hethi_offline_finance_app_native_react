import { Transaction } from '../models/Transaction'; // adjust path as needed

export interface CategorySummary {
  category: string;
  value: number;
}

export const getCategorySummary = (
  transactions: Transaction[],
  categoriesMap: Record<string, string>
): CategorySummary[] => {
  return Object.entries(
    transactions.reduce((acc, tx) => {
      if (tx.type === 'expense' && tx.categoryId) {
        acc[tx.categoryId] = (acc[tx.categoryId] || 0) + tx.amount;
      }
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([categoryId, value]) => ({
      category: categoriesMap[categoryId] || 'Unknown',
      value,
    }))
    .filter((item): item is CategorySummary => typeof item.value === 'number' && item.value > 0)
    .sort((a, b) => b.value - a.value);
};