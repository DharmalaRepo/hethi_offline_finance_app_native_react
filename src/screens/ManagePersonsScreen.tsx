import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, StyleSheet, Modal, Image } from 'react-native';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import uuid from 'react-native-uuid';
import { Ionicons } from '@expo/vector-icons';
import { savePersons, addAccountToPerson, addPersons } from '../services/mockDataService';
import PersonModal from '../components/PersonModal';
import AccountModal from '../components/AccountModal';
import { ToastAndroid } from 'react-native/Libraries/Components/ToastAndroid/ToastAndroid';
import { showToast } from '../utils/transactionUtils';
import { useAppData } from '../context/AppDataProvider';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

const ManagePersonsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isPersonModalVisible, setIsPersonModalVisible] = useState(false);
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [personName, setPersonName] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [accountNotes, setAccountNotes] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const {
    persons,
    reloadAppData,
  } = useAppData();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      reloadPersons();
    }
  }, [isFocused]);


  const reloadPersons = async () => {
    await reloadAppData();
  };

  const handleAddAccount = (personId: string, account: { paymentMode: string; bankName?: string; notes?: string }) => {
    const updatedPersons = persons.map(p => {
      if (p.id === personId) {
        const newAccount: Account = {
          id: uuid.v4().toString(),
          personId,
          paymentMode: account.paymentMode || 'UNKNOWN',
          notes: account.notes || '',
        };
        return {
          ...p,
          accounts: [...(p.accounts || []), newAccount],
        };
      }
      return p;
    });
    savePersons(updatedPersons);
    Alert.alert('paymentMode Saved', paymentMode);
    reloadAppData();
  };

  const handleEditAccount = (personId: string, accountId: string, updated: { paymentMode: string; bankName?: string; notes?: string }) => {
    const updatedPersons = persons.map(p => {
      if (p.id === personId) {
        const updatedAccounts = (p.accounts || []).map((acc: Account) =>
          acc.id === accountId
            ? {
              ...acc,
              paymentMode: updated.paymentMode || acc.paymentMode,
              notes: updated.notes ?? acc.notes,
            }
            : acc
        );
        return { ...p, accounts: updatedAccounts };
      }
      return p;
    });
    savePersons(updatedPersons);

    Alert.alert('paymentMode uopdated with', paymentMode);
    reloadAppData();
    setEditingPerson(null);
  };

  const handleDeleteAccount = (accountId: string) => {
    const updatedPersons = persons.map(p => ({
      ...p,
      accounts: (p.accounts || []).filter((acc: Account) => acc.id !== accountId),
    }));
    savePersons(updatedPersons);
    Alert.alert('paymentMode deleted');
    reloadAppData();
  }

  const handleAddPerson = async (personName: string) => {
    setSelectedPerson(null);
    const trimmedName = personName.trim();
    if (!trimmedName) return;

    const nameKey = trimmedName.toLowerCase();

    const isDuplicate = persons.some(
      (p) => p.name.toLowerCase() === nameKey
    );

    if (isDuplicate) {
      Alert.alert('Duplicate', 'Person with the same name already exists.');
      return;
    }

    const newPerson: Person = {
      id: uuid.v4().toString(),
      name: trimmedName,
      accounts: [],
    };

    try {
      await addPersons([newPerson]); // ✅ append style
      reloadAppData();
      setPersonName('');
      setSelectedPerson(null);

      Alert.alert('Person Saved', personName);
      personName = '';
      setSelectedPerson(null);
      //setIsPersonModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add person. Please try again.');
    }
  };

  const handleEditPerson = async (personName: string) => {
    if (!selectedPerson) return;

    const trimmedName = personName.trim();
    if (!trimmedName) return;

    const nameKey = trimmedName.toLowerCase();

    const isDuplicate = persons.some(
      (p) => p.name.toLowerCase() === nameKey && p.id !== selectedPerson.id
    );

    if (isDuplicate) {
      Alert.alert('Duplicate', 'Person with the same name already exists.');
      return;
    }

    const updatedPerson: Person = {
      ...selectedPerson,
      name: trimmedName,
    };

    try {
      await addPersons([updatedPerson]); // ✅ overwrite that person
      reloadAppData();
      setPersonName('');
      setSelectedPerson(null);
      setIsPersonModalVisible(false);

      Alert.alert('person updated', personName);
    } catch (error) {
      Alert.alert('Error', 'Failed to update person. Please try again.');
    }
  };



  const deletePerson = (id: string) => {
    Alert.alert('Confirm', 'Delete this person?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedList = persons.filter(p => p.id !== id);
          await savePersons(updatedList);
          reloadAppData();
          ToastAndroid.show('Person deleted!', ToastAndroid.CENTER);
          showToast('success', 'Person deleted !');
        },
      },
    ]);
  };

  const filteredPersons = persons.filter((p) => {
    const query = searchQuery.toLowerCase();

    // Match person name
    const nameMatch = typeof p.name === 'string' && p.name.toLowerCase().includes(query);

    // Match any account details
    const accountMatch = (p.accounts || []).some((acc: Account) =>
      [acc.paymentMode, acc.paymentMode, acc.notes].some(
        (field) => typeof field === 'string' && field.toLowerCase().includes(query)
      )
    );

    return nameMatch || accountMatch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.title}> Manage Persons</Text>
        </View>
        <TouchableOpacity
          onPress={reloadPersons}
          style={{
            flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#007bff',
            borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#e6f0ff',
          }}
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
        data={[...filteredPersons].sort((a, b) =>
          a.name.localeCompare(b.name) // ascending by name
        )}
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
                {[...item.accounts]
                  .sort((a, b) => a.paymentMode.localeCompare(b.paymentMode)) // optional: sort accounts too
                  .map((sub: Account) => (
                    <Text key={sub.id} style={styles.subText}>
                      • {sub.paymentMode}
                    </Text>
                  ))}
              </View>
            )}
          </View>

        )}
      />



      <PersonModal
        visible={isPersonModalVisible}
        onClose={() => {
          setIsPersonModalVisible(false);
          setSelectedPerson(null);
          setEditingPerson(null);
        }}
        onSave={(name) => {
          if (selectedPerson) {
            handleEditPerson(name);
          } else {
            handleAddPerson(name);
          }
        }}
        isEdit={!!selectedPerson}
        defaultName={selectedPerson?.name || ''}
      />

      {/* Account Modal */}
      <AccountModal
        visible={isAccountModalVisible}
        onClose={() => setIsAccountModalVisible(false)}
        accounts={selectedPerson?.accounts || []}
        editingAccount={editingAccount}
        setEditingAccount={setEditingAccount}
        onAdd={(acc) => handleAddAccount(selectedPerson?.id!, acc)}
        onEdit={(id, acc) => handleEditAccount(selectedPerson?.id!, id, acc)}
        onDelete={() => handleDeleteAccount(selectedPerson?.id!)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7ff',
    padding: 16,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
    color: '#222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a66e4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6, // For Android
    // Optional: Use gradient background with expo-linear-gradient
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Optional for spacing (or use marginRight)
  },

  logo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: 8,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderColor: '#007bff',
    borderWidth: 1,
  },
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