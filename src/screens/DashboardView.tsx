// DashboardView.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { Category } from '../models/Category';
import { Person } from '../models/Person';
import { OpeningBalance } from '../models/MonthlyOpeningBalance';
import { RecurringPayment } from '../models/RecurringPayment';

interface Props {
  accounts: Account[];
  categories: Category[];
  persons: Person[];
  monthlyOpeningBalances: OpeningBalance[];
  recurringPayments: RecurringPayment[];
  transactions: Transaction[];
}

const DashboardView: React.FC<Props> = ({
  accounts,
  categories,
  persons,
  monthlyOpeningBalances,
  recurringPayments,
  transactions,
}) => {
  const navigation = useNavigation<any>();

  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const savings = income - expense;

  const getDueToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return recurringPayments.filter(r => r.dueDate === today);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.cardContainer}>
        <View style={styles.card}><Text>Income: ₹{income}</Text></View>
        <View style={styles.card}><Text>Expense: ₹{expense}</Text></View>
        <View style={styles.card}><Text>Savings: ₹{savings}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Persons')}><Text style={styles.buttonText}>Persons</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Categories')}><Text style={styles.buttonText}>Categories</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Add')}><Text style={styles.buttonText}>AddTransactionScreen</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Transactions')}><Text style={styles.buttonText}>Transactions</Text></TouchableOpacity>
       </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reminders (Today)</Text>
        {getDueToday().length > 0 ? (
          getDueToday().map((entry, idx) => (
            <Text key={idx} style={styles.reminderItem}>
              {entry.type} of ₹{entry.amount} for {entry.title}
            </Text>
          ))
        ) : (
          <Text style={{ color: 'gray' }}>No reminders for today</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f9f9f9' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  cardContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 8, elevation: 2 },
  section: { marginVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  reminderItem: { paddingVertical: 4 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
    width: '48%',
    marginBottom: 10,
  },
  buttonText: { color: '#fff', textAlign: 'center' },
});

export default DashboardView;