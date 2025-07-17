import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TransactionsScreen from '../screens/TransactionsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import SetupWizardScreen from '../screens/SetupWizardScreen';
import SetPinScreen from '../screens/SetPinScreen';
import { useThemeContext } from '../components/ThemeContext';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { navTheme } = useThemeContext(); // 👈 Navigation theme (light/dark)

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator initialRouteName="Transactions">
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
        <Stack.Screen name="SetupWizard" component={SetupWizardScreen} />
        <Stack.Screen name="SetPin" component={SetPinScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;