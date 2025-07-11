import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { CategoryService } from '../features/categories/CategoryService';
import { PersonService } from '../features/persons/PersonService';
import TransactionEditDialog from '../components/TransactionEditDialog';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  persons: Person[];
  selectedCategoryId?: string;
  setSelectedCategoryId: (id?: string) => void;
  selectedPersonId?: string;
  setSelectedPersonId: (id?: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  onEdit: (txn: Transaction) => void;
  refreshData: () => void;
}

const TransactionsView: React.FC<Props> = ({ transactions, refreshData }) => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [personId, setPersonId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [editVisible, setEditVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    (async () => {
      setCategories(await CategoryService.getAll());
      setPersons(await PersonService.getAll());
    })();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];
    if (categoryId) filtered = filtered.filter(txn => txn.categoryId === categoryId);
    if (personId) filtered = filtered.filter(txn => txn.personId === personId);
    if (fromDate) filtered = filtered.filter(txn => txn.date >= fromDate);
    if (toDate) filtered = filtered.filter(txn => txn.date <= toDate);
    setFilteredTransactions(filtered);
  }, [categoryId, personId, fromDate, toDate, transactions]);

  const handleEdit = (txn: Transaction) => {
    setSelectedTransaction(txn);
    setEditVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transactions</Text>

      <Text style={styles.label}>Filter by Category:</Text>
      <RNPickerSelect
        onValueChange={setCategoryId}
        value={categoryId}
        items={categories.map(c => ({ label: c.name, value: c.id }))}
        placeholder={{ label: 'All Categories', value: null }}
      />

      <Text style={styles.label}>Filter by Person:</Text>
      <RNPickerSelect
        onValueChange={setPersonId}
        value={personId}
        items={persons.map(p => ({ label: p.name, value: p.id }))}
        placeholder={{ label: 'All Persons', value: null }}
      />

      <Text style={styles.label}>From Date:</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={fromDate}
        onChangeText={setFromDate}
      />

      <Text style={styles.label}>To Date:</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={toDate}
        onChangeText={setToDate}
      />

      {filteredTransactions.length === 0 ? (
        <Text style={{ marginTop: 20 }}>No transactions found for selected filters.</Text>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleEdit(item)}>
              <View style={styles.card}>
                <Text style={styles.amount}>{item.type.toUpperCase()}: ₹{item.amount}</Text>
                <Text>
                  {item.date} | Cat: {item.categoryId} | Person: {item.personId}
                </Text>
                {item.note && <Text style={styles.note}>Note: {item.note}</Text>}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {selectedTransaction && (
        <TransactionEditDialog
          visible={editVisible}
          transaction={selectedTransaction}
          onClose={() => setEditVisible(false)}
          onUpdate={refreshData}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  label: { marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  card: {
    padding: 12,
    backgroundColor: '#f2f2f2',
    marginVertical: 6,
    borderRadius: 8,
  },
  amount: { fontWeight: 'bold' },
  note: { fontStyle: 'italic', marginTop: 4 },
});

export default TransactionsView;