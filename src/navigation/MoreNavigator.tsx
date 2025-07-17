import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MoreMenuScreen from '../screens/MoreMenuScreen'; // ✅ Add this
import ReportsScreen from '../screens/ReportsScreen';
import ManagePersonsScreen from '../screens/ManagePersonsScreen';
import MonthlyOpeningBalanceScreen from '../screens/MonthlyOpeningBalanceScreen';
import  BalanceSheetScreen from '../screens/BalanceSheetScreen';
import ReversibleTransactionsScreen from '../screens/ReversibleTransactionsScreen';
import RecurringPaymentsScreen from '../screens/RecurringPaymentsScreen';
import ImportDataScreen from '../screens/ImportDataScreen';
import ExportDataScreen from '../screens/ExportDataScreen';
import SetPinScreen from '../screens/SetPinScreen';
import SetupWizardScreen from '../screens/SetupWizardScreen';
import DataManagementScreen from '../screens/DataManagementScreen';

export type MoreStackParamList = {
  Menu: undefined;
  MonthlyOpeningBalance: undefined;
  BalanceSheets: undefined;
  ReversibleTransactions: undefined;
  RecurringPayments: undefined;
  ImportData: undefined;
  ExportData: undefined;
  SetPin: undefined;
  SetupWizard: undefined;
  Reports: undefined;
  DataManagement: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

const MoreNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Menu">
      <Stack.Screen name="Menu" component={MoreMenuScreen} options={{ title: 'Menu Items' }} />
      <Stack.Screen name="MonthlyOpeningBalance" component={MonthlyOpeningBalanceScreen} />
      <Stack.Screen name="BalanceSheets" component={BalanceSheetScreen} />
      <Stack.Screen name="ReversibleTransactions" component={ReversibleTransactionsScreen} />
      <Stack.Screen name="RecurringPayments" component={RecurringPaymentsScreen} />
      <Stack.Screen name="ImportData" component={ImportDataScreen} />
      <Stack.Screen name="ExportData" component={ExportDataScreen} />
      <Stack.Screen name="SetPin" component={SetPinScreen} />
      <Stack.Screen name="SetupWizard" component={SetupWizardScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="DataManagement" component={DataManagementScreen} />
      
    </Stack.Navigator>
  );
};

export default MoreNavigator;