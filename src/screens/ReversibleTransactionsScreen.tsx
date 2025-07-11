import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReversibleTransactionsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reversible Transactions Screen</Text>
    </View>
  );
};

export default ReversibleTransactionsScreen;

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