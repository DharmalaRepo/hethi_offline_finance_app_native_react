import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Transaction } from '../models/Transaction';

interface Props {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  categoryName: string;
  subCategoryName?: string;
}

const TransactionListItem: React.FC<Props> = ({
  transaction,
  onEdit,
  onDelete,
  categoryName,
  subCategoryName,
}) => {
  const amountColor = transaction.type === 'income' ? '#28a745' : '#dc3545';

  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.cell}>{transaction.date}</Text>
      <Text style={styles.cell}>{categoryName}</Text>
      <Text style={styles.cell}>{subCategoryName || ''}</Text>
      <Text style={[styles.cell, styles.amount, { color: amountColor }]}>
        ₹ {transaction.amount}
      </Text>
      <TouchableOpacity onPress={() => onEdit(transaction)} style={styles.iconBtn}>
        <Ionicons name="create-outline" size={20} color="#007bff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(transaction.id)} style={styles.iconBtn}>
        <Ionicons name="trash-outline" size={20} color="#dc3545" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 14,
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