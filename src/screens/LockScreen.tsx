import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { getAppSettings, getPin, clearPinAttempts, getPinFailedAttempts, getPinLockUntil, setPinFailedAttempts, setPinLockUntil, validatePin} from '../services/mockDataService';
import { StackNavigationProp } from '@react-navigation/stack';
import { navigationRef } from '../navigation/NavigationService';
import { showToast } from '../utils/toastUtils'; // ✅ Correct usage for named export
import { ToastAndroid } from 'react-native';

import {
  CompositeNavigationProp,
  useNavigation,
} from '@react-navigation/native';
import {
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type { RootStackParamList, MoreStackParamList } from '../navigation/routes';

const LockScreen = () => {
  
  const [enteredPin, setEnteredPin] = useState('');
  const [settings, setSettings] = useState<any>({});
  const [storedPin, setStoredPin] = useState('');
  // ✅ fixed (use Root stack instead of More stack)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    (async () => {
      const appSettings = await getAppSettings();
      const pin = await getPin();
      setSettings(appSettings || {});
      setStoredPin(pin || '');
      if (appSettings?.biometricEnabled) {
        handleBiometricAuth();
      }
    })();
  }, []);

  const handleUnlock = async () => {
    const lockUntil = await getPinLockUntil();
    const now = Date.now();

    if (lockUntil && now < lockUntil) {
      const secondsLeft = Math.ceil((lockUntil - now) / 1000);
      console.log(`App is locked until ${new Date(lockUntil).toLocaleTimeString()}`);
      console.log(`Seconds left: ${secondsLeft}`);
      showToast('error', `App is temporarily locked. Try again in ${secondsLeft} seconds.`);
      ToastAndroid.show(`App is temporarily locked. Try again in ${secondsLeft} seconds.`, ToastAndroid.SHORT);
      return;
    }

    const isValid = await validatePin(enteredPin);

    if (isValid) {
      await clearPinAttempts(); // Reset after success
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } else {
      console.warn('Incorrect PIN entered:', enteredPin);
      showToast('error', 'Incorrect PIN. Please try again.');
      ToastAndroid.show('Incorrect PIN. Please try again.', ToastAndroid.SHORT);
      const attempts = await getPinFailedAttempts();
      const newAttempts = attempts + 1;
      await setPinFailedAttempts(newAttempts);

      if (newAttempts >= 3) {
        const lockTime = Date.now() + 60 * 1000; // lock for 1 min
        await setPinLockUntil(lockTime);
        showToast('error', 'Too many attempts. App is locked for 1 minute.');
      } else {
        showToast('error', `Incorrect PIN. Attempts left: ${5 - newAttempts}`);
      }
    }
  };

  const handleSuccess = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('MainTabs');
    }
  };

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (hasHardware && supported.length > 0 && enrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock',
        fallbackLabel: 'Enter PIN',
      });
      if (result.success) {
        showToast('success', 'Authenticated');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒 Enter PIN to Unlock</Text>

      <TextInput
        style={styles.input}
        secureTextEntry
        keyboardType="numeric"
        maxLength={6}
        placeholder="Enter PIN"
        value={enteredPin}
        onChangeText={setEnteredPin}
      />

      <TouchableOpacity style={styles.button} onPress={handleUnlock}>
        <Text style={styles.buttonText}>Unlock</Text>
      </TouchableOpacity>

      {settings.biometricEnabled && (
        <TouchableOpacity style={[styles.button, styles.altButton]} onPress={handleBiometricAuth}>
          <Text style={styles.buttonText}>Use Biometric</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default LockScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#2d3436',
  },
  input: {
    borderWidth: 1,
    borderColor: '#b2bec3',
    padding: 12,
    fontSize: 18,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0984e3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  altButton: {
    backgroundColor: '#636e72',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});