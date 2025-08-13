import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, Image } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { getAppSettings_, getPin, clearPinAttempts, getPinFailedAttempts, getPinLockUntil, setPinFailedAttempts, setPinLockUntil, validatePin } from '../services/mockDataService';
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
//console.log('Inside LockScreen mm');
const LockScreen = () => {
  //console.log('Inside LockScreen');
  const [enteredPin, setEnteredPin] = useState('');
  const [settings, setSettings] = useState<any>({});
  const [storedPin, setStoredPin] = useState('');
  // ✅ fixed (use Root stack instead of More stack)
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    (async () => {
      const appSettings = await getAppSettings_();
      const pin = await getPin();
      setSettings(appSettings || {});
      setStoredPin(pin || '');
      if (appSettings?.biometricEnabled) {
        handleBiometricAuth();
      }
    })();

  }, []);

  const handleUnlock = async () => {
    //console.log('Inside handleUnlock');
    const lockUntil = await getPinLockUntil();
    const now = Date.now();

    if (lockUntil && now < lockUntil) {
      const secondsLeft = Math.ceil((lockUntil - now) / 1000);
      //console.log(`Seconds left: ${secondsLeft}`);
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding' })}>
      <Image source={require('../../assets/images/icon.png')} style={styles.fullImage} resizeMode="contain" />
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
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>✨ App Highlights</Text>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>Offline-first Expense & Income Tracking</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>No ads. No data tracking. 100% private.</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>Category and Person-wise transaction grouping</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>Smart Dashboards with monthly summaries</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>Recurring payment reminders </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.featureText}>Balance Sheet with Opening/Closing support</Text>
        </View>

      </View>

    </KeyboardAvoidingView>


  );
};

export default LockScreen;

const styles = StyleSheet.create({

  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#2d3436',
  }, input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  altButton: {
    backgroundColor: '#636e72',
    marginTop: 12,
  },
  fullImage: { width: 150, height: 150, marginBottom: 25 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  button: {
    backgroundColor: '#0984e3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 20, alignItems: 'center' },
  footerText: { fontSize: 12, color: '#999', textAlign: 'center' },
  link: { color: '#007bff', textDecorationLine: 'underline' }, featuresContainer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#f1f2f6',
    borderRadius: 10,
    width: '100%',
  },
  featuresTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 10,
    color: '#1e90ff', // slightly deeper blue
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 6,
  },

  bullet: {
    fontSize: 16,
    marginRight: 10,
    color: '#0abde3', // cyan-blue shade for visual highlight
  },

  featureText: {
    fontSize: 12,
    color: '#2d3436', // rich dark grey instead of black
    flex: 1,
    lineHeight: 20,
  },
});