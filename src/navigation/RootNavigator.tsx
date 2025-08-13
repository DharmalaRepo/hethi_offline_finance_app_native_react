import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, Dimensions, Linking } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TextTicker from 'react-native-text-ticker';
import BottomTabNavigator from './BottomTabNavigator';
import LockScreen from '../screens/LockScreen'; // adjust if needed
import { preloadConfigData } from '../utils/configUtils';
import { useThemeContext } from '../components/ThemeContext';
import { RootStackParamList } from './routes';
import { getAppSettings_ } from '../services/mockDataService';
import { useAutoLock } from '../hooks/useAutoLock';

const { width } = Dimensions.get('window');

const RootNavigator = () => {
  const RootStack = createNativeStackNavigator<RootStackParamList>();
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const { theme } = useThemeContext();
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useAutoLock();

  useEffect(() => {
    preloadConfigData();

    const checkPinEnabled = async () => {
      const settings = await getAppSettings_();
      if (settings.pinEnabled) {
        setInitialRoute('LockScreen');
      } else {
        setInitialRoute('MainTabs');
      }
    };

    checkPinEnabled();
  }, []);

  useEffect(() => {
    const startScrolling = () => {
      scrollAnim.setValue(0);
      Animated.loop(
        Animated.timing(scrollAnim, {
          toValue: -width,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();
    };

    startScrolling();
  }, []);

  if (!initialRoute) return null; // or splash screen

  return (
    <SafeAreaView style={[styles.safeArea, theme === 'dark' ? styles.darkBackground : styles.lightBackground]}>
      {/* HEADER */}
      <View style={styles.header}></View>

      {/* TICKER */}
      <View style={styles.tickerWrapper}>
        <Animated.View style={[styles.tickerAnimatedContainer, { transform: [{ translateX: scrollAnim }] }]}>
          <Text style={styles.tickerText}>
            💰 Welcome to HETHI SOLUTIONS - Manage your personal finances (offline) effortlessly with care and clarity. 🏛️
            💰 Welcome to HETHI SOLUTIONS - Manage your personal finances (offline) effortlessly with care and clarity. 🏛️
          </Text>
        </Animated.View>
      </View>

      {/* MAIN NAVIGATION */}
      <View style={styles.content}>
        <RootStack.Navigator initialRouteName={initialRoute}>
          <RootStack.Screen
            name="MainTabs"
            component={BottomTabNavigator}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="LockScreen"
            component={LockScreen}
            options={{ headerShown: false }}
          />
        </RootStack.Navigator>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © All rights reserved. <Text style={{ fontWeight: 'bold', color: 'grey' }}>HETHI SOLUTIONS.</Text>
        </Text>
        <Text style={styles.footerSubText}>
          By Dharmala Shiva Prasad Reddy. Email for{' '}
          <Text
            style={styles.emailLink}
            onPress={() => Linking.openURL('mailto:hethi.solutions@gmail.com')}
          >
            queries/feedback
          </Text>{' '}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { backgroundColor: '#007bff', paddingVertical: 20, paddingHorizontal: 20 },
  lightBackground: { backgroundColor: '#fff' },
  darkBackground: { backgroundColor: '#000' },
  content: { flex: 1 },
  footer: {
    backgroundColor: '#e6f0ff',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#cce0ff',
  },
  footerText: { fontSize: 12, color: 'grey' },
  emailLink: { color: '#1a3c70', textDecorationLine: 'underline', fontSize: 13 },
  footerSubText: { fontSize: 13, color: 'grey' },
  tickerWrapper: {
    height: 22,
    overflow: 'hidden',
    backgroundColor: '#e2f1ff',
    justifyContent: 'center',
  },
  tickerAnimatedContainer: { flexDirection: 'row', width: width * 2 },
  tickerText: {
    fontSize: 16,
    color: '#1a3c70',
    fontWeight: 'bold',
    paddingHorizontal: 20,
  },
});

export default RootNavigator;
