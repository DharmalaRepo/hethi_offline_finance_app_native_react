// PersonModal.tsx
import React, { useEffect, useState } from 'react';
import { Modal, View, TextInput, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Account } from '../models/Account';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  isEdit?: boolean;
  defaultName?: string;
}

const PersonModal = ({
  visible,
  onClose,
  onSave,
  isEdit,
  defaultName,
}: Props) => {
  const [name, setName] = useState('');
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (isEdit) {
      setName(defaultName || '');
    } else {
      setName
    }

  }, [defaultName]);


  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{isEdit ? 'Edit' : 'Add'} Person</Text>

          <TextInput
            placeholder="Person name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.cancelButton, { flex: 1, marginLeft: 6 }]}
            >
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSave(name)}
              style={[styles.saveButton, { flex: 1, marginRight: 6 }]}
            >
              <Text style={styles.saveText}>{isEdit ? 'Update' : 'Add'} Person</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PersonModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000aa' },
  container: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 10 },
  saveButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6, alignItems: 'center', marginLeft: 6 },
  cancelButton: { backgroundColor: '#ccc', padding: 10, borderRadius: 6, alignItems: 'center' },
  saveText: { color: 'white' },
  subHeading: { fontSize: 16, marginTop: 20, fontWeight: '600' },
  accountItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  accountText: { fontSize: 14 },
  noteText: { fontSize: 12, color: 'gray' },
  actions: { flexDirection: 'row', gap: 10 },
  addAccountButton: { marginTop: 10, padding: 8, backgroundColor: '#cdeaff', borderRadius: 6 },
  addAccountText: { textAlign: 'center', color: '#007AFF' },
  cancelText: { textAlign: 'center' },
  emptyText: { fontStyle: 'italic', textAlign: 'center', marginTop: 6 },
});