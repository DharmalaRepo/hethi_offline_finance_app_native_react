import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Button } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { SubCategory } from '../models/SubCategory';
import { Transaction } from '../models/Transaction';
import { getCategories, getPersons, getAllCategories, getAllPersons, getAccounts, addCategory, addSubCategory, addPerson, addAccount, saveTransaction } from '../services/mockDataService';
import { showToast, validateTransactionData, autoDetectFromNotes } from '../utils/transactionUtils';
import * as mockDataService from '../services/mockDataService';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {commonStyles} from '../styles/commonStyles'; 
import { Checkbox } from 'react-native-paper';
import { FlatList } from 'react-native';
import { Modal } from 'react-native';


const LogTransactionForm = () => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isReversible, setIsReversible] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [markAsReturned, setMarkAsReturned] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showSubCategoryList, setShowSubCategoryList] = useState(false);
  const [showAddSubcategoryModal, setShowAddSubcategoryModal] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [fromOrToPerson, setFromOrToPerson] = useState<Person | null>(null);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [showPersonList, setShowPersonList] = useState(false);

  const reloadConfig = async () => {
    setCategories(await getAllCategories());
    setPersons(await getAllPersons());
    setAccounts(await getAccounts());
  };

  useEffect(() => {
    reloadConfig();
  }, []);

  useEffect(() => {
  if (note.length >= 2) {
    const result = autoDetectFromNotes(note, categories);
    if (result.category) {
      setCategory(result.category);
    }
    if (result.subCategory) {
      setSubCategory(result.subCategory);
    }
  }
}, [note]);

  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    setDate(selectedDate);
  };


  // ✅ HANDLE NOTES BLUR TO DETECT CATEGORY/SUBCATEGORY
const handleNotesBlur = () => {
  const result = autoDetectFromNotes(note, categories);
  if (result.category) setCategory(result.category);
  if (result.subCategory) setSubCategory(result.subCategory);
};

// ✅ PICKER HELPERS
const openCategoryPicker = async () => {
  const name = prompt('Enter new category name');
  if (!name) return;
  const newCategory = { id: uuid.v4().toString(), name, subcategories: [] };
  await addCategory(newCategory);
  await new Promise(res => setTimeout(res, 100)); 
  await reloadConfig(); 
   // Re-fetch the saved category with updated ID from AsyncStorage
  const refreshed = await getAllCategories();
  const matched = refreshed.find(cat => cat.name.toLowerCase() === name.toLowerCase());

    console.log('🔍 Available categories:', categories.map(c => ({ id: c.id, name: c.name })));
    console.log('🔍 Looking for categoryId:', category?.id);

  if (!matched) {
    console.warn('Category not found in AsyncStorage:', category?.id);
    showToast('error', 'Category not available');
    return;
  }


  if (matched) {
    setCategory(matched); // ✅ use fresh object that exists in storage
    setSubCategory(null); // reset subcategory when category changes
    showToast('success', 'New category added');
  } else {
    showToast('error', 'Failed to reload new category');
  }
};

const openSubCategoryPicker = async () => {
  if (!category) return;

  const name = prompt('Enter sub-category');
  if (!name || !name.trim()) return;

  try {
    const newSub: SubCategory = {
      id: uuid.v4().toString(),
      name: name.trim(),
      categoryId: category.id,
    };

    await addSubCategory(category.id, newSub);

    // Refresh categories from storage
    const refreshed = await getAllCategories();
    const matched = refreshed.find(cat => cat.id === category.id);
    if (matched) {
      setCategory(matched);
      setSubCategory(
        (matched.subcategories ?? []).find(sub => sub.id === newSub.id) || null
      );
    }

    reloadConfig();
    showToast('success', 'New sub-category added');
  } catch (err) {
    console.error('Failed to add sub-category', err);
    showToast('error', 'Error adding sub-category');
  }
};

const openPersonPicker = async () => {
  const name = prompt('Enter person name');
  if (!name) return;
  const newPerson = { id: uuid.v4().toString(), name };
  await addPerson(newPerson);
  setPerson(newPerson);
  reloadConfig();
  showToast('success', 'Person added');
};

const openAccountPicker = async () => {
  const name = prompt('Enter account name');
  if (!name) return;
  const newAcc = { id: uuid.v4().toString(), name, bankName: '', personalName: 'SELF' };
  await addAccount(newAcc);
  setAccount(newAcc);
  reloadConfig();
  showToast('success', 'Account added');
};

// ✅ SAVE HANDLER
const handleSaveTransaction = async () => {
    try {
  const validation = validateTransactionData({
    type,
    amount: parseFloat(amount),
    date: date.toISOString().split('T')[0],
  });

  if (!validation || !validation.valid) {
    showToast('error', validation?.message || 'Validation failed');
    return;
  }

  const transaction: Transaction = {
    id: uuid.v4().toString(),
    type,
    amount: parseFloat(amount),
    date: date.toISOString().split('T')[0],
    categoryId: category?.id || 'misc',
    subCategoryId: subCategory?.id,
    personId: person?.id || 'self',
    accountId: account?.id || 'cash',
    note,
    isReversible,
    dueDate: isReversible && dueDate ? dueDate.toISOString().split('T')[0] : undefined,
    isSettled: markAsReturned,
    createdAt: new Date().toISOString(),
  };
console.log('[SAVE] Logging transaction before save:', JSON.stringify(transaction, null, 2));
  await mockDataService.saveTransaction(transaction);
  showToast('success', 'Transaction saved');
  resetForm();
  } catch (error) {
      console.error('Error saving transaction:', error);
      showToast('error', 'Failed to save transaction');
    }
};

  const handleDueDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    setDueDate(selectedDate);
  };

  const handleSave = async () => {
    try {
      const validation = validateTransactionData({
        type,
        amount: parseFloat(amount),
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
      });

      if (!validation.valid) {
        showToast('error', validation.message ?? 'Something went wrong.');
        return;
      }

      // Step 1: Prepare Fallbacks
      let finalCategory = category;
      let finalSubCategory = subCategory;
      let finalPerson = person;
      let finalAccount = account;

      if (!finalCategory) {
        finalCategory = { id: 'misc', name: 'MISC', subcategories: [] };
        showToast('warning', 'No category selected. Using MISC.');
      }

      if (!finalSubCategory) {
        finalSubCategory = {
          id: 'misc_sub',
          name: 'MISC',
          categoryId: finalCategory.id,
        };
        showToast('warning', 'No sub-category selected. Using MISC.');
      }

      if (!finalPerson) {
        finalPerson = { id: 'self', name: 'SELF' };
        showToast('warning', 'No person selected. Using SELF.');
      }

      if (!finalAccount) {
        finalAccount = {
          id: 'cash',
          name: 'CASH',
          bankName: '',
          personalName: 'SELF',
        };
        showToast('warning', 'No account selected. Using CASH.');
      }

      // Step 2: Construct Transaction Object
      const transaction: Transaction = {
        id: uuid.v4().toString(),
        type,
        amount: parseFloat(amount),
        date: date.toISOString().split('T')[0],
        categoryId: finalCategory.id,
        subCategoryId: finalSubCategory.id,
        personId: finalPerson.id,
        accountId: finalAccount.id,
        note,
        isReversible,
        dueDate:
          isReversible && dueDate ? dueDate.toISOString().split('T')[0] : undefined,
        fromOrToPersonId: fromOrToPerson?.id,
        isSettled: markAsReturned,
        createdAt: new Date().toISOString(),
      };

      // Step 3: Debug Log
      console.log('[SAVE] Transaction object:', JSON.stringify(transaction, null, 2));

      // Step 4: Save Transaction
      await saveTransaction(transaction);
      showToast('success', 'Transaction saved successfully');

      // Step 5: Reset Form
      resetForm();
    } catch (error) {
      console.error('[SAVE ERROR]', error);
      showToast('error', 'Failed to save transaction');
    }
  };

  const resetForm = () => {
    setType('expense');
    setAmount('');
    setDate(new Date());
    setNote('');
    setCategory(null);
    setSubCategory(null);
    setPerson(null);
    setAccount(null);
    setIsReversible(false);
    setDueDate(null);
    setFromOrToPerson(null);
    setMarkAsReturned(false);
    setShowCategoryList(false);
    setShowSubCategoryList(false);
    setNewSubcategoryName('');
    setShowAddSubcategoryModal(false);
  };

  const handleReversibleToggle = () => {
  setIsReversible(prev => !prev);
};

  const handleMarkAsReturnedToggle = () => {
    setIsSettled(prev => !prev);
  };

  const handleInlineAdd = async (label: string, value: string, type: 'category' | 'subcategory' | 'person' | 'account') => {
    Alert.alert(`Add ${label}`, `Do you want to add "${value}" as new ${label}?`, [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Add',
        

onPress: async () => {
  if (type === 'category') {
    const newCat = {
      id: uuid.v4().toString(),
      name: value,
      subcategories: [],
    };
    const savedCat = await addCategory(newCat);
    setCategory(savedCat);
    reloadConfig();
    showToast('success', 'Category added');
  } else if (type === 'subcategory' && category) {
    const newSub = {
      id: uuid.v4().toString(),
      name: value,
      categoryId: category.id,
    };
    const savedSub = await addSubCategory(category.id, newSub);
    setSubCategory(savedSub);
    reloadConfig();
    showToast('success', 'SubCategory added');
  } else if (type === 'person') {
    const newPerson = {
      id: uuid.v4().toString(),
      name: value,
    };
    const savedPerson = await addPerson(newPerson);
    setPerson(savedPerson);
    reloadConfig();
    showToast('success', 'Person added');
  } else if (type === 'account') {
    const newAcc = {
      id: uuid.v4().toString(),
      name: value,
      bankName: 'Unknown',
      personalName: 'SELF',
    };
    const savedAcc = await addAccount(newAcc);
    setAccount(savedAcc);
    reloadConfig();
    showToast('success', 'Account added');
  }
}
      }
    ]);


  };




  return (
      <>
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <Text style={[commonStyles.label, { fontSize: 20, fontWeight: 'bold' }]}>Log Transaction</Text>
      <TouchableOpacity
        onPress={reloadConfig}
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
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: '#007bff',
            marginRight: 6,
          }}
        >
          ⟳
        </Text>
        <Text style={{ fontSize: 14, color: '#007bff' }}>Config</Text>
      </TouchableOpacity>
    </View>

      {/* Type Toggle */}
      <View style={commonStyles.row}>
        <TouchableOpacity
          style={[commonStyles.toggleBtn, type === 'expense' && commonStyles.activeBtn]}
          onPress={() => setType('expense')}
        >
          <Text style={commonStyles.toggleText}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[commonStyles.toggleBtn, type === 'income' && commonStyles.activeBtn]}
          onPress={() => setType('income')}
        >
          <Text style={commonStyles.toggleText}>Income</Text>
        </TouchableOpacity>
      </View>

      {/* Amount and Date - Side by Side */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
        {/* Amount */}
        <View style={{ flex: 1 }}>
          <Text style={commonStyles.label}>Amount</Text>
          <TextInput
            style={commonStyles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
          />
        </View>

        {/* Date */}
        <View style={{ flex: 1 }}>
          <Text style={commonStyles.label}>Date</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={commonStyles.dateBtn}>
            <Text>{date.toLocaleDateString()}</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
          />
        </View>
      </View>

      {/* Notes */}
      <Text style={commonStyles.label}>Notes</Text>
      <TextInput
        style={commonStyles.input}
        value={note}
        onChangeText={setNote}
        onBlur={handleNotesBlur}
        placeholder="groceries, rent..."
      />

      {category && (
        <Text style={{ color: 'green', fontSize: 12 }}>
          Suggested Category: {category.name}
        </Text>
      )}
      {subCategory && (
        <Text style={{ color: 'green', fontSize: 12 }}>
          Suggested Subcategory: {subCategory.name}
        </Text>
      )}

      {/* Category */}
      <Text style={commonStyles.label}>Category</Text>
      <TouchableOpacity
        style={commonStyles.dropdown}
        onPress={() => setShowCategoryList(prev => !prev)}
      >
        <Text>{category?.name || 'Select or Add Category'}</Text>
      </TouchableOpacity>

      {showCategoryList && (
        <View style={{ maxHeight: 150 }}>
          <ScrollView nestedScrollEnabled>
            {categories.map(item => (
              <TouchableOpacity
                key={item.id}
                style={commonStyles.dropdownItem}
                onPress={() => {
                  setCategory(item);
                  setShowCategoryList(false);
                }}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            ))}

            {/* Add New Category Button */}
            <TouchableOpacity
              style={[commonStyles.dropdownItem, { backgroundColor: '#e6f7ff' }]}
              onPress={() => {
                setShowCategoryList(false); // Hide dropdown
                setShowAddCategoryModal(true); // Show modal
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>+ Add New Category</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}


      {/* Subcategory */}
        <Text style={commonStyles.label}>Subcategory</Text>
        <TouchableOpacity
          style={commonStyles.dropdown}
          onPress={() => setShowSubCategoryList(prev => !prev)}
        >
          <Text>{subCategory?.name || 'Select or Add Subcategory'}</Text>
        </TouchableOpacity>

        {showSubCategoryList && category && (
          <View style={{ maxHeight: 150 }}>
            <ScrollView nestedScrollEnabled>
              {(category.subcategories || []).map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={commonStyles.dropdownItem}
                  onPress={() => {
                    setSubCategory(item);
                    setShowSubCategoryList(false);
                  }}
                >
                  <Text>{item.name}</Text>
                </TouchableOpacity>
              ))}

              {/* Fixed Add New Subcategory Button */}
              <TouchableOpacity
              disabled={!category?.subcategories}
                style={[commonStyles.dropdownItem, { backgroundColor: '#e6f7ff' }]}
                onPress={() => {
                  setShowAddSubcategoryModal(true);
                }}
              >
                <Text style={{ fontWeight: 'bold' }}>+ Add New Subcategory</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

      <Text style={commonStyles.label}>Person</Text>
      <TouchableOpacity
        style={commonStyles.dropdown}
        onPress={() => setShowPersonList(prev => !prev)}
      >
        <Text>{person?.name || 'SELF (Tap to select/add person)'}</Text>
      </TouchableOpacity>

      {showPersonList && (
        <View style={{ maxHeight: 150 }}>
          <ScrollView nestedScrollEnabled>
            {persons.map(item => (
              <TouchableOpacity
                key={item.id}
                style={commonStyles.dropdownItem}
                onPress={() => {
                  setPerson(item);
                  setShowPersonList(false);
                }}
              >
                <Text>{item.name}</Text>
              </TouchableOpacity>
            ))}

            {/* Add New Person Button */}
            <TouchableOpacity
              style={[commonStyles.dropdownItem, { backgroundColor: '#e6f7ff' }]}
              onPress={() => {
                setShowAddPersonModal(true);
                setShowPersonList(false);
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>+ Add New Person</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Account */}
      <Text style={commonStyles.label}>Account</Text>
      <TouchableOpacity style={commonStyles.dropdown} onPress={openAccountPicker}>
        <View style={commonStyles.row}>
          <Text>{account?.name || 'CASH (Tap to add account)'}</Text>
          {!account && <Text style={commonStyles.warningIcon}>⚠️</Text>}
        </View>
      </TouchableOpacity>

      {/* Reversible Transaction Toggle */}
      <View style={commonStyles.checkboxRow}>
        <Checkbox
          status={isReversible ? 'checked' : 'unchecked'}
          onPress={handleReversibleToggle}
        />
        <Text style={commonStyles.label}>Track for Return</Text>
      </View>

      {isReversible && (
        <>
          {/* Due Date */}
          <Text style={commonStyles.label}>Due Date</Text>
          <TouchableOpacity onPress={() => setShowDueDatePicker(true)} style={commonStyles.dateBtn}>
            <Text>{dueDate ? new Date(dueDate).toLocaleDateString() : 'Pick a due date'}</Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={showDueDatePicker}
            mode="date"
            onConfirm={handleDueDateConfirm}
            onCancel={() => setShowDueDatePicker(false)}
          />

          {/* From/To Person */}
          <Text style={commonStyles.label}>From / To Person</Text>
          <TouchableOpacity style={commonStyles.dropdown} onPress={openPersonPicker}>
            <View style={commonStyles.row}>
              <Text>{fromOrToPerson?.name || 'Select person involved'}</Text>
              {!fromOrToPerson && <Text style={commonStyles.warningIcon}>⚠️</Text>}
            </View>
          </TouchableOpacity>

          {/* Mark as Returned */}
          <View style={commonStyles.checkboxRow}>
            <Checkbox
                status={isSettled ? 'checked' : 'unchecked'}
                onPress={handleMarkAsReturnedToggle}
              />
            <Text style={commonStyles.label}>Mark as Returned</Text>
          </View>
        </>
      )}

      {/* Action Buttons Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
        {/* Save Button */}
        <TouchableOpacity onPress={handleSave} style={[commonStyles.saveBtn, { flex: 1, marginRight: 8 }]}>
          <Text style={commonStyles.saveBtnText}>Log Transaction</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={resetForm}
          style={[commonStyles.saveBtn, { backgroundColor: '#ccc', flex: 1, marginLeft: 8 }]}
        >
          <Text style={[commonStyles.saveBtnText, { color: '#000' }]}>Cancel</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>

    <Modal visible={showAddCategoryModal} transparent animationType="slide">
      <View style={commonStyles.modalContainer}>
        <View style={commonStyles.modalContent}>
          <Text style={commonStyles.label}>Enter Category Name</Text>
          <TextInput
            style={commonStyles.input}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            placeholder="e.g., Food, Travel"
          />
          <View style={commonStyles.modalButtonRow}>
            <Button
              title="Cancel"
              onPress={() => {
                setNewCategoryName('');
                setShowAddCategoryModal(false);
              }}
            />
            <Button
              title="Add"
              onPress={async () => {
                const name = newCategoryName.trim();

                if (!name) {
                  showToast('error', 'Category name cannot be empty');
                  return;
                }

                try {
                  const newCat: Category = {
                    id: uuid.v4().toString(),
                    name,
                    subcategories: [],
                  };

                  await addCategory(newCat);

                  // Fetch updated categories after save
                  const updated = await getAllCategories();
                  const updatedCat = updated.find(c => c.id === newCat.id);

                  if (updatedCat) {
                     setCategory(updatedCat);
                     setSubCategory(null); // ✅ clear previous subcategory
                  }
                  reloadConfig();
                  setNewCategoryName('');
                  setShowAddCategoryModal(false);
                  showToast('success', 'New category added');
                } catch (error) {
                  console.error('Error adding category:', error);
                  showToast('error', 'Failed to add category');
                }
              }}
            />
          </View>
        </View>
      </View>
    </Modal>

    <Modal visible={showAddPersonModal} transparent animationType="slide">
      <View style={commonStyles.modalContainer}>
        <View style={commonStyles.modalContent}>
          <Text style={commonStyles.label}>Enter Person Name</Text>
          <TextInput
            style={commonStyles.input}
            value={newPersonName}
            onChangeText={setNewPersonName}
            placeholder="e.g., John, Mom"
          />
          <View style={commonStyles.modalButtonRow}>
            <Button title="Cancel" onPress={() => {
              setNewPersonName('');
              setShowAddPersonModal(false);
            }} />
            <Button title="Add" onPress={async () => {
              const name = newPersonName.trim();
              if (!name) {
                showToast('error', 'Person name cannot be empty');
                return;
              }

              const newPerson: Person = {
                id: uuid.v4().toString(),
                name,
              };

              await addPerson(newPerson);
              reloadConfig(); // reloads latest config including persons
              setPerson(newPerson); // select newly added person
              setNewPersonName('');
              setShowAddPersonModal(false);
              showToast('success', 'New person added');
            }} />
          </View>
        </View>
      </View>
    </Modal>

    <Modal visible={showAddSubcategoryModal} transparent animationType="slide">
          <View style={commonStyles.modalContainer}>
            <View style={commonStyles.modalContent}>
              <Text style={commonStyles.label}>Enter Subcategory Name</Text>
              <TextInput
                style={commonStyles.input}
                value={newSubcategoryName}
                onChangeText={setNewSubcategoryName}
                placeholder="e.g., Fancy, Vegetables"
              />
              <View style={commonStyles.modalButtonRow}>
                <Button title="Cancel" onPress={() => {
                  setNewSubcategoryName('');
                  setShowAddSubcategoryModal(false);
                }} />
                <Button
                  title="Add"
                  onPress={async () => {
                    const name = newSubcategoryName.trim();

                    if (!name) {
                      showToast('error', 'Subcategory name cannot be empty');
                      return;
                    }

                    if (!category) {
                      showToast('error', 'Please select a category first');
                      return;
                    }

                    try {
                      const allCategories = await getAllCategories(); // ✅ freshly read

                      console.log('[DEBUG] All Categories:', JSON.stringify(allCategories, null, 2));
                      console.log('[DEBUG] Looking for Category ID:', category?.id);

                      const targetCategory = allCategories.find(cat => cat.id === category.id);

                      if (!targetCategory) {
                        console.warn('Category not found in AsyncStorage:', category.id);
                        showToast('error', 'Category not found in saved list');
                        return;
                      }

                      // Ensure subcategories array
                      if (!targetCategory.subcategories) targetCategory.subcategories = [];

                      // Create new subcategory
                      const newSub: SubCategory = {
                        id: uuid.v4().toString(),
                        name,
                        categoryId: targetCategory.id,
                      };

                      // Add to category
                      targetCategory.subcategories.push(newSub);

                      // Save updated list
                      await AsyncStorage.setItem('categories', JSON.stringify(allCategories));

                      // 🔁 Refresh config and update local category state
                      await reloadConfig();

                      const refreshed = await getAllCategories();
                      const matched = refreshed.find(cat => cat.id === category.id);
                      if (matched) {
                        setCategory(matched);
                        setSubCategory(
                          matched.subcategories?.find(sub => sub.id === newSub.id) || null
                        );
                      }

                      // Reset modal
                      setNewSubcategoryName('');
                      setShowAddSubcategoryModal(false);
                      showToast('success', 'New subcategory added');
                    } catch (error) {
                      console.error('Error adding subcategory:', error);
                      showToast('error', 'Failed to add subcategory');
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
        </>
  )
  };



const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9fbff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleBtn: {
    flex: 1,
    padding: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  activeBtn: {
    backgroundColor: '#007bff',
  },
  toggleText: {
    color: '#000',
    fontWeight: '600',
  },
  dateBtn: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  dropdown: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  warningIcon: {
    marginLeft: 8,
    fontSize: 16,
    color: 'orange',
  },
  saveBtn: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#007bff',
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LogTransactionForm;