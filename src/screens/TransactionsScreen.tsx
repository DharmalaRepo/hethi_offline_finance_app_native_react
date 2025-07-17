
import React, { useCallback, useEffect, useState } from 'react';
import { Person } from '../models/Person';


import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAllTransactions, deleteTransaction, updateTransaction } from '../services/mockDataService';
import { getCategories, getPersons } from '../services/mockDataService';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import TransactionEditModal from '../components/TransactionEditModal';
import ExportModal from '../components/ExportModal';
import DateRangeFilter from '../components/DateRangeFilter';
import { Ionicons } from '@expo/vector-icons'; // Or react-native-vector-icons
import { useFocusEffect } from '@react-navigation/native';
import TransactionListItem from '../components/TransactionListItem';
import DateTimePicker from '@react-native-community/datetimepicker';



export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null,
  });
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [persons, setPersons] = useState<Person[]>([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadTransactions();
    loadCategoryMaps();
  }, []);

  useFocusEffect(
     useCallback(() => {
       reloadData();
     }, [])
   );

  useEffect(() => {
    const loadPersons = async () => {
      const fetchedPersons = await getPersons();
      setPersons(fetchedPersons);
    };
    loadPersons();
  }, []);

  useEffect(() => {
  const loadCategories = async () => {
    const all = await getCategories();
    setCategories(all);
  };
  loadCategories();
}, []);

 const reloadData = async () => {
      setCategories(await getCategories());
       loadTransactions();
       loadCategoryMaps();
       loadPersons();
    };

  const loadTransactions = async () => {
    const txns = await getAllTransactions();
    setTransactions(txns);
    setFiltered(txns);
  };

  const personsMap: Record<string, string> = persons.reduce((acc, person) => {
    acc[person.id] = person.name;
    return acc;
  }, {} as Record<string, string>);

  const filteredTransactions = transactions.filter((tx) => {
    const category = categoriesMap[tx.categoryId]?.toLowerCase() || '';
    const subcategory = subCategoriesMap[tx.subCategoryId || '']?.toLowerCase() || '';
    const person = personsMap[tx.personId]?.toLowerCase() || '';
    const search = searchQuery.toLowerCase();
    return (
      tx.amount.toString().includes(search) ||
      category.includes(search) ||
      subcategory.includes(search) ||
      person.includes(search)
    );
  });

  const loadCategoryMaps = async () => {
    const cats = await getCategories();
    const catMap: Record<string, string> = {};
    const subMap: Record<string, string> = {};
    cats.forEach((cat) => {
      catMap[cat.id] = cat.name;
      cat.subcategories?.forEach((sub) => {
        subMap[sub.id] = sub.name;
      });
    });
    setCategoriesMap(catMap);
    setSubCategoriesMap(subMap);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterTransactions(text, dateRange.startDate, dateRange.endDate);
  };
  
  const getCategoryName = (categoryId: string): string => {
  const category = categories.find((c) => c.id === categoryId);
  return category?.name || '';
};

const getSubCategoryName = (categoryId: string, subCategoryId?: string): string => {
  const category = categories.find((c) => c.id === categoryId);
  const sub = category?.subcategories?.find((s) => s.id === subCategoryId);
  return sub?.name || '';
};
  const filterTransactions = (query: string, start: Date | null, end: Date | null) => {
    let results = [...transactions];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter((txn) => {
        const cat = categoriesMap[txn.categoryId]?.toLowerCase() || '';
        const sub = txn.subCategoryId ? subCategoriesMap[txn.subCategoryId]?.toLowerCase() : '';
        return (
          txn.amount.toString().includes(q) ||
          cat.includes(q) ||
          sub.includes(q)
        );
      });
    }

    if (start && end) {
      results = results.filter((txn) => {
        const txnDate = new Date(txn.date);
        return txnDate >= start && txnDate <= end;
      });
    }

    results.sort((a, b) => {
      let fieldA: any;
  let fieldB: any;

  switch (sortColumn) {
    case 'amount':
      fieldA = a.amount;
      fieldB = b.amount;
      break;
    case 'date':
      fieldA = new Date(a.date);
      fieldB = new Date(b.date);
      break;
    case 'category':
      fieldA = getCategoryName(a.categoryId); // helper function
      fieldB = getCategoryName(b.categoryId);
      break;
    case 'subCategory':
      fieldA = getSubCategoryName(a.categoryId, a.subCategoryId);
      fieldB = getSubCategoryName(b.categoryId, b.subCategoryId);
      break;
    default:
      return 0;
  }

  if (fieldA == null || fieldB == null) return 0;

  return sortOrder === 'asc'
    ? fieldA > fieldB
      ? 1
      : -1
    : fieldA < fieldB
    ? 1
    : -1;
});

    setFiltered(results);
  };

  const toggleSort = (column: string) => {
    if (column === sortColumn) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    filterTransactions(searchQuery, dateRange.startDate, dateRange.endDate);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          await deleteTransaction(id);
          await loadTransactions();
        },
      },
    ]);
  };

  const handleUpdateTransaction = async (updated: Transaction) => {
    await updateTransaction(updated);
    setIsEditModalVisible(false);
    await loadTransactions();
  };

  return (
    <View style={styles.container}>
      {/* Header Title */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity
                      onPress={loadTransactions}
                      style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#007bff',
                        borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#e6f0ff', }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginRight: 6, }}>
                        ⟳
                      </Text>
                      <Text style={{ fontSize: 14, color: '#007bff' }}>Reload</Text>
              </TouchableOpacity>

      </View>

      {/* Search Row */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by amount, category..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            filterTransactions(text, dateRange.startDate, dateRange.endDate);
          }}
        />
        <TouchableOpacity onPress={() => setIsExportModalVisible(true)} style={styles.iconBtn}>
          <Icon name="share-outline" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Date Filters */}
      <View style={styles.dateRow}>
        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateBtn}>
          <Text style={styles.dateText}>{dateRange.startDate?.toDateString() || 'Start Date'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateBtn}>
          <Text style={styles.dateText}>{dateRange.endDate?.toDateString() || 'End Date'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn} onPress={() => filterTransactions(searchQuery, dateRange.startDate, dateRange.endDate)}>
          <Ionicons name="checkmark-circle" size={22} color="green" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setDateRange({ startDate: null, endDate: null })}>
          <Ionicons name="close-circle" size={22} color="red" />
        </TouchableOpacity>
      </View>

      {/* Sort Header */}
      <View style={styles.headerRow}>
        {['date', 'category', 'subCategory', 'amount'].map((col) => (
          <TouchableOpacity key={col} onPress={() => toggleSort(col)} style={styles.headerCell}>
            <Text style={styles.headerText}>
              {col === 'subCategory' ? 'SUB-CAT' : col.toUpperCase()}
              {sortColumn === col ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionListItem
            transaction={item}
            onEdit={(tx) => {
              setSelectedTransaction(tx);
              setIsEditModalVisible(true);
            }}
            onDelete={handleDelete}
            categoryName={categoriesMap[item.categoryId] || ''}
            subCategoryName={item.subCategoryId ? subCategoriesMap[item.subCategoryId] : ''}
          />
        )}
      />

      {/* Edit Modal */}
      {selectedTransaction && (
        <TransactionEditModal
          visible={isEditModalVisible}
          transaction={selectedTransaction}
          onSave={handleUpdateTransaction}
          onClose={() => setIsEditModalVisible(false)}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        visible={isExportModalVisible}
        onClose={() => setIsExportModalVisible(false)}
        transactions={filtered}
        categoryMap={categoriesMap}
        subCategoryMap={subCategoriesMap}
        personsMap={personsMap}
      />

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={dateRange.startDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setDateRange((prev) => ({ ...prev, startDate: selectedDate }));
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={dateRange.endDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) {
              setDateRange((prev) => ({ ...prev, endDate: selectedDate }));
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ffffff',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 12,
  },

  // Header row with title and refresh icon
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },

  reloadIcon: {
    padding: 6,
    backgroundColor: '#e6f0ff',
    borderRadius: 6,
  },

  // Search row containing input and buttons
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },

  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },

  reloadButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#e6f0ff',
  },

  iconBtn: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#e6f0ff',
    borderRadius: 6,
  },

  // Date filter row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginTop: 10,
    gap: 8,
  },

  dateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
  },

  dateText: {
    color: '#003366',
    fontWeight: '600',
  },

  applyBtn: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },

  cancelBtn: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },

  applyText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  cancelText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Sort header cells
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },

  headerText: {
    fontWeight: 'bold',
    color: '#003366',
  },

  // FlatList item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 10,
  },

  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
});