// components/BalanceSheetModal.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';

type AnyBalance = MonthlyOpeningBalance | MonthlyClosingBalance;

type Props = {
  visible?: boolean;
  onClose: () => void;
  type: 'opening' | 'closing';           // just for labels
  year: string;                           // "2025"
  month: string;                          // "8" or "08"
  persons?: Person[];                     // may be briefly undefined → default []
  accounts?: Account[];                   // unused (we compute from persons), safe default []
  balances?: AnyBalance[];                // FULL list for ALL months → default []
  selectedPersonId?: string;              // optional enforced person filter
  onSave: (updated: AnyBalance[]) => void | Promise<void>;
};

const BalanceSheetModal: React.FC<Props> = (rawProps) => {
  // ---------- safe defaults ----------
  const {
    visible = false,
    onClose,
    type,
    year,
    month,
    persons = [],
    accounts = [],
    balances = [],
    selectedPersonId = '',
    onSave,
  } = rawProps;

  // ---------- helpers ----------
  const nYear = (v: string | number) => Number(v);
  const nMonth = (v: string | number) => Number(v);

  const prettyMonthYear = useMemo(() => {
    const y = nYear(year);
    const m = nMonth(month);
    if (!y || !m) return `${month}/${year}`;
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [year, month]);

  const personName = (pid: string) =>
    persons.find((p) => p.id === pid)?.name ?? 'Unknown';

  const accountLabel = (aid: string) => {
    const all = persons.flatMap((p) => p.accounts ?? []);
    const acc = all.find((a) => a.id === aid);
    if (!acc) return 'Unknown';
    const owner = persons.find((p) => p.id === acc.personId)?.name ?? 'Unknown';
    return `${acc.paymentMode} (${owner})`;
  };

  const makeId = () => {
    try {
      // @ts-ignore
      if (globalThis?.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    } catch { }
    return `bal_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  };

  // ---------- local state ----------
  // We keep the full list across months so that switching month while the modal is open
  // won’t nuke data for other months. We only reset when the modal OPENS.
  const [working, setWorking] = useState<AnyBalance[]>(balances);
  const [personId, setPersonId] = useState<string>(selectedPersonId);
  const [accountId, setAccountId] = useState<string>('');
  const [amountText, setAmountText] = useState<string>('');

  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [editBuffer, setEditBuffer] = useState<Record<string, string>>({});

useEffect(() => {
  if (!visible) return;
  // fresh baseline from props each time it OPENS
  setWorking(balances ?? []);
  setEditing({});
  setEditBuffer({});
  setPersonId(selectedPersonId ?? '');
  setAccountId('');
  setAmountText('');
}, [visible, balances, selectedPersonId, year, month]);

  // ---------- derived ----------
  const personAccounts = useMemo(() => {
    if (!personId) return [] as Account[];
    const p = persons.find((pp) => pp.id === personId);
    return (p?.accounts ?? []).filter((a) => !!a?.id);
  }, [personId, persons]);

  // slice for current period (+ enforced person filter, if provided)
  const periodBalances = useMemo(() => {
    const y = nYear(year);
    const m = nMonth(month);
    const base = (working ?? []).filter(
      (b) => nYear(b.year) === y && nMonth(b.month) === m
    );
    return selectedPersonId ? base.filter((b) => b.personId === selectedPersonId) : base;
  }, [working, year, month, selectedPersonId]);

  const sortedPeriodBalances = useMemo(() => {
    return [...periodBalances].sort(
      (a, b) =>
        personName(a.personId).localeCompare(personName(b.personId)) ||
        accountLabel(a.accountId).localeCompare(accountLabel(b.accountId))
    );
  }, [periodBalances, persons]);

  // ---------- actions ----------
  const clearAddForm = () => {
    setAccountId('');
    setAmountText('');
  };

  const handleAdd = () => {
    if (!personId) {
      Alert.alert('Select person', 'Please select a person.');
      return;
    }
    if (!accountId) {
      Alert.alert('Select account', 'Please select an account.');
      return;
    }
    const amount = parseFloat(amountText);
    if (isNaN(amount)) {
      Alert.alert('Invalid amount', 'Enter a valid number.');
      return;
    }
    if (amount < 0) {
      Alert.alert('Invalid amount', 'Amount cannot be negative.');
      return;
    }

    const dup = working.find(
      (b) =>
        nYear(b.year) === nYear(year) &&
        nMonth(b.month) === nMonth(month) &&
        b.personId === personId &&
        b.accountId === accountId
    );
    if (dup) {
      Alert.alert('Already exists', 'This person & account already has a balance for this month.');
      return;
    }

    const newRow: AnyBalance = {
      id: makeId(),
      year,
      month,
      personId,
      accountId,
      amount,
      // Use "notes" if your models have it; if they use "note", change key to "note".
      notes: type === 'opening' ? 'Opening balance' : 'Closing balance',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as AnyBalance;

    setWorking((prev) => [...prev, newRow]);
    clearAddForm();
  };

  const startEdit = (id: string, currentAmount: number) => {
    setEditing((prev) => ({ ...prev, [id]: true }));
    setEditBuffer((prev) => ({ ...prev, [id]: String(currentAmount) }));
  };

  const cancelEdit = (id: string) => {
    setEditing((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
    setEditBuffer((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
  };

  const saveEdit = (id: string) => {
    const text = editBuffer[id];
    const amt = parseFloat(text);
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Invalid amount', 'Enter a valid non-negative number.');
      return;
    }
    setWorking((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, amount: amt, updatedAt: new Date().toISOString() } : b
      )
    );
    cancelEdit(id);
  };

  const handleClose = () => {
    setEditing({});
    setEditBuffer({});
    onClose();
  };

  const deleteRow = (id: string) => {
    Alert.alert('Delete balance', 'Are you sure you want to delete this row?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setWorking((prev) => prev.filter((b) => b.id !== id)),
      },
    ]);
  };

  const handleSaveAll = async () => {
    await onSave(working);
    onClose();
  };

  // ---------- UI ----------
  const headerTitle = type === 'opening' ? 'Opening Balances' : 'Closing Balances';

  return (
    <Modal
      visible={visible} animationType="slide" 
      transparent
      onRequestClose={handleClose}  // 
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={[styles.card, { flexGrow: 1, minHeight: 10 }]}>
              <Text style={styles.title}>{headerTitle}</Text>
              <Text style={styles.subtitle}>{prettyMonthYear}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Existing rows */}
          <View style={[styles.card, { flexGrow: 1, minHeight: 10 }]}>
            <View style={styles.listHeader}>
              <Text style={[styles.colBase, styles.colPersonHdr]}>Person</Text>
              <Text style={[styles.colBase, styles.colAccountHdr]}>Account</Text>
              <Text style={[styles.colBase, styles.colAmtHdr, { textAlign: 'right' }]}>Amount</Text>
              <Text style={[styles.colBase, styles.colActionsHdr]} />
            </View>

            <FlatList
              data={sortedPeriodBalances}
              keyExtractor={(item) => item.id}
              extraData={working}    
              removeClippedSubviews={false}                                        // ← helps in modals
              contentContainerStyle={{ paddingBottom: 12 }}
              renderItem={({ item, index }) => {
                const isEditing = !!editing[item.id];
                const alt = index % 2 === 1;
                return (
                  <View style={[styles.row, alt && styles.rowAlt]}>
                    <Text style={[styles.colPerson]} numberOfLines={1} ellipsizeMode="tail">
                      {personName(item.personId)}
                    </Text>

                    <Text style={[styles.colAccount]} numberOfLines={1} ellipsizeMode="tail">
                      {accountLabel(item.accountId)}
                    </Text>

                    <View style={styles.colAmt}>
                      {isEditing ? (
                        <TextInput
                          value={editBuffer[item.id]}
                          onChangeText={(t) => setEditBuffer((p) => ({ ...p, [item.id]: t }))}
                          keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })}
                          style={styles.inlineInput}
                          autoFocus
                        />
                      ) : (
                        <TouchableOpacity onPress={() => startEdit(item.id, item.amount)}>
                          <Text style={{ textAlign: 'right', fontWeight: '600' }}>
                            ₹ {item.amount.toFixed(2)}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.colActions}>
                      {isEditing ? (
                        <>
                          <TouchableOpacity
                            onPress={() => saveEdit(item.id)}
                            style={[styles.smallBtn, { backgroundColor: '#10b981' }]}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => cancelEdit(item.id)}
                            style={[styles.smallBtn, { backgroundColor: '#9ca3af' }]}
                          >
                            <Ionicons name="close" size={16} color="#fff" />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity
                            onPress={() => startEdit(item.id, item.amount)}
                            style={[styles.smallBtn, { backgroundColor: '#3b82f6' }]}
                          >
                            <Ionicons name="create-outline" size={16} color="#fff" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => deleteRow(item.id)}
                            style={[styles.smallBtn, { backgroundColor: '#ef4444' }]}
                          >
                            <Ionicons name="trash-outline" size={16} color="#fff" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={{ paddingVertical: 16 }}>
                  <Text style={{ textAlign: 'center', color: '#6b7280' }}>
                    No balances added for this month.
                  </Text>
                </View>
              }
            />
          </View>

          {/* Add Row */}
          <View style={styles.card}>
            <Text style={{ fontWeight: '700', color: '#1f2937', marginBottom: 6 }}>
              Add for {prettyMonthYear}
            </Text>

            {/* Person */}
            <View style={styles.inputRow}>
              <Text style={styles.label}>Person</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  enabled={!selectedPersonId}
                  selectedValue={personId}
                  onValueChange={(v) => {
                    setPersonId(String(v));
                    setAccountId('');
                  }}
                >
                  {!selectedPersonId && <Picker.Item label="Select person" value="" />}
                  {persons.map((p) => (
                    <Picker.Item key={p.id} label={p.name} value={p.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Account */}
            <View style={styles.inputRow}>
              <Text style={styles.label}>Account</Text>
              <View style={[styles.pickerWrap, !personId && styles.pickerDisabled]}>
                <Picker
                  enabled={!!personId}
                  selectedValue={accountId}
                  onValueChange={(v) => setAccountId(String(v))}
                >
                  <Picker.Item
                    label={personId ? 'Select account' : 'Select person first'}
                    value=""
                  />
                  {personAccounts.map((a) => (
                    <Picker.Item key={a.id} label={a.paymentMode} value={a.id} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Amount + Add */}
            <View style={styles.addRow}>
              <View style={[styles.amountBox, { flex: 1 }]}>
                <Text style={styles.amountLabel}>Amount</Text>
                <TextInput
                  value={amountText}
                  onChangeText={setAmountText}
                  keyboardType={Platform.select({ ios: 'decimal-pad', android: 'numeric' })}
                  placeholder="0.00"
                  style={styles.amountInput}
                  returnKeyType="done"
                />
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleClose} style={[styles.footerBtn, styles.cancelBtn]}>
              <Text style={styles.footerBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveAll} style={[styles.footerBtn, styles.saveBtn]}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={[styles.footerBtnText, { color: '#fff', marginLeft: 6 }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ---------- styles ----------
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },

  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#475569', marginTop: 2 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: '#e2e8f0' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },

  listHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 4,
  },
  colBase: { paddingHorizontal: 4, fontWeight: '700', color: '#334155' },
  colPersonHdr: { flex: 1.1, minWidth: 0 },
  colAccountHdr: { flex: 1.2, minWidth: 0 },
  colAmtHdr: { width: 110 },
  colActionsHdr: { width: 96 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  rowAlt: { backgroundColor: '#f9fbff' },

  colPerson: { flex: 1.1, paddingHorizontal: 4, flexShrink: 1, minWidth: 0 },
  colAccount: { flex: 1.2, paddingHorizontal: 4, flexShrink: 1, minWidth: 0 },
  colAmt: { width: 110, paddingHorizontal: 4, alignItems: 'flex-end' },
  colActions: {
    width: 96,
    paddingHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  inputRow: { marginBottom: 8 },
  label: { fontSize: 12, color: '#334155', marginBottom: 4 },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  pickerDisabled: { opacity: 0.55 },

  addRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  amountBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
    backgroundColor: '#fff',
  },
  amountLabel: { fontSize: 11, color: '#64748b' },
  amountInput: {
    paddingVertical: Platform.select({ ios: 10, android: 6 }),
    fontSize: 16,
    color: '#0f172a',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '700', marginLeft: 6 },

  inlineInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: Platform.select({ ios: 6, android: 2 }),
    paddingHorizontal: 8,
    textAlign: 'right',
    fontSize: 15,
    backgroundColor: '#fff',
  },
  smallBtn: {
    marginLeft: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 10,
  },
  footerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: '#e2e8f0' },
  saveBtn: { backgroundColor: '#16a34a' },
  footerBtnText: { fontWeight: '700', color: '#0f172a' },
});

export default BalanceSheetModal;