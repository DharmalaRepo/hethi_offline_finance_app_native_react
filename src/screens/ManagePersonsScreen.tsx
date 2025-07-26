import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, StyleSheet, Modal } from 'react-native';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getPersons } from '../services/mockDataService';

const ManagePersonsScreen = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonModalVisible, setIsPersonModalVisible] = useState(false);
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [personName, setPersonName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNotes, setAccountNotes] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    loadPersons();
  }, []);


  const loadPersons = async () => {
      //console.log('Inside loadPersons');
    const json = await getPersons();
    if (json) setPersons(json);
  };


  const savePersons = async (data: Person[]) => {
    setPersons(data);
    await AsyncStorage.setItem('persons', JSON.stringify(data));
  };

  const addOrUpdatePerson = () => {
    const trimmedName = personName.trim();
    if (!trimmedName) return;
    const existing = persons.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());
    let updated;
    if (selectedPerson) {
      updated = persons.map(p => p.id === selectedPerson.id ? { ...p, name: trimmedName } : p);
    } else if (!existing) {
      updated = [...persons, { id: uuid.v4().toString(), name: trimmedName, accounts: [] }];
    } else {
      Alert.alert('Duplicate', 'Person already exists');
      return;
    }
    savePersons(updated);
    setPersonName('');
    setSelectedPerson(null);
    setIsPersonModalVisible(false);
  };

  const deletePerson = (id: string) => {
    Alert.alert('Confirm', 'Delete this person?', [
      {
          text: 'Cancel',
          style: 'cancel', // ✅ renders cancel-style button
          onPress: () => console.log('Cancel pressed')
        },
      {
        text: 'Delete',
          style: 'destructive',onPress: () => {
          const updated = persons.filter(p => p.id !== id);
          savePersons(updated);
        }
      }
    ]);
  };



  const addAccountToPerson = () => {
    if (!selectedPerson || !accountName.trim()) return;
    const updatedPersons = persons.map(p => {
      if (p.id === selectedPerson.id) {
        const newAccount: Account = {
          id: uuid.v4().toString(),
          personId: p.id,
          accountTypeOrName: accountName.trim(),
          notes: accountNotes.trim(),
        };
        return { ...p, accounts: [...(p.accounts || []), newAccount] };
      }
      return p;
    });
    savePersons(updatedPersons);
    setAccountName('');
    setAccountNotes('');
    setIsAccountModalVisible(false);
  };

  const filteredPersons = persons.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>Manage Persons</Text>
            <TouchableOpacity
                    onPress={loadPersons}
                    style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#007bff',
                      borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#e6f0ff', }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginRight: 6, }}>
                      ⟳
                    </Text>
                    <Text style={{ fontSize: 14, color: '#007bff' }}>Reload</Text>
            </TouchableOpacity>
          </View>

      <TextInput
        style={styles.search}
        placeholder="Search person..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <TouchableOpacity style={styles.sortButton} onPress={() => setSortAsc(!sortAsc)}>
              <Text style={styles.sortText}>
                Sort: {sortAsc ? 'Ascending 🔼' : 'Descending 🔽'}
              </Text>
            </TouchableOpacity>

      <TouchableOpacity style={styles.addButton} onPress={() => setIsPersonModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add Person</Text>
      </TouchableOpacity>
      <FlatList
        data={filteredPersons}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.categoryBox}>
                                          <View style={styles.rowSpaceBetween}>
                                            <Text style={styles.categoryName}>{item.name}</Text>
                                            <View style={styles.rowButtons}>
                                              <TouchableOpacity onPress={() => { setSelectedPerson(item); setIsPersonModalVisible(true); setPersonName(item.name); }}>
                                                <Ionicons name="create-outline" size={22} color="blue" />
                                              </TouchableOpacity>
                                              <TouchableOpacity onPress={() => deletePerson(item.id)}>
                                                <Ionicons name="trash-outline" size={22} color="red" />
                                              </TouchableOpacity>
                                              <TouchableOpacity onPress={() => { setSelectedPerson(item); setIsAccountModalVisible(true); }}>
                                                <Ionicons name="list-outline" size={22} color="green" />
                                              </TouchableOpacity>
                                            </View>
                                          </View>
                                          
                                          {(item.accounts?.length ?? 0) > 0 && (
                                            <View style={styles.subcategoryList}>
                                              {(item.accounts || []).map((sub) => (
                                                <Text key={sub.id} style={styles.subText}>
                                                  • {sub.accountTypeOrName}
                                                </Text>
                                              ))}
                                            </View>
                                          )}
                                        </View>
                                        
        )}
      />

      {/* Person Modal */}
      <Modal visible={isPersonModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              placeholder="Person name"
              value={personName}
              onChangeText={setPersonName}
              style={styles.input}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={addOrUpdatePerson}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setIsPersonModalVisible(false);
                setPersonName('');
                setSelectedPerson(null);
              }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Account Modal */}
      <Modal visible={isAccountModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Account for {selectedPerson?.name}</Text>
            <TextInput
              placeholder="Account name"
              value={accountName}
              onChangeText={setAccountName}
              style={styles.input}
            />
            <TextInput
              placeholder="Notes (optional)"
              value={accountNotes}
              onChangeText={setAccountNotes}
              style={styles.input}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={addAccountToPerson}>
                <Text style={styles.saveText}>Add Account</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAccountModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: '#f0f7ff',
      padding: 16,
    },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  search: { backgroundColor: '#fff',
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
                borderColor: '#007bff',
                borderWidth: 1, },
  addButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6, alignItems: 'center', marginBottom: 10 },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  item: { marginBottom: 12, padding: 10, borderWidth: 1, borderRadius: 6 },
  personName: { fontWeight: 'bold' },
  action: { color: '#007AFF', marginRight: 10 },
  subItem: { marginLeft: 10, paddingTop: 4 },
  notes: { fontStyle: 'italic', color: 'gray' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000aa' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' },
  input: { borderWidth: 1, borderRadius: 6, marginVertical: 8, padding: 8 },
  saveButton: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6, alignItems: 'center' },
  saveText: { color: 'white' },
  modalTitle: { fontWeight: 'bold', marginBottom: 10 },
    searchBox: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      borderColor: '#007bff',
      borderWidth: 1,
    },
    sortButton: {
      marginBottom: 12,
    },
    sortText: {
      color: '#007bff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    categoryBox: {
      backgroundColor: '#ffffff',
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      borderColor: '#d0e2ff',
      borderWidth: 1,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    rowSpaceBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subcategoryList: {
      marginTop: 6,
      paddingLeft: 10,
    },
    subText: {
      fontSize: 14,
      color: '#333',
    },
buttonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 16,
},
cancelButton: {
  backgroundColor: '#f44336',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 5,
},
cancelText: {
  color: 'white',
  fontWeight: 'bold',
  textAlign: 'center',
},
});

export default ManagePersonsScreen;