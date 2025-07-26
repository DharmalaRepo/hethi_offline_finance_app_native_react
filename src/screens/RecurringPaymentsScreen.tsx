import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { RecurringPayment } from '../models/RecurringPayment';
import RecurringPaymentModal from '../components/RecurringPaymentModal';
import uuid from 'react-native-uuid';
import { getAllRecurringPayments, saveRecurringPayments } from '../services/mockDataService';

const RecurringPaymentsScreen = () => {
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [filteredList, setFilteredList] = useState<RecurringPayment[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringPayment | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    loadData();
  }, []);

   const reloadData = () => {
      loadData();
      console.log("Reloading recurring payment data...");
    };

  useEffect(() => {
    applyFilterAndSearch();
  }, [recurringPayments, searchText, filterType]);

  const loadData = async () => {
    const data = await getAllRecurringPayments();
    if (data) setRecurringPayments(data);
  };

  const saveData = async (updated: RecurringPayment[]) => {
    saveRecurringPayments(updated);
    await AsyncStorage.setItem('recurringPayments', JSON.stringify(updated));
  };



  const handleAdd = (data: Partial<RecurringPayment>) => {
    const newItem: RecurringPayment = {
      id: uuid.v4().toString(),
      title: data.title!,
      amount: data.amount!,
      type: data.type!,
      startDate: data.startDate!,
      frequency: data.frequency!,
      endDate: data.endDate,
      createdAt: new Date().toISOString(),
      transactionTemplate: {}, // placeholder or default
      repeatType: data.repeatType!,
      dueDate: data.dueDate ?? data.startDate!, // fallback to startDate if dueDate not provided
      categoryId: data.categoryId ?? '',
      subCategoryId: data.subCategoryId ?? '',
      personId: data.personId ?? '',
      personName: data.personName ?? '',
      isTestData: data.isTestData ?? false,
      note: data.note ?? '',
      accountId: data.accountId ?? '',
    };
    const updated = [...recurringPayments, newItem];
    saveData(updated);
  };

  const handleEdit = (data: Partial<RecurringPayment>) => {
    const updated = recurringPayments.map((item) =>
      item.id === data.id ? { ...item, ...data } : item
    );
    saveData(updated);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updated = recurringPayments.filter((r) => r.id !== id);
          saveData(updated);
        },
      },
    ]);
  };

  const applyFilterAndSearch = () => {
    let result = [...recurringPayments];
    if (filterType !== 'all') {
      result = result.filter((r) => r.type === filterType);
    }
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(search) ||
          r.personName?.toLowerCase().includes(search)
      );
    }
    setFilteredList(result);
  };

  return (
    <View style={styles.container}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}> Manage Recurring Payments</Text>

                  <TouchableOpacity
                    onPress={reloadData}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#007bff',
                      borderRadius: 6,
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      backgroundColor: '#e6f0ff',
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#007bff', marginRight: 6 }}>⟳</Text>
                    <Text style={{ fontSize: 14, color: '#007bff' }}>Reload</Text>
                  </TouchableOpacity>
                </View>

      <TextInput
        style={styles.input}
        placeholder="Search by title or person"
        value={searchText}
        onChangeText={setSearchText}
      />
      <View style={styles.filterRow}>
        {['all', 'income', 'expense'].map((type) => (
          <TouchableOpacity
            key={type}
            onPress={() => setFilterType(type as any)}
            style={[
              styles.filterButton,
              filterType === type && styles.filterSelected,
            ]}
          >
            <Text style={styles.filterText}>{type.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No entries</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemBox}>
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={{ color: item.type === 'income' ? 'green' : 'red' }}>
                ₹{item.amount}
              </Text>
            </View>
            <Text style={styles.subtext}>
              {item.type} • {item.frequency} • Until: {item.endDate ? new Date(item.endDate).toDateString() : '∞'}
            </Text>
            <View style={styles.rowButtons}>
              <TouchableOpacity
                onPress={() => {
                  setEditingItem(item);
                  setShowModal(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color="blue" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={{ marginLeft: 16 }}
              >
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingItem(null);
          setShowModal(true);
        }}
      >
        <Text style={styles.addText}>+ Add Recurring</Text>
      </TouchableOpacity>

      <RecurringPaymentModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={(data) => {
          editingItem ? handleEdit(data) : handleAdd(data);
          setShowModal(false);
        }}
        defaultValue={editingItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 16 },
  input: {
    backgroundColor: '#e9f0ff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  filterSelected: {
    backgroundColor: '#007bff',
  },
  filterText: {
    color: '#000',
  },
  itemBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtext: {
    marginTop: 4,
    fontSize: 13,
    color: '#333',
  },
  rowButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  addText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default RecurringPaymentsScreen;