import React, { useEffect, useState }  from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image, Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type { RootStackParamList, MoreStackParamList } from '../navigation/routes';
import { LinearGradient } from 'expo-linear-gradient';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { Account } from '../models/Account';
import { SubCategory } from '../models/SubCategory';
import { Transaction } from '../models/Transaction';
import { RecurringPayment } from '../models/RecurringPayment';
import ReminderCard from '../components/ReminderCard'; // adjust the path as needed
import { getCategories, getAllTransactions, getAllRecurringPayments, getPersons, getAllPersons, getAccounts, addCategory, 
  addSubCategory, addPerson, saveTransaction, getFallbackTransactionValues } from '../services/mockDataService';
import { isSameDay, parseISO, isAfter, isBefore } from 'date-fns';
import { useAppContext  } from '../context/AppContext';

type Props = {
  title: string;
  value: number;
  icon: string;
  color: string;
};


const screenWidth = Dimensions.get('window').width;

const DashboardScreen = () => {
  
  type DashboardNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<RootStackParamList>,
    NativeStackNavigationProp<MoreStackParamList>
  >;

const navigation = useNavigation<DashboardNavigationProp>();

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [reversibleCount, setReversibleCount] = useState(0);
  const [todaysReminders, setTodaysReminders] = useState<RecurringPayment[]>([]);
  const [personCount, setPersonCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  
  const { showSensitiveData, toggleSensitiveData } = useAppContext(); // ✅ Use global toggle

    const SummaryCard = ({ title, value, icon, color }: Props) => {      

      return (
        <View style={[styles.card, { borderLeftColor: color }]}>
          <View style={styles.row}>
            <Ionicons name={icon as any} size={24} color={color} style={styles.icon} />
            <Text style={styles.title}>{title}</Text>
          </View>
          <Text style={[styles.value, { color }]}>
            {showSensitiveData ? `₹${value}` : '₹****'}
          </Text>
        </View>
      );
    };
  
  

useEffect(() => {
  loadDashboardData(); // call async wrapper
}, []);

const today = new Date();

const loadDashboardData = async () => {
      const today = new Date().toISOString().slice(0, 10);      

      const transactions = await getAllTransactions();
      const reminders= await getAllRecurringPayments();
      const filtered = reminders.filter(r => {
          //console.log(r);
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

      const persons = await getAllPersons();
      setPersonCount(persons.length);
      const categories = await getCategories();
      setCategoriesCount(categories.length);
  };


  const reloadConfig = async () => {
      console.log('Reload dashboard data');
    loadDashboardData(); 
    const fetchedCategories = await getCategories();
    const allSubCategories = fetchedCategories.flatMap(cat =>
      (cat.subcategories || []).map(sub => ({ ...sub, categoryId: cat.id }))
    );
    const persons = await getAllPersons();
    const accounts = await getAccounts();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header with logo and title and bell */}
      <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
              <Text style={styles.title}>Dashboard</Text>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity onPress={reloadConfig} style={styles.iconButton}>
                <Ionicons name="refresh" size={22} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('SetupWizard')} style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleSensitiveData} style={styles.iconButton}>
                <Ionicons name={showSensitiveData ? "eye" : "eye-off"} size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

      {/* Overall Summary Row */}
      <Text style={styles.sectionTitle}>Overall Summary</Text>
      <View style={styles.summaryRow}>
        <SummaryCard title="Income" value={totalIncome} icon="arrow-down" color="#00b894" />
        <SummaryCard title="Expense" value={totalExpense} icon="arrow-up" color="#d63031" />
        <SummaryCard title="Savings" value={totalIncome - totalExpense} icon="wallet" color="#0984e3" />
      </View>

      {/* Monthly Summary Row */}
      <Text style={styles.sectionTitle}>This Month</Text>
      <View style={styles.summaryRow}>

        <SummaryCard title="Income" value={monthlyIncome} icon="arrow-down" color="#00b894" />
        <SummaryCard title="Expense" value={monthlyExpense} icon="arrow-up" color="#d63031" />
        <SummaryCard title="Savings" value={monthlyIncome-monthlyExpense} icon="wallet" color="#0984e3" />
      </View>

      {/* Quick Navigation */}
      <Text style={styles.sectionTitle}>Quick Links</Text>
      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#0984e3' }]}
          onPress={() => navigation.navigate('MoreNavigator', { screen: 'Persons',})}
        >
          <Ionicons name="people-outline" size={22} color="#fff" />
          <Text style={styles.quickText}> Person ({personCount}) </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#6c5ce7' }]}
          onPress={() => navigation.navigate('MoreNavigator', { screen: 'Categories' })}
        >
          <Ionicons name="pricetags-outline" size={22} color="#fff" />
          <Text style={styles.quickText}> Categories ({categoriesCount})</Text>
        </TouchableOpacity>        
      </View>

      {/* Reminders */}
      <Text style={styles.sectionTitle}>Payment Reminders</Text>
      <View style={styles.card}>

      {todaysReminders.length === 0 ? (
        <View style={styles.emptyReminderContainer}>
          <TouchableOpacity
            style={styles.addReminderButton}
            onPress={() => navigation.navigate('MoreNavigator', { screen: 'RecurringPayments' })}
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

      {/* Reversible Transactions */}
      <Text style={styles.sectionTitle}>Reversible Transactions</Text>
      <TouchableOpacity
        style={[styles.card, styles.reversible]}
        onPress={() => navigation.navigate('MoreNavigator', { screen: 'ReversibleTransactions' })}
      >
        <Ionicons name="swap-horizontal-outline" size={22} color="#fff" />
        <Text style={styles.reversibleText}>You have {reversibleCount} pending reversals</Text>
      </TouchableOpacity>

      

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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
    color: '#2d3436',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
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
  },
  quickText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  reminderText: {
    fontSize: 15,
    color: '#2d3436',
  },
  reversible: {
    backgroundColor: '#d63031',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reversibleText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  emptyReminderContainer: {
  backgroundColor: '#f9f9f9',
  padding: 16,
  borderRadius: 10,
  alignItems: 'center',
  marginBottom: 20,
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
},row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  value: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default DashboardScreen;

