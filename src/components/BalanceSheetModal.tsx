import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  Alert,
  TouchableOpacity
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import uuid from 'react-native-uuid';
import { Account } from '../models/Account';
import { Person } from '../models/Person';
import { MonthlyOpeningBalance } from '../models/MonthlyOpeningBalance';
import { MonthlyClosingBalance } from '../models/MonthlyClosingBalance';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (updated: (MonthlyOpeningBalance | MonthlyClosingBalance)[]) => void;
  type: 'opening' | 'closing';
  year: string;
  month: string;
  balances: (MonthlyOpeningBalance | MonthlyClosingBalance)[];
  persons: Person[];
  accounts: Account[];
  selectedPersonId?: string;
}


const BalanceSheetModal = ({
  visible,
  onClose,
  onSave,
  type,
  year,
  month,
  balances,
  persons,
  accounts,
  selectedPersonId: selectedFromHeader,
}: Props) => {
  const [editList, setEditList] = useState<
    (MonthlyOpeningBalance | MonthlyClosingBalance)[]
  >([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [editModeItem, setEditModeItem] = useState<any>(null);
  const [editAmount, setEditAmount] = useState('');



  // Prepopulate edit list when balances or modal open
  useEffect(() => {
    if (visible) {
      setEditList(balances || []);
    }
  }, [visible, balances]);

  useEffect(() => {
    if (selectedFromHeader) {
      setSelectedPersonId(selectedFromHeader);
    } else {
      setSelectedPersonId('');
    }
  }, [selectedFromHeader]);


  useEffect(() => {
    const personIdToUse = selectedFromHeader || selectedPersonId;

    if (personIdToUse) {
      const matchedPerson = persons.find((p) => p.id === personIdToUse);
      const accountsToUse = matchedPerson?.accounts || [];

      setFilteredAccounts(accountsToUse);
    } else {
      // If no person is selected (All Persons selected), load all accounts from all persons
      const allAccounts = persons.flatMap(p => p.accounts || []);
      setFilteredAccounts(allAccounts);
    }
  }, [selectedFromHeader, selectedPersonId, persons]);


  const filteredPersons = selectedFromHeader
    ? persons.filter((p) => p.id === selectedFromHeader)
    : persons;

    const onEdit = (entry: any) => {
      setEditModeItem(entry);
      setEditAmount(entry.amount.toString());
    };

    const onDelete = (entry: any) => {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              const updatedList = editList.filter(e => e.id !== entry.id);
              setEditList(updatedList);
            },
          },
        ]
      );
    };

    const handleEdit = (item: any) => {
      setEditModeItem(item);
      setEditAmount(item.amount.toString());
    };

    const handleDelete = (id: string) => {
      setEditList(editList.filter(e => e.id !== id));
    };

  const handleAdd = () => {
    if (!selectedPersonId || !selectedAccountId || !amount) {
      Alert.alert('Validation Error', 'Please select person, account, and amount.');
      return;
    }

    const newEntry = {
      id: uuid.v4().toString(),
      personId: selectedPersonId,
      accountId: selectedAccountId,
      amount: parseFloat(amount),
      year,
      month,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEditList((prev) => [...prev, newEntry]);
    setSelectedAccountId('');
    setAmount('');
    if (!selectedFromHeader) setSelectedPersonId('');
    setShowAddForm(false);
  };

  const handleSave = () => {
    const invalid = editList.find((e) => !e.personId || !e.accountId || !e.amount);
    if (invalid) {
      Alert.alert('Validation Error', 'Each entry must have person, account and amount.');
      return;
    }

    onSave(editList);
    onClose();
  };

  const resolvePersonName = (id: string) => persons.find((p) => p.id === id)?.name || id;

  const resolveAccountName = (id: string) => {
    const allAccounts = persons.flatMap(p => p.accounts);
    return allAccounts.find(a => a.id === id)?.accountTypeOrName || id;
  };

  return (
    <>
    <Modal visible={visible} animationType="slide">
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
          {type === 'opening' ? 'Edit Opening Balances' : 'Edit Closing Balances'}
        </Text>

          <FlatList
            data={editList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginVertical: 6,
                  padding: 10,
                  backgroundColor: '#eef3ff',
                  borderRadius: 5,
                }}
              >
                <View>
                  <Text>₹ {item.amount.toFixed(2)}</Text>
                  <Text style={{ fontSize: 12, color: '#444' }}>
                    {resolvePersonName(item.personId)} - {resolveAccountName(item.accountId)} - {item.month}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 12 }}>
                    <Text style={{ color: 'blue' }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={{ color: 'red' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

        {showAddForm && (
          <View style={{ marginVertical: 10 }}>
            <Text>Select Person:</Text>
            <Picker
              selectedValue={selectedPersonId}
              onValueChange={(value) => setSelectedPersonId(value)}
              enabled={!selectedFromHeader}
            >
              {filteredPersons.map((person) => (
                <Picker.Item key={person.id} label={person.name} value={person.id} />
              ))}
            </Picker>

            <Text>Select Account:</Text>
            <Picker
              selectedValue={selectedAccountId}
              onValueChange={(value) => setSelectedAccountId(value)}
               enabled={!!(selectedPersonId || selectedFromHeader)}
            >
               <Picker.Item label="Select Account" value="" />
                {filteredAccounts
                  .filter((a) => !selectedPersonId || a.personId === selectedPersonId)
                  .map((acc) => (
                        <Picker.Item
                          key={acc.id}
                          label={acc.accountTypeOrName || acc.accountTypeOrName || acc.id}
                          value={acc.id}
                        />
                      )
                    )}
              </Picker>

            <TextInput
              placeholder="Enter Amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              style={{ borderWidth: 1, padding: 8, marginVertical: 10 }}
            />

            <Button title="Add" onPress={handleAdd} />
            <Button title="Cancel" onPress={() => setShowAddForm(false)} />
          </View>
        )}

        {!showAddForm && (
          <Button title="+ Add" onPress={() => setShowAddForm(true)} />
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
          <Button title="Save" onPress={handleSave} />
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>

    {editModeItem && (
        <Modal visible={true} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#00000066',
            }}
          >
            <View
              style={{
                backgroundColor: 'white',
                padding: 20,
                width: '80%',
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 16, marginBottom: 10 }}>Edit Amount</Text>
              <TextInput
                keyboardType="numeric"
                value={editAmount}
                onChangeText={setEditAmount}
                style={{
                  borderWidth: 1,
                  borderColor: '#ccc',
                  padding: 8,
                  marginBottom: 20,
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Button title="Cancel" onPress={() => setEditModeItem(null)} />
                <View style={{ width: 10 }} />
                <Button
                  title="Save"
                  onPress={() => {
                    const updatedList = editList.map((e) =>
                      e.id === editModeItem.id
                        ? {
                            ...e,
                            amount: parseFloat(editAmount),
                            updatedAt: new Date().toISOString(),
                          }
                        : e
                    );
                    setEditList(updatedList);
                    setEditModeItem(null);
                    setEditAmount('');
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
     )}
    </>
  );
};

export default BalanceSheetModal;