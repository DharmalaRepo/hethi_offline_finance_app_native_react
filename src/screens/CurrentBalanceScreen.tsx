import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CurrentBalanceScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Current Balance Screen</Text>
    </View>
  );
};

export default CurrentBalanceScreen;

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