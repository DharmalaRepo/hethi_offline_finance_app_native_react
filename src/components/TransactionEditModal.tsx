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
  Switch,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { Ionicons } from '@expo/vector-icons';
import { useAppData } from '../context/AppDataProvider';
import { useIsFocused } from '@react-navigation/native';

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
  const [isOptional, setIsOptional] = useState(transaction.isOptional);
  const [isReversableTransaction, setIsReversableTransaction] = useState(transaction.isReversible);
  const [subCategories, setSubCategories] = useState<Category['subcategories']>([]);
  const [accounts, setAccounts] = useState<Person['accounts']>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    persons,
    categories,
    reloadAppData,
  } = useAppData();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      reloadConfig();
    }
  }, [isFocused]);

  const reloadConfig = async () => {
    await reloadAppData();
  };

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
      setIsReversableTransaction(!!transaction.isReversible);
      setIsOptional(!!transaction.isOptional);
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
      isOptional,
      isReversible: isReversableTransaction
    };
    onSave(updated);
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

            <Text style={styles.fieldLabel}>Amount & Date</Text>
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

            
            <Text style={styles.fieldLabel}>Category</Text>
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

            <Text style={styles.fieldLabel}>Subcategory</Text>
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

            <Text style={styles.fieldLabel}>Person</Text>
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

            <Text style={styles.fieldLabel}>Payment Mode</Text>
            <Picker
              selectedValue={accountId}
              onValueChange={(val) => setAccountId(val)}
              style={styles.input}
            >
              <Picker.Item label="Select PaymentMode" value="" />
              {accounts.map((acc) => (
                <Picker.Item key={acc.id} label={acc.paymentMode} value={acc.id} />
              ))}
            </Picker>

            <View style={styles.row}>
              <Text>Reversible</Text>
              <Switch
                value={isReversableTransaction}
                onValueChange={setIsReversableTransaction}
              />
            </View>

            <View style={styles.row}>
              <Text>Optional</Text>
              <Switch
                value={isOptional}
                onValueChange={setIsOptional}
              />
            </View>

            <View style={styles.actions}>
              
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleUpdate} style={styles.saveButton}>
                <Text style={styles.btnText}>Update</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Backdrop
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  // Container / Card
  modalContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,      // ↓ tighter padding
    paddingTop: 12,
    paddingBottom: 14,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 10,
  },

  // Title
  header: {
    fontSize: 18,               // ↓ smaller title
    fontWeight: '700',
    marginBottom: 10,           // ↓ tighter spacing
    textAlign: 'center',
    color: '#0C66E4',
  },

  // Inputs / Pickers share the same compact chrome
  input: {
    borderWidth: 1,
    borderColor: '#E3E8EF',
    backgroundColor: '#FAFBFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,         // ↓ shorter field
    marginBottom: 10,
    fontSize: 13,               // ↓ smaller text
    minHeight: 40,              // consistent touch target
  },

  // Amount + Date row
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                     // neat spacing
    marginBottom: 10,
  },

  // Date "pill" button
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3E8EF',
    backgroundColor: '#FAFBFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 40,
    flex: 1,
  },
  dateText: {
    fontSize: 13,
    color: '#2D3748',
  },

  // Toggle buttons (Income / Expense)
  rowToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,         // ↓ slimmer
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#E3E8EF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedToggle: {
    backgroundColor: '#0C66E4',
    borderColor: '#0C66E4',
  },
  toggleText: {
    color: '#2D3748',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedToggleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Switch rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 2,
  },

  // Buttons row
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#0C66E4',
    paddingVertical: 10,        // ↓ slimmer
    borderRadius: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#D14343',
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,               // ↓ smaller
    letterSpacing: 0.2,
  },

  // Optional labels (if you decide to add small section labels)
  fieldLabel: {
    fontSize: 12,
    color: '#5A6573',
    marginBottom: 6,
    marginLeft: 2,
    fontWeight: '600',
  },
});

export default TransactionEditModal;