import React, { useEffect, useState, useMemo } from 'react';

import { ScrollView } from 'react-native-gesture-handler';
import { Picker } from '@react-native-picker/picker';
import * as Sharing from 'expo-sharing'; // If using Expo
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons'; // Or react-native-vector-icons
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, Modal, Pressable
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Transaction } from '../models/Transaction';
import { format } from 'date-fns';
import styles from '../styles/ReportsViewStyles';
import { Switch } from 'react-native';
import { getTransactionsForMonth } from '../services/mockDataService';
import { useAppContext } from '../context/AppContext';
import YearlySummaryExportModal from '../components/YearlySummaryExportModal';
import { useAppData } from '../context/AppDataProvider';
import { useIsFocused } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const ReportsView = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [month, setMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [loading, setLoading] = useState(false);
  const { showSensitiveData, toggleSensitiveData } = useAppContext(); // ✅ Use global toggle
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showYearlyExport, setShowYearlyExport] = useState(false);
  const [showTxnTable, setShowTxnTable] = useState(false);

  const {
    persons,
    categories,
    subcategories,
    accounts,
    transactions,
    reloadAppData,
  } = useAppData();

  const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
  ];
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const today = new Date();
  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);



  // which side are we editing with the date picker?
  const [activeSide, setActiveSide] = useState<'left' | 'right' | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [month1, setMonth1] = useState<string>(
    `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
  );
  const [month2, setMonth2] = useState<string>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  );
  const [txns1, setTxns1] = useState<Transaction[]>([]);
  const [txns2, setTxns2] = useState<Transaction[]>([]);
  const monthOptions = [
    '2025-01', '2025-02', '2025-03', '2025-04',
    '2025-05', '2025-06', '2025-07', '2025-08',
    '2025-09', '2025-10', '2025-11', '2025-12',
  ];

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      console.log('TransactionsScreen is focused');
      reloadReports();
    }
  }, [isFocused]);

  useEffect(() => {
    if (comparisonEnabled) setToPrevVsCurrent();
  }, [comparisonEnabled]);

  useEffect(() => {
    if (!comparisonEnabled) return;
    const [y1, m1] = month1.split('-');
    const [y2, m2] = month2.split('-');
    getTransactionsForMonth(+y1, +m1 - 1).then(setTxns1);
    getTransactionsForMonth(+y2, +m2 - 1).then(setTxns2);
  }, [comparisonEnabled, month1, month2]);


  const reloadReports = async () => {
    await reloadAppData();
  };

  useEffect(() => {
    if (comparisonEnabled) {
      const [y1, m1] = month1.split('-');
      const [y2, m2] = month2.split('-');
      getTransactionsForMonth(+y1, +m1 - 1).then(setTxns1);
      getTransactionsForMonth(+y2, +m2 - 1).then(setTxns2);
    }
  }, [comparisonEnabled, month1, month2]);



  // label helper (MMM yyyy)
  const ymLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  // set utils
  const setToPrevVsCurrent = () => {
    const now = new Date();
    const p = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setMonth1(`${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}`);
    setMonth2(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  };

  const swapMonths = () => {
    setMonth1((a) => {
      setMonth2(a);
      return month2;
    });
  };

  const filteredTxns = useMemo(() => {
    return transactions.filter(txn => {
      const txnMonth = txn.date.slice(0, 7); // "YYYY-MM"
      const matchesMonth = txnMonth === month;
      const matchesType = typeFilter === 'all' || txn.type === typeFilter;

      const categoryName =
        categories.find(c => c.id === txn.categoryId)?.name?.toLowerCase() || '';
      const subcategoryName =
        subcategories.find(sc => sc.id === txn.subCategoryId)?.name?.toLowerCase() || '';

      const matchesSearch =
        categoryName.includes(search.toLowerCase()) ||
        subcategoryName.includes(search.toLowerCase());

      return matchesMonth && matchesType && matchesSearch;
    });
  }, [transactions, month, typeFilter, search, categories, subcategories]);


  const exportToCSV = async (
    sum1: { income: number; expense: number; savings: number },
    sum2: { income: number; expense: number; savings: number },
    m1: string,
    m2: string
  ) => {
    const csv = `Category,${m1},${m2}\nIncome,${sum1.income},${sum2.income}\nExpense,${sum1.expense},${sum2.expense}\nSavings,${sum1.savings},${sum2.savings}`;
    const filename = `comparison_${Date.now()}.csv`;
    const path = `${FileSystem.documentDirectory}${filename}`;

    try {
      await FileSystem.writeAsStringAsync(path, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (!(await Sharing.isAvailableAsync())) {
        alert('Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(path);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV');
    }
  };

  const exportToPDF = async (
    summary1: { income: number; expense: number; savings: number },
    summary2: { income: number; expense: number; savings: number },
    month1: string,
    month2: string
  ) => {
    const html = `
    <html>
      <body>
        <h1 style="text-align: center;">📊 Monthly Comparison</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid #ccc; padding: 8px;">Category</th>
              <th style="border: 1px solid #ccc; padding: 8px;">${month1}</th>
              <th style="border: 1px solid #ccc; padding: 8px;">${month2}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Income</td>
              <td style="border: 1px solid #ccc; padding: 8px;">₹${summary1.income}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">₹${summary2.income}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Expense</td>
              <td style="border: 1px solid #ccc; padding: 8px;">₹${summary1.expense}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">₹${summary2.expense}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">Savings</td>
              <td style="border: 1px solid #ccc; padding: 8px;">₹${summary1.savings}</td>
              <td style="border: 1px solid #ccc; padding: 8px;">₹${summary2.savings}</td>
            </tr>
          </tbody>
        </table>
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

  const summary = filteredTxns.reduce(
    (acc, txn) => {
      if (txn.type === 'income') acc.income += txn.amount;
      else acc.expense += txn.amount;
      acc.savings = acc.income - acc.expense;
      return acc;
    },
    { income: 0, expense: 0, savings: 0 }
  );

  const chartData = Object.entries(
    filteredTxns.reduce((acc, txn) => {
      const cat = categories.find(c => c.id === txn.categoryId)?.name || 'Unknown';
      acc[cat] = (acc[cat] || 0) + txn.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, amount], index) => ({
    name,
    amount,
    color: chartColors[index % chartColors.length],
    legendFontColor: '#333',
    legendFontSize: 12
  }));

  const calculateSummary = (txns: Transaction[]) => {
    const income = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, savings: income - expense };
  };

  const summary1 = calculateSummary(txns1);
  const summary2 = calculateSummary(txns2);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          </TouchableOpacity>
          <Text style={styles.title}> Reports Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={reloadReports} style={styles.iconButton}>
            <Ionicons name="refresh" size={22} color="#e6f0ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSensitiveData} style={styles.iconButton}>
            <Ionicons name={showSensitiveData ? "eye" : "eye-off"} size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <Pressable onPress={() => setModalVisible(false)} style={styles.modalBackground}>
            <Image source={require('../../assets/images/icon.png')} style={styles.fullImage} resizeMode="contain" />
          </Pressable>
        </View>
      </Modal>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>

        {/* Month Picker */}
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Select Month</Text>
          <TouchableOpacity
            style={[styles.commonBtn, styles.monthBtn]}
            onPress={() => { setActiveSide('left'); setShowMonthPicker(true); }}
          >
            <Ionicons name="calendar" size={16} color="#1a3c70" />
            <Text style={styles.monthBtnText}>{ymLabel(month)}</Text>
          </TouchableOpacity>
        </View>

        {/* Export Button */}
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Yearly Summary Report</Text>
          <TouchableOpacity
            style={[styles.commonBtn, { justifyContent: 'center' }]}
            onPress={() => setShowYearlyExport(true)}
          >
            <Text style={{ color: 'black' }}>View/Export</Text>
          </TouchableOpacity>
        </View>

      </View>

      <YearlySummaryExportModal
        visible={showYearlyExport}
        onClose={() => setShowYearlyExport(false)}
        transactions={transactions} // or filteredTransactions if needed
      />

      {/* Summary */}
      <View style={styles.tableContainer}>
        <Text>Total Income: {showSensitiveData ? `₹ ${summary.income}` : '₹ ****'}</Text>
        <Text>Total Expense: {showSensitiveData ? `₹ ${summary.expense}` : '₹ ****'}</Text>
        <Text style={{ fontWeight: 'bold' }}>Total Savings: {showSensitiveData ? `₹ ${summary.savings}` : '₹ ****'}</Text>
      </View>


      {/* Filters */}
      <View style={styles.filters}>
        <TextInput
          placeholder="Search notes or category"
          value={search}
          onChangeText={setSearch}
          style={styles.searchBox}
        />
        <View style={styles.filterRow}>
          {['all', 'income', 'expense'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterBtn, typeFilter === type && styles.selectedFilter]}
              onPress={() => setTypeFilter(type as any)}>
              <Text>{type.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.tableContainer}>
        {/* Pie Chart */}
        {chartData.length > 0 && (
          <>
            <Text style={styles.subheading}>Spending Breakdown</Text>
            <PieChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,  // 👈 Required
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
            />
          </>
        )}
      </View>
      <View style={styles.tableContainer}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>📊 Enable Monthly Comparison</Text>
          <Switch value={comparisonEnabled} onValueChange={setComparisonEnabled} />
        </View>

        {comparisonEnabled ? (
          <>
            {/* Quick actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <TouchableOpacity style={styles.quickBtn} onPress={setToPrevVsCurrent}>
                <Ionicons name="refresh" size={16} color="#0a66e4" />
                <Text style={styles.quickBtnText}>Set to Last vs Current</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickBtn} onPress={swapMonths}>
                <Ionicons name="swap-horizontal" size={16} color="#0a66e4" />
                <Text style={styles.quickBtnText}>Swap</Text>
              </TouchableOpacity>
            </View>

            {/* Month buttons (open calendar) */}
            <View style={styles.monthRow}>
              <View style={styles.monthPickerCard}>
                <Text style={styles.label}>Month 1</Text>
                <TouchableOpacity
                  style={styles.monthBtn}
                  onPress={() => { setActiveSide('left'); setShowMonthPicker(true); }}
                >
                  <Ionicons name="calendar" size={16} color="#1a3c70" />
                  <Text style={styles.monthBtnText}>{ymLabel(month1)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.monthPickerCard}>
                <Text style={styles.label}>Month 2</Text>
                <TouchableOpacity
                  style={styles.monthBtn}
                  onPress={() => { setActiveSide('right'); setShowMonthPicker(true); }}
                >
                  <Ionicons name="calendar" size={16} color="#1a3c70" />
                  <Text style={styles.monthBtnText}>{ymLabel(month2)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* One shared DateTimePickerModal */}
            <DateTimePickerModal
              isVisible={showMonthPicker}
              mode="date"
              onConfirm={(date: Date) => {
                setShowMonthPicker(false);
                const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (activeSide === 'left') setMonth1(ym);
                if (activeSide === 'right') setMonth2(ym);
                setActiveSide(null);
              }}
              onCancel={() => { setShowMonthPicker(false); setActiveSide(null); }}
            />

            {/* Monthly Summary */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>{month1}</Text>
                <Text style={styles.income}>Income: {showSensitiveData ? `₹ ${summary1.income}` : '₹ ****'}</Text>
                <Text style={styles.expense}>Expense: {showSensitiveData ? `₹ ${summary1.expense}` : '₹ ****'}</Text>
                <Text style={styles.savings}>Savings: {showSensitiveData ? `₹ ${summary1.savings}` : '₹ ****'}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>{month2}</Text>
                <Text style={styles.income}>Income: {showSensitiveData ? `₹ ${summary2.income}` : '₹ ****'}</Text>
                <Text style={styles.expense}>Expense: {showSensitiveData ? `₹ ${summary2.expense}` : '₹ ****'}</Text>
                <Text style={styles.savings}>Savings: {showSensitiveData ? `₹ ${summary2.savings}` : '₹ ****'}</Text>
              </View>
            </View>

            {/* Header & Export */}
            <View style={styles.comparisonHeaderRow}>
              <Text style={styles.subheading}> Category Comp</Text>
              <View style={styles.exportButtonRow}>
                <TouchableOpacity style={styles.exportButton} onPress={() => exportToPDF(summary1, summary2, month1, month2)}>
                  <Text style={styles.exportText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportButton} onPress={() => exportToCSV(summary1, summary2, month1, month2)}>
                  <Text style={styles.exportText}>CSV</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.tableHeaderCell}>Category</Text>
                <Text style={styles.tableHeaderCell}>{month1}</Text>
                <Text style={styles.tableHeaderCell}>{month2}</Text>
              </View>

              {categories.map(cat => {
                const m1Total = txns1.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0);
                const m2Total = txns2.filter(t => t.categoryId === cat.id).reduce((sum, t) => sum + t.amount, 0);
                if (m1Total === 0 && m2Total === 0) return null;

                return (
                  <View key={cat.id} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{cat.name}</Text>
                    <Text style={[styles.tableCell, { color: '#0a66e4' }]}>
                      {showSensitiveData ? `₹ ${m1Total}` : '₹ ****'}
                    </Text>
                    <Text style={[styles.tableCell, { color: '#00b894' }]}>
                      {showSensitiveData ? `₹ ${m2Total}` : '₹ ****'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.note}>
            ℹ️ Comparison is turned off. Reports are shown only for the selected month.
          </Text>
        )}
      </View>
      
    </ScrollView>
  );
};

export default ReportsView;