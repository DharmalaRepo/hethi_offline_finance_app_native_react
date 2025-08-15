
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert, Image, Modal, Pressable
} from 'react-native';
import uuid from 'react-native-uuid';
import Icon from 'react-native-vector-icons/Ionicons';
import { deleteTransaction, updateTransaction, saveTransactions } from '../services/mockDataService';
import { Transaction } from '../models/Transaction';
import TransactionEditModal from '../components/TransactionEditModal';
import ExportModal from '../components/ExportModal';
import { Ionicons } from '@expo/vector-icons'; // Or react-native-vector-icons
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import TransactionListItem, { TransactionListHeader } from '../components/TransactionListItem';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Account } from '../models/Account';
import { useAppContext } from '../context/AppContext';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/routes'; // adjust as needed
import CheckBox from '@react-native-community/checkbox';
import { useAppData } from '../context/AppDataProvider';
import { SubCategory } from '../models/SubCategory';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

type VisibleCols = {
  date: boolean;
  category: boolean;
  sub: boolean;
  amount: boolean;   // fixed (always true)
  person: boolean;
  account: boolean;
};

const OPTIONAL_KEYS: Array<keyof VisibleCols> = ['date', 'category', 'sub', 'person', 'account'];

interface ToggleRowProps {
  value: VisibleCols;
  onChange: (v: VisibleCols) => void;
  onClose?: () => void;        // 👈 new
  autoCloseMs?: number;
}

type SortKey = 'date' | 'category' | 'subCategory' | 'person' | 'account' | 'amount';


export default function TransactionsScreen() {
  const [filtered, setFiltered] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: null,
    endDate: null,
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, string>>({});
  const [personsMap, setPersonsMap] = useState<Record<string, string>>({});
  const [accountsMap, setAccountsMap] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<SortKey>('date');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { showSensitiveData, toggleSensitiveData } = useAppContext(); // ✅ Use global toggle
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCopyMode, setIsCopyMode] = useState(false);
  const [selectedTxns, setSelectedTxns] = useState<string[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  const [visibleCols, setVisibleCols] = useState<VisibleCols>(() => ({
    date: true,
    category: true,
    sub: true,
    amount: true,
    person: false,
    account: false,
  }));

  const {
    persons,
    categories,
    transactions,
    reloadAppData,
  } = useAppData();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      console.log('TransactionsScreen is focused');
      reloadTransactions();
    }
  }, [isFocused]);

  useEffect(() => {
    refilter();
    // include sort/settings/maps if you want the header sort to live-update too
  }, [transactions, searchQuery, dateRange.startDate, dateRange.endDate, sortColumn, sortOrder, categoriesMap, subCategoriesMap]);

  const reloadTransactions = async () => {
    await reloadAppData();
    refilter();
  };

  type TransactionsScreenRouteProp = RouteProp<RootStackParamList, 'Transactions'>;
  const route = useRoute<TransactionsScreenRouteProp>();
  const filters = route.params?.filters;

  useEffect(() => {
    loadCategoryMaps();
  }, [transactions]);

  useFocusEffect(
    useCallback(() => {
      if (!filters) {
        reloadTransactions();
      }
    }, [filters])
  );


  useEffect(() => {
    if (!filters) return; // wait until filters are passed

    //console.log('inside useEffect with filters', filters);


    const loadData = async () => {
      const allTxns = transactions;

      const filtered = allTxns.filter(txn => {
        const matchesType = !filters?.type || txn.type === filters.type;
        const txnDate = new Date(txn.date);
        const matchesMonth = !filters?.month || txnDate.getMonth() + 1 === filters.month;
        const matchesYear = !filters?.year || txnDate.getFullYear() === filters.year;

        const isMatch = matchesType && matchesMonth && matchesYear;
        return isMatch;
      });
      setFiltered(filtered);
    };

    loadData();
  }, [filters]);

  // use the same filtered list you render in the table.
  // If you don’t have one, use your source list:
  const totals = useMemo(() => {
    // Replace `visibleTxns` with your filtered dataset for the table
    const list = filtered || [];
    let income = 0, expense = 0;
    for (const t of list) {
      const amt = Number(t.amount) || 0;
      if ((t.type || '').toLowerCase() === 'income') income += amt;
      else expense += amt;
    }
    const savings = income - expense;
    const count = filtered ? filtered.length : 0;
    return { income, expense, savings, count };
  }, [filtered]); // or your dependencies

  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<{ year: number; month: number }>(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const periodLabel = useMemo(() => {
    const d = new Date(period.year, period.month - 1, 1);
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [period]);
  const shiftPeriod = (delta: number) => {
    const t = new Date(period.year, period.month - 1 + delta, 1);
    setPeriod({ year: t.getFullYear(), month: t.getMonth() + 1 });
  };

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }



  const toggleOptions = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowOptions(prev => !prev);
  };


  const toggleCol = (key: keyof typeof visibleCols) =>
    setVisibleCols(v => ({ ...v, [key]: !v[key] }));

  const [bulkCopy, setBulkCopy] = useState(false);
  const [bulkDelete, setBulkDelete] = useState(false);

  // Quick From/To flag filters (replace with your real filters if different)
  const [filterFrom, setFilterFrom] = useState(false);
  const [filterTo, setFilterTo] = useState(false);

  const loadCategoryMaps = async () => {

    const catMap: Record<string, string> = {};
    const subMap: Record<string, string> = {};
    const perMap: Record<string, string> = {};
    const accMap: Record<string, string> = {};
    categories.forEach((cat) => {
      catMap[cat.id] = cat.name;
      cat.subcategories?.forEach((sub: SubCategory) => {
        subMap[sub.id] = sub.name;
      });
    });
    persons.forEach((per) => {
      perMap[per.id] = per.name;
      per.accounts?.forEach((acc: Account) => {
        accMap[acc.id] = acc.paymentMode;
      });
    });
    setCategoriesMap(catMap);
    setSubCategoriesMap(subMap);
    setPersonsMap(perMap);
    setAccountsMap(accMap);
  };

  const refilter = () => {
    filterTransactions(searchQuery, dateRange.startDate, dateRange.endDate);
  };


  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || '';
  };

  const getSubCategoryName = (categoryId: string, subCategoryId?: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    const sub = category?.subcategories?.find((s: SubCategory) => s.id === subCategoryId);
    return sub?.name || '';
  };

  const getPersonsMap = (personId: string): string => {
    const person = persons.find((p) => p.id === personId);
    return person?.name || '';
  };

  const getAccountsMap = (personId: string, accountId?: string): string => {
    const person = persons.find((p) => p.id === personId);
    const account = person?.accounts?.find((a: Account) => a.id === accountId);
    return account?.paymentMode || '';
  };


  const updateMonth = (direction: 'prev' | 'next') => {
    const now = new Date();
    const newDate =
      direction === 'prev'
        ? new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1)
        : new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1);

    // Prevent going beyond current month
    if (direction === 'next') {
      if (newDate.getFullYear() > now.getFullYear() ||
        (newDate.getFullYear() === now.getFullYear() && newDate.getMonth() > now.getMonth())) {
        return; // do nothing if trying to go past this month
      }
    }

    setCurrentViewDate(newDate);

    const start = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    const end = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
    setDateRange({ startDate: start, endDate: end });
    filterTransactions(searchQuery, start, end);
  };

  const monthLabel = currentViewDate.toLocaleString('default', { month: 'short', year: 'numeric' });

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

  const toggleSort = (column: SortKey) => {
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
          await reloadAppData();
          refilter();
        },
      },
    ]);
  };

  const handleUpdateTransaction = async (updated: Transaction) => {
    await updateTransaction(updated);
    setIsEditModalVisible(false);
    await reloadAppData();
    refilter();
  };

  const now = new Date();
  const currentMonthLabel = now.toLocaleString('default', { month: 'short' });
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthLabel = lastMonthDate.toLocaleString('default', { month: 'short' });

  const LABELS: Record<keyof VisibleCols, string> = {
    date: 'Date', category: 'Category', sub: 'Sub', person: 'Person', account: 'Account', amount: 'Amount',
  };

  const OPTIONAL_KEYS: (keyof VisibleCols)[] = ['date', 'category', 'sub', 'person', 'account'];

  const ColumnPickerCard: React.FC<{
    initial: VisibleCols;
    onApply: (next: VisibleCols) => void;
    onCancel: () => void;
  }> = ({ initial, onApply, onCancel }) => {
    const [draft, setDraft] = useState<VisibleCols>(initial);
    const selectedCount = OPTIONAL_KEYS.filter(k => draft[k]).length;

    const toggle = (k: keyof VisibleCols) => {
      if (k === 'amount') return;                       // fixed
      const next = !draft[k];
      if (next && selectedCount >= 4) return;           // max 4 optional
      if (!next && selectedCount <= 3) return;          // min 3 optional
      setDraft({ ...draft, [k]: next });
    };

    return (
      <View style={styles.pickerCard}>
        {OPTIONAL_KEYS.map(k => (
          <View key={k} style={styles.pickerRow}>
            <CheckBox value={!!draft[k]} onValueChange={() => toggle(k)} />
            <Text style={styles.pickerLabel}>{LABELS[k]}</Text>
          </View>
        ))}

        <View style={styles.pickerRow}>
          <CheckBox value disabled />
          <Text style={[styles.pickerLabel, { opacity: 0.7 }]}>Amount (always on)</Text>
        </View>

        <Text style={styles.pickerHint}>{`${selectedCount}/4 selected (min 3)`}</Text>

        <View style={styles.pickerActions}>
          <TouchableOpacity onPress={onCancel} style={styles.btnGhost}>
            <Text>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onApply(draft)}
            disabled={selectedCount < 3}
            style={[styles.btnPrimary, selectedCount < 3 && { opacity: 0.5 }]}
          >
            <Text style={styles.btnPrimaryText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          <TouchableOpacity onPress={reloadTransactions} style={styles.iconButton}>
            <Ionicons name="refresh" size={22} color="#e6f0ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSensitiveData} style={styles.iconButton}>
            <Ionicons name={showSensitiveData ? "eye" : "eye-off"} size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsExportModalVisible(true)} style={styles.iconButton}>
            <Icon name="share-outline" size={22} color="#fff" />
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

      <View style={styles.row}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInputSm}
            placeholder="Search by amount, category..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              filterTransactions(text, dateRange.startDate, dateRange.endDate);
            }}
            placeholderTextColor="#94a3b8"
          />
        </View>
        {/* Options Toggle Row */}
        <TouchableOpacity onPress={toggleOptions} style={styles.optionsBtn} activeOpacity={0.8}>
          <Ionicons name="options" size={16} color="#0a66e4" />
          <Text style={styles.optionsBtnText}>Options</Text>
          <Ionicons
            name={showOptions ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#0a66e4"
            style={{ marginLeft: 2 }}
          />
        </TouchableOpacity>
      </View>



      {/* Collapsible Panel */}
      {showOptions && (
        <View style={styles.optionsCompact}>

          

          {/* Row 1 — Month nav + Date range + Apply/Clear */}
          <View style={styles.optRowWrap}>
            {/* Month nav */}
            <TouchableOpacity onPress={() => updateMonth('prev')} style={styles.iconBtnSm}>
              <Ionicons name="chevron-back" size={18} color="#0a66e4" />
            </TouchableOpacity>

            <View style={[styles.pillSm, styles.pillNeutral]}>
              <Ionicons name="calendar" size={14} color="#0a66e4" />
              <Text style={styles.labelSm}>{monthLabel}</Text>
            </View>

            <TouchableOpacity onPress={() => updateMonth('next')} style={styles.iconBtnSm}>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={
                  currentViewDate.getMonth() === new Date().getMonth() &&
                    currentViewDate.getFullYear() === new Date().getFullYear()
                    ? '#cbd5e1'
                    : '#0a66e4'
                }
              />
            </TouchableOpacity>

            <View style={styles.optRow}>
            {!bulkDeleteMode && !isCopyMode && (
              <TouchableOpacity onPress={() => setShowColumnPicker(true)} style={styles.chipSm}>
                <Ionicons name="options-outline" size={16} color="#0C66E4" />
                <Text style={styles.chipTextSm}>Columns</Text>
              </TouchableOpacity>
            )}
          </View>

          {showColumnPicker && !bulkDeleteMode && !isCopyMode && (
            <ColumnPickerCard
              initial={visibleCols}
              onApply={(next) => { setVisibleCols(next); setShowColumnPicker(false); }}
              onCancel={() => setShowColumnPicker(false)}
            />
          )}

            <View style={styles.dot} />

            
          </View>

          {/* Row 2 — Date Range selection */}
          <View style={styles.optRow}>
            {/* Date range */}
            <TouchableOpacity style={[styles.pillSm, styles.pillFrom]} onPress={() => setShowStartPicker(true)}>
              <Ionicons name="calendar-number" size={14} color="#00b894" />
              <Text style={styles.labelSm}>
                {dateRange.startDate
                  ? `${String(dateRange.startDate.getDate()).padStart(2, '0')}-${String(dateRange.startDate.getMonth() + 1).padStart(2, '0')}-${dateRange.startDate.getFullYear()}`
                  : 'From'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.pillSm, styles.pillTo]} onPress={() => setShowEndPicker(true)}>
              <Ionicons name="calendar-number-outline" size={14} color="#fd79a8" />
              <Text style={styles.labelSm}>
                {dateRange.endDate
                  ? `${String(dateRange.endDate.getDate()).padStart(2, '0')}-${String(dateRange.endDate.getMonth() + 1).padStart(2, '0')}-${dateRange.endDate.getFullYear()}`
                  : 'To'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtnSm}
              onPress={() => filterTransactions(searchQuery, dateRange.startDate, dateRange.endDate)}
            >
              <Ionicons name="checkmark-circle" size={20} color="green" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtnSm}
              onPress={() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                setCurrentViewDate(now);
                setDateRange({ startDate: start, endDate: end });
                filterTransactions(searchQuery, start, end);
              }}
            >
              <Ionicons name="close-circle" size={20} color="red" />
            </TouchableOpacity>
          </View>

          {/* Row 3 — Bulk copy / delete */}
          <View style={styles.optRowWrap}>
            {!bulkDeleteMode && !showColumnPicker && (
              <TouchableOpacity
                onPress={() => { setIsCopyMode(!isCopyMode); setSelectedIds([]); }}
                style={[styles.pillSm, styles.pillCopy]}
              >
                <CheckBox
                  value={isCopyMode}
                  onValueChange={(v) => { setIsCopyMode(v); setSelectedIds([]); }}
                  tintColors={{ true: 'green', false: 'gray' }}
                />
                <Text style={styles.labelSm}>Copy (current date)</Text>
              </TouchableOpacity>
            )}

            {!isCopyMode && !showColumnPicker && (
              <TouchableOpacity
                onPress={() => { setBulkDeleteMode(!bulkDeleteMode); setSelectedIds([]); }}
                style={[styles.pillSm, styles.pillDelete]}
              >
                <CheckBox
                  value={bulkDeleteMode}
                  onValueChange={(v) => { setBulkDeleteMode(v); setSelectedIds([]); }}
                  tintColors={{ true: 'red', false: 'gray' }}
                />
                <Text style={styles.labelSm}>Delete transactions</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.headerRow}>
        <Text style={styles.subheading}>Transactions</Text>

        <Text style={styles.headerTotals}>
          <Text style={styles.tinySavings}> ({totals.count.toLocaleString('en-IN')})</Text>
          {'  '}
          <Text style={styles.tinyIncome}>+₹{totals.income.toLocaleString('en-IN')}</Text>
          {'  '}
          <Text style={styles.tinyExpense}>-₹{totals.expense.toLocaleString('en-IN')}</Text>

        </Text>


      </View>

      {/* Transactions List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <TransactionListHeader
            visibleCols={visibleCols}        // your state with amount fixed & 3–4 others
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            isCopyMode={isCopyMode}
            isBulkDeleteMode={bulkDeleteMode}   
            onSort={toggleSort}          // your existing sorter
          />
        }
        renderItem={({ item, index }) => (
          <TransactionListItem
            transaction={item}
            index={index} // 🔹 pass row index
            isCopyMode={isCopyMode}
            isBulkDeleteMode={bulkDeleteMode}
            isSelected={selectedIds.includes(item.id)}
            onSelect={(id, selected) => {
              setSelectedIds(prev =>
                selected ? [...prev, id] : prev.filter(itemId => itemId !== id)
              );
            }}
            onEdit={(tx) => {
              setSelectedTransaction(tx);
              setIsEditModalVisible(true);
            }}
            onDelete={handleDelete}
            categoryName={categoriesMap[item.categoryId] || ''}
            subCategoryName={item.subCategoryId ? subCategoriesMap[item.subCategoryId] : ''}
            personName={personsMap[item.personId] || ''}
            accountName={item.accountId ? accountsMap[item.accountId] : ''}
            visibleCols={visibleCols}
          />
        )}
      />

      {isCopyMode && selectedIds.length > 0 && (
        <View style={styles.bulkDeleteBar}>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => {
              Alert.alert(
                'Confirm Copy',
                `Copy ${selectedIds.length} transaction(s)?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Copy',
                    style: 'destructive',
                    onPress: async () => {
                      const now = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

                      const transactionsToCopy = transactions.filter(txn => selectedIds.includes(txn.id));
                      const copiedTxns = transactionsToCopy.map(txn => ({
                        ...txn,
                        id: uuid.v4().toString(),
                        date: now,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      }));

                      const updated = [...transactions, ...copiedTxns];
                      await saveTransactions(updated);
                      reloadAppData();

                      Alert.alert('Copied', `${copiedTxns.length} transaction(s) copied to today.`);

                      setIsCopyMode(false);
                      setSelectedIds([]);
                    }
                  },
                ]
              );
            }}
          >
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              setIsCopyMode(false);
              setSelectedIds([]);
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {bulkDeleteMode && selectedIds.length > 0 && (
        <View style={styles.bulkDeleteBar}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              Alert.alert(
                'Confirm Delete',
                `Delete ${selectedIds.length} transaction(s)?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      const updated = transactions.filter(txn => !selectedIds.includes(txn.id));
                      saveTransactions(updated);
                      reloadAppData();
                      setBulkDeleteMode(false);
                      setSelectedIds([]);
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              setBulkDeleteMode(false);
              setSelectedIds([]);
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

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
    backgroundColor: '#0a66e4',
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
  optionsCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },

  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  optRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },

  /* Search compact */
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 38,
  },
  searchInputSm: {
    flex: 1,
    paddingVertical: 6,
    color: '#0f172a',
    fontSize: 13,
  },

  /* Small chips & pills */
  chipSm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderColor: '#dbeafe',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 36,
  },
  chipTextSm: { fontSize: 12, color: '#0C66E4', fontWeight: '700', marginLeft: 6 },

  iconBtnSm: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pillSm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
  },
  labelSm: { fontSize: 12, color: '#0f172a' },

  pillNeutral: { backgroundColor: '#f8fafc', borderColor: '#e5e7eb' },
  pillFrom: { backgroundColor: '#f0fdf4', borderColor: '#d1fae5' },
  pillTo: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
  pillCopy: { backgroundColor: '#f0fdf4', borderColor: '#d1fae5' },
  pillDelete: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },

  dot: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb',
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
    marginTop: 3,
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
  bulkDeleteBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f6fa',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  deleteBtn: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  copyBtn: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  copyText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  subheading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 12,
    textAlign: 'left',
  },

  bulkDeleteInactive: {
    color: 'red',
    fontWeight: '600',
  },

  bulkCopyInactive: {
    color: 'green',
    fontWeight: '600',
  },

  bulkDeleteActive: {
    color: 'red',
    fontWeight: 'bold',
  },

  bulkCopyActive: {
    color: 'green',
    fontWeight: 'bold',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    color: 'blue',
  },

  copyControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    color: 'blue',
    gap: 8,
  },

  copySelectionCount: {
    textAlign: 'center',
    marginBottom: 8,
    color: 'blue',
    fontSize: 14,
    fontWeight: '500',
  },
  pickerCard: {
    marginTop: 8,
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickerLabel: { marginLeft: 8, fontSize: 14, color: '#333' },
  pickerHint: { marginTop: 4, fontSize: 12, color: '#6b7280' },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  btnGhost: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#f3f4f6',
  },
  btnPrimary: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#0C66E4',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
  // add to your Transactions screen stylesheet
  headerTotals: { marginLeft: 0, fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  tinyIncome: { fontSize: 12, color: '#16a34a', fontWeight: '800' }, // green
  tinyExpense: { fontSize: 12, color: '#dc2626', fontWeight: '800' }, // red
  tinySavings: { fontSize: 12, color: '#f59e0b', fontWeight: '800' }, // amber
  tinySavingsNeg: { fontSize: 12, color: '#ef4444', fontWeight: '800' },
  optionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },

  optionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  optionsBtnText: {
    marginLeft: 6,
    color: '#0a66e4',
    fontWeight: '700',
    fontSize: 12,
  },

  optionsPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },

  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },

  chipBtnText: { fontSize: 12, color: 'black', marginLeft: 4 },

  chipToggle: { marginLeft: 8 }, optSection: {
    marginBottom: 12,
  },

  optTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },

  optDivider: {
    height: 1,
    backgroundColor: '#eef2f7',
    marginVertical: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
  },

  grow: { flex: 1 },

  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },

  monthLabelPill: {
    paddingHorizontal: 14,
    marginHorizontal: 6,
  },

  pillIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
  },
});