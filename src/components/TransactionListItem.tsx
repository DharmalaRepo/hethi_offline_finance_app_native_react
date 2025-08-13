import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Transaction } from '../models/Transaction';
import { useAppContext } from '../context/AppContext';
import CheckBox from '@react-native-community/checkbox';

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
}

const TransactionListItem: React.FC<Props> = ({
  transaction,
  onEdit,
  onDelete,
  isCopyMode,
  categoryName,
  subCategoryName,
  isBulkDeleteMode,
  isSelected,
  onToggleSelect,
  onSelect,
}) => {
  const amountColor = transaction.type === 'income' ? '#28a745' : '#dc3545';
  const { showSensitiveData, toggleSensitiveData } = useAppContext(); // ✅ Use global toggle


  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {(isCopyMode || isBulkDeleteMode) && (
          <CheckBox
            value={isSelected}
            onValueChange={(value) => onSelect?.(transaction.id, value)}
            tintColors={{ true: isCopyMode ? '#007AFF' : 'red', false: '#888' }}
            style={{ marginRight: 8 }}
          />
        )}

        <View
          style={[
            styles.dot,
            {
              backgroundColor:
                transaction.isReversible
                  ? transaction.isSettled
                    ? '#4caf50' // ✅ Green → Reversible & Settled
                    : '#f44336' // 🔴 Red → Reversible & Not Settled
                  : 'white',   // 🔵 Blue → Not Reversible
            },
          ]}
        />
        <Text style={styles.cell}>{transaction.date}</Text>
        <Text style={styles.cell}>{categoryName}</Text>
        <Text style={styles.cell}>{subCategoryName || ''}</Text>
        <Text style={[styles.cell, styles.amount, { color: amountColor }, transaction.isOptional && { textDecorationLine: 'underline', textDecorationColor: 'orange' },]}>
          {showSensitiveData ? `₹ ${transaction.amount}` : '₹ ****'}
        </Text>
        {!isBulkDeleteMode && (
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007bff',
    marginHorizontal: 4,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  amount: {
    fontWeight: 'bold',
  },
  iconBtn: {
    paddingHorizontal: 4,
  },
});

export default TransactionListItem;