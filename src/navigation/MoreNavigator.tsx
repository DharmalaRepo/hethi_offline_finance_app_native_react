import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MoreMenuScreen from '../screens/MoreMenuScreen'; // ✅ Add this
import ReportsScreen from '../screens/ReportsScreen';
import ManagePersonsScreen from '../screens/ManagePersonsScreen';
import MonthlyOpeningBalanceScreen from '../screens/MonthlyOpeningBalanceScreen';
import CurrentBalancesScreen from '../screens/CurrentBalanceScreen';
import ReversibleTransactionsScreen from '../screens/ReversibleTransactionsScreen';
import RecurringPaymentsScreen from '../screens/RecurringPaymentsScreen';
import ImportDataScreen from '../screens/ImportDataScreen';
import ExportDataScreen from '../screens/ExportDataScreen';
import SetPinScreen from '../screens/SetPinScreen';
import SetupWizardScreen from '../screens/SetupWizardScreen';

export type MoreStackParamList = {
  MoreMenu: undefined;
  MonthlyOpeningBalance: undefined;
  CurrentBalances: undefined;
  ReversibleTransactions: undefined;
  RecurringPayments: undefined;
  ImportData: undefined;
  ExportData: undefined;
  SetPin: undefined;
  SetupWizard: undefined;
  Reports: undefined;
};

const Stack = createNativeStackNavigator<MoreStackParamList>();

const MoreNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Menu">
      <Stack.Screen name="Menu" component={MoreMenuScreen} options={{ title: 'Menu Items' }} />
      <Stack.Screen name="MonthlyOpeningBalance" component={MonthlyOpeningBalanceScreen} />
      <Stack.Screen name="CurrentBalances" component={CurrentBalancesScreen} />
      <Stack.Screen name="ReversibleTransactions" component={ReversibleTransactionsScreen} />
      <Stack.Screen name="RecurringPayments" component={RecurringPaymentsScreen} />
      <Stack.Screen name="ImportData" component={ImportDataScreen} />
      <Stack.Screen name="ExportData" component={ExportDataScreen} />
      <Stack.Screen name="SetPin" component={SetPinScreen} />
      <Stack.Screen name="SetupWizard" component={SetupWizardScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
};

export default MoreNavigator;