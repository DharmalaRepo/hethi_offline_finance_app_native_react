import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MoreMenuScreen from '../screens/MoreMenuScreen'; // ✅ Add this
import ManagePersonsScreen from '../screens/ManagePersonsScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import ReversibleTransactionsScreen from '../screens/ReversibleTransactionsScreen';
import RecurringPaymentsScreen from '../screens/RecurringPaymentsScreen';
import ImportDataScreen from '../screens/ImportDataScreen';
import ExportDataScreen from '../screens/ExportDataScreen';
import SetPinScreen from '../screens/SetPinScreen';
import SetupWizardScreen from '../screens/SetupWizardScreen';
import DataManagementScreen from '../screens/DataManagementScreen';
import OptionalExpensesScreen from '../screens/OptionalExpensesScreen';
import LockScreen from '../screens/LockScreen';


export type MoreStackParamList = {
  MoreMenu: undefined;
  Categories: undefined;
  Persons: undefined;
  MonthlyOpeningBalance: undefined;
  ReversibleTransactions: undefined;
  RecurringPayments: undefined;
  ImportData: undefined;
  ExportData: undefined;
  SetPin: undefined;
  SetupWizard: undefined;
  DataManagement: undefined;
  OptionalExpenses: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

const More = () => {
  return (
    <Stack.Navigator initialRouteName="MoreMenu">
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'Menu Items', headerShown: false }} />
      <Stack.Screen name="Categories" component={ManageCategoriesScreen} options={{ title: 'Manage Categories', headerShown: false }} />
      <Stack.Screen name="Persons" component={ManagePersonsScreen} options={{ title: 'Manage Persons', headerShown: false }} />
      <Stack.Screen name="ReversibleTransactions" component={ReversibleTransactionsScreen} options={{ title: 'Reversible Transactions', headerShown: false }} />
      <Stack.Screen name="RecurringPayments" component={RecurringPaymentsScreen} options={{ title: 'Recurring Payments', headerShown: false }} />
      <Stack.Screen name="DataManagement" component={DataManagementScreen} options={{ title: 'Data Management', headerShown: false }} />
      <Stack.Screen name="ImportData" component={ImportDataScreen} options={{ title: 'Import Data', headerShown: false }} />
      <Stack.Screen name="ExportData" component={ExportDataScreen} options={{ title: 'Export Data', headerShown: false }} />
      <Stack.Screen name="SetPin" component={SetPinScreen} options={{ title: 'PIN Protection', headerShown: false }} />
      <Stack.Screen name="SetupWizard" component={SetupWizardScreen} options={{ title: 'Set up Wizard', headerShown: false }} />      
      <Stack.Screen name="OptionalExpenses" component={OptionalExpensesScreen} options={{ title: 'Optional Expenses', headerShown: false }} />      
    </Stack.Navigator>
  );
};

export default More;