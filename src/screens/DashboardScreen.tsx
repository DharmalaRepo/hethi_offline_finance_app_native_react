import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image, 
  Dimensions, Modal, Pressable,
  Alert, Button
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CompositeNavigationProp,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type { RootStackParamList, MoreStackParamList } from '../navigation/routes';
import { SubCategory } from '../models/SubCategory';
import { RecurringPayment } from '../models/RecurringPayment';
import ReminderCard from '../components/ReminderCard'; // adjust the path as needed
import { isSameDay, parseISO, isAfter, isBefore } from 'date-fns';
import { useAppContext } from '../context/AppContext';
import { loadPredefinedCategories } from '../screens/DataManagementScreen';
import SavingsBreakdownModal from '../components/SavingsBreakdownModal';
import { useAppData } from '../context/AppDataProvider';


type Props = {
  title: string;
  value: number;
  icon: string;
  color: string;
  onPress?: () => void;
};

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {

  type DashboardNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<RootStackParamList, 'More'>,
    NativeStackNavigationProp<MoreStackParamList>
  >;
  const navigation = useNavigation<DashboardNavigationProp>();

  type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Transactions'>;
  const navigation2 = useNavigation<NavigationProp>();

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [reversibleCount, setReversibleCount] = useState(0);
  const [todaysReminders, setTodaysReminders] = useState<RecurringPayment[]>([]);
  const [personCount, setPersonCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);

  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [topIncomeCategories, setTopIncomeCategories] = useState<{ name: string; amount: number }[]>([]);
  const [topExpenseCategories, setTopExpenseCategories] = useState<{ name: string; amount: number }[]>([]);
  const { showSensitiveData, toggleSensitiveData } = useAppContext(); // ✅ Use global toggle
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});

  const {
    persons,
    categories,
    transactions,
    recurringPayments,
    reloadAppData,
  } = useAppData();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadDashboardData();
    }
  }, [isFocused]);


  const SummaryCard = ({ title, value, icon, color, onPress }: Props) => {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.card, { borderLeftColor: color }]}>
        <View style={styles.row}>
          <Ionicons name={icon as any} size={12} color={color} style={styles.icon} />
          <Text style={[styles.value, { color }]}>
            {showSensitiveData ? `₹${value}` : '₹****'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    const calculateTopCategories = () => {
      const incomeMap: { [key: string]: number } = {};
      const expenseMap: { [key: string]: number } = {};

      transactions.forEach(txn => {
        if (txn.type === 'income') {
          incomeMap[txn.categoryId] = (incomeMap[txn.categoryId] || 0) + txn.amount;
        } else if (txn.type === 'expense') {
          expenseMap[txn.categoryId] = (expenseMap[txn.categoryId] || 0) + txn.amount;
        }
      });

      const getCategoryName = (categoryId: string) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Unknown';
      };

      const sortedIncome = Object.entries(incomeMap)
        .map(([id, amount]) => ({ name: getCategoryName(id), amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3); // Top 3

      const sortedExpense = Object.entries(expenseMap)
        .map(([id, amount]) => ({ name: getCategoryName(id), amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3); // Top 3

      setTopIncomeCategories(sortedIncome);
      setTopExpenseCategories(sortedExpense);
    };

    if (transactions.length && categories.length) {
      calculateTopCategories();
    }
  }, [transactions, categories]);


  const loadCategoryMaps = async () => {
    const catMap: Record<string, string> = {};
    const subMap: Record<string, string> = {};
    categories.forEach((cat) => {
      catMap[cat.id] = cat.name;
      cat.subcategories?.forEach((sub: SubCategory) => {
        subMap[sub.id] = sub.name;
      });
    });
    setCategoriesMap(catMap);
  };

  const loadDashboardData = async () => {
    await reloadAppData();
    const today = new Date().toISOString().slice(0, 10);
    const filtered = recurringPayments.filter(r => {
      const today1 = new Date()
      const todayDate = today1.getDate();
      if (!r.startDate || !r.endDate) return false;

      const start = parseISO(r.startDate);
      const end = parseISO(r.endDate);

      const startDay = start.getDate();

      const hasSameDate = todayDate === startDay;
      const isWithinRange = (isAfter(today, start) || isSameDay(today, start)) &&
        (isBefore(today, end) || isSameDay(today, end));

      return hasSameDate && isWithinRange;
    });

    setTodaysReminders(filtered);
    setReversibleCount(transactions.filter(t => t.isReversible && !t.isSettled).length);
    setTotalIncome(transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0));
    setTotalExpense(transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0));

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    setMonthlyIncome(transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0));
    setMonthlyExpense(transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0));

    setPersonCount(persons.length);
    setCategoriesCount(categories.length);
  };


  const reloadConfig = async () => {
    loadDashboardData();
  };


  const handleLoadPredefined = async () => {
    await loadPredefinedCategories();
    Alert.alert('Success', 'Predefined categories and subcategories loaded!');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header with logo and title and bell */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          </TouchableOpacity>
          <Text style={styles.title}>Dashboard</Text>
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
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleSensitiveData} style={styles.iconButton}>
            <Ionicons name={showSensitiveData ? "eye" : "eye-off"} size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Overall Summary</Text>
        <View style={styles.summaryRow}>
          <SummaryCard title="Income" value={totalIncome} icon="arrow-down" color="#00b894" onPress={() =>
            navigation2.navigate('Transactions', { filters: { type: 'income' } })} />

          <SummaryCard title="Expense" value={totalExpense} icon="arrow-up" color="#d63031" onPress={() =>
            navigation2.navigate('Transactions', {
              filters: { type: 'expense', month: new Date().getMonth() + 1, year: new Date().getFullYear(), }
            })} />

          <SummaryCard title="Savings" value={totalIncome - totalExpense} icon="wallet" color="#0984e3"
            onPress={() => setShowSavingsModal(true)} />
        </View>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.summaryRow}>
          {/* Monthly Income */}
          <SummaryCard
            title="Income"
            value={monthlyIncome}
            icon="arrow-down"
            color="#00b894"
            onPress={() =>
              navigation2.navigate('Transactions', {
                filters: {
                  type: 'income',
                  month: new Date().getMonth() + 1,
                  year: new Date().getFullYear(),
                },
              })
            }
          />

          {/* Monthly Expense */}
          <SummaryCard
            title="Expense"
            value={monthlyExpense}
            icon="arrow-up"
            color="#d63031"
            onPress={() =>
              navigation2.navigate('Transactions', {
                filters: {
                  type: 'expense',
                  month: new Date().getMonth() + 1,
                  year: new Date().getFullYear(),
                },
              })
            }
          />

          {/* Monthly Savings (non-clickable) */}
          <SummaryCard
            title="Savings"
            value={monthlyIncome - monthlyExpense}
            icon="wallet"
            color="#0984e3" onPress={() => setShowSavingsModal(true)}
          />
        </View>
      </View>

      {categoriesCount === 0 && (
        <View style={{ padding: 16 }}>
          <Button title="Use Starter Categories" onPress={handleLoadPredefined} />
        </View>
      )}

      {/* Quick Navigation */}
      <Text style={styles.sectionTitle}>Quick Links</Text>
      <View style={styles.quickLinks}>
        <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#0984e3' }]} onPress={() => navigation.navigate('More', { screen: 'Persons', })} >
          <Ionicons name="people-outline" size={22} color="#fff" />
          <Text style={styles.quickText}> Person ({personCount}) </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#0984e3' }]} onPress={() => navigation.navigate('More', { screen: 'Categories' })} >
          <Ionicons name="pricetags-outline" size={22} color="#fff" />
          <Text style={styles.quickText}> Categories ({categoriesCount})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickLinks}>
        <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#0984e3' }]} onPress={() => navigation.navigate('More', { screen: 'SetPin', })} >
          <Ionicons name="lock-closed-outline" size={22} color="#fff" />
          <Text style={styles.quickText}> Set/Update PIN </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#0984e3' }]} onPress={() => navigation.navigate('More', { screen: 'SetupWizard' })} >
          <Ionicons name="settings-outline" size={22} color="#fff" />
          <Text style={styles.quickText}> Enable PIN/Settings </Text>
        </TouchableOpacity>

      </View>

      {/* Reminders */}
      <Text style={styles.sectionTitle}>Payment Reminders</Text>
      <View style={styles.card}>

        {todaysReminders.length === 0 ? (
          <View style={styles.emptyReminderContainer}>
            <TouchableOpacity
              style={styles.addReminderButton}
              onPress={() => navigation.navigate('More', { screen: 'RecurringPayments' })}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.addReminderText}>No reminders for today. Add +</Text>
            </TouchableOpacity>
          </View>
        ) : (
          todaysReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              title={reminder.title}
              dueDate={reminder.dueDate} />
          ))
        )}
      </View>

      <View style={{ marginTop: 24 }}>
        {/* Reversible Transactions */}
        <Text style={styles.sectionTitle}>Reversible Transactions</Text>
        <TouchableOpacity
          style={[styles.card, styles.reversible]}
          onPress={() => navigation.navigate('More', { screen: 'ReversibleTransactions' })}
        >
          <View style={styles.reversible}>
            <Ionicons name="swap-horizontal-outline" size={22} color="#fff" />
            <Text style={styles.reversibleText}>
              You have {reversibleCount} pending reversals
            </Text>
          </View>
        </TouchableOpacity>
      </View>


      <SavingsBreakdownModal
        visible={showSavingsModal}
        onClose={() => setShowSavingsModal(false)}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        topIncomeCategories={topIncomeCategories}
        topExpenseCategories={topExpenseCategories}
      />



    </ScrollView>
  );

};

const SummaryCard = ({ title, value, icon, color }: any) => (
  <View style={styles.summaryCard}>
    <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.cardLabel}>{title}</Text>
    <Text style={[styles.cardValue, { color }]}>₹{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    marginBottom: 6,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 4,
    borderLeftWidth: 2,
    elevation: 1,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#444',
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  logo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: 8,
  },
  iconButton: {
    marginLeft: 12,
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    width: screenWidth * 0.28,
    alignItems: 'center',
    shadowColor: '#dfe6e9',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,

  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 13,
    color: '#636e72',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '700',
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
    marginBottom: 6,
  },
  quickText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#ddd',
  },
  reminderText: {
    fontSize: 15,
    color: '#2d3436',
  },
  reversible: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // optional
    backgroundColor: '#d63031',
    borderRadius: 10,
    padding: 10,
    gap: 8, // or use marginRight on icon
  },
  reversibleText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  emptyReminderContainer: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 6,
  },
  emptyReminderText: {
    fontSize: 16,
    color: '#777',
    marginBottom: 12,
  },
  addReminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0984e3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addReminderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
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
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;

