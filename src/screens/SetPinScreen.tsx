import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Button, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../components/ThemeContext'; // ✅ Ensure correct import

const SetPinScreen = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const { theme } = useThemeContext();
  const isDark = theme === 'dark';

  const themedColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    inputBg: isDark ? '#222' : '#f2f2f2',
    border: isDark ? '#555' : '#ccc',
  };

  const handleSetPin = async () => {
    if (pin.length < 4 || pin !== confirmPin) {
      setError('PIN must be at least 4 digits and match confirmation.');
      return;
    }
    await AsyncStorage.setItem('app_pin', pin);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themedColors.background }]}>
      <Text style={[styles.title, { color: themedColors.text }]}>Set PIN</Text>

      <TextInput
        style={[styles.input, { backgroundColor: themedColors.inputBg, color: themedColors.text, borderColor: themedColors.border }]}
        placeholder="Enter PIN"
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        secureTextEntry
        keyboardType="number-pad"
        value={pin}
        onChangeText={setPin}
      />

      <TextInput
        style={[styles.input, { backgroundColor: themedColors.inputBg, color: themedColors.text, borderColor: themedColors.border }]}
        placeholder="Confirm PIN"
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        secureTextEntry
        keyboardType="number-pad"
        value={confirmPin}
        onChangeText={setConfirmPin}
      />

      {error !== '' && <Text style={[styles.error, { color: 'red' }]}>{error}</Text>}

      <View style={styles.buttonContainer}>
        <Button title="Set PIN" onPress={handleSetPin} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
  error: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SetPinScreen;