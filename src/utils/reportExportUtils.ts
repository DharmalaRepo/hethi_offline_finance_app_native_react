import React, { useEffect, useState } from 'react';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { format, parseISO } from 'date-fns';
import { getCategories } from '../services/mockDataService'

interface MonthlySummaryRow {
    category: string;
    monthly: Record<string, number>;
    total: number;
    average: number;
    percentContribution: number;
}

export interface YearlySummaryResult {
    months: string[];
    rows: MonthlySummaryRow[];
}

export const generateYearlyCategorySummary = (
  transactions: Transaction[],
  categories: Category[],
  fromMonthYear: string
): YearlySummaryResult => {
  const [fromYear, fromMonth] = fromMonthYear.split('-').map(Number);
  const months: string[] = [];
  const monthYearKeys: string[] = [];

  for (let i = 0; i < 12; i++) {
    const d = new Date(fromYear, fromMonth - 1 - i);
    const label = format(d, 'MMM yyyy');
    months.unshift(label);
    monthYearKeys.unshift(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
  }

  const categoryMap: Record<string, Record<string, number>> = {};

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '';
  };

  transactions.forEach((txn) => {
    const date = parseISO(txn.date);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const label = format(date, 'MMM yyyy');
    const category = getCategoryName(txn.categoryId);

    if (monthYearKeys.includes(key)) {
      if (!categoryMap[category]) {
        categoryMap[category] = {};
      }
      categoryMap[category][label] = (categoryMap[category][label] || 0) + txn.amount;
    }
  });

  const rows: MonthlySummaryRow[] = [];
  const averages: number[] = [];

  Object.entries(categoryMap).forEach(([category, monthData]) => {
    const monthly: Record<string, number> = {};
    months.forEach((m) => {
      monthly[m] = Number((monthData[m] || 0).toFixed(2));
    });

    const values = Object.values(monthly);
    const total = values.reduce((sum, val) => sum + val, 0);
    const nonZero = values.filter((v) => v !== 0);
    const avg = nonZero.length ? total / nonZero.length : 0;

    if (Object.values(monthly).some((val) => val > 0)) {
        rows.push({
            category,
            monthly,
            total: Number(total.toFixed(2)),
            average: Number(avg.toFixed(2)),
            percentContribution: 0,
        });
    }
    averages.push(avg);
  });

  const avgSum = averages.reduce((sum, v) => sum + v, 0);
  rows.forEach((row, i) => {
    row.percentContribution = avgSum > 0 ? Number(((averages[i] / avgSum) * 100).toFixed(2)) : 0;
  });

  return {
    months,
    rows,
  };
};