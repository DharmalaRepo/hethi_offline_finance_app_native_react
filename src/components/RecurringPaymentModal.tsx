import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RecurringPayment } from '../models/RecurringPayment';

interface RecurringPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payment: RecurringPayment) => void;
  defaultValue?: RecurringPayment | null;
}

const RecurringPaymentModal = ({
  visible,
  onClose,
  onSave,
  defaultValue,
}: RecurringPaymentModalProps) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [startDate, setStartDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [repeatEvery, setRepeatEvery] = useState('monthly');
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [personName, setPersonName] = useState('');

  useEffect(() => {
    if (defaultValue) {
      setTitle(defaultValue.title);
      setAmount(defaultValue.amount.toString());
      setType(defaultValue.type);
      setStartDate(new Date(defaultValue.startDate));
      setRepeatEvery(defaultValue.repeatEvery || 'monthly');
      setEndDate(defaultValue.endDate ? new Date(defaultValue.endDate) : undefined);
      setPersonName(defaultValue.personName || '');
    } else {
      setTitle('');
      setAmount('');
      setType('expense');
      setStartDate(new Date());
      setRepeatEvery('monthly');
      setEndDate(undefined);
      setPersonName('');
    }
  }, [defaultValue]);

  const handleSave = () => {
    if (!title || !amount || isNaN(Number(amount))) return;

    const now = new Date().toISOString();

    const newPayment: RecurringPayment = {
      id: defaultValue?.id ?? Date.now().toString(),
      title,
      amount: parseFloat(amount),
      type,
      startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD
      repeatEvery,
      endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
      personName: personName || undefined,
      createdAt: defaultValue?.createdAt || now,
      transactionTemplate: defaultValue?.transactionTemplate,
      repeatType: defaultValue?.repeatType,
      completedInstances: defaultValue?.completedInstances || [],
    };

    onSave(newPayment);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>
            {defaultValue ? 'Edit Recurring Payment' : 'Add Recurring Payment'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount"
            value={amount}
            keyboardType="numeric"
            onChangeText={setAmount}
          />
          <TextInput
            style={styles.input}
            placeholder="Person Name (optional)"
            value={personName}
            onChangeText={setPersonName}
          />

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, type === 'income' && styles.selectedToggle]}
              onPress={() => setType('income')}
            >
              <Text>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, type === 'expense' && styles.selectedToggle]}
              onPress={() => setType('expense')}
            >
              <Text>Expense</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setShowStartPicker(true)}>
            <Text style={styles.datePicker}>
              Start Date: {startDate.toDateString()}
            </Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) setStartDate(selectedDate);
              }}
            />
          )}

          <View style={styles.repeatRow}>
            {['daily', 'weekly', 'monthly'].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setRepeatEvery(val)}
                style={[styles.repeatButton, repeatEvery === val && styles.selectedRepeat]}
              >
                <Text>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => setShowEndPicker(true)}>
            <Text style={styles.datePicker}>
              End Date: {endDate ? endDate.toDateString() : 'None'}
            </Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) setEndDate(selectedDate);
              }}
            />
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderColor: '#007bff',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  toggleButton: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    borderColor: '#007bff',
  },
  selectedToggle: {
    backgroundColor: '#cce5ff',
  },
  repeatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  repeatButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e6ecf5',
  },
  selectedRepeat: {
    backgroundColor: '#007bff',
  },
  datePicker: {
    paddingVertical: 10,
    fontSize: 16,
    color: '#007bff',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  saveBtn: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default RecurringPaymentModal;