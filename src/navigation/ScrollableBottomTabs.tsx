import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, Platform } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import BalanceSheetsScreen from '../screens/BalanceSheetScreen';
import PersonsScreen from '../screens/ManagePersonsScreen';
import CategoriesScreen from '../screens/ManageCategoriesScreen';

const Tab = createMaterialTopTabNavigator();

const ScrollableBottomTabs = () => {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarIndicatorStyle: { height: 0 },
        tabBarStyle: {
          backgroundColor: '#fff',
          elevation: 5,
          borderTopWidth: Platform.OS === 'android' ? 0.5 : 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          textTransform: 'none',
        },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="BalanceSheets" component={BalanceSheetsScreen} />
      <Tab.Screen name="Persons" component={PersonsScreen} />
      <Tab.Screen name="Categories" component={CategoriesScreen} />
      {/* Add more tabs as needed */}
    </Tab.Navigator>
  );
};

export default ScrollableBottomTabs;