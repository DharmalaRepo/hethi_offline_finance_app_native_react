import { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  MainTabs: undefined;
  BottomTabs: undefined;
  Transactions: undefined;
  LogTransaction: undefined;
  SetupWizard: undefined;
  LockScreen: undefined;
  Dashboard: undefined;
  Root: NavigatorScreenParams<BottomTabParamList>;
  MoreNavigator: { screen: keyof MoreStackParamList };
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  MoreNavigator: undefined;
  Reports: undefined;
  BalanceSheets: undefined;
};


export type MoreStackParamList = {
  Persons: undefined;
  Categories: undefined;
  ReversibleTransactions: undefined;
  CurrentBalances: undefined;
  RecurringPayments: undefined;
  DataManagement: undefined;
  ImportData: undefined;
  ExportData: undefined;
  SetupWizard: undefined;
  SetPin: undefined;
  LockScreen: undefined;
};