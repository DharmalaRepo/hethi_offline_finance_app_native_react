// AddTransactionForm.tsx – Full Working with Scroll, Debounce, Toast, Navigation, Modal Dropdowns
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Switch,
  StyleSheet,
  ToastAndroid,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { debounce } from 'lodash';
import { Dropdown } from 'react-native-element-dropdown';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { Account } from '../models/Account';

interface Props {
  categories: Category[];
  persons: Person[];
  accounts: Account[];
  onSave: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

const AddTransactionForm: React.FC<Props> = ({ categories = [],
  persons = [],
  accounts = [], onSave }) => {
  const navigation = useNavigation();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [personId, setPersonId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isReversible, setIsReversible] = useState(false);
  const [isReturnPayment, setIsReturnPayment] = useState(false);
  const [isAutoReverseEntry, setIsAutoReverseEntry] = useState(false);
  const [fromOrToPersonId, setFromOrToPersonId] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [categorySearch, setCategorySearch] = useState('');
  const [subCategorySearch, setSubCategorySearch] = useState('');
  const [personSearch, setPersonSearch] = useState('');

  useEffect(() => {
    const selected = categories.find(c => c.id === categoryId);
    setSubCategories(selected?.subcategories || []);
    setSubCategoryId('');
  }, [categoryId]);

  const debouncedCategorySearch = useCallback(debounce(setCategorySearch, 300), []);
  const debouncedSubCategorySearch = useCallback(debounce(setSubCategorySearch, 300), []);
  const debouncedPersonSearch = useCallback(debounce(setPersonSearch, 300), []);

  const handleSubmit = () => {
    try {
      if (!amount || !categoryId || !personId) {
        const msg = 'Please fill all mandatory fields.';
        console.error(msg);
        ToastAndroid.show(msg, ToastAndroid.SHORT);
        return;
      }
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        const msg = 'Amount should be a valid number > 0.';
        console.error(msg);
        ToastAndroid.show(msg, ToastAndroid.SHORT);
        return;
      }

      const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
        type,
        amount: parseFloat(amount),
        date: date.toISOString().split('T')[0],
        categoryId,
        subCategoryId: subCategoryId || undefined,
        personId,
        accountId,
        note,
        isReversible,
        isSettled: isReturnPayment,
        fromOrToPersonId: fromOrToPersonId || undefined,
        dueDate: dueDate ? dueDate.toISOString().split('T')[0] : undefined,
        isAutoReverseEntry,
      };
      onSave(transaction);
      //console.log('Transaction Submitted:', transaction);
      ToastAndroid.show('Transaction saved successfully!', ToastAndroid.SHORT);
      handleClear();
    } catch (err: any) {
      console.error('Save failed:', err?.message || err);
        ToastAndroid.show(err?.message || 'Failed to save transaction.', ToastAndroid.SHORT);
    }
  };

  const handleClear = () => {
    setType('expense');
    setAmount('');
    setDate(new Date());
    setNote('');
    setCategoryId('');
    setSubCategoryId('');
    setPersonId('');
    setAccountId('');
    setIsReversible(false);
    setIsReturnPayment(false);
    setIsAutoReverseEntry(false);
    setFromOrToPersonId('');
    setDueDate(undefined);
    setShowAdvanced(false);
  };

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
  const filteredSubCategories = subCategories.filter(c => c.name.toLowerCase().includes(subCategorySearch.toLowerCase()));
  const filteredPersons = persons.filter(p => p.name.toLowerCase().includes(personSearch.toLowerCase()));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1 }} showsVerticalScrollIndicator>
        <View style={styles.rowToggle}>
          <TouchableOpacity style={[styles.toggleButton, type === 'income' && styles.selectedToggle]} onPress={() => setType('income')}>
            <Text>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, type === 'expense' && styles.selectedToggle]} onPress={() => setType('expense')}>
            <Text>Expense</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>
              {date ? new Date(date).toLocaleDateString() : 'Select Date'}
            </Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar-outline" size={22} color="#007bff" />
            </TouchableOpacity>
          </View>
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

        <Dropdown
          data={filteredCategories.map(cat => ({ label: cat.name, value: cat.id }))}
          labelField="label"
          valueField="value"
          placeholder="Select Category"
          search
          searchPlaceholder="Search Category..."
          value={categoryId}
          onChange={(item: { label: string; value: string }) => setCategoryId(item.value)}
          onChangeText={debouncedCategorySearch}
          style={styles.input}
        />

        <Dropdown
          data={filteredSubCategories.map(sub => ({ label: sub.name, value: sub.id }))}
          labelField="label"
          valueField="value"
          placeholder="Select Subcategory"
          search
          searchPlaceholder="Search Subcategory..."
          value={subCategoryId}
          onChange={(item: { label: string; value: string }) => setSubCategoryId(item.value)}
          onChangeText={debouncedSubCategorySearch}
          style={styles.input}
        />

        <Dropdown
          data={filteredPersons.map(p => ({ label: p.name, value: p.id }))}
          labelField="label"
          valueField="value"
          placeholder="Select Person"
          search
          searchPlaceholder="Search Person..."
          value={personId}
          onChange={(item: { label: string; value: string }) => setPersonId(item.value)}
          onChangeText={debouncedPersonSearch}
          style={styles.input}
        />

        <Dropdown
          data={accounts.map(a => ({ label: a.name, value: a.id }))}
          labelField="label"
          valueField="value"
          placeholder="Select Account"
          value={accountId}
          onChange={(item: { label: string; value: string }) => setAccountId(item.value)}
          style={styles.input}
        />

        <TextInput
          style={styles.input}
          placeholder="Note (optional)"
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={styles.advancedToggle} onPress={() => setShowAdvanced(!showAdvanced)}>
          <Text style={styles.advancedText}>{showAdvanced ? 'Hide Advanced' : 'Show Advanced'}</Text>
        </TouchableOpacity>

        {showAdvanced && (
          <>
            <View style={styles.rowSwitch}>
              <Text>Reversible</Text>
              <Switch value={isReversible} onValueChange={setIsReversible} />
            </View>

            {isReversible && (
              <>
                <Dropdown
                  data={persons.map(p => ({ label: p.name, value: p.id }))}
                  labelField="label"
                  valueField="value"
                  placeholder="To/From Person"
                  value={fromOrToPersonId}
                  onChange={item => setFromOrToPersonId(item.value)}
                  style={styles.input}
                />

                <TouchableOpacity onPress={() => setShowDueDatePicker(true)}>
                  <Text style={styles.dateLabel}>Due Date: {dueDate ? dueDate.toDateString() : 'Not set'}</Text>
                </TouchableOpacity>
                {showDueDatePicker && (
                  <DateTimePicker
                    value={dueDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, selectedDate) => {
                      setShowDueDatePicker(false);
                      if (selectedDate) setDueDate(selectedDate);
                    }}
                  />
                )}

                <View style={styles.rowSwitch}>
                  <Text>Return Payment</Text>
                  <Switch value={isReturnPayment} onValueChange={setIsReturnPayment} />
                </View>

                {isReturnPayment && (
                  <View style={styles.rowSwitch}>
                    <Text>Auto Reverse</Text>
                    <Switch value={isAutoReverseEntry} onValueChange={setIsAutoReverseEntry} />
                  </View>
                )}
              </>
            )}
          </>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#dc3545' }]} onPress={handleClear}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>


      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  rowToggle: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#007bff', borderRadius: 6, backgroundColor: '#fff' },
  selectedToggle: { backgroundColor: '#007bff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  dateLabel: { fontSize: 14, color: '#007bff', marginBottom: 10 },
  advancedToggle: { padding: 10, backgroundColor: '#f0f0f0', borderRadius: 6, marginVertical: 12 },
  advancedText: { fontWeight: 'bold', textAlign: 'center' },
  rowSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  button: { flex: 1, padding: 12, backgroundColor: '#007bff', borderRadius: 6, marginHorizontal: 6 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  }
});

export default AddTransactionForm;