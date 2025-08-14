import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Transaction } from '../models/Transaction';
import { useAppContext } from '../context/AppContext';
import CheckBox from '@react-native-community/checkbox';

type SortKey = 'date' | 'category' | 'subCategory' | 'person' | 'account' | 'amount';

const COLS = [
  { key: 'date', label: 'DATE', sortKey: 'date' as SortKey },
  { key: 'category', label: 'CAT', sortKey: 'category' as SortKey },
  { key: 'sub', label: 'SUB-CAT', sortKey: 'subCategory' as SortKey },
  { key: 'person', label: 'PER', sortKey: 'person' as SortKey },
  { key: 'account', label: 'ACC', sortKey: 'account' as SortKey },
  { key: 'amount', label: 'AMOUNT', sortKey: 'amount' as SortKey },
] as const;

type VisibleCols = {
  date: boolean;
  category: boolean;
  sub: boolean;
  person: boolean;
  account: boolean;
  amount: boolean;
};

interface HeaderProps {
  visibleCols: Partial<VisibleCols>;        // same shape you already use
  sortColumn: SortKey;
  sortOrder: 'asc' | 'desc';
  onSort: (key: SortKey) => void;           // call your toggleSort from screen
}

export const TransactionListHeader: React.FC<HeaderProps> = ({
  visibleCols,
  sortColumn,
  sortOrder,
  onSort,
}) => {
  return (
    <View style={styles.headerRow}>
      {COLS.filter(c => !!visibleCols[c.key as keyof VisibleCols]) // show only selected
        .map(c => (
          <TouchableOpacity
            key={c.sortKey}
            onPress={() => onSort(c.sortKey)}
            style={styles.headerCell}
            activeOpacity={0.7}
          >
            <Text style={styles.headerText}>
              {c.label}
              {sortColumn === c.sortKey ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
            </Text>
          </TouchableOpacity>
        ))}
      <Text style={styles.headerText}>EDIT / DEL</Text>
    </View>

  );
};


interface Props {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  isCopyMode?: boolean;
  isBulkDeleteMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onSelect?: (id: string, selected: boolean) => void;
  categoryName: string;
  subCategoryName?: string;
  personName?: string;
  accountName?: string;
  visibleCols?: Partial<VisibleCols>;
}

const DEFAULT_VISIBLE: VisibleCols = {
  date: true,
  category: true,
  sub: true,
  person: false,
  account: false,
  amount: true,
};

const TransactionListItem: React.FC<Props & { index: number }> = ({
  transaction,
  index,
  onEdit,
  onDelete,
  isCopyMode,
  categoryName,
  subCategoryName,
  isBulkDeleteMode,
  isSelected,
  onSelect,
  personName,
  accountName,
  visibleCols = DEFAULT_VISIBLE,
}) => {
  const amountColor = transaction.type === 'income' ? '#28a745' : '#dc3545';
  const { showSensitiveData, toggleSensitiveData } = useAppContext(); // ✅ Use global toggle

  // fallbacks if parent didn’t pass names
  const person = personName ?? transaction.personId ?? '';
  const account = accountName ?? transaction.accountId ?? '';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.row,
          { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }, // 🔹 striped rows
        ]}
      >
        {(isCopyMode || isBulkDeleteMode) && (
          <CheckBox
            value={isSelected}
            onValueChange={(value) => onSelect?.(transaction.id, value)}
            tintColors={{ true: isCopyMode ? '#007AFF' : 'red', false: '#888' }}
            style={{ marginRight: 8 }}
          />
        )}


        {visibleCols.date && <Text style={styles.cell}>{transaction.date}</Text>}
        {visibleCols.category && <Text style={styles.cell}>{categoryName}</Text>}
        {visibleCols.sub && <Text style={styles.cell}>{subCategoryName || ''}</Text>}
        {visibleCols.person && <Text style={styles.cell}>{person}</Text>}
        {visibleCols.account && <Text style={styles.cell}>{account}</Text>}
        {visibleCols.amount && (
          <Text
            style={[
              styles.cell,
              styles.amount,
              { color: amountColor },
              transaction.isOptional && { textDecorationLine: 'underline', textDecorationColor: 'orange' },
            ]}
          >
            {showSensitiveData ? `₹ ${transaction.amount}` : '₹ ****'}
          </Text>
        )}
        {!isBulkDeleteMode && !isCopyMode && (
          <>
            <TouchableOpacity onPress={() => onEdit(transaction)} style={styles.iconBtn}>
              <Ionicons name="create-outline" size={20} color="#007bff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(transaction.id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={20} color="#dc3545" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'white',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007bff',
    marginHorizontal: 4,
  },
  amount: {
    fontWeight: 'bold',
  },
  iconBtn: {
    paddingHorizontal: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f9fc',
    borderBottomWidth: 1,
    borderColor: '#e6eaf0',
    minHeight: 36,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,   // match row.cell padding
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#003366',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    minHeight: 40,               // helps alignment
  },
  cell: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 4,        // little gutter matches header
  },
  
});

export default TransactionListItem;