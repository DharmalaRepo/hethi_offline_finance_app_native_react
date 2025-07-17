import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity } from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import { Picker } from '@react-native-picker/picker';
import uuid from 'react-native-uuid';
import BalanceSheetModal from '../components/BalanceSheetModal';
import { getOpeningBalances, getClosingBalances, getPersons, saveOpeningBalances, saveClosingBalances } from '../services/mockDataService';
import { getAllTransactions } from '../services/mockDataService';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';
import {calculateSummary,  getUniqueYearsMonths,  getFilteredBalances,  getFilteredTransactions, generatePersonAccountSummary} from '../utils/balanceSheetUtils';
import { Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MonthPicker from 'react-native-month-year-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const BalanceSheetScreen = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString().padStart(2, '0'));

  const [persons, setPersons] = useState<Person[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openingBalances, setOpeningBalances] = useState<MonthlyOpeningBalance[]>([]);
  const [closingBalances, setClosingBalances] = useState<MonthlyClosingBalance[]>([]);

  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'opening' | 'closing'>('opening');
  const [showOpening, setShowOpening] = useState<boolean>(true);
  const [showClosing, setShowClosing] = useState<boolean>(true);
  const getPersonName = (id: string) => persons.find(p => p.id === id)?.name || 'Unknown';
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.accountTypeOrName || 'Unknown';
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [selectedYear, setSelectedYear] = useState(year);


  const onMonthYearChange = (event: any, selected?: Date) => {
    setShowMonthYearPicker(false);
    if (selected) {
      setSelectedDate(selected);
      setMonth(`${(selected.getMonth() + 1).toString().padStart(2, '0')}`);
      setYear(`${selected.getFullYear()}`);
    }
  };


  const toggleExpand = (index: number) => {
    setExpandedIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleCheckbox = (personId: string) => {
    setSelectedItems((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  };

  const resolvePersonName = (personId: string) => {
    const person = persons.find((p) => p.id === personId);
    return person ? person.name : 'Unknown Person';
  };

  const resolveAccountName = (accountId: string) => {
    const allAccounts = persons.flatMap(p => p.accounts || []);
    const account = allAccounts.find((a) => a.id === accountId);
    const person = persons.find((p) => p.id === account?.personId);

    if (!account) return 'Unknown';

    const accountLabel = account.accountTypeOrName || 'Unnamed Account';
    const personLabel = person ? person.name : 'Unknown Person';

    return `${accountLabel} (${personLabel})`;
  };
  
  const getBalance = (
    balances: (MonthlyOpeningBalance | MonthlyClosingBalance)[],
    year: string,
    month: string,
    personId?: string,
    accountId?: string
  ): number => {
    return balances
      .filter(
        b =>
          b.year === year &&
          b.month === month &&
          (!personId || b.personId === personId) &&
          (!accountId || b.accountId === accountId)
      )
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const getClosingBalance = (
    balances: (MonthlyClosingBalance)[],
    year: string,
    month: string,
    personId?: string,
    accountId?: string
  ): number => {
    return balances
      .filter(
        b =>
          b.year === year &&
          b.month === month &&
          (!personId || b.personId === personId) &&
          (!accountId || b.accountId === accountId)
      )
      .reduce((sum, b) => sum + b.amount, 0);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPersonId) {
      const person = persons.find(p => p.id === selectedPersonId);
      setAccounts(person?.accounts || []);
    } else {
      setAccounts([]);
    }
  }, [selectedPersonId]);

  const loadData = async () => {
    const txns = await getAllTransactions();
    const ob = await getOpeningBalances();
    const cb = await getClosingBalances();
    const ps = await getPersons();

    setTransactions(txns);
    setOpeningBalances(ob);
    setClosingBalances(cb);
    setPersons(ps);
  };

  const filteredOpening = getFilteredBalances(openingBalances, year, month, selectedPersonId, selectedAccountId);
  const filteredClosing = getFilteredBalances(closingBalances, year, month, selectedPersonId, selectedAccountId);
  const filteredTxns = getFilteredTransactions(transactions, year, month, selectedPersonId, selectedAccountId);
  const openingSummaryData = generatePersonAccountSummary(filteredOpening, selectedPersonId, selectedAccountId);
  const closingSummaryData = generatePersonAccountSummary(filteredClosing, selectedPersonId, selectedAccountId);
  const balanceSummary = calculateSummary(filteredTxns, filteredOpening, filteredClosing, { year, month, personId: selectedPersonId, accountId: selectedAccountId });

  const openModal = (type: 'opening' | 'closing') => {
    setModalType(type);
    setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}> Monthly Balance Sheet</Text>

      {/* Header Section Data, Persons and accounts */}
      <View style={styles.filterRow}>
        {/* Month/Year Button */}
        <TouchableOpacity style={styles.periodButton} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar" size={18} color="#1a3c70" style={{ marginRight: 6 }} />
          <Text style={styles.periodText}>{month}/{year}</Text>
        </TouchableOpacity>

        {/* Person Picker */}
        <View style={styles.dropdownWrapper}>
          <Ionicons name="person" size={18} color="#1a3c70" style={{ marginRight: 4 }} />
          <Picker
            selectedValue={selectedPersonId}
            style={styles.picker}
            onValueChange={value => setSelectedPersonId(value)}>
            <Picker.Item label="All" value="" />
            {persons.map(p => (
              <Picker.Item key={p.id} label={p.name} value={p.id} />
            ))}
          </Picker>
        </View>

        {/* Account Picker */}
        <View style={styles.dropdownWrapper}>
          <Ionicons name="wallet" size={18} color="#1a3c70" style={{ marginRight: 4 }} />
          <Picker
            selectedValue={selectedAccountId}
            style={styles.picker}
            onValueChange={value => setSelectedAccountId(value)}>
            <Picker.Item label="All" value="" />
            {accounts.map(a => (
              <Picker.Item key={a.id} label={a.accountTypeOrName} value={a.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Opening Balance Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text> Opening Balance  </Text>
            <Text style={styles.balanceAmount}>
              ₹{' '}
              {getBalance(  
                openingBalances,
                year,
                month,
                selectedPersonId,
                selectedAccountId
              ).toFixed(2)}
            </Text>

            <TouchableOpacity onPress={() => setShowOpening(!showOpening)}>
              <Text style={styles.toggleText}>{showOpening ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerButton} onPress={() => {
              setModalType('opening');
              setModalVisible(true);
            }}>
              <Text style={styles.headerButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

           {showOpening && (
            <View style={{ marginTop: 16 }}>
                      {openingSummaryData.map((personSummary: any, index: number) => (
                        <View key={personSummary.personId} style={{ marginBottom: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, backgroundColor: '#fff' }}>
                          {/* Person Summary Header */}
                          <TouchableOpacity
                            onPress={() => toggleExpand(index)}
                            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#e8f1ff' }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {multiSelectEnabled && (
                                <CheckBox
                                  value={selectedItems.includes(personSummary.personId)}
                                  onValueChange={() => toggleCheckbox(personSummary.personId)}
                                />
                              )}
                              <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>
                                {resolvePersonName(personSummary.personId)}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ fontWeight: 'bold', marginRight: 12 }}>
                                ₹{personSummary.totalAmount.toFixed(2)}
                              </Text>
                              <Text>{expandedIndexes.includes(index) ? '▲' : '▼'}</Text>
                            </View>
                          </TouchableOpacity>

                          {/* Collapsible Content */}
                          {expandedIndexes.includes(index) && (
                            <View style={{ padding: 10, paddingTop: 0 }}>
                              {personSummary.accounts.map((acc: { accountId: string; amount: number }) => (
                                <View key={acc.accountId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6, padding: 10, backgroundColor: '#f6f9ff', borderRadius: 4 }}>
                                  <View>
                                    <Text style={{ fontSize: 14 }}>{resolveAccountName(acc.accountId)}</Text>
                                    <Text style={{ fontSize: 13, color: '#444' }}>₹{acc.amount.toFixed(2)}</Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
          )}
        </View>

      {/* Closing Balance Section */}
      <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text> Closing Balance  </Text>
            <Text style={styles.balanceAmount}>
              ₹{' '}
              {getBalance(  
                closingBalances,
                year,
                month,
                selectedPersonId,
                selectedAccountId
              ).toFixed(2)}
            </Text>

            <TouchableOpacity onPress={() => setShowClosing(!showClosing)}>
              <Text style={styles.toggleText}>{showClosing ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerButton} onPress={() => {
              setModalType('closing');
              setModalVisible(true);
            }}>
              <Text style={styles.headerButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

           {showClosing && (
            <View style={{ marginTop: 16 }}>
                      {closingSummaryData.map((personSummary: any, index: number) => (
                        <View key={personSummary.personId} style={{ marginBottom: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, backgroundColor: '#fff' }}>
                          {/* Person Summary Header */}
                          <TouchableOpacity
                            onPress={() => toggleExpand(index)}
                            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#e8f1ff' }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {multiSelectEnabled && (
                                <CheckBox
                                  value={selectedItems.includes(personSummary.personId)}
                                  onValueChange={() => toggleCheckbox(personSummary.personId)}
                                />
                              )}
                              <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>
                                {resolvePersonName(personSummary.personId)}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ fontWeight: 'bold', marginRight: 12 }}>
                                ₹{personSummary.totalAmount.toFixed(2)}
                              </Text>
                              <Text>{expandedIndexes.includes(index) ? '▲' : '▼'}</Text>
                            </View>
                          </TouchableOpacity>

                          {/* Collapsible Content */}
                          {expandedIndexes.includes(index) && (
                            <View style={{ padding: 10, paddingTop: 0 }}>
                              {personSummary.accounts.map((acc: { accountId: string; amount: number }) => (
                                <View key={acc.accountId} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6, padding: 10, backgroundColor: '#f6f9ff', borderRadius: 4 }}>
                                  <View>
                                    <Text style={{ fontSize: 14 }}>{resolveAccountName(acc.accountId)}</Text>
                                    <Text style={{ fontSize: 13, color: '#444' }}>₹{acc.amount.toFixed(2)}</Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
          )}
        </View>




      <View style={{ backgroundColor: '#f1f6fd', borderRadius: 10, padding: 16, marginVertical: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#2a4d8f' }}>Transaction Summary</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontWeight: '600' }}>Opening Balance</Text>
          <Text>₹{balanceSummary.openingBalance.toFixed(2)}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontWeight: '600' }}>Total Income</Text>
          <Text style={{ color: 'green' }}>+₹{balanceSummary.totalIncome.toFixed(2)}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontWeight: '600' }}>Total Expense</Text>
          <Text style={{ color: 'red' }}>-₹{balanceSummary.totalExpense.toFixed(2)}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontWeight: '600' }}>Closing Balance</Text>
          <Text>₹{balanceSummary.closingBalance.toFixed(2)}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ fontWeight: '600', color: '#ff6b6b' }}>Untracked Difference</Text>
          <Text style={{ color: '#ff6b6b' }}>₹{balanceSummary.difference.toFixed(2)}</Text>
        </View>
      </View>

      
      <BalanceSheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalType}
        year={year}
        month={month}
        persons={persons}
        accounts={accounts}
        balances={modalType === 'opening' ? openingBalances : closingBalances}
        selectedPersonId={selectedPersonId}
        onSave={(updated) => {
          if (modalType === 'opening') {
            saveOpeningBalances(updated as MonthlyOpeningBalance[]);
            setOpeningBalances(updated as MonthlyOpeningBalance[]);
          } else {
            saveClosingBalances(updated as MonthlyClosingBalance[]);
            setClosingBalances(updated as MonthlyClosingBalance[]);
          }
          loadData(); // Call this independently after state update
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  subheader: { fontSize: 18, fontWeight: 'bold' },
  section: { marginBottom: 20 },
  picker: { flex: 1, height: 50 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionContainer: {
  backgroundColor: '#f0f8ff',
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
},

sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},

sectionTitle: {
  fontSize: 16,
  fontWeight: 'bold',
},

sectionTotal: {
  fontSize: 16,
  color: 'green',
},

headerButton: {
  backgroundColor: '#007bff',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 6,
},

headerButtonText: {
  color: '#fff',
  fontWeight: 'bold',
},

toggleText: {
  color: '#007bff',
  textDecorationLine: 'underline',
  fontSize: 12,
},

detailsContainer: {
  marginTop: 8,
},

balanceItem: {
  fontSize: 14,
  paddingVertical: 4,
  borderBottomColor: '#ccc',
  borderBottomWidth: 0.5,
},

emptyText: {
  fontSize: 14,
  color: '#888',
},
  balanceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  periodButton: {
    backgroundColor: '#e0ecff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  periodText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3c70',
  },
  iconButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#007bff',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 6,
},
iconButtonText: {
  color: '#fff',
  marginLeft: 6,
  fontSize: 14,
  fontWeight: '500',
},
dropdownWrapper: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#eef3ff',
  borderRadius: 6,
  paddingHorizontal: 6,
  flex: 1,
},
});

export default BalanceSheetScreen;