import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MonthlyOpeningBalanceScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Monthly Opening Balance Screen</Text>
    </View>
  );
};

export default MonthlyOpeningBalanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});