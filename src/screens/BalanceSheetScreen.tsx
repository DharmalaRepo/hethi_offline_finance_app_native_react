// screens/BalanceSheetScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CheckBox from '@react-native-community/checkbox';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import uuid from 'react-native-uuid';
import { format } from 'date-fns';
import BalanceSheetModal from '../components/BalanceSheetModal';

import { Account } from '../models/Account';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

import {
  calculateSummary,
  getFilteredBalances,
  getFilteredTransactions,
  generatePersonAccountSummary,
} from '../utils/balanceSheetUtils';

import { useAppData } from '../context/AppDataProvider';
import { useIsFocused } from '@react-navigation/native';

const BalanceSheetScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const today = new Date();

  // Single source of truth for the period (year/month)
  const [period, setPeriod] = useState<{ year: number; month: number }>({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Filters
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // UI bits
  const [logoModalVisible, setLogoModalVisible] = useState(false);
  const [showOpening, setShowOpening] = useState(true);
  const [showClosing, setShowClosing] = useState(true);
  const [expandedOpening, setExpandedOpening] = useState<number[]>([]);
  const [expandedClosing, setExpandedClosing] = useState<number[]>([]);
  const [multiSelectEnabled] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Add/Edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'opening' | 'closing'>('opening');

  // Derived: accounts for the currently selected person
  const {
    persons,
    transactions,
    categories,
    monthlyOpeningBalance,
    monthlyClosingBalance,
    reloadAppData,
  } = useAppData();

  const personAccounts: Account[] = useMemo(() => {
    if (!selectedPersonId) return [];
    const p = persons.find((x) => x.id === selectedPersonId);
    return p?.accounts || [];
  }, [selectedPersonId, persons]);

  useEffect(() => {
    if (isFocused) {
      reloadAppData();
    }
  }, [isFocused]);

  // Ensure account filter resets when person is cleared/changed
  useEffect(() => {
    setSelectedAccountId(''); // reset to "All" whenever person changes
  }, [selectedPersonId]);

  // Labels
  const periodLabel = useMemo(
    () =>
      format(new Date(period.year, period.month - 1, 1), 'MMM yyyy'), // e.g. Aug 2025
    [period],
  );

  // Helpers to resolve names
  const resolvePersonName = (personId: string) => {
    return persons.find((p) => p.id === personId)?.name ?? 'Unknown';
  };
  const resolveAccountName = (accountId: string) => {
    const all = persons.flatMap((p) => p.accounts || []);
    const account = all.find((a) => a.id === accountId);
    if (!account) return 'Unknown';
    const person = persons.find((p) => p.id === account.personId);
    return `${account.paymentMode || 'Unnamed Account'} (${person?.name ?? 'Unknown'})`;
  };

  const resolveCategoryName = (categoryId: string) => {
  return categories.find((c) => c.id === categoryId)?.name ?? 'Unknown';
};

const resolveSubCategoryName = (subCategoryId: string) => {
  const all = categories.flatMap((c) => c.subcategories || []);
  return all.find((sc) => sc.id === subCategoryId)?.name ?? 'Unknown';
}

  // Filtered data (computed off current filters)
  const yearStr = String(period.year);
  // If your data stores months zero-padded, use padStart(2, '0') below:
  const monthStr = String(period.month); // or String(period.month).padStart(2, '0')

  const filteredOpening = useMemo(
    () => getFilteredBalances(
      monthlyOpeningBalance,
      yearStr,
      monthStr,
      selectedPersonId,
      selectedAccountId
    ),
    [monthlyOpeningBalance, yearStr, monthStr, selectedPersonId, selectedAccountId]
  );

  const filteredClosing = useMemo(
    () => getFilteredBalances(
      monthlyClosingBalance,
      yearStr,
      monthStr,
      selectedPersonId,
      selectedAccountId
    ),
    [monthlyClosingBalance, yearStr, monthStr, selectedPersonId, selectedAccountId]
  );

  const filteredTxns = useMemo(
    () => getFilteredTransactions(
      transactions,
      yearStr,
      monthStr,
      selectedPersonId,
      selectedAccountId
    ),
    [transactions, yearStr, monthStr, selectedPersonId, selectedAccountId]
  );

  const openingSummaryData = useMemo(
    () => generatePersonAccountSummary(filteredOpening, selectedPersonId, selectedAccountId),
    [filteredOpening, selectedPersonId, selectedAccountId]
  );
  const closingSummaryData = useMemo(
    () => generatePersonAccountSummary(filteredClosing, selectedPersonId, selectedAccountId),
    [filteredClosing, selectedPersonId, selectedAccountId]
  );

  const balanceSummary = useMemo(
    () =>
      calculateSummary(
        filteredTxns,
        filteredOpening,
        filteredClosing,
        {
          year: yearStr,
          month: monthStr,
          personId: selectedPersonId,
          accountId: selectedAccountId,
        }
      ),
    [filteredTxns, filteredOpening, filteredClosing, yearStr, monthStr, selectedPersonId, selectedAccountId]
  );

  // Toggle expand collapse
  const toggleExpand = (index: number, type: 'opening' | 'closing') => {
    if (type === 'opening') {
      setExpandedOpening((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setExpandedClosing((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    }
  };

  // Multi-select toggles (kept for parity with your code)
  const toggleCheckbox = (personId: string) => {
    setSelectedItems((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  };

  // Section totals
  const getBalance = (
    balances: (MonthlyOpeningBalance | MonthlyClosingBalance)[],
    year: string,
    month: string,
    personId?: string,
    accountId?: string
  ): number => {
    return balances
      .filter(
        (b) =>
          b.year === year &&
          b.month === month &&
          (!personId || b.personId === personId) &&
          (!accountId || b.accountId === accountId)
      )
      .reduce((sum, b) => sum + b.amount, 0);
  };

  // Carry forward
  const handleCarryForward = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Only allow carry-forward FROM past months
    if (period.year > currentYear || (period.year === currentYear && period.month >= currentMonth)) {
      Alert.alert('Not Allowed', 'You can only carry forward from past months.');
      return;
    }

    const fromDate = new Date(period.year, period.month - 1, 1);
    const toDate = new Date(period.year, period.month - 1, 1);
    toDate.setMonth(toDate.getMonth() + 1);

    // Disallow target beyond current month
    if (
      toDate.getFullYear() > currentYear ||
      (toDate.getFullYear() === currentYear && toDate.getMonth() + 1 > currentMonth)
    ) {
      Alert.alert('Not Allowed', 'You can only carry forward up to the current month.');
      return;
    }

    Alert.alert(
      'Carry Forward',
      `Carry closing (${format(fromDate, 'MMM yyyy')}) → opening (${format(toDate, 'MMM yyyy')})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => doCarryForward(fromDate, toDate),
        },
      ]
    );
  };
  const shiftPeriod = (delta: number) => {
    const target = new Date(period.year, period.month - 1 + delta, 1);
    const today = new Date();
    // block > current month
    if (target.getFullYear() > today.getFullYear() ||
      (target.getFullYear() === today.getFullYear() && target.getMonth() > today.getMonth())) {
      return;
    }
    setPeriod({ year: target.getFullYear(), month: target.getMonth() + 1 });
  };

  const doCarryForward = async (fromDate: Date, toDate: Date) => {
    const fromYear = String(fromDate.getFullYear());
    const fromMonth = String(fromDate.getMonth() + 1);
    const toYear = String(toDate.getFullYear());
    const toMonth = String(toDate.getMonth() + 1);

    const source = monthlyClosingBalance.filter(
      (b) => b.year === fromYear && b.month === fromMonth
    );

    if (source.length === 0) {
      Alert.alert('No Data', 'No closing balances found for this month.');
      return;
    }

    const newOpening: MonthlyOpeningBalance[] = source.map((b) => ({
      ...b,
      id: uuid.v4().toString(),
      year: toYear,
      month: toMonth,
      note: `Carried forward from ${fromMonth}/${fromYear}`,
    }));

    // Persist via your service
    await saveOpeningBalancesMerged(newOpening, toYear, toMonth);
    await reloadAppData();
    Alert.alert('Success', 'Closing balances carried forward successfully.');
  };

  // Merge helper (keeps only non-target-month rows + new target month rows)
  const saveOpeningBalancesMerged = async (
    newRows: MonthlyOpeningBalance[],
    toYear: string,
    toMonth: string
  ) => {
    // @ts-ignore – you already import these services in the original file
    const { saveOpeningBalances } = await import('../services/mockDataService');
    const existingOthers = monthlyOpeningBalance.filter(
      (ob) => !(ob.year === toYear && ob.month === toMonth)
    );
    await saveOpeningBalances([...existingOthers, ...newRows]);
  };

  // Export: quick CSV dump of filtered txns + balances
  const handleExportPDF = async () => {
  // --- helpers ---
  const INR = (n: number) => `&#8377;${Number(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  })}`;

  const esc = (s: any) =>
    String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  type Row = { personId: string; accountName: string; amount: number };

  const groupByPerson = (rows: Row[]) => {
    const map: Record<string, { personId: string; items: Row[]; total: number }> = {};
    rows.forEach(r => {
      if (!map[r.personId]) map[r.personId] = { personId: r.personId, items: [], total: 0 };
      map[r.personId].items.push(r);
      map[r.personId].total += r.amount;
    });
    return Object.values(map);
  };

  // Data transforms (uses your existing filtered lists and helpers)
  const openingRows: Row[] = (filteredOpening || []).map(b => ({
    personId: b.personId,
    accountName: esc(resolveAccountName(b.accountId)),
    amount: b.amount,
  }));
  const closingRows: Row[] = (filteredClosing || []).map(b => ({
    personId: b.personId,
    accountName: esc(resolveAccountName(b.accountId)),
    amount: b.amount,
  }));
  const openingGroups = groupByPerson(openingRows);
  const closingGroups = groupByPerson(closingRows);
  const openingGrand = openingRows.reduce((s, r) => s + r.amount, 0);
  const closingGrand = closingRows.reduce((s, r) => s + r.amount, 0);

  const txns = [...(filteredTxns || [])].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  // --- HTML builders (conservative CSS) ---
  const Summary = `
    <div class="card">
      <div class="h2">Summary</div>
      <table class="tbl tight">
        <thead><tr><th class="tl">Item</th><th class="tr">Amount</th></tr></thead>
        <tbody>
          <tr><td class="tl">Opening Balance</td><td class="tr">${INR(balanceSummary.openingBalance)}</td></tr>
          <tr><td class="tl">Total Income</td><td class="tr green">+${INR(balanceSummary.totalIncome)}</td></tr>
          <tr><td class="tl">Pending Income</td><td class="tr green">+${INR(balanceSummary.pendingIncome)}</td></tr>
          <tr><td class="tl">Total Expense</td><td class="tr red">-${INR(balanceSummary.totalExpense)}</td></tr>
          <tr><td class="tl">Pending Expense</td><td class="tr red">-${INR(balanceSummary.pendingExpense)}</td></tr>
          <tr><td class="tl">Closing Balance</td><td class="tr">${INR(balanceSummary.closingBalance)}</td></tr>
          <tr><td class="tl muted">Untracked Difference</td><td class="tr muted">${INR(balanceSummary.difference)}</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const GroupTable = (title: string, groups: ReturnType<typeof groupByPerson>, grand: number) => `
    <div class="card">
      <div class="h2">${esc(title)} <span class="right">Total: ${INR(grand)}</span></div>
      ${
        groups.length === 0
          ? '<div class="empty">No data for this period</div>'
          : `
        <table class="tbl zebra">
          <thead>
            <tr><th class="tl">Account</th><th class="tr">Amount</th></tr>
          </thead>
          ${groups.map(g => {
            const name = esc(resolvePersonName(g.personId));
            const items = g.items.map(it => `
              <tr><td class="tl">${it.accountName}</td><td class="tr">${INR(it.amount)}</td></tr>
            `).join('');
            return `
              <tbody>
                <tr class="person"><td colspan="2">${name}</td></tr>
                ${items}
                <tr class="subtotal"><td>Subtotal — ${name}</td><td class="tr">${INR(g.total)}</td></tr>
              </tbody>
            `;
          }).join('')}
        </table>`
      }
    </div>
  `;

  const Transactions = `
    <div class="card">
      <div class="h2">Transactions</div>
      ${
        txns.length === 0
          ? '<div class="empty">No transactions for this period</div>'
          : `
        <table class="tbl zebra">
          <thead>
            <tr>
              <th class="tl">Date</th>
              <th class="tl">Category</th>
              <th class="tl">Sub Category</th>
              <th class="tl">Person</th>
              <th class="tl">Account</th>
              <th class="tr">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${txns.map(t => {
              const isIncome = (t.type || '').toLowerCase() === 'income';
              const cls = isIncome ? 'green' : 'red';
              const sign = isIncome ? '+' : '-';
              return `
                <tr>
                  <td class="tl">${esc(t.date || '')}</td>
                  <td class="tl">${esc(t.categoryId ? resolveCategoryName(t.categoryId) : '')}</td>
                  <td class="tl">${esc(t.subCategoryId ? resolveSubCategoryName(t.subCategoryId) : '')}</td>
                  <td class="tl">${esc(t.personId ? resolvePersonName(t.personId) : '')}</td>
                  <td class="tl">${esc(t.accountId ? resolveAccountName(t.accountId) : '')}</td>
                  <td class="tr ${cls}">${sign}${INR(t.amount || 0)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>`
      }
    </div>
  `;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: A4; margin: 36pt; }
      body { font-family: -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; color:#0f172a; }
      h1 { margin: 0 0 6pt; font-size: 18pt; }
      .period { color:#475569; margin: 0 0 12pt; }
      .card { border:1px solid #e5e7eb; border-radius:10pt; padding:10pt; margin: 0 0 12pt; }
      .h2 { font-size: 12pt; font-weight: 700; color:#1f2937; display:flex; justify-content:space-between; }
      .right { font-weight:700; color:#111827; }
      .empty { padding:8pt 10pt; background:#f8fafc; border:1px dashed #e5e7eb; border-radius:8pt; color:#64748b; margin-top:6pt; }
      .tbl { width:100%; border-collapse: collapse; }
      .tbl thead th { font-size:9pt; color:#475569; border-bottom:1px solid #e2e8f0; padding:6pt; }
      .tbl td { padding:6pt; border-bottom:1px solid #f1f5f9; font-size:9.5pt; }
      .tbl.tight td, .tbl.tight th { padding:4pt 6pt; }
      .person td { background:#f1f5f9; font-weight:700; border-top:1px solid #e2e8f0; }
      .subtotal td { font-weight:700; border-top:1px dashed #e2e8f0; }
      .zebra tbody tr:nth-child(odd) { background:#fbfbfb; }
      .tl { text-align:left; } .tr { text-align:right; }
      .green { color:#059669; } .red { color:#dc2626; } .muted { color:#6b7280; }
      .pagebreak { page-break-before: always; }
    </style>
  </head>
  <body>
    <h1>Balance Sheet</h1>
    <div class="period">${esc(periodLabel)}</div>

    ${Summary}

    ${GroupTable('Opening Balances', openingGroups, openingGrand)}

    <div class="pagebreak"></div>

    ${GroupTable('Closing Balances', closingGroups, closingGrand)}

    ${Transactions}
  </body>
  </html>
  `;

  try {
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });
  
        if (!(await Sharing.isAvailableAsync())) {
          alert('Sharing is not available on this device');
          return;
        }
  
        await Sharing.shareAsync(uri);
      } catch (err) {
        console.error('PDF Export Error:', err);
        alert('Failed to generate or share PDF');
      }
};

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* App header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setLogoModalVisible(true)}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          </TouchableOpacity>
          <Text style={styles.title}>Balance Sheet</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={reloadAppData} style={styles.headerIconBtn}>
            <Ionicons name="refresh" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportPDF} style={styles.headerIconBtn}>
            <Ionicons name="share-outline" size={20} color="#fff" />
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

      {/* Filters */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Filters</Text>

        <View style={styles.filtersRow}>
          {/* Period */}
          <View style={{ flex: 1.4, overflow: 'visible' }}>
            <Text style={styles.label}>Month: {periodLabel}</Text>

            <View style={styles.periodRow}>
              {/* Prev */}
              <TouchableOpacity
                onPress={() => shiftPeriod(-1)}
                style={styles.navBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-back" size={18} color="#1a3c70" />
              </TouchableOpacity>

              {/* Current month (opens date picker) */}
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[styles.inputBtn, styles.monthBtn]}
              >
                <Ionicons name="calendar" size={16} color="#1a3c70" />
              </TouchableOpacity>

              {/* Next */}
              <TouchableOpacity
                onPress={() => shiftPeriod(1)}
                style={styles.navBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-forward" size={18} color="#1a3c70" />
              </TouchableOpacity>
            </View>

            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              onConfirm={(date: Date) => {
                setShowDatePicker(false);
                setPeriod({ year: date.getFullYear(), month: date.getMonth() + 1 });
              }}
              onCancel={() => setShowDatePicker(false)}
            />
          </View>

          {/* Person */}
          <View style={{ flex: 0.8, marginHorizontal: 2 }}>
            <Text style={styles.label}>Person: {selectedPersonId? resolvePersonName(selectedPersonId) : 'ALL'}</Text>
            <View style={styles.pickerWrap}>
              <Ionicons name="person" size={16} color="#1a3c70" style={{ marginRight: 2 }} />
              <Picker
                selectedValue={selectedPersonId}
                onValueChange={(v) => setSelectedPersonId(v)}
                style={styles.picker}
              >
                <Picker.Item label="All" value="" />
                {persons.map((p) => (
                  <Picker.Item key={p.id} label={p.name} value={p.id} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Account */}
          <View style={{ flex: 0.8, marginHorizontal: 2 }}>
            <Text style={styles.label}>Account: {selectedAccountId? resolveAccountName(selectedAccountId) : 'ALL'}</Text>
            <View
              style={[
                styles.pickerWrap,
                !selectedPersonId && { opacity: 0.5 },
              ]}
              pointerEvents={selectedPersonId ? 'auto' : 'none'}
            >
              <Ionicons name="wallet" size={16} color="#1a3c70" style={{ marginRight: 6 }} />
              <Picker
                selectedValue={selectedAccountId}
                onValueChange={(v) => setSelectedAccountId(v)}
                style={styles.picker}
              >
                <Picker.Item label="All" value="" />
                {personAccounts.map((a) => (
                  <Picker.Item key={a.id} label={a.paymentMode} value={a.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>

      {/* Opening Balance */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Opening Balance</Text>
          <Text style={styles.sectionTotal}>
            ₹ {getBalance(monthlyOpeningBalance, yearStr, monthStr, selectedPersonId, selectedAccountId).toFixed(2)}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => setShowOpening((s) => !s)} style={styles.chipBtn}>
              <Text style={styles.chipText}>{showOpening ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { marginLeft: 8 }]}
              onPress={() => {
                setModalType('opening');
                setModalVisible(true);
              }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showOpening && (
          <View style={{ marginTop: 8 }}>
            {openingSummaryData.map((pSum: any, index: number) => (
              <View key={pSum.personId} style={styles.expandCard}>
                <TouchableOpacity
                  onPress={() => toggleExpand(index, 'opening')}
                  style={styles.expandHeader}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {multiSelectEnabled && (
                      <CheckBox
                        value={selectedItems.includes(pSum.personId)}
                        onValueChange={() => toggleCheckbox(pSum.personId)}
                      />
                    )}
                    <Text style={styles.expandTitle}>{resolvePersonName(pSum.personId)}</Text>
                  </View>
                  <View style={styles.expandRight}>
                    <Text style={styles.expandAmount}>₹{pSum.totalAmount.toFixed(2)}</Text>
                    <Ionicons
                      name={expandedOpening.includes(index) ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#1a3c70"
                    />
                  </View>
                </TouchableOpacity>

                {expandedOpening.includes(index) && (
                  <View style={styles.expandBody}>
                    {pSum.accounts.map((acc: { accountId: string; amount: number }) => (
                      <View key={acc.accountId} style={styles.rowItem}>
                        <Text style={styles.rowLeft}>{resolveAccountName(acc.accountId)}</Text>
                        <Text style={styles.rowRight}>₹{acc.amount.toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Closing Balance */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Closing Balance</Text>
          <Text style={styles.sectionTotal}>
            ₹ {getBalance(monthlyClosingBalance, yearStr, monthStr, selectedPersonId, selectedAccountId).toFixed(2)}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => setShowClosing((s) => !s)} style={styles.chipBtn}>
              <Text style={styles.chipText}>{showClosing ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { marginLeft: 8 }]}
              onPress={() => {
                setModalType('closing');
                setModalVisible(true);
              }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showClosing && (
          <View style={{ marginTop: 8 }}>
            {closingSummaryData.map((pSum: any, index: number) => (
              <View key={pSum.personId} style={styles.expandCard}>
                <TouchableOpacity
                  onPress={() => toggleExpand(index, 'closing')}
                  style={styles.expandHeader}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {multiSelectEnabled && (
                      <CheckBox
                        value={selectedItems.includes(pSum.personId)}
                        onValueChange={() => toggleCheckbox(pSum.personId)}
                      />
                    )}
                    <Text style={styles.expandTitle}>{resolvePersonName(pSum.personId)}</Text>
                  </View>
                  <View style={styles.expandRight}>
                    <Text style={styles.expandAmount}>₹{pSum.totalAmount.toFixed(2)}</Text>
                    <Ionicons
                      name={expandedClosing.includes(index) ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#1a3c70"
                    />
                  </View>
                </TouchableOpacity>

                {expandedClosing.includes(index) && (
                  <View style={styles.expandBody}>
                    {pSum.accounts.map((acc: { accountId: string; amount: number }) => (
                      <View key={acc.accountId} style={styles.rowItem}>
                        <Text style={styles.rowLeft}>{resolveAccountName(acc.accountId)}</Text>
                        <Text style={styles.rowRight}>₹{acc.amount.toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Carry Forward */}
      <TouchableOpacity style={styles.primaryBtn} onPress={handleCarryForward}>
        <Ionicons name="arrow-forward-circle" size={18} color="#fff" />
        <Text style={styles.primaryBtnText}>Carry Forward Closing → Next Opening</Text>
      </TouchableOpacity>

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Summary</Text>

        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Opening Balance</Text>
          <Text style={styles.sumValue}>₹{balanceSummary.openingBalance.toFixed(2)}</Text>
        </View>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Total Income</Text>
          <Text style={[styles.sumValue, { color: 'green' }]}>
            +₹{balanceSummary.totalIncome.toFixed(2)}
          </Text>
        </View>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Total Expense</Text>
          <Text style={[styles.sumValue, { color: 'red' }]}>
            -₹{balanceSummary.totalExpense.toFixed(2)}
          </Text>
        </View>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Closing Balance</Text>
          <Text style={styles.sumValue}>₹{balanceSummary.closingBalance.toFixed(2)}</Text>
        </View>

        <View style={[styles.sumRow, { marginTop: 6 }]}>
          <Text style={[styles.sumLabel, { color: '#c2410c' }]}>Untracked Difference</Text>
          <Text style={[styles.sumValue, { color: '#c2410c' }]}>
            ₹{balanceSummary.difference.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Add/Edit Modal */}
      <BalanceSheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalType}
        year={yearStr}
        month={monthStr}
        persons={persons}
        accounts={personAccounts}
        balances={modalType === 'opening' ? monthlyOpeningBalance : monthlyClosingBalance}
        selectedPersonId={selectedPersonId}
        onSave={async (updated) => {
          if (modalType === 'opening') {
            const { saveOpeningBalances } = await import('../services/mockDataService');
            await saveOpeningBalances(updated as MonthlyOpeningBalance[]);
          } else {
            const { saveClosingBalances } = await import('../services/mockDataService');
            await saveClosingBalances(updated as MonthlyClosingBalance[]);
          }
          await reloadAppData();
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fc' },

  picker: { flex: 1, height: 40 },

  inputBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#f8fafc',
    gap: 8,
  },

  inputBtnText: { color: '#1f2937', fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a66e4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 28, height: 28, resizeMode: 'contain', marginRight: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerIconBtn: {
    marginLeft: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 8,
  },

  card: {
    marginHorizontal: 12,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a3c70', marginBottom: 10 },

  filtersRow: { flexDirection: 'row', alignItems: 'flex-end' },
  label: { fontSize: 12, fontWeight: '600', color: '#334155', marginBottom: 6 },


  pickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
  },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1a3c70' },
  sectionTotal: { fontSize: 16, fontWeight: '700', color: '#111827' },
  chipBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#eef2ff',
    borderRadius: 999,
  },
  chipText: { color: '#1f3b8a', fontWeight: '600', fontSize: 12 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#0a66e4',
    borderRadius: 999,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12, marginLeft: 6 },

  expandCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  expandHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#f3f6ff',
    borderTopLeftRadius: 10, borderTopRightRadius: 10,
  },
  expandTitle: { fontSize: 15, fontWeight: '700', color: '#1a3c70', marginLeft: 6 },
  expandRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expandAmount: { fontWeight: '700', color: '#111827' },
  expandBody: { paddingHorizontal: 12, paddingVertical: 8 },
  rowItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eef2ff',
  },
  rowLeft: { color: '#1f2937' },
  rowRight: { color: '#1f2937', fontWeight: '700' },

  primaryBtn: {
    marginHorizontal: 12,
    marginBottom: 10,
    backgroundColor: '#0a66e4',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // in StyleSheet.create(...)
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    height: 40,
    width: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },

  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sumLabel: { fontWeight: '600', color: '#334155' },
  sumValue: { color: '#111827', fontWeight: '700' },

  // modal for logo
  modalContainer: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBackground: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '86%', height: '86%' },

  monthBtn: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
});

export default BalanceSheetScreen;