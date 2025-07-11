import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { CategoryService } from '../features/categories/CategoryService';
import { PersonService } from '../features/persons/PersonService';
import { AccountService } from '../features/balances/AccountService';
import { updateTransaction, deleteTransaction } from '../services/transactionService';

interface Props {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction;
  onUpdate: () => void;
}

const TransactionEditDialog: React.FC<Props> = ({
  visible,
  onClose,
  transaction,
  onUpdate,
}) => {
  const [editedTxn, setEditedTxn] = useState<Transaction>(transaction);
  const [categories, setCategories] = useState<Category[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    setEditedTxn(transaction);
  }, [transaction]);

  useEffect(() => {
    (async () => {
      setCategories(await CategoryService.getAll());
      setPersons(await PersonService.getAll());
      setAccounts(await AccountService.getAll());
    })();
  }, []);

  const handleChange = (field: keyof Transaction, value: any) => {
    setEditedTxn({ ...editedTxn, [field]: value });
  };

  const handleSave = async () => {
    await updateTransaction(editedTxn.id, editedTxn);
    onUpdate();
    onClose();
  };

  const handleDelete = () => {
    Alert.alert('Delete', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(transaction.id);
          onUpdate();
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Edit Transaction</Text>

        <Text>Type:</Text>
        <View style={styles.row}>
          <Button title="Income" onPress={() => handleChange('type', 'income')} />
          <Button title="Expense" onPress={() => handleChange('type', 'expense')} />
        </View>

        <Text>Amount:</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={editedTxn.amount.toString()}
          onChangeText={(text) => handleChange('amount', parseFloat(text))}
        />

        <Text>Date:</Text>
        <TextInput
          style={styles.input}
          value={editedTxn.date}
          onChangeText={(text) => handleChange('date', text)}
        />

        <Text>Category:</Text>
        <RNPickerSelect
          onValueChange={(val) => handleChange('categoryId', val)}
          value={editedTxn.categoryId}
          items={categories.map((cat) => ({ label: cat.name, value: cat.id }))}
        />

        <Text>Person:</Text>
        <RNPickerSelect
          onValueChange={(val) => handleChange('personId', val)}
          value={editedTxn.personId}
          items={persons.map((p) => ({ label: p.name, value: p.id }))}
        />

        <Text>Account:</Text>
        <RNPickerSelect
          onValueChange={(val) => handleChange('accountId', val)}
          value={editedTxn.accountId}
          items={accounts.map((a) => ({
            label: `${a.personalName} - ${a.name}`,
            value: a.id,
          }))}
        />

        <Text>Note:</Text>
        <TextInput
          style={styles.input}
          value={editedTxn.note || ''}
          onChangeText={(text) => handleChange('note', text)}
        />

        <View style={styles.actions}>
          <Button title="Save" onPress={handleSave} />
          <View style={{ height: 10 }} />
          <Button title="Delete" onPress={handleDelete} color="red" />
          <View style={{ height: 10 }} />
          <Button title="Cancel" onPress={onClose} />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 8,
  },
  row: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  actions: {
    marginTop: 20,
  },
});

export default TransactionEditDialog;