import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Account } from '../models/Account';

interface Props {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  onAdd: (account: Omit<Account, 'id' | 'personId'>) => void;
  onEdit: (id: string, updatedAccount: Omit<Account, 'id' | 'personId'>) => void;
  onDelete: (id: string) => void;
  editingAccount?: Account | null;
  setEditingAccount: (acc: Account | null) => void;
}

const AccountModal: React.FC<Props> = ({
  visible,
  onClose,
  accounts,
  onAdd,
  onEdit,
  onDelete,
  editingAccount,
  setEditingAccount,
}) => {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.paymentMode || '');
      setBankName(editingAccount.paymentMode || '');
      setNote(editingAccount.notes || '');
    } else {
      resetForm();
    }
  }, [editingAccount]);

  const resetForm = () => {
    setName('');
    setBankName('');
    setNote('');
    setEditingAccount(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter account name');
      return;
    }

    const trimmedAccount = {
      paymentMode: name.trim(),
      bankName: bankName.trim(),
      notes: note.trim(),
    };

    if (editingAccount) {
      onEdit(editingAccount.id, trimmedAccount);
    } else {
      onAdd(trimmedAccount);
    }
    setName('');
    resetForm();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {editingAccount ? 'Edit Account' : 'Add Account'}
          </Text>

          <TextInput
            placeholder="Account Name (e.g., UPI/CASH/HDFC)"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => { resetForm(); onClose(); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>{editingAccount ? 'Update' : 'Add'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Existng Accounts</Text>

          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemText}>{item.paymentMode}</Text>
                  {item.notes ? <Text style={styles.noteText}>{item.notes}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => setEditingAccount(item)}>
                  <Ionicons name="create-outline" size={20} color="blue" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="red" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: 'gray', marginTop: 12 }}>
                No accounts found
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000099' },
  content: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '85%' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 10, padding: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
  cancelButton: { backgroundColor: '#f44336', padding: 10, borderRadius: 6 },
  cancelText: { color: 'white', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6 },
  saveText: { color: 'white', fontWeight: 'bold' },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },
  itemText: { fontSize: 16 },
  noteText: { fontSize: 12, color: '#555' },
});

export default AccountModal;