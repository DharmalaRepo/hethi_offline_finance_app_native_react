// ReportsView.tsx – Fully Polished and Enhanced Reports Dashboard
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { getAllTransactions, getAllCategories, getAllPersons } from '../services/mockDataService';
import { Transaction } from '../models/Transaction';
import { exportToCSV, exportToPDF } from '../services/exportService';
import { useNavigation } from '@react-navigation/native';
import { Category } from '../models/Category';
import { Person } from '../models/Person';

interface ReportsViewProps {
  transactions: Transaction[];
}

const ReportsView = () => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTxns, setFilteredTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryMap, setCategoryMap] = useState<{ [key: string]: string }>({});
  const [personMap, setPersonMap] = useState<{ [key: string]: string }>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);

  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    savings: 0,
    categoryTotals: {} as Record<string, number>,
    personTotals: {} as Record<string, number>,
  });

  useEffect(() => {
  const fetchMeta = async () => {
    const cats = await getAllCategories();
    const people = await getAllPersons();
    setCategories(cats);
    setPersons(people);
  };
  fetchMeta();
}, []);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, search, typeFilter]);

  const loadTransactions = async () => {
    setLoading(true);
    const txns = await getAllTransactions();
    setTransactions(txns);
    setLoading(false);
    computeSummary(txns);
  };

  const computeSummary = (txns: Transaction[]) => {
    let income = 0,
      expense = 0,
      categoryTotals: Record<string, number> = {},
      personTotals: Record<string, number> = {};

    txns.forEach(tx => {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;

      if (tx.categoryId) {
        categoryTotals[tx.categoryId] = (categoryTotals[tx.categoryId] || 0) + tx.amount;
      }

      if (tx.personId) {
        personTotals[tx.personId] = (personTotals[tx.personId] || 0) + tx.amount;
      }
    });

    const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
      return (
        <View style={{ padding: 16 }}>
          <Text>Reports Summary ({transactions.length} transactions)</Text>
          {/* Render logic */}
        </View>
      );
    };


    setSummary({
      income,
      expense,
      savings: income - expense,
      categoryTotals,
      personTotals,
    });
  };

  const applyFilters = () => {
    let data = [...transactions];

    if (search.trim()) {
      const keyword = search.toLowerCase();
      data = data.filter(tx =>
        (tx.note || '').toLowerCase().includes(keyword) ||
        (categoryMap[tx.categoryId]?.toLowerCase().includes(keyword) || '') ||
        (personMap[tx.personId]?.toLowerCase().includes(keyword) || '')
      );
    }

    if (typeFilter !== 'all') {
      data = data.filter(tx => tx.type === typeFilter);
    }

    setFilteredTxns(data);
  };

  const handleExport = (format: 'csv' | 'pdf') => {
  const fileName = `Finance_Report_${new Date().toISOString().split('T')[0]}`;
  if (format === 'csv') exportToCSV(filteredTxns, categories, persons, fileName);
  else exportToPDF(filteredTxns, categories, persons, fileName);
};

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.txnRow}>
      <Text style={styles.cell}>{item.date}</Text>
      <Text style={styles.cell}>{categoryMap[item.categoryId] || item.categoryId}</Text>
      <Text style={styles.cell}>{personMap[item.personId] || item.personId}</Text>
      <Text style={[styles.cell, { color: item.type === 'income' ? 'green' : 'red' }]}>₹{item.amount}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>📊 Reports Dashboard</Text>

      {/* A. Summary */}
      <View style={styles.card}>
        <Text>Total Income: ₹{summary.income}</Text>
        <Text>Total Expense: ₹{summary.expense}</Text>
        <Text>Net Savings: ₹{summary.savings}</Text>
      </View>

      {/* B. Filters */}
      <View style={styles.filters}>
        <TextInput
          placeholder="Search notes, category, person"
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

      {/* E. Table View */}
      <Text style={styles.subheading}>Transactions</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : filteredTxns.length === 0 ? (
        <Text>No data found</Text>
      ) : (
        <FlatList
          data={filteredTxns}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          horizontal={true}
          showsHorizontalScrollIndicator
        />
      )}

      {/* F. Export Options */}
      <View style={styles.exportBtns}>
        <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('csv')}>
          <Text style={styles.exportText}>Export CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('pdf')}>
          <Text style={styles.exportText}>Export PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', flexGrow: 1 },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#007bff' },
  card: { backgroundColor: '#f0f8ff', padding: 12, borderRadius: 10, marginBottom: 16 },
  filters: { marginBottom: 16 },
  searchBox: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 6, marginBottom: 10 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-around' },
  filterBtn: { padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#007bff' },
  selectedFilter: { backgroundColor: '#007bff', color: '#fff' },
  subheading: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  txnRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  cell: { minWidth: 120, paddingRight: 10 },
  exportBtns: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 16 },
  exportBtn: { backgroundColor: '#007bff', padding: 10, borderRadius: 6 },
  exportText: { color: '#fff', fontWeight: 'bold' },
});

export default ReportsView;