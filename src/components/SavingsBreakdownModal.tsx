// SavingsBreakdownModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  totalIncome: number;
  totalExpense: number;
  topIncomeCategories: { name: string; amount: number }[];
  topExpenseCategories: { name: string; amount: number }[];
}

const SavingsBreakdownModal = ({
  visible,
  onClose,
  totalIncome,
  totalExpense,
  topIncomeCategories,
  topExpenseCategories,
}: Props) => {
  const savings = totalIncome - totalExpense;

  const renderCategoryItem = (item: { name: string; amount: number }, isIncome: boolean) => (
    <View style={styles.categoryItem}>
      <Text style={styles.categoryName}>• {item.name}</Text>
      <Text style={[styles.categoryAmount, { color: isIncome ? '#2ecc71' : '#e74c3c' }]}>
        ₹{item.amount.toLocaleString()}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>💰 Savings Breakdown</Text>

          <Text style={styles.summaryText}>
            Income: <Text style={{ color: '#2ecc71' }}>₹{totalIncome.toLocaleString()}</Text>
          </Text>
          <Text style={styles.summaryText}>
            Expense: <Text style={{ color: '#e74c3c' }}>₹{totalExpense.toLocaleString()}</Text>
          </Text>
          <Text style={styles.summaryText}>
            Savings: <Text style={{ color: '#0984e3' }}>₹{savings.toLocaleString()}</Text>
          </Text>

          <Text style={styles.sectionTitle}>🔝 Top Income Categories:</Text>
          {topIncomeCategories.length === 0 ? (
            <Text style={styles.emptyText}>No income data</Text>
          ) : (
            topIncomeCategories.map((item) => <React.Fragment key={item.name}>
              {renderCategoryItem(item, true)}
            </React.Fragment>)
          )}

          <Text style={styles.sectionTitle}>💸 Top Expense Categories:</Text>
          {topExpenseCategories.length === 0 ? (
            <Text style={styles.emptyText}>No expense data</Text>
          ) : (
            topExpenseCategories.map((item) => <React.Fragment key={item.name}>
              {renderCategoryItem(item, false)}
            </React.Fragment>)
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={onClose}>
            <Text style={styles.saveBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SavingsBreakdownModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#0984e3',
  },
  summaryText: {
    fontSize: 16,
    marginVertical: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    color: '#2d3436',
    marginBottom: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  categoryName: {
    fontSize: 14,
    color: '#34495e',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    alignSelf: 'flex-start',
    paddingLeft: 6,
  },
  saveBtn: {
    backgroundColor: '#0984e3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});