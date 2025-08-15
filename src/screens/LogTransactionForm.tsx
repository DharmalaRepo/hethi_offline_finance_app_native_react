import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Button,
  Image, Pressable,
  Platform
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
  const [dateLocked, setDateLocked] = useState(false);
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
  const [isPending, setIsPending] = useState<boolean>(false);
  const [useLastTransactiondata, setUseLastTransactionData] = useState<boolean>(false);
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

  const {
    persons,
    categories,
    reloadAppData,
  } = useAppData();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setDateLocked(false);
      resetForm();
      setUseLastTransactionData(false);
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
    if (!useLastTransactiondata) {
      resetForm();
    }
  }, [useLastTransactiondata]);

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
    const today = new Date();
    // strip time
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      showToast('error', 'Future date is not allowed');
      return;
    }
    setDate(selectedDate);
  };

  const incrementDateByOne = () => {
    if (!date) return;
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);

    if (next > today) {
      showToast('warning', 'Cannot move beyond today');
      return;
    }
    setDate(next);
  };

  const decrementDateByOne = () => {
    if (!date) return;
    const prev = new Date(date);
    prev.setDate(prev.getDate() - 1);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    prev.setHours(0, 0, 0, 0);

    if (prev > today) {
      showToast('warning', 'Cannot move beyond today');
      return;
    }
    setDate(prev);
  };

  // ✅ HANDLE NOTES BLUR TO DETECT CATEGORY/SUBCATEGORY
  const handleNotesBlur = () => {
    if (!smartSuggestEnabled) return;
    const result = autoDetectFromNotes(note, categories);
    if (result.category) setCategory(result.category);
    if (result.subCategory) setSubCategory(result.subCategory);
  };




  const handleDueDateConfirm = (selectedDate: Date) => {
    setShowDueDatePicker(false);
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
      } = await getFallbackTransactionValues({ category, subCategory, selectedPerson, selectedAccount });

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
        accountId: selectedAccount?.id ?? finalAccount?.id ?? '',
        note,
        isReversible,
        isOptional,
        isPending,
        dueDate:
          isReversible && dueDate ? dueDate.toISOString().split('T')[0] : undefined,
        fromOrToPersonName: fromOrToPersonName,
        isSettled,
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
    if (!useLastTransactiondata) {
      setType('expense');
      setAmount('');
      if (!dateLocked) {
        setDate(new Date());
      }
      setNote('');
      setCategory(null);
      setSubCategory(null);
      setSelectedPerson(null);
      setSelectedAccount(null);
      setIsReversible(false);
      setDueDate(null);
      setFromOrToPersonName('');
      setMarkAsReturned(false);
      setShowCategoryList(false);
      setShowSubCategoryList(false);
      setNewSubcategoryName('');
      setShowAddSubcategoryModal(false);
      setIsOptional(false);
      setIsPending(false);
      setSmartSuggestEnabled(true);
      setUseLastTransactionData(false);
    }
  };

  const handleReversibleToggle = () => {
    setIsReversible(prev => !prev);
  };

  const handleMarkAsReturnedToggle = () => {
    setIsSettled(prev => !prev);
  };


  return (
    <>
      <View style={commonStyles.container}>
        <View style={commonStyles.header}>
          <View style={commonStyles.headerLeft}>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Image source={require('../../assets/images/icon.png')} style={commonStyles.logo} />
            </TouchableOpacity>
            <Text style={commonStyles.title}>Log Transaction</Text>
          </View>
          <Modal visible={modalVisible} transparent={true} animationType="fade">
            <View style={commonStyles.modalContainer}>
              <Pressable onPress={() => setModalVisible(false)} style={commonStyles.modalBackground}>
                <Image source={require('../../assets/images/icon.png')} style={commonStyles.fullImage} resizeMode="contain" />
              </Pressable>
            </View>
          </Modal>
          <View style={commonStyles.headerRight}>
            <TouchableOpacity onPress={reloadConfig} style={commonStyles.iconButton}>
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
        </View>

        <View style={commonStyles.row}>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
            <Checkbox
              status={isPending ? 'checked' : 'unchecked'}
              onPress={() => setIsPending((prev) => !prev)}
            />
            <Text>Mark as Pending</Text>
          </View>
          {type === 'expense' && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                <Checkbox
                  status={isOptional ? 'checked' : 'unchecked'}
                  onPress={() => setIsOptional((prev) => !prev)}
                />
                <Text>Mark as Optional Exp</Text>
              </View>
            </>
          )}
        </View>



        {/* Amount and Date - Side by Side */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          {/* Amount */}
          <View style={{ flex: 1 }}>
            <Text style={commonStyles.label}>Amount</Text>
            <TextInput
              style={commonStyles.input}
              keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
            />
          </View>
          {/* Date */}
          <View style={{ flex: 1.2, overflow: 'visible' }}>
            <View style={commonStyles.row}><Text style={commonStyles.label}>Date :
              {date ? date.toLocaleDateString() : 'Pick a date'}
            </Text>
              <Text style={commonStyles.label}>Lock
              </Text>
            </View>


            <View style={commonStyles.dateRow}>

              {/* Prev day */}
              <TouchableOpacity
                onPress={decrementDateByOne}
                disabled={!date}
                style={[commonStyles.iconBtn, !date && commonStyles.iconBtnDisabled]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Previous day"
              >
                <Ionicons name="chevron-back-outline" size={20} color="#2d3436" />
              </TouchableOpacity>

              {/* Date display / picker */}
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[commonStyles.dateField, dateLocked && commonStyles.dateFieldDisabled]}
                disabled={dateLocked}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="calendar-outline" size={18} color="#2d3436" />
              </TouchableOpacity>

              {/* Next day */}
              <TouchableOpacity
                onPress={incrementDateByOne}
                disabled={!date}
                style={[commonStyles.iconBtn, !date && commonStyles.iconBtnDisabled]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Next day"
              >
                <Ionicons name="chevron-forward-outline" size={20} color="#2d3436" />
              </TouchableOpacity>

              {/* Lock / Unlock */}
              <TouchableOpacity
                onPress={() => {
                  if (!date) {
                    showToast('warning', 'Select a valid date first');
                    return;
                  }
                  setDateLocked(prev => !prev);
                }}
                style={commonStyles.iconBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel={dateLocked ? 'Unlock date' : 'Lock date'}
              >
                <Ionicons
                  name={dateLocked ? 'lock-closed-outline' : 'lock-open-outline'}
                  size={20}
                  color={dateLocked ? '#D14343' : '#0C66E4'}
                />
              </TouchableOpacity>

            </View>            
          </View>         
        </View>

        <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              onConfirm={handleDateConfirm}
              onCancel={() => setShowDatePicker(false)}
            />

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


        {/* CATEGORY + SUBCATEGORY side-by-side */}
        <View style={commonStyles.twoColRow}>
          {/* ===== Category ===== */}
          <View style={commonStyles.col}>
            <Text style={commonStyles.label}>Category</Text>

            <View style={commonStyles.inputWrap}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  setShowCategoryList(true);
                  setShowSubCategoryList(false); // close the other
                  setCategorySearch('');
                }}
              >
                <TextInput
                  style={commonStyles.input}
                  value={showCategoryList ? categorySearch : category?.name || ''}
                  placeholder="Select or Add Category"
                  editable={showCategoryList}
                  onChangeText={setCategorySearch}
                  onBlur={() => {
                    if (!categorySearch.trim()) setShowCategoryList(false);
                  }}
                />
              </TouchableOpacity>

              {/* Category dropdown */}
              {showCategoryList && (
                <View style={commonStyles.dropdown}>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    contentContainerStyle={{ paddingVertical: 4 }}
                  >
                    {categories
                      .filter((item) =>
                        item.name.toLowerCase().includes(categorySearch.toLowerCase())
                      )
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={commonStyles.dropdownItem}
                          onPress={() => {
                            setCategory(item);
                            setCategorySearch(item.name);
                            setShowCategoryList(false);
                            // clear subcategory if category changed
                            setSubCategory(undefined as any);
                            setSubCategorySearch('');
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
            </View>
          </View>

          {/* ===== Subcategory ===== */}
          <View style={commonStyles.col}>
            <Text style={commonStyles.label}>Subcategory</Text>

            <View style={commonStyles.inputWrap}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  if (!category?.subcategories) {
                    return;
                  }
                  setShowSubCategoryList(true);
                  setShowCategoryList(false); // close the other
                  setSubCategorySearch('');
                }}
              >
                <TextInput
                  style={[
                    commonStyles.input,
                    !category?.subcategories && { opacity: 0.5 },
                  ]}
                  value={showSubCategoryList ? subCategorySearch : subCategory?.name || ''}
                  placeholder="Select or Add Subcategory"
                  editable={!!category && showSubCategoryList}
                  onChangeText={(text) => {
                    setSubCategorySearch(text);
                    setShowSubCategoryList(true);
                  }}
                  onBlur={() => {
                    if (!subCategorySearch.trim()) setShowSubCategoryList(false);
                  }}
                />
              </TouchableOpacity>

              {/* Subcategory dropdown */}
              {showSubCategoryList && category && (
                <View style={[commonStyles.dropdown, { zIndex: 1002 }]}>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    contentContainerStyle={{ paddingVertical: 4 }}
                  >
                    {(category.subcategories || [])
                      .filter((item) =>
                        item.name.toLowerCase().includes(subCategorySearch.toLowerCase())
                      )
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item) => (
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

                    {/* Add New Subcategory */}
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
            </View>
          </View>
        </View>


        {/* PERSON + ACCOUNT side-by-side */}
        <View style={commonStyles.twoColRow}>
          {/* ===== Person ===== */}
          <View style={commonStyles.col}>
            <Text style={commonStyles.label}>Person / Paid By</Text>

            <View style={commonStyles.inputWrap}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  setShowPersonList(true);
                  setShowAccountList(false);          // close the other
                  setPersonSearch('');
                }}
              >
                <TextInput
                  style={commonStyles.input}
                  value={showPersonList ? personSearch : selectedPerson?.name || ''}
                  placeholder="Select or Add Person"
                  editable={showPersonList}
                  onChangeText={(text) => {
                    setPersonSearch(text);
                    setShowPersonList(true);
                  }}
                  onBlur={() => {
                    if (!personSearch.trim()) setShowPersonList(false);
                  }}
                />
              </TouchableOpacity>

              {/* Person dropdown */}
              {showPersonList && (
                <View style={commonStyles.dropdown}>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingVertical: 4 }}
                  >
                    {persons
                      .filter(p =>
                        p.name.toLowerCase().includes(personSearch.toLowerCase())
                      )
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(p => (
                        <TouchableOpacity
                          key={p.id}
                          style={commonStyles.dropdownItem}
                          onPress={() => {
                            setSelectedPerson(p);
                            setPersonSearch(p.name);
                            setShowPersonList(false);
                            // reset account if person changes
                            setSelectedAccount(undefined as any);
                            setAccountSearch('');
                          }}
                        >
                          <Text>{p.name}</Text>
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
            </View>
          </View>

          {/* ===== Account ===== */}
          <View style={commonStyles.col}>
            <Text style={commonStyles.label}>Account / Paid From</Text>

            <View style={commonStyles.inputWrap}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  if (!selectedPerson?.accounts) return;
                  setShowAccountList(true);
                  setShowPersonList(false);
                  setAccountSearch('');
                }}
              >
                <TextInput
                  style={[
                    commonStyles.input,
                    !selectedPerson?.accounts && { opacity: 0.5 },
                  ]}
                  value={showAccountList ? accountSearch : selectedAccount?.paymentMode || ''}
                  placeholder={selectedPerson ? 'Select or Add Account' : 'Select person first'}
                  editable={!!selectedPerson?.accounts && showAccountList}
                  onChangeText={(text) => {
                    setAccountSearch(text);
                    setShowAccountList(true);
                  }}
                  onBlur={() => {
                    if (!accountSearch.trim()) setShowAccountList(false);
                  }}
                />
              </TouchableOpacity>

              {/* Account dropdown */}
              {showAccountList && selectedPerson?.accounts && (
                <View style={[commonStyles.dropdown, { zIndex: 1002 }]}>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    contentContainerStyle={{ paddingVertical: 4 }}
                  >
                    {selectedPerson.accounts
                      .filter(acc =>
                        acc.paymentMode.toLowerCase().includes(accountSearch.toLowerCase())
                      )
                      .sort((a, b) => a.paymentMode.localeCompare(b.paymentMode))
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
            </View>
          </View>
        </View>

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
            <View style={commonStyles.twoColRow}>
              {/* Due Date */}
              <View style={commonStyles.col}>
                <Text style={commonStyles.label}>Due Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDueDatePicker(true)}
                  style={commonStyles.dateBtn}
                >
                  <Text>
                    {dueDate ? dueDate.toLocaleDateString() : 'Pick a due date'}
                  </Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={showDueDatePicker}
                  mode="date"
                  onConfirm={handleDueDateConfirm}
                  onCancel={() => setShowDueDatePicker(false)}
                />
              </View>

              {/* From/To Person */}
              <View style={commonStyles.col}>
                <Text style={commonStyles.label}>From / To Person</Text>
                <TextInput
                  value={fromOrToPersonName}
                  onChangeText={setFromOrToPersonName}
                  placeholder="Enter name involved (optional)"
                  style={commonStyles.input}
                />
              </View>
            </View>
          </>
        )}

        <View>



          <View style={commonStyles.checkboxRow}>
            <Checkbox
              status={useLastTransactiondata ? 'checked' : 'unchecked'}
              onPress={() => setUseLastTransactionData((prev) => !prev)}
            />
            <Text style={commonStyles.label}>Use these details for next transaction</Text>
          </View>

        </View>

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

      </View>

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


export default LogTransactionForm;