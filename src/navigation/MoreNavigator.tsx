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
import LockScreen from '../screens/LockScreen';


export type MoreStackParamList = {
  MoreNavigator: undefined;
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
  LockScreen: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

const MoreNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="MoreNavigator">
      <Stack.Screen name="MoreNavigator" component={MoreMenuScreen} options={{ title: 'Menu Items' }} />
      <Stack.Screen name="Categories" component={ManageCategoriesScreen} options={{ title: 'Manage Categories' }} />
      <Stack.Screen name="Persons" component={ManagePersonsScreen} options={{ title: 'Manage Persons' }} />
      <Stack.Screen name="ReversibleTransactions" component={ReversibleTransactionsScreen} options={{ title: 'Reversible Transactions' }} />
      <Stack.Screen name="RecurringPayments" component={RecurringPaymentsScreen} options={{ title: 'Recurring Payments' }} />
      <Stack.Screen name="ImportData" component={ImportDataScreen} options={{ title: 'Import Data' }} />
      <Stack.Screen name="ExportData" component={ExportDataScreen} options={{ title: 'Expor Data' }} />
      <Stack.Screen name="SetPin" component={SetPinScreen} options={{ title: '🔐 PIN Protection' }} />
      <Stack.Screen name="SetupWizard" component={SetupWizardScreen} options={{ title: 'Set up Wizard' }} />
      <Stack.Screen name="DataManagement" component={DataManagementScreen} options={{ title: 'Data Management' }} />
      <Stack.Screen name="LockScreen" component={LockScreen} options={{ headerShown: false }} />
      
    </Stack.Navigator>
  );
};

export default MoreNavigator;