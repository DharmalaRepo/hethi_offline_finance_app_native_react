import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet, Image 
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Transaction } from '../models/Transaction';
import { formatCurrency } from '../utils/formatUtils';
import { format, parseISO } from 'date-fns';
import { useIsFocused } from '@react-navigation/native';
import { useAppData } from '../context/AppDataProvider';
import { Ionicons } from '@expo/vector-icons';

const OptionalExpensesScreen = () => {

  const [filteredTxns, setFilteredTxns] = useState<Transaction[]>([]);
  const [month, setMonth] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [sortField, setSortField] = useState<'date'|'category'|'person' | 'amount'>('date');
  const [sortOrderAsc, setSortOrderAsc] = useState(false);


  const {
    persons,
    categories,
    transactions,
    reloadAppData
  } = useAppData();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      reloadTransactions();
    }
  }, [isFocused]);

  const reloadTransactions = async () => {
    await reloadAppData();
  };


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
        if (sortField === 'category') {
          const nameA = getCategoryName(a.categoryId).toLowerCase();
          const nameB = getCategoryName(b.categoryId).toLowerCase();
          return sortOrderAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        if (sortField === 'person') {
          const nameA = getCategoryName(a.categoryId).toLowerCase();
          const nameB = getPersonName(b.categoryId).toLowerCase();
          return sortOrderAsc ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        return sortOrderAsc
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    setFilteredTxns(result);
  }, [transactions, month, selectedCategory, selectedPerson, sortField, sortOrderAsc]);

  const toggleSort = (field: 'date'|'category'|'person'| 'amount') => {
    if (sortField === field) {
      setSortOrderAsc(!sortOrderAsc);
    } else {
      setSortField(field);
      setSortOrderAsc(true);
    }
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '-';
  const getPersonName = (id: string) => persons.find(c => c.id === id)?.name || '-';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.title}>Optional Expenses</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={reloadTransactions} style={styles.iconButton}>
            <Ionicons name="refresh" size={22} color="#e6f0ff" />
          </TouchableOpacity>
        </View>
      </View>

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
      </View>

      {/* Table */}
<View style={styles.table}>
  {/* Table Header */}
  <View style={styles.tableHeader}>    

    <TouchableOpacity onPress={() => toggleSort('date')} style={[styles.th, styles.thCenter]}>
      <Text style={styles.thText}>
        Date {sortField === 'date' ? (sortOrderAsc ? '↑' : '↓') : ''}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => toggleSort('category')} style={[styles.th, styles.thCenter]}>
      <Text style={styles.thText}>
        Category {sortField === 'category' ? (sortOrderAsc ? '↑' : '↓') : ''}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => toggleSort('person')} style={[styles.th, styles.thCenter]}>
      <Text style={styles.thText}>
        Person {sortField === 'person' ? (sortOrderAsc ? '↑' : '↓') : ''}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => toggleSort('amount')} style={[styles.th, styles.thRight]}>
      <Text style={styles.thText}>
        Amount {sortField === 'amount' ? (sortOrderAsc ? '↑' : '↓') : ''}
      </Text>
    </TouchableOpacity>

    
  </View>

  <FlatList
    data={filteredTxns}
    keyExtractor={(item) => item.id}
    ListEmptyComponent={
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No optional expenses match your filters.</Text>
      </View>
    }
    renderItem={({ item, index }) => (
      <View style={[styles.tr, index % 2 === 0 ? styles.trEven : styles.trOdd]}>

        <Text style={[styles.td, styles.tdCenter]}>
          {format(parseISO(item.date), 'dd EEE')}
        </Text>

        <Text style={[styles.td, styles.tdLeft]} numberOfLines={1}>
          {getCategoryName(item.categoryId)}
        </Text>

        <Text style={[styles.td, styles.tdLeft]} numberOfLines={1}>
          {getPersonName(item.personId)}
        </Text>

        <Text style={[styles.td, styles.tdRight, styles.amountMono]}>
          {formatCurrency(item.amount)}
        </Text>

        
      </View>
    )}
    ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
    ListFooterComponent={
      <View style={styles.tfoot}>
        <Text style={[styles.td, styles.tdLeft, styles.totalLabel]}>Total</Text>
        <Text style={[styles.td, styles.tdRight, styles.totalValue]}>
          {formatCurrency(filteredTxns.reduce((sum, t) => sum + t.amount, 0))}
        </Text>
        <Text style={[styles.td, styles.tdCenter]} />
      </View>
    }
  />
</View>
    </View>
  );
};

export default OptionalExpensesScreen;

const styles = StyleSheet.create({
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
    paddingBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
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
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },table: {
  borderWidth: 1,
  borderColor: '#e3e6eb',
  borderRadius: 10,
  overflow: 'hidden',
  backgroundColor: '#fff',
  elevation: 1,
},

tableHeader: {
  flexDirection: 'row',
  backgroundColor: '#f5f8ff',
  borderBottomWidth: 1,
  borderBottomColor: '#e3e6eb',
  paddingVertical: 10,
},

th: {
  flex: 1,
  paddingHorizontal: 10,
},
thText: {
  fontWeight: '700',
  color: '#334155',
},
thLeft: { alignItems: 'flex-start' },
thCenter: { alignItems: 'center' },
thRight: { alignItems: 'flex-end' },

tr: {
  flexDirection: 'row',
  paddingVertical: 10,
  paddingHorizontal: 10,
},
trEven: { backgroundColor: '#ffffff' },
trOdd: { backgroundColor: '#fafcff' },

td: { flex: 1, color: '#1f2937' },
tdLeft: { textAlign: 'left' },
tdCenter: { textAlign: 'center' },
tdRight: { textAlign: 'right' },

amountMono: { fontVariant: ['tabular-nums'], fontWeight: '600' },

rowDivider: {
  height: 1,
  backgroundColor: '#eef1f6',
  marginLeft: 10,
  marginRight: 10,
},

tfoot: {
  flexDirection: 'row',
  alignItems: 'center',
  borderTopWidth: 1,
  borderTopColor: '#e3e6eb',
  backgroundColor: '#f9fbff',
  paddingVertical: 12,
  paddingHorizontal: 10,
},
totalLabel: { fontWeight: '800', color: '#0f172a' },
totalValue: { fontWeight: '800', color: '#0f172a' },

emptyState: { paddingVertical: 16, alignItems: 'center' },
emptyText: { color: '#64748b' },
});