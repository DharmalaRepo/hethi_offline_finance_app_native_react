import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Button,
  Image, Pressable
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { SubCategory } from '../models/SubCategory';
import { Transaction } from '../models/Transaction';
import {
  addCategory, addSubCategory, addPerson, saveTransaction, getFallbackTransactionValues, addAccountToPerson
} from '../services/mockDataService';
import { showToast, validateTransactionData, autoDetectFromNotes } from '../utils/transactionUtils';
import { saveCategories } from '../services/mockDataService';
import { Ionicons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import { commonStyles } from '../styles/commonStyles';
import { Checkbox } from 'react-native-paper';
import { Modal } from 'react-native';
import { ToastAndroid } from 'react-native';
import {
  CompositeNavigationProp,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type { RootStackParamList, MoreStackParamList } from '../navigation/routes';
import { useAppData } from '../context/AppDataProvider';


const LogTransactionForm = () => {

  type DashboardNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<RootStackParamList>,
    NativeStackNavigationProp<MoreStackParamList>
  >;

  const navigation = useNavigation<DashboardNavigationProp>();
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isReversible, setIsReversible] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [markAsReturned, setMarkAsReturned] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const [showAddSubcategoryModal, setShowAddSubcategoryModal] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [fromOrToPersonName, setFromOrToPersonName] = useState<string>('');
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [isOptional, setIsOptional] = useState<boolean>(false);
  const [smartSuggestEnabled, setSmartSuggestEnabled] = useState(true);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
  const [showSubCategoryList, setShowSubCategoryList] = useState(false);
  const [subCategorySearch, setSubCategorySearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showPersonList, setShowPersonList] = useState(false);
  const [personSearch, setPersonSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [showAccountList, setShowAccountList] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [account, setAccount] = useState<Account | null>(null);

  const {
    persons,
    categories,
    reloadAppData,
  } = useAppData();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      reloadConfig();
    }
  }, [isFocused]);

  const reloadConfig = async () => {
    await reloadAppData();
  };

  useEffect(() => {
    setSubCategory(null);
    setSubCategorySearch('');
    setShowSubCategoryList(false);
  }, [category]);

  useEffect(() => {
    if (type !== 'expense') {
      setIsOptional(false); // Reset optional when not expense
    }
  }, [type]);

  useEffect(() => {
    setSelectedAccount(null);
    setAccountSearch('');
    setShowAccountList(false);
  }, [selectedPerson]);

  useEffect(() => {
    if (!smartSuggestEnabled) return;

    if (note.length >= 2) {
      const result = autoDetectFromNotes(note, categories);
      if (result.category) {
        setCategory(result.category);
      }
      if (result.subCategory) {
        setSubCategory(result.subCategory);
      }
    }
  }, [note, smartSuggestEnabled, categories]);

  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    setDate(selectedDate);
  };

  // ✅ HANDLE NOTES BLUR TO DETECT CATEGORY/SUBCATEGORY
  const handleNotesBlur = () => {
    if (!smartSuggestEnabled) return;
    const result = autoDetectFromNotes(note, categories);
    if (result.category) setCategory(result.category);
    if (result.subCategory) setSubCategory(result.subCategory);
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

      const {
        fallbackCategory: finalCategory,
        fallbackSubCategory: finalSubCategory,
        fallbackPerson: finalPerson,
        fallbackAccount: finalAccount,
      } = await getFallbackTransactionValues({ category, subCategory, selectedPerson, account });

      if (!finalCategory) {
        showToast('warning', 'No category selected. Using MISC.');
      }
      if (!finalSubCategory) {
        showToast('warning', 'No sub-category selected. Using MISC.');
      }
      if (!finalPerson) {
        showToast('warning', 'No person selected. Using SELF.');
      }

      // Step 2: Construct Transaction Object
      const transaction: Transaction = {
        id: uuid.v4().toString(),
        type,
        amount: parseFloat(amount),
        date: date.toISOString().split('T')[0],
        categoryId: category?.id ?? finalCategory?.id ?? '',
        subCategoryId: subCategory?.id ?? finalSubCategory?.id ?? '',
        personId: selectedPerson?.id ?? finalPerson?.id ?? '',
        accountId: account?.id ?? finalAccount?.id ?? '',
        note,
        isReversible,
        isOptional,
        dueDate:
          isReversible && dueDate ? dueDate.toISOString().split('T')[0] : undefined,
        fromOrToPersonName: fromOrToPersonName,
        isSettled: markAsReturned,
        createdAt: new Date().toISOString(),
      };

      // Step 3: Debug Log
      ////console.log('[SAVE] Transaction object:', JSON.stringify(transaction, null, 2));

      // Step 4: Save Transaction
      await saveTransaction(transaction);
      reloadAppData();
      ToastAndroid.show('Transaction saved successfully!', ToastAndroid.SHORT);
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
    setSelectedPerson(null);
    setAccount(null);
    setIsReversible(false);
    setDueDate(null);
    setFromOrToPersonName('');
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


  return (
    <>
      <ScrollView nestedScrollEnabled={true} style={styles.screen} keyboardShouldPersistTaps="handled">

        {/* Header with logo and title and bell */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
            </TouchableOpacity>
            <Text style={styles.title}>Log Transaction</Text>
          </View>
          <Modal visible={modalVisible} transparent={true} animationType="fade">
            <View style={styles.modalContainer}>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalBackground}>
                <Image source={require('../../assets/images/icon.png')} style={styles.fullImage} resizeMode="contain" />
              </Pressable>
            </View>
          </Modal>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={reloadConfig} style={styles.iconButton}>
              <Ionicons name="refresh" size={22} color="#e6f0ff" />
            </TouchableOpacity>
          </View>
          {/* Add Person */}
          <TouchableOpacity
            onPress={() => navigation.navigate('More', { screen: 'Persons' })}>
            <Ionicons name="person-add-outline" size={22} color="#e6f0ff" />
          </TouchableOpacity>

          {/* Add Categories */}
          <TouchableOpacity
            onPress={() => navigation.navigate('More', { screen: 'Categories' })}>
            <Ionicons name="pricetags-outline" size={22} color="#e6f0ff" />
          </TouchableOpacity>
        </View>


        {/* Type Toggle */}
        <View style={commonStyles.row}>

          <TouchableOpacity
            style={[commonStyles.toggleBtn, type === 'income' && commonStyles.activeBtn]}
            onPress={() => setType('income')}
          >
            <Text style={commonStyles.toggleText}>Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[commonStyles.toggleBtn, type === 'expense' && commonStyles.activeBtn]}
            onPress={() => setType('expense')}
          >
            <Text style={commonStyles.toggleText}>Expense</Text>
          </TouchableOpacity>

          {type === 'expense' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
              <Checkbox
                status={isOptional ? 'checked' : 'unchecked'}
                onPress={() => setIsOptional((prev) => !prev)}
              />
              <Text>Optional Exp</Text>
            </View>
          )}

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

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8 }}>
          <Text style={commonStyles.label}>Notes / Smart suggestion</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Checkbox
              status={smartSuggestEnabled ? 'checked' : 'unchecked'}
              onPress={() => setSmartSuggestEnabled(prev => !prev)}
            />
            <Text style={{ marginLeft: 4 }}>Smart Suggestion</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
          {/* Notes Input */}
          <View style={{ flex: 1 }}>
            <TextInput
              style={[commonStyles.input, { paddingVertical: 4, height: 40 }]}
              value={note}
              onChangeText={setNote}
              onBlur={handleNotesBlur}
              placeholder="Enter notes (smart suggestion for category/sub)"
            />
          </View>

        </View>

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


        {/* Category Label */}
        <Text style={commonStyles.label}>Category</Text>

        {/* Combined Display + Search Input */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowCategoryList(true);
            setCategorySearch('');
          }}
        >
          <TextInput
            style={commonStyles.input}
            value={
              showCategoryList ? categorySearch : category?.name || ''
            }
            placeholder="Select or Add Category"
            editable={showCategoryList} // Only editable when dropdown is open
            onChangeText={(text) => setCategorySearch(text)}
            onBlur={() => {
              if (!categorySearch.trim()) {
                setShowCategoryList(false);
              }
            }}
          />
        </TouchableOpacity>

        {/* Dropdown List: Show only when user is searching */}
        {showCategoryList && (
          <View style={{ maxHeight: 200 }}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingVertical: 4 }}
              style={{
                maxHeight: 200,
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 6,
                backgroundColor: '#fff',
              }}
            >
              {categories
                .filter((item) =>
                  item.name.toLowerCase().includes(categorySearch.toLowerCase())
                )
                .sort((a, b) => a.name.localeCompare(b.name)) // ✅ sort ascending
                .map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={commonStyles.dropdownItem}
                    onPress={() => {
                      setCategory(item);
                      setCategorySearch(item.name);
                      setShowCategoryList(false);
                    }}
                  >
                    <Text>{item.name}</Text>
                  </TouchableOpacity>
                ))}

              {/* Add New Category */}
              <TouchableOpacity
                style={[commonStyles.dropdownItem, { backgroundColor: '#e6f7ff' }]}
                onPress={() => {
                  setShowCategoryList(false);
                  setShowAddCategoryModal(true);
                  setCategorySearch('');
                }}
              >
                <Text style={{ fontWeight: 'bold' }}>+ Add New Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}


        {/* Subcategory Label */}
        <Text style={commonStyles.label}>Subcategory</Text>

        {/* Subcategory Input (Display + Search) */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (category?.subcategories) {
              setShowSubCategoryList(true);
              setSubCategorySearch('');
            }
          }}
        >
          <TextInput
            style={commonStyles.input}
            value={
              showSubCategoryList ? subCategorySearch : subCategory?.name || ''
            }
            placeholder="Select or Add Subcategory"
            editable={showSubCategoryList} // Editable only when dropdown is open
            onChangeText={text => {
              setSubCategorySearch(text);
              setShowSubCategoryList(true);
            }}
            onBlur={() => {
              if (!subCategorySearch.trim()) {
                setShowSubCategoryList(false);
              }
            }}
          />
        </TouchableOpacity>

        {/* Dropdown List */}
        {showSubCategoryList && category && (
          <View style={{ maxHeight: 150 }}>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6 }}
            >
              {(category.subcategories || [])
                .filter(item =>
                  item.name.toLowerCase().includes(subCategorySearch.toLowerCase())
                )
                .sort((a, b) => a.name.localeCompare(b.name)) // ✅ sort ascending
                .map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={commonStyles.dropdownItem}
                    onPress={() => {
                      setSubCategory(item);
                      setSubCategorySearch(item.name);
                      setShowSubCategoryList(false);
                    }}
                  >
                    <Text>{item.name}</Text>
                  </TouchableOpacity>
                ))}

              {/* ➕ Add New Subcategory */}
              <TouchableOpacity
                disabled={!category?.subcategories}
                style={[commonStyles.dropdownItem, { backgroundColor: '#e6f7ff' }]}
                onPress={() => {
                  setShowAddSubcategoryModal(true);
                  setShowSubCategoryList(false);
                  setSubCategorySearch('');
                }}
              >
                <Text style={{ fontWeight: 'bold' }}>+ Add New Subcategory</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}


        {/* Person */}
        <Text style={commonStyles.label}>Person Or Paid By</Text>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowPersonList(true);
            setPersonSearch('');
          }}
        >
          <TextInput
            style={commonStyles.input}
            value={
              showPersonList ? personSearch : selectedPerson?.name || ''
            }
            placeholder="Select or Add Person"
            editable={showPersonList}
            onChangeText={(text) => {
              setPersonSearch(text);
              setShowPersonList(true);
            }}
            onBlur={() => {
              if (!personSearch.trim()) {
                setShowPersonList(false);
              }
            }}
          />
        </TouchableOpacity>

        {showPersonList && (
          <View style={{ maxHeight: 200 }}>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6 }}
            >
              {persons
                .filter(person =>
                  person.name.toLowerCase().includes(personSearch.toLowerCase())
                )
                .sort((a, b) => a.name.localeCompare(b.name)) // ✅ sort ascending
                .map(person => (
                  <TouchableOpacity
                    key={person.id}
                    style={commonStyles.dropdownItem}
                    onPress={() => {
                      setSelectedPerson(person);
                      setPersonSearch(person.name);
                      setShowPersonList(false);
                    }}
                  >
                    <Text>{person.name}</Text>
                  </TouchableOpacity>
                ))}

              {/* ➕ Add New Person */}
              <TouchableOpacity
                style={[commonStyles.dropdownItem, { backgroundColor: '#e6f7ff' }]}
                onPress={() => {
                  setShowAddPersonModal(true);
                  setShowPersonList(false);
                  setPersonSearch('');
                }}
              >
                <Text style={{ fontWeight: 'bold' }}>+ Add New Person</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Account Label */}
        <Text style={commonStyles.label}>Account Or Paid From</Text>

        {/* Account Input (Display + Search) */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (selectedPerson?.accounts) {
              setShowAccountList(true);
              setAccountSearch('');
            }
          }}
        >
          <TextInput
            style={commonStyles.input}
            value={
              showAccountList ? accountSearch : selectedAccount?.paymentMode || ''
            }
            placeholder="Select or Add Account"
            editable={showAccountList}
            onChangeText={text => {
              setAccountSearch(text);
              setShowAccountList(true);
            }}
            onBlur={() => {
              if (!accountSearch.trim()) {
                setShowAccountList(false);
              }
            }}
          />
        </TouchableOpacity>

        {/* Dropdown List */}
        {showAccountList && selectedPerson?.accounts && (
          <View style={{ maxHeight: 150 }}>
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6 }}
            >
              {selectedPerson.accounts
                .filter(acc =>
                  acc.paymentMode.toLowerCase().includes(accountSearch.toLowerCase())
                )
                .sort((a, b) => a.paymentMode.localeCompare(b.paymentMode)) // ✅ sort ascending
                .map(acc => (
                  <TouchableOpacity
                    key={acc.id}
                    style={commonStyles.dropdownItem}
                    onPress={() => {
                      setSelectedAccount(acc);
                      setAccountSearch(acc.paymentMode);
                      setShowAccountList(false);
                    }}
                  >
                    <Text>{acc.paymentMode}</Text>
                  </TouchableOpacity>
                ))}

              {/* ➕ Add New Account */}
              <TouchableOpacity
                style={[commonStyles.dropdownItem, { backgroundColor: '#e6f7ff' }]}
                onPress={() => {
                  setShowAddAccountModal(true);
                  setShowAccountList(false);
                  setAccountSearch('');
                }}
              >
                <Text style={{ fontWeight: 'bold' }}>+ Add New Account</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

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
            <TextInput
              value={fromOrToPersonName}
              onChangeText={setFromOrToPersonName}
              placeholder="Enter name involved (optional)"
              style={styles.input}
            />


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
          {/* Cancel Button */}
          <TouchableOpacity
            onPress={resetForm}
            style={[commonStyles.saveBtn, { backgroundColor: '#ccc', flex: 1, marginRight: 8 }]}
          >
            <Text style={[commonStyles.saveBtnText, { color: '#000' }]}>Cancel</Text>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={[commonStyles.saveBtn, { flex: 1, marginLeft: 8 }]}
          >
            <Text style={commonStyles.saveBtnText}>Log Transaction</Text>
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

                    const updatedCat = categories.find(c => c.id === newCat.id);

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
                  accounts: [], // Add this to satisfy the required field
                };

                await addPerson(newPerson);
                reloadConfig(); // reloads latest config including persons
                setSelectedPerson(newPerson); // select newly added person
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


                    const targetCategory = categories.find(cat => cat.id === category.id);

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
                    saveCategories(categories);

                    // 🔁 Refresh config and update local category state
                    await reloadConfig();


                    const matched = categories.find(cat => cat.id === category.id);
                    if (matched) {
                      setCategory(matched);
                      setSubCategory(
                        matched.subcategories?.find((sub: SubCategory) => sub.id === newSub.id) || null
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

      <Modal visible={showAddAccountModal} transparent animationType="slide">
        <View style={commonStyles.modalContainer}>
          <View style={commonStyles.modalContent}>
            <Text style={commonStyles.label}>Enter Account Name</Text>
            <TextInput
              style={commonStyles.input}
              value={newAccountName}
              onChangeText={setNewAccountName}
              placeholder="e.g., Bank, UPI, Cash"
            />
            <View style={commonStyles.modalButtonRow}>
              <Button
                title="Cancel"
                onPress={() => {
                  setNewAccountName('');
                  setShowAddAccountModal(false);
                }}
              />
              <Button
                title="Add"
                onPress={async () => {
                  const name = newAccountName.trim();

                  if (!name) {
                    showToast('error', 'Account name cannot be empty');
                    return;
                  }

                  if (!selectedPerson?.id) {
                    showToast('error', 'No person selected');
                    return;
                  }

                  try {
                    const addedAccount = await addAccountToPerson(selectedPerson.id, {
                      paymentMode: name,
                    });

                    // Refresh local person list or config (optional)
                    reloadConfig(); // If this refreshes selectedPerson + accounts

                    setSelectedAccount(addedAccount);
                    setNewAccountName('');
                    setShowAddAccountModal(false);
                    showToast('success', 'New account added');
                  } catch (error) {
                    console.error('Add account error:', error);
                    showToast('error', 'Failed to add account');
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
    backgroundColor: '#0984e3',
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

  iconButton: {
    marginLeft: 12,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    color: '#2d3436',
  },
  quickText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 10,
  },
  quickCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '90%',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
});

export default LogTransactionForm;