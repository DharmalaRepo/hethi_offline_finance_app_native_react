import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Transaction } from '../models/Transaction';
import { getAllTransactions, getCategories, getPersons } from '../services/mockDataService';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { formatCurrency } from '../utils/formatUtils';
import { format, parseISO } from 'date-fns';

const OptionalExpensesScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTxns, setFilteredTxns] = useState<Transaction[]>([]);
  const [month, setMonth] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrderAsc, setSortOrderAsc] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const allTxns = await getAllTransactions();
      const cats = await getCategories();
      const people = await getPersons();
      setTransactions(allTxns);
      setCategories(cats);
      setPersons(people);
    };
    loadData();
  }, []);

  useEffect(() => {
    const [year, mo] = month ? month.split('-') : ['', ''];
    const result = transactions
      .filter(t => t.type === 'expense' && t.isOptional)
      .filter(t => {
        const txnDate = parseISO(t.date);
        return (
          (!month || (txnDate.getFullYear() === +year && txnDate.getMonth() + 1 === +mo)) &&
          (!selectedCategory || t.categoryId === selectedCategory) &&
          (!selectedPerson || t.personId === selectedPerson)
        );
      })
      .sort((a, b) => {
        if (sortField === 'amount') return sortOrderAsc ? a.amount - b.amount : b.amount - a.amount;
        return sortOrderAsc
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    setFilteredTxns(result);
  }, [transactions, month, selectedCategory, selectedPerson, sortField, sortOrderAsc]);

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrderAsc(!sortOrderAsc);
    } else {
      setSortField(field);
      setSortOrderAsc(true);
    }
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '-';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Optional Expenses</Text>

      {/* Filters Row */}
      <View style={styles.filters}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.filterBtn}>
          <Text>{month || 'Select Month'}</Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={(date: Date) => {
            setShowDatePicker(false);
            setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
          }}
          onCancel={() => setShowDatePicker(false)}
        />

        <TouchableOpacity
          onPress={() => setSelectedCategory('')}
          style={styles.filterBtn}
        >
          <Text>{selectedCategory ? getCategoryName(selectedCategory) : 'All Categories'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelectedPerson('')}
          style={styles.filterBtn}
        >
          <Text>{selectedPerson ? persons.find(p => p.id === selectedPerson)?.name : 'All Persons'}</Text>
        </TouchableOpacity>
      </View>

      {/* Table Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerCell}>Category</Text>
        <TouchableOpacity onPress={() => toggleSort('amount')} style={styles.headerCell}>
          <Text>Amount {sortField === 'amount' ? (sortOrderAsc ? '↑' : '↓') : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleSort('date')} style={styles.headerCell}>
          <Text>Date {sortField === 'date' ? (sortOrderAsc ? '↑' : '↓') : ''}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTxns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>{getCategoryName(item.categoryId)}</Text>
            <Text style={styles.cell}>{formatCurrency(item.amount)}</Text>
            <Text style={styles.cell}>{format(parseISO(item.date), 'dd MMM yyyy')}</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.totalRow}>
            <Text style={[styles.cell, { fontWeight: 'bold' }]}>Total</Text>
            <Text style={[styles.cell, { fontWeight: 'bold' }]}>
              {formatCurrency(filteredTxns.reduce((sum, t) => sum + t.amount, 0))}
            </Text>
            <Text style={styles.cell} />
          </View>
        }
      />
    </View>
  );
};

export default OptionalExpensesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 8 },
  filterBtn: {
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 4,
    marginBottom: 4,
  },
  headerCell: { flex: 1, fontWeight: 'bold', textAlign: 'center' },
  row: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderColor: '#ddd' },
  cell: { flex: 1, textAlign: 'center' },
  totalRow: {
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#999',
    marginTop: 8,
  },
});