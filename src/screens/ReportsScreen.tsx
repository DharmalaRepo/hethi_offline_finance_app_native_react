import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Transaction } from '../models/Transaction';
import ReportsView from './ReportsView';

const ReportsScreen = () => {

  return (
    <View style={{ flex: 1 }}>
        <ReportsView />
    </View>
  );
};

export default ReportsScreen;