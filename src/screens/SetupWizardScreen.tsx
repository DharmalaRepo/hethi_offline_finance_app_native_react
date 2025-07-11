import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SetupWizardScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Setup Wizard Screen</Text>
    </View>
  );
};

export default SetupWizardScreen;

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