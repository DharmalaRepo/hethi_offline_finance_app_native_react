import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import LogTransactionScreen from '../screens/LogTransactionScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ReportsScreen from '../screens/ReportsScreen';
import BalanceSheetScreen from '../screens/BalanceSheetScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import MoreNavigator from './MoreNavigator';
import ManagePersonsScreen from '../screens/ManagePersonsScreen';


const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route, }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          switch (route.name) {
            case 'Dashboard':
              iconName = 'home-outline';
              break;
            case 'Log':
              iconName = 'add-circle-outline';
              break;
            case 'Transactions':
              iconName = 'book-outline';
              break;
            case 'Reports':
              iconName = 'bar-chart-outline';
              break;
            case 'BalanceSheets':
              iconName = 'document-text-outline';
              break;
            case 'More':
              iconName = 'menu-outline';
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tab.Screen name="Log" component={LogTransactionScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="BalanceSheets" component={BalanceSheetScreen} />
      <Tab.Screen name="More" component={MoreNavigator} />

    </Tab.Navigator>
  );
};

export default BottomTabNavigator;