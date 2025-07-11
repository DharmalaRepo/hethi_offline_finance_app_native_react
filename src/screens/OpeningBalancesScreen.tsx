import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OpeningBalancesScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Opening Balances Screen</Text>
    </View>
  );
};

export default OpeningBalancesScreen;

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