import React, { useEffect, useState, useMemo } from 'react';

import { ScrollView } from 'react-native-gesture-handler';
import RNPickerSelect from 'react-native-picker-select';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Picker } from '@react-native-picker/picker';
import * as Sharing from 'expo-sharing'; // If using Expo
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { Ionicons } from '@expo/vector-icons'; // Or react-native-vector-icons
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, FlatList, Image 
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { getAllTransactions, getCategories, getAllSubCategories } from '../services/mockDataService';
import { Transaction } from '../models/Transaction';
import {  Category } from '../models/Category';
import {  SubCategory } from '../models/SubCategory';
import { format, parseISO } from 'date-fns';
import styles from '../styles/ReportsViewStyles';
import { Switch, StyleSheet } from 'react-native';
import { getTransactionsForMonth } from '../services/mockDataService';
import { useAppContext  } from '../context/AppContext';

const screenWidth = Dimensions.get('window').width;

const ReportsView = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [month, setMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [loading, setLoading] = useState(false);
  const { showSensitiveData, toggleSensitiveData } = useAppContext(); // ✅ Use global toggle
  const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
  ];
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
    const [month1, setMonth1] = useState('2025-06');
    const [month2, setMonth2] = useState('2025-07');
    const [txns1, setTxns1] = useState<Transaction[]>([]);
    const [txns2, setTxns2] = useState<Transaction[]>([]);
    const monthOptions = [
  '2025-01', '2025-02', '2025-03', '2025-04',
  '2025-05', '2025-06', '2025-07', '2025-08',
  '2025-09', '2025-10', '2025-11', '2025-12',
];


 useEffect(() => {
   fetchData();
 }, []);

  const reloadReports = () => {
     fetchData();
     console.log("Reloading Reports...");
   };

 const fetchData = async () => {
      setLoading(true);

      const txns = await getAllTransactions();
      const cats = await getCategories();
      const subs = await getAllSubCategories();
      setTransactions(txns);
      setCategories(cats);
      setSubcategories(subs); // ✅ Save it
      setLoading(false);
    };

   useEffect(() => {
     if (comparisonEnabled) {
       const [y1, m1] = month1.split('-');
       const [y2, m2] = month2.split('-');
       getTransactionsForMonth(+y1, +m1 - 1).then(setTxns1);
       getTransactionsForMonth(+y2, +m2 - 1).then(setTxns2);
     }
   }, [comparisonEnabled, month1, month2]);

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

  const getColor = (index: number) => {
    const defaultColors = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f'];
    return defaultColors[index % defaultColors.length];
  };

  const getCategoryName = (id: string) =>
    categories.find(cat => cat.id === id)?.name || 'Unknown';

  const getSubCategoryName = (catId: string, subId: string) =>
    categories
      .find(cat => cat.id === catId)
      ?.subcategories?.find(sub => sub.id === subId)?.name || '';

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

  const pieData = categories.map((cat, index) => {
    const catTxns = filteredTxns.filter(t => t.categoryId === cat.id);
    const amount = catTxns.reduce((sum, t) => sum + t.amount, 0);

    return {
      name: cat.name,
      value: amount,
      color: getColor(index),
      legendFontColor: '#000',
      legendFontSize: 12,
    };
  }).filter(d => d.value > 0);

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const cat = categories.find(c => c.id === item.categoryId)?.name || 'Unknown';
    return (
      <View style={styles.txnRow}>
        <Text>{item.date}</Text>
        <Text>{item.type.toUpperCase()} - ₹{item.amount}</Text>
        <Text>{cat}</Text>
        <Text>{item.note}</Text>
      </View>
    );
  };





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
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
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


      {/* Summary */}
      <View style={styles.card}>
        <Text>Total Income: {showSensitiveData ? `₹ ${summary.income}` : '₹ ****'}</Text>
        <Text>Total Expense: {showSensitiveData ? `₹ ${summary.expense}` : '₹ ****'}</Text>
        <Text style={{ fontWeight: 'bold' }}>Total Savings: {showSensitiveData ? `₹ ${summary.savings}` : '₹ ****'}</Text>
      </View>

      {/* Month Picker */}
      <TextInput
        value={month}
        onChangeText={setMonth}
        placeholder="YYYY-MM"
        style={styles.monthInput}
      />

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
      {/* Monthly Comparison */}
          {/* Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>📊 Enable Monthly Comparison</Text>
            <Switch value={comparisonEnabled} onValueChange={setComparisonEnabled} />
          </View>

          {comparisonEnabled ? (
            <>
              {/* Month Pickers */}
              <View style={styles.monthRow}>
                <View style={styles.monthPicker}>
                  <Text style={styles.label}>Month 1</Text>
                  <Picker selectedValue={month1} onValueChange={setMonth1}>
                    {monthOptions.map(m => (
                      <Picker.Item key={m} label={m} value={m} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.monthPicker}>
                  <Text style={styles.label}>Month 2</Text>
                  <Picker selectedValue={month2} onValueChange={setMonth2}>
                    {monthOptions.map(m => (
                      <Picker.Item key={m} label={m} value={m} />
                    ))}
                  </Picker>
                </View>
              </View>

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
                      <Text style={[styles.tableCell, { color: '#0984e3' }]}>
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
       <View style={styles.tableContainer}>
          {/* Transactions */}
          <Text style={styles.subheading}>Transactions</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#007bff" />
          ) : filteredTxns.length === 0 ? (
            <Text style={{ textAlign: 'center', marginVertical: 10 }}>No transactions found</Text>
          ) : (
            <View style={styles.tableContainer}>
              {/* Table Headers */}
              <View style={styles.tableRowHeader}>
                <Text style={styles.tableCellHeader}>Date</Text>
                <Text style={styles.tableCellHeader}>Category</Text>
                <Text style={styles.tableCellHeader}>Subcategory</Text>
                <Text style={styles.tableCellHeader}>Amount</Text>
              </View>

              {/* Table Rows */}
              {filteredTxns.map(txn => {
                const categoryName =
                  categories.find(cat => cat.id === txn.categoryId)?.name || txn.categoryId;
                const subcategoryName =
                  subcategories.find(sub => sub.id === txn.subCategoryId)?.name || txn.subCategoryId;
                return (
                  <View key={txn.id} style={styles.tableRow}>
                    <Text style={styles.tableCell}>{txn.date}</Text>
                    <Text style={styles.tableCell}>{categoryName}</Text>
                    <Text style={styles.tableCell}>{subcategoryName}</Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { color: txn.type === 'income' ? 'green' : 'red' },
                      ]}
                    >
                      {showSensitiveData ? `₹ ${txn.amount}` : '₹ ****'}₹
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
    </ScrollView>
  );
};

export default ReportsView;