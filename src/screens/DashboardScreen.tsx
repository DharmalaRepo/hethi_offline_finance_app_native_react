// DashboardView.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';

import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { RecurringPayment } from '../models/RecurringPayment';
import { useAppData } from '../context/AppDataProvider';
import { useAppContext } from '../context/AppContext';
import StarterCategoryImporter from '../components/StarterCategoryImporter';

interface Props {
  accounts: Account[];
  categories: Category[];
  persons: Person[];
  monthlyOpeningBalances: MonthlyOpeningBalance[];
  recurringPayments: RecurringPayment[];
  transactions: Transaction[];
}

// ⬇️ give every prop a safe default (empty array)
const DashboardView: React.FC<Props> = ({
}) => {
  const navigation = useNavigation<any>();

  const { showSensitiveData, toggleSensitiveData } = useAppContext();
  const [logoModalVisible, setLogoModalVisible] = useState(false);
  const [showStarterModal, setShowStarterModal] = useState(false);

  const {
    persons,
    categories,
    transactions,
    reloadAppData,
    recurringPayments,
  } = useAppData();

  const reloadData = async () => {
    await reloadAppData().catch((err) => {
      console.error('Failed to reload data:', err);
    });
  };

  // ---------------- helpers ----------------
  const fmt = (n: number) =>
    `₹${Number(n || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const fmt2 = (n: number) =>
    `₹${Number(n || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const parseYMD = (d?: string) => {
    // expecting YYYY-MM-DD
    if (!d) return null;
    const [y, m, dd] = d.split('-').map((x) => Number(x));
    if (!y || !m || !dd) return null;
    return new Date(y, m - 1, dd);
  };

  const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;


  // --- period & picker ---
  const today = new Date();
  const [period, setPeriod] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const periodLabel = useMemo(() => {
    const d = new Date(period.year, period.month - 1, 1);
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [period]);
  const shiftPeriod = (delta: number) => {
    const target = new Date(period.year, period.month - 1 + delta, 1);
    setPeriod({ year: target.getFullYear(), month: target.getMonth() + 1 });
  };


  // ---------------- resolvers ----------------
  const resolvePersonName = (personId?: string) =>
    personId ? persons.find((p) => p.id === personId)?.name ?? '' : '';
  const resolveAccountName = (accountId?: string) => {
    if (!accountId) return '';
    const all = persons.flatMap((p) => p.accounts || []);
    const acc = all.find((a) => a.id === accountId);
    if (!acc) return '';
    const owner = persons.find((p) => p.id === acc.personId)?.name ?? '';
    return `${acc.paymentMode ?? 'Account'}${owner ? ` (${owner})` : ''}`;
  };
  const resolveCategoryName = (categoryId?: string) =>
    categoryId ? categories.find((c) => c.id === categoryId)?.name ?? '' : '';
  const resolveSubCategoryName = (categoryId?: string, subId?: string) => {
    if (!categoryId || !subId) return '';
    const cat: any = categories.find((c) => c.id === categoryId);
    const subs: Array<{ id: string; name: string }> = (cat?.subCategories as any) ?? [];
    return subs.find((s) => s.id === subId)?.name ?? '';
  };


  // --- month-filtered data (guarded by defaults above) ---
  const txM = useMemo(
    () =>
      transactions.filter((t) => {
        const d = parseYMD(t.date);
        return d && d.getFullYear() === period.year && d.getMonth() + 1 === period.month;
      }),
    [transactions, period]
  );

  const income = useMemo(
    () => txM.filter((t) => (t.type || '').toLowerCase() === 'income').reduce((s, t) => s + (t.amount || 0), 0),
    [txM]
  );
  const expense = useMemo(
    () => txM.filter((t) => (t.type || '').toLowerCase() === 'expense').reduce((s, t) => s + (t.amount || 0), 0),
    [txM]
  );
  const savings = income - expense;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  // ---------------- small 6‑month trend ----------------
  const last6 = useMemo(() => {
    const base = new Date(period.year, period.month - 1, 1);
    const arr: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const key = monthKey(d);
      arr.push({
        key,
        label: d.toLocaleDateString(undefined, { month: 'short' }),
        income: 0,
        expense: 0,
      });
    }
    const mset = new Set(arr.map((x) => x.key));
    transactions.forEach((t) => {
      const d = parseYMD(t.date);
      if (!d) return;
      const key = monthKey(new Date(d.getFullYear(), d.getMonth(), 1));
      if (!mset.has(key)) return;
      const isInc = (t.type || '').toLowerCase() === 'income';
      const bucket = arr.find((x) => x.key === key)!;
      if (isInc) bucket.income += t.amount || 0;
      else bucket.expense += t.amount || 0;
    });
    return arr;
  }, [transactions, period]);

  const maxBar = Math.max(
    1,
    ...last6.map((m) => Math.max(m.income, m.expense))
  );

  // ---------------- top categories (selected month) ----------------
  const topCats = useMemo(() => {
    const map: Record<string, number> = {};
    txM.forEach((t) => {
      if ((t.type || '').toLowerCase() !== 'expense') return;
      const id = t.categoryId || 'uncat';
      map[id] = (map[id] || 0) + (t.amount || 0);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    const rows = Object.entries(map)
      .map(([id, amt]) => ({
        id,
        name: resolveCategoryName(id) || 'Uncategorized',
        amount: amt,
        pct: (amt / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    return { rows, total };
  }, [txM, categories]);

  // ---------------- recent transactions (selected month) ----------------
  const recentTx = useMemo(() => {
    return [...txM]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .reverse()
      .slice(0, 8);
  }, [txM]);

  // ---------------- reminders / upcoming recurring (next 7 days) ----------------
  const upcomingRecurring = useMemo(() => {
    const now = new Date();
    const end = new Date();
    end.setDate(now.getDate() + 7);
    // Assuming RecurringPayment.dueDate is in YYYY-MM-DD (next occurrence)
    return recurringPayments
      .map((r) => ({ ...r, _d: parseYMD(r.dueDate) }))
      .filter((r) => r._d && r._d >= now && r._d <= end)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [recurringPayments]);

  // ---------------- date picker modal (optional) ----------------
  const [pickerVisible, setPickerVisible] = useState(false);

  // ---------------- UI ----------------
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 10 }}>
      {/* App header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setLogoModalVisible(true)}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          </TouchableOpacity>
          <Text style={styles.title}>  Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={reloadData} style={styles.iconButton}>
            <Ionicons name="refresh" size={22} color="#e6f0ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSensitiveData} style={styles.iconButton}>
            <Ionicons name={showSensitiveData ? "eye" : "eye-off"} size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Full‑logo modal */}
      <Modal visible={logoModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <Pressable onPress={() => setLogoModalVisible(false)} style={styles.modalBackground}>
            <Image source={require('../../assets/images/icon.png')} style={styles.fullImage} resizeMode="contain" />
          </Pressable>
        </View>
      </Modal>

      {/* Month selector */}
      <View style={{ paddingHorizontal: 16, marginTop: 6, marginBottom: 6 }}>
        <View style={styles.periodRow}>
          {/* Prev */}
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => shiftPeriod(-1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={18} color="#1a3c70" />
          </TouchableOpacity>

          {/* Current month (opens date picker) */}
          <TouchableOpacity
            style={[styles.inputBtn, styles.monthBtn]}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar" size={16} color="#1a3c70" />
            <Text style={styles.inputBtnText}>{periodLabel}</Text>
          </TouchableOpacity>

          {/* Next (optional: disable if next month would be in the future) */}
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => shiftPeriod(1)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-forward" size={18} color="#1a3c70" />
          </TouchableOpacity>
        </View>
      </View>

      <DateTimePickerModal
        isVisible={pickerVisible}
        mode="date"
        onConfirm={(date: Date) => {
          setPickerVisible(false);
          setPeriod({ year: date.getFullYear(), month: date.getMonth() + 1 });
        }}
        onCancel={() => setPickerVisible(false)}
      />

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderLeftColor: '#16a34a' }]}>
          <Text style={styles.kpiLabel}>Income</Text>
          <Text style={[styles.kpiValue, { color: '#16a34a' }]}> {showSensitiveData ? `₹ ${fmt(income)}` : '₹ ****'}  </Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#dc2626' }]}>
          <Text style={styles.kpiLabel}>Expense</Text>
          <Text style={[styles.kpiValue, { color: '#dc2626' }]}> {showSensitiveData ? `₹ ${fmt(expense)}` : '₹ ****'} </Text>
        </View>
      </View>
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderLeftColor: '#1f2937' }]}>
          <Text style={styles.kpiLabel}>Savings</Text>
          <Text style={styles.kpiValue}> {showSensitiveData ? `₹ ${fmt(savings)}` : '₹ ****'} </Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#0ea5e9' }]}>
          <Text style={styles.kpiLabel}>Savings Rate</Text>
          <Text style={[styles.kpiValue, { color: '#0ea5e9' }]}>{savingsRate.toFixed(1)}%</Text>
        </View>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => setShowStarterModal(true)}
          style={{ padding: 10, borderRadius: 10, backgroundColor: '#0a66e4' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Load Starter Categories</Text>
        </TouchableOpacity>

        <StarterCategoryImporter
          visible={showStarterModal}
          onClose={() => setShowStarterModal(false)}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Add')}>
            <Ionicons name="add-circle" size={16} color="#fff" />
            <Text style={styles.buttonText}>Add Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Transactions')}>
            <Ionicons name="list" size={16} color="#fff" />
            <Text style={styles.buttonText}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Persons')}>
            <Ionicons name="people" size={16} color="#fff" />
            <Text style={styles.buttonText}>Persons</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Categories')}>
            <Ionicons name="pricetags" size={16} color="#fff" />
            <Text style={styles.buttonText}>Categories</Text>
          </TouchableOpacity>
          
        </View>
      </View>

      {/* Mini Trend (last 6 months) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Last 6 Months</Text>
        <View style={styles.trendRow}>
          {last6.map((m) => {
            const incH = Math.max(8, Math.round((m.income / maxBar) * 80));
            const expH = Math.max(8, Math.round((m.expense / maxBar) * 80));
            return (
              <View key={m.key} style={styles.trendCol}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                  <View style={[styles.bar, { height: expH, backgroundColor: '#fee2e2', marginRight: 4 }]} />
                  <View style={[styles.bar, { height: incH, backgroundColor: '#dcfce7' }]} />
                </View>
                <Text style={styles.trendLabel}>{m.label}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#dcfce7' }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#fee2e2' }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>
      </View>

      {/* Top Categories (expense) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Categories (Expense)</Text>
        {topCats.rows.length === 0 ? (
          <Text style={styles.empty}>No expenses this month</Text>
        ) : (
          topCats.rows.map((row) => (
            <View key={row.id} style={styles.catRow}>
              <Text style={styles.catName}>{row.name}</Text>
              <View style={styles.catBarWrap}>
                <View style={[styles.catBarFill, { width: `${Math.min(100, row.pct)}%` }]} />
              </View>
              <Text style={styles.catAmt}>{showSensitiveData ? `₹ ${fmt(row.amount)}` : '₹ ****'} </Text>
            </View>
          ))
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.link}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentTx.length === 0 ? (
          <Text style={styles.empty}>No transactions this month</Text>
        ) : (
          recentTx.slice(0, 5).map((t) => {
            const isIncome = (t.type || '').toLowerCase() === 'income';
            return (
              <View key={t.id} style={styles.txRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle}>
                    {resolveCategoryName(t.categoryId) || '—'}
                    {t.subCategoryId ? ` • ${resolveSubCategoryName(t.categoryId, t.subCategoryId)}` : ''}
                  </Text>
                  <Text style={styles.txSub}>
                    {t.date} {resolvePersonName(t.personId) ? `• ${resolvePersonName(t.personId)}` : ''}{' '}
                    {resolveAccountName(t.accountId) ? `• ${resolveAccountName(t.accountId)}` : ''}
                  </Text>
                </View>
                <Text style={[styles.txAmt, { color: isIncome ? '#16a34a' : '#dc2626' }]}>
                  {showSensitiveData ? `₹ ${fmt(t.amount || 0)}` : '₹ ****'}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Upcoming Recurring (7 days) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upcoming (Next 7 Days)</Text>
        {upcomingRecurring.length === 0 ? (
          <Text style={styles.empty}>No upcoming payments</Text>
        ) : (
          upcomingRecurring.map((r, idx) => (
            <View key={`${r.id || idx}`} style={styles.upRow}>
              <Text style={styles.upTitle}>{r.title || r.type}</Text>
              <Text style={styles.upSub}>
                {r.dueDate} • {fmt2(r.amount || 0)}
              </Text>
            </View>
          ))
        )}
      </View>

      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.98)', // semi-transparent white
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a66e4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6, // For Android
    // Optional: Use gradient background with expo-linear-gradient
  },
  title: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 8 },

  periodRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: {
    height: 40, width: 40, borderRadius: 8,
    borderWidth: 1, borderColor: '#c7d2fe',
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
  },
  inputBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 8, borderWidth: 1, borderColor: '#c7d2fe',
    backgroundColor: '#f8fafc', gap: 8,
  },
  monthBtn: { flex: 1, height: 40, justifyContent: 'center' },
  inputBtnText: { color: '#1f2937', fontWeight: '700' },

  kpiRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 12 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    borderLeftWidth: 4,
  },
  kpiLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '700' },
  kpiValue: { fontSize: 18, fontWeight: '800', color: '#111827' },

  card: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1a3c70', marginBottom: 10 },

  // Trend
  trendRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 120, paddingHorizontal: 6 },
  trendCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: 12, borderRadius: 3 },
  trendLabel: { marginTop: 6, fontSize: 11, color: '#475569' },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3, borderWidth: 1, borderColor: '#e5e7eb' },
  legendText: { color: '#475569', fontSize: 12 },

  // Top categories
  empty: { color: '#6b7280' },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  catName: { flex: 0.9, color: '#111827', fontWeight: '600' },
  catBarWrap: { flex: 2, height: 10, backgroundColor: '#f1f5f9', borderRadius: 999, overflow: 'hidden' },
  catBarFill: { height: '100%', backgroundColor: '#fde68a' },
  catAmt: { width: 90, textAlign: 'right', color: '#111827', fontWeight: '700' },

  // Recent transactions
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { color: '#0a66e4', fontWeight: '700' },
  txRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb',
  },
  txTitle: { color: '#111827', fontWeight: '700' },
  txSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  txAmt: { fontWeight: '800' },

  // Upcoming
  upRow: {
    paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb',
  },
  upTitle: { color: '#111827', fontWeight: '700' },
  upSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },

  // Quick actions
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  button: {
    backgroundColor: '#0a66e4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    width: '48%',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: { color: '#fff', fontWeight: '800' },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Optional for spacing (or use marginRight)
  },

  logo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: 8,
  },

  iconButton: {
    marginLeft: 12,
  },
  fullImage: {
    width: '90%',
    height: '90%',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardView;