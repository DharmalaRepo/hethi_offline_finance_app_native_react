import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PersonModal from '../components/PersonModal';
import { Person } from '../models/Person'; // Or use '../../models/Person' based on your folder structure

const STORAGE_KEY = 'persons';

const ManagePersonsScreen = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  useEffect(() => {
    loadPersons();
  }, []);

  useEffect(() => {
    filterAndSortPersons();
  }, [persons, searchText, sortAsc]);

  const loadPersons = async () => {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      try {
        const data: Person[] = JSON.parse(json);
        setPersons(data);
      } catch (e) {
        console.error('Failed to load persons:', e);
      }
    }
  };

  const savePersons = async (updatedList: Person[]) => {
    setPersons(updatedList);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  };

  const handleAdd = (name: string) => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name,
    };
    const updated = [...persons, newPerson];
    savePersons(updated);
    setShowModal(false);
  };

  const handleEdit = (name: string) => {
    if (!editingPerson) return;
    const updated = persons.map(p =>
      p.id === editingPerson.id ? { ...p, name } : p
    );
    savePersons(updated);
    setEditingPerson(null);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this person?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = persons.filter(p => p.id !== id);
          savePersons(updated);
        },
      },
    ]);
  };

  const filterAndSortPersons = () => {
    let result = [...persons];
    if (searchText) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    result.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }) *
      (sortAsc ? 1 : -1)
    );
    setFilteredPersons(result);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Persons</Text>

      <View style={styles.controls}>
        <TextInput
          placeholder="Search..."
          value={searchText}
          onChangeText={setSearchText}
          style={styles.input}
        />
        <TouchableOpacity onPress={() => setSortAsc(!sortAsc)}>
          <Text style={styles.sort}>{sortAsc ? '↑' : '↓'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingPerson(null);
            setShowModal(true);
          }}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPersons}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.personItem}>
            <Text style={styles.personName}>{item.name}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => {
                  setEditingPerson(item);
                  setShowModal(true);
                }}
              >
                <Text style={styles.edit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.delete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <PersonModal
        visible={showModal}
        onClose={() => {
          setEditingPerson(null);
          setShowModal(false);
        }}
        onSave={editingPerson ? handleEdit : handleAdd}
        isEdit={!!editingPerson}
        defaultName={editingPerson?.name}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF3FF',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A73E8',
    marginBottom: 10,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  sort: {
    fontSize: 20,
    padding: 8,
    color: '#1A73E8',
  },
  addButton: {
    backgroundColor: '#1A73E8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  personItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personName: {
    fontSize: 16,
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  edit: {
    color: '#1A73E8',
  },
  delete: {
    color: '#d11a2a',
  },
});

export default ManagePersonsScreen;