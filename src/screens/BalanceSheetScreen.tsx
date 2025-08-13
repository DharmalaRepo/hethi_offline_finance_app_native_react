import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CheckBox from '@react-native-community/checkbox';
import { Picker } from '@react-native-picker/picker';
import BalanceSheetModal from '../components/BalanceSheetModal';
import { saveOpeningBalances, saveClosingBalances } from '../services/mockDataService';
import { Account } from '../models/Account';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';
import {
  calculateSummary, getFilteredBalances,
  getFilteredTransactions, generatePersonAccountSummary
} from '../utils/balanceSheetUtils';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAppData } from '../context/AppDataProvider';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { format } from 'date-fns';


const BalanceSheetScreen = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear().toString());
  const [modalVisible1, setModalVisible1] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'opening' | 'closing'>('opening');
  const [showOpening, setShowOpening] = useState<boolean>(true);
  const [showClosing, setShowClosing] = useState<boolean>(true);
  const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(year);
  const defaultMonth = `${today.getFullYear()} - ${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(defaultMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [selectedMonth, setSelectedMonth] = useState(month);
  const [expandedOpening, setExpandedOpening] = useState<number[]>([]);
  const [expandedClosing, setExpandedClosing] = useState<number[]>([]);


  const {
    persons,
    transactions,
    monthlyOpeningBalance,
    monthlyClosingBalance,
    reloadAppData,
    dataVersion,
  } = useAppData();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      console.log('TransactionsScreen is focused');
      reloadbalanceSheetData();
    }
  }, [isFocused]);

  // Recompute when the source-of-truth changes:
  useEffect(() => {
    console.log('BalanceSheet: dataVersion changed → recompute derived');
  }, [dataVersion, persons, transactions, monthlyOpeningBalance, monthlyClosingBalance]);

  useEffect(() => {
    if (selectedPersonId) {
      const person = persons.find(p => p.id === selectedPersonId);
      setAccounts(person?.accounts || []);
    } else {
      setAccounts([]);
    }
  }, [selectedPersonId, persons]);

  const filteredOpening = getFilteredBalances(monthlyOpeningBalance, year, month, selectedPersonId, selectedAccountId);
  const filteredClosing = getFilteredBalances(monthlyClosingBalance, year, month, selectedPersonId, selectedAccountId);
  const filteredTxns = getFilteredTransactions(transactions, year, month, selectedPersonId, selectedAccountId);
  const openingSummaryData = generatePersonAccountSummary(filteredOpening, selectedPersonId, selectedAccountId);
  const closingSummaryData = generatePersonAccountSummary(filteredClosing, selectedPersonId, selectedAccountId);
  const balanceSummary = calculateSummary(filteredTxns, filteredOpening, filteredClosing, { year, month, personId: selectedPersonId, accountId: selectedAccountId });

  const reloadbalanceSheetData = async () => {
    await reloadAppData();
  };

  const toggleExpand = (index: number, type: 'opening' | 'closing') => {
    if (type === 'opening') {
      setExpandedOpening(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    } else {
      setExpandedClosing(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    }
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

    const accountLabel = account.paymentMode || 'Unnamed Account';
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

  const handleCarryForward = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log(`Current Year: ${currentYear}, Current Month: ${currentMonth}`);

    // Restrict to past months only
    if (Number(year) > currentYear || (Number(year) === currentYear && Number(month) >= currentMonth)) {
      Alert.alert("Not Allowed", "You can only carry forward from past months.");
      return;
    }

    // Calculate target month/year (next month from given)
    const fromDate = new Date(Number(year), Number(month) - 1);
    const toDate = new Date(fromDate);
    toDate.setMonth(toDate.getMonth() + 1);

    console.log(`From Date: ${fromDate}, To Date: ${toDate}`);

    // If target is beyond current month, block
    if (
      toDate.getFullYear() > currentYear ||
      (toDate.getFullYear() === currentYear && toDate.getMonth() + 1 > currentMonth)
    ) {
      Alert.alert("Not Allowed", "You can only carry forward up to the current month.");
      return;
    }

    console.log(`Carrying forward from ${format(fromDate, 'MMM yyyy')} to ${format(toDate, 'MMM yyyy')}`);

    Alert.alert(
      "Carry Forward",
      `Do you want to carry forward closing balance from ${format(fromDate, 'MMM yyyy')} to opening balance of ${format(toDate, 'MMM yyyy')}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => doCarryForward(fromDate, toDate) }
      ]
    );
  };

  const doCarryForward = async (fromDate: Date, toDate: Date) => {
    const fromYear = String(fromDate.getFullYear());
    const fromMonth = String(fromDate.getMonth() + 1);
    const toYear = String(toDate.getFullYear());
    const toMonth = String(toDate.getMonth() + 1);

    const source = monthlyClosingBalance.filter(
      b => b.year === fromYear && b.month === fromMonth
    );

    if (source.length === 0) {
      Alert.alert("No Data", "No closing balances found for this month.");
      return;
    }

    const newOpening = source.map(b => ({
      ...b,
      id: crypto.randomUUID(),
      year: toYear,
      month: toMonth,
      note: `Carried forward from ${fromMonth}/${fromYear}`
    }));

    const others = monthlyOpeningBalance.filter(
      ob => !(ob.year === toYear && ob.month === toMonth)
    );

    await saveOpeningBalances([...others, ...newOpening]);
    reloadAppData();
    Alert.alert("Success", "Closing balances carried forward successfully.");
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setModalVisible1(true)}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          </TouchableOpacity>

          <Text style={styles.title}>Balance Sheet Dashboard</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={reloadbalanceSheetData} style={styles.iconButton}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <Modal visible={modalVisible1} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <Pressable onPress={() => setModalVisible1(false)} style={styles.modalBackground}>
            <Image source={require('../../assets/images/icon.png')} style={styles.fullImage} resizeMode="contain" />
          </Pressable>
        </View>
      </Modal>

      {/* Header Section Data, Persons and accounts */}
      <View style={styles.filterRow}>
        {/* Month/Year Picker */}
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text style={styles.label}>Year - Month</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
            <Text>{month || 'Select Month'}</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={(date: Date) => {
              setShowDatePicker(false);
              setSelectedDate(date);
              const selectedMonth = `${date.getFullYear()} - ${String(date.getMonth() + 1).padStart(2, '0')}`;
              setMonth(selectedMonth);
            }}
            onCancel={() => setShowDatePicker(false)}
          />
        </View>

        {/* Person Picker */}
        <View style={[styles.dropdownWrapper, { flex: 1, marginHorizontal: 6 }]}>
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
        <View style={[styles.dropdownWrapper, { flex: 1, marginLeft: 6 }]}>
          <Ionicons name="wallet" size={18} color="#1a3c70" style={{ marginRight: 4 }} />
          <Picker
            selectedValue={selectedAccountId}
            style={styles.picker}
            onValueChange={value => setSelectedAccountId(value)}>
            <Picker.Item label="All" value="" />
            {accounts.map(a => (
              <Picker.Item key={a.id} label={a.paymentMode} value={a.id} />
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
              monthlyOpeningBalance,
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
                  onPress={() => toggleExpand(index, 'opening')}
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
              monthlyClosingBalance,
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
                  onPress={() => toggleExpand(index, 'closing')}
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

      <TouchableOpacity style={styles.btn} onPress={handleCarryForward}>
        <Text style={styles.btnText}>Carry Forward</Text>
      </TouchableOpacity>

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
        balances={modalType === 'opening' ? monthlyOpeningBalance : monthlyClosingBalance}
        selectedPersonId={selectedPersonId}
        onSave={async (updated) => {
          if (modalType === 'opening') {
            await saveOpeningBalances(updated as MonthlyOpeningBalance[]);
          } else {
            await saveClosingBalances(updated as MonthlyClosingBalance[]);
          }
          reloadAppData(); // Provider updates, consumers re-render; no need to set local arrays
        }}
      />

      {showPicker && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month & Year</Text>

            {/* Month Picker */}
            <Picker
              selectedValue={month}
              onValueChange={(value) => setMonth(value)}
              style={styles.picker}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Picker.Item key={i + 1} label={`Month ${i + 1}`} value={i + 1} />
              ))}
            </Picker>

            {/* Year Picker */}
            <Picker
              selectedValue={year}
              onValueChange={(value) => setYear(value)}
              style={styles.picker}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const y = new Date().getFullYear() - 5 + i;
                return <Picker.Item key={y} label={`${y}`} value={y} />;
              })}
            </Picker>

            <TouchableOpacity style={styles.doneButton} onPress={() => setShowPicker(false)}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  subheader: { fontSize: 18, fontWeight: 'bold' },
  section: { marginBottom: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  screen: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0984e3',
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

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
    color: '#222',
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
  }, modalContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  picker: {
    width: '100%',
    marginBottom: 10,
  },
  doneButton: {
    backgroundColor: '#0984e3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  doneText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateBtn: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  modalBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '90%',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  btn: {
    backgroundColor: '#0984e3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10
  },
  btnText: {
    color: '#fff',
    fontWeight: '600'
  }
});

export default BalanceSheetScreen;
