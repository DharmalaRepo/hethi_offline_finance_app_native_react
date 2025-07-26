import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { getCategories, getPersons, getAccounts } from '../services/mockDataService';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  transaction: Transaction;
  onSave: (updatedTransaction: Transaction) => void;
  onClose: () => void;
}

const TransactionEditModal: React.FC<Props> = ({ visible, transaction, onSave, onClose }) => {
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [date, setDate] = useState(new Date(transaction.date));
  const [note, setNote] = useState(transaction.note || '');
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [subCategoryId, setSubCategoryId] = useState(transaction.subCategoryId || '');
  const [personId, setPersonId] = useState(transaction.personId);
  const [accountId, setAccountId] = useState(transaction.accountId);
  const [type, setType] = useState<'income' | 'expense'>(transaction.type);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<Category['subcategories']>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedCategories, fetchedPersons, fetchedAccounts] = await Promise.all([
        getCategories(),
        getPersons(),
        getAccounts(),
      ]);
      setCategories(fetchedCategories);
      setPersons(fetchedPersons);
      setAccounts(fetchedAccounts);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const selectedCategory = categories.find((cat) => cat.id === categoryId);
    setSubCategories(selectedCategory?.subcategories || []);

  }, [categoryId, categories]);

  useEffect(() => {
      const selectedAccounts = persons.find((per) => per.id === personId);
      setAccounts(selectedAccounts?.accounts || []);

    }, [personId, persons]);

  useEffect(() => {
    if (transaction && visible) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDate(new Date(transaction.date));
      setNote(transaction.note || '');
      setCategoryId(transaction.categoryId || '');
      setSubCategoryId(transaction.subCategoryId || '');
      setPersonId(transaction.personId || '');
      setAccountId(transaction.accountId || '');
    }
  }, [transaction, visible]);

  const handleUpdate = () => {
    const updated: Transaction = {
      ...transaction,
      amount: parseFloat(amount),
      date: date.toISOString().split('T')[0],
      note,
      categoryId,
      subCategoryId,
      personId,
      accountId,
      type,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.header}>Edit Transaction</Text>

            {/* Toggle Income / Expense */}
            <View style={styles.rowToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, type === 'income' && styles.selectedToggle]}
                onPress={() => setType('income')}
              >
                <Text style={type === 'income' ? styles.selectedToggleText : styles.toggleText}>Income</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, type === 'expense' && styles.selectedToggle]}
                onPress={() => setType('expense')}
              >
                <Text style={type === 'expense' ? styles.selectedToggleText : styles.toggleText}>Expense</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rowContainer}>
              {/* Amount Input */}
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Amount"
              />

              {/* Date Picker with Calendar Icon */}
              <TouchableOpacity
                style={styles.datePicker}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#333" style={{ marginRight: 6 }} />
                <Text style={styles.dateText}>{date.toDateString()}</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}

            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="Note (optional)"
            />

            <Picker
              selectedValue={categoryId}
              onValueChange={(val) => setCategoryId(val)}
              style={styles.input}
            >
              <Picker.Item label="Select Category" value="" />
              {categories.map((cat) => (
                <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
              ))}
            </Picker>

            <Picker
              selectedValue={subCategoryId}
              onValueChange={(val) => setSubCategoryId(val)}
              style={styles.input}
            >
              <Picker.Item label="Select Subcategory" value="" />
              {(subCategories ?? []).map((sub) => (
                <Picker.Item key={sub.id} label={sub.name} value={sub.id} />
              ))}
            </Picker>

            <Picker
              selectedValue={personId}
              onValueChange={(val) => setPersonId(val)}
              style={styles.input}
            >
              <Picker.Item label="Select Person" value="" />
              {persons.map((p) => (
                <Picker.Item key={p.id} label={p.name} value={p.id} />
              ))}
            </Picker>

            <Picker
              selectedValue={accountId}
              onValueChange={(val) => setAccountId(val)}
              style={styles.input}
            >
              <Picker.Item label="Select Account" value="" />
              {accounts.map((acc) => (
                <Picker.Item key={acc.id} label={acc.accountTypeOrName} value={acc.id} />
              ))}
            </Picker>

            <View style={styles.actions}>
              <TouchableOpacity onPress={handleUpdate} style={styles.saveButton}>
                <Text style={styles.btnText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#007bff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rowToggle: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  toggleButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedToggle: {
    backgroundColor: '#007bff',
  },
  toggleText: {
    color: '#000',
  },
  selectedToggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  rowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    datePicker: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: '#fff',
    },
    dateText: {
      fontSize: 14,
      color: '#333',
    },
});

export default TransactionEditModal;