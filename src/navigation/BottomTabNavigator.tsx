import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import LogTransactionScreen from '../screens/LogTransactionScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import ReportsScreen from '../screens/ReportsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import MoreNavigator from './MoreNavigator';
import ManagePersonsScreen from '../screens/ManagePersonsScreen';


const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          switch (route.name) {
            case 'Dashboard':
              iconName = 'home-outline';
              break;
            case 'Add':
              iconName = 'add-circle-outline';
              break;
            case 'Log':
              iconName = 'add-circle-outline';
              break;
            case 'Transactions':
              iconName = 'book-outline';
              break;
            case 'Persons':
              iconName = 'people-outline';
              break;
            case 'Categories':
              iconName = 'pricetags-outline';
              break;
            case 'Menu':
              iconName = 'menu-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Add" component={AddTransactionScreen} />
      <Tab.Screen name="Log" component={LogTransactionScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Persons" component={ManagePersonsScreen} />
      <Tab.Screen name="Categories" component={ManageCategoriesScreen} />
      <Tab.Screen name="Menu" component={MoreNavigator} />

    </Tab.Navigator>
  );
};

export default BottomTabNavigator;