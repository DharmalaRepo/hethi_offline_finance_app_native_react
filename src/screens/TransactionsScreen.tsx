
import React, { useCallback, useEffect, useState } from 'react';
import { Person } from '../models/Person';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert, Image, Modal, Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAllTransactions, deleteTransaction, updateTransaction, getAllPersons } from '../services/mockDataService';
import { getCategories, getPersons, getAccounts } from '../services/mockDataService';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import TransactionEditModal from '../components/TransactionEditModal';
import ExportModal from '../components/ExportModal';
import DateRangeFilter from '../components/DateRangeFilter';
import { Ionicons } from '@expo/vector-icons'; // Or react-native-vector-icons
import { useFocusEffect } from '@react-navigation/native';
import TransactionListItem from '../components/TransactionListItem';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Account } from '../models/Account';
import { useAppContext  } from '../context/AppContext';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/routes'; // adjust as needed



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
  const [modalVisible, setModalVisible] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [persons, setPersons] = useState<Person[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { showSensitiveData, toggleSensitiveData } = useAppContext(); // ✅ Use global toggle

  type TransactionsScreenRouteProp = RouteProp<RootStackParamList, 'Transactions'>;
  const route = useRoute<TransactionsScreenRouteProp>();
  const filters = route.params?.filters;

  useEffect(() => {
    loadTransactions();
    loadCategoryMaps();
  }, []);

 useFocusEffect(
  useCallback(() => {
    if (!filters) {
      reloadData(); // only reload if not navigating with filters
    }
  }, [filters])
);

  useEffect(() => {    
    loadPersons();
  }, []);

  useEffect(() => {
      const loadAccounts = async () => {
        const fetchedAccounts = await getAccounts();
        setAccounts(fetchedAccounts);
      };
      loadAccounts();
    }, []);

  useEffect(() => {
  const loadCategories = async () => {
    const all = await getCategories();
    setCategories(all);
  };
  loadCategories();
}, []);

useEffect(() => {
  if (!filters) return; // wait until filters are passed

  console.log('inside useEffect with filters', filters);
  

  const loadData = async () => {
    const allTxns = await getAllTransactions();

    const filtered = allTxns.filter(txn => {
  const matchesType = !filters?.type || txn.type === filters.type;
  const txnDate = new Date(txn.date);
  const matchesMonth = !filters?.month || txnDate.getMonth() + 1 === filters.month;
  const matchesYear = !filters?.year || txnDate.getFullYear() === filters.year;

  const isMatch = matchesType && matchesMonth && matchesYear;

  if (isMatch) {
    console.log('✅ Filter Match:', txn.type, txn.date, txn.amount);
  }

  return isMatch;
});

    setTransactions(filtered);
    setFiltered(filtered);
  };

  loadData();
}, [filters]);

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

  const loadPersons = async () => {
      const fetchedPersons = await getPersons();
      setPersons(fetchedPersons);
      };

  const personsMap: Record<string, string> = persons.reduce((acc, person) => {
    acc[person.id] = person.name;
    return acc;
  }, {} as Record<string, string>);

    const accountsMap: Record<string, string> = accounts.reduce((acc, account) => {
      acc[account.id] = account.paymentMode;
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

  const now = new Date();
  const currentMonthLabel = now.toLocaleString('default', { month: 'short' });
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthLabel = lastMonthDate.toLocaleString('default', { month: 'short' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
            </TouchableOpacity>

            <Text style={styles.title}> Transactions</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={loadTransactions} style={styles.iconButton}>
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
        {/* Current Month */}
                <TouchableOpacity
                  style={styles.filterOption}
                  onPress={() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    setDateRange({ startDate: start, endDate: end });
                    filterTransactions(searchQuery, start, end);
                  }}
                >
                  <Ionicons name="calendar" size={18} color="#0984e3" />
                  <Text style={styles.filterText}>{currentMonthLabel}</Text>
                </TouchableOpacity>

                {/* Last Month */}
                <TouchableOpacity
                  style={styles.filterOption}
                  onPress={() => {
                    const now = new Date();
                    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const end = new Date(now.getFullYear(), now.getMonth(), 0);
                    setDateRange({ startDate: start, endDate: end });
                    filterTransactions(searchQuery, start, end);
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color="#6c5ce7" />
                  <Text style={styles.filterText}>{lastMonthLabel}</Text>
                </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsExportModalVisible(true)} style={styles.iconBtn}>
          <Icon name="share-outline" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.dateRow, { flexWrap: 'wrap', rowGap: 6 }]}>


        {/* Start Date */}
        <TouchableOpacity
          style={styles.filterOption}
          onPress={() => setShowStartPicker(true)}
        >
          <Ionicons name="calendar-number" size={18} color="#00b894" />
          <Text style={styles.filterText}>
            {dateRange.startDate
              ? `${dateRange.startDate.getDate().toString().padStart(2, '0')}-${(dateRange.startDate.getMonth() + 1).toString().padStart(2, '0')}-${dateRange.startDate.getFullYear()}`
              : 'From'}
          </Text>
        </TouchableOpacity>

        {/* End Date */}
        <TouchableOpacity
          style={styles.filterOption}
          onPress={() => setShowEndPicker(true)}
        >
          <Ionicons name="calendar-number-outline" size={18} color="#fd79a8" />
          <Text style={styles.filterText}>
            {dateRange.endDate
              ? `${dateRange.endDate.getDate().toString().padStart(2, '0')}-${(dateRange.endDate.getMonth() + 1).toString().padStart(2, '0')}-${dateRange.endDate.getFullYear()}`
              : 'To'}
          </Text>
        </TouchableOpacity>

        {/* Apply */}
        <TouchableOpacity
          style={styles.filterIconBtn}
          onPress={() =>
            filterTransactions(searchQuery, dateRange.startDate, dateRange.endDate)
          }
        >
          <Ionicons name="checkmark-circle" size={22} color="green" />
        </TouchableOpacity>

        {/* Clear */}
        <TouchableOpacity
          style={styles.filterIconBtn}
          onPress={() => {
            setDateRange({ startDate: null, endDate: null });
            filterTransactions(searchQuery, null, null); // fallback
          }}
        >
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
        accountsMap={accountsMap}
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
screen: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
    color: '#222',
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
iconButton: {
  marginLeft: 12,
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
  modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.9)',
      justifyContent: 'center',
      alignItems: 'center',
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
    quickFilterBtn: {
      backgroundColor: '#dfe6e9',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    quickFilterText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#2d3436',
    },
    filterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f1f2f6',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      marginRight: 6,
    },
    filterText: {
      marginLeft: 4,
      fontSize: 14,
      fontWeight: '500',
      color: '#2d3436',
    },
    filterIconBtn: {
      backgroundColor: '#f1f2f6',
      padding: 6,
      borderRadius: 8,
      marginRight: 6,
    },
});