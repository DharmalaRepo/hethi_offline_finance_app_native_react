// src/navigation/RootNavigator.tsx
import React, { useRef, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';
import { Linking } from 'react-native';
import TextTicker from 'react-native-text-ticker';
import { preloadConfigData } from '../utils/configUtils';
import { useThemeContext } from '../components/ThemeContext';

const { width } = Dimensions.get('window');

const RootNavigator = () => {
  const { theme } = useThemeContext();
 const scrollAnim = useRef(new Animated.Value(0)).current;

 useEffect(() => {
   preloadConfigData(); // preload categories and persons
 }, []);

 useEffect(() => {
   const startScrolling = () => {
     scrollAnim.setValue(0);
     Animated.loop(
       Animated.timing(scrollAnim, {
         toValue: -width, // scroll full screen width
         duration: 10000,
         useNativeDriver: true,
       })
     ).start();
   };

   startScrolling();
 }, []);

  return (
    <SafeAreaView style={[styles.safeArea, theme === 'dark' ? styles.darkBackground : styles.lightBackground]}>
    {/* HEADER */}
          <View style={styles.header}>

          </View>
      <View style={styles.tickerWrapper}>
        <Animated.View
          style={[
            styles.tickerAnimatedContainer,
            { transform: [{ translateX: scrollAnim }] },
          ]}
        >
          {/* Duplicated text for seamless loop */}
          <Text style={styles.tickerText}>
            💰 Welcome to HETHI SOLUTIONS - Manage your personal finances effortlessly with care and clarity. 🏛️   💰 Welcome to HETHI SOLUTIONS - Manage your personal finances effortlessly with care and clarity. 🏛️
          </Text>
        </Animated.View>
      </View>

      {/* MAIN NAVIGATION */}
      <View style={styles.content}>
        <NavigationContainer>
          <BottomTabNavigator />
        </NavigationContainer>
      </View>


      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © All rights reserved. <Text style={{ fontWeight: 'bold', color: 'grey'}}>HETHI SOLUTIONS.</Text>
        </Text>

        <Text style={styles.footerSubText}>
          By Dharmala Hethi Pranavi Reddy - For queries{' '}
          <Text
            style={styles.emailLink}
            onPress={() => Linking.openURL('mailto:shivaprasad1547@gmail.com')}
          >
            Send Email
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    //backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#007bff',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  lightBackground: {
    backgroundColor: '#fff',
  },
  darkBackground: {
    backgroundColor: '#000',
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    //overflow: 'hidden', // ensures footer remains fixed
  },
  footer: {
    backgroundColor: '#e6f0ff',
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#cce0ff',
  },
  footerText: {
    fontSize: 12,
    color: 'grey',
  },
  emailLink: {
    color: '#1a3c70',
    textDecorationLine: 'underline',
    marginTop: 4,
    fontSize: 13,
  },
  footerSubText: {
    fontSize: 13,
    color: 'grey',
  },
  container: {
    overflow: 'hidden',
    height: 30,
    backgroundColor: '#e2f1ff',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a3c70',
  },
  tickerContainer: {
      height: 30,
      overflow: 'hidden',
      backgroundColor: '#e2f1ff',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    tickerWrapper: {
        height: 22,
        overflow: 'hidden',
        backgroundColor: '#e2f1ff',
        justifyContent: 'center',
      },

      tickerAnimatedContainer: {
        flexDirection: 'row',
        width: width * 2, // allow enough room for 2 texts to scroll
      },

      tickerText: {
        fontSize: 16,
        color: '#1a3c70',
        fontWeight: 'bold',
        paddingHorizontal: 20,
      },
});

export default RootNavigator;