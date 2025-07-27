import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ScrollView, Image
} from 'react-native';
import {
  getPin,
  savePin,
  validatePin,
  getSecurityQA,
  saveSecurityQA,
  validateSecurityAnswer,
} from '../services/mockDataService';

const PinProtectionScreen = () => {
  const [mode, setMode] = useState<'set' | 'change' | 'reset'>('set');
  const [pinExists, setPinExists] = useState(false);

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [resetAnswer, setResetAnswer] = useState('');

  useEffect(() => {
    (async () => {
      const existingPin = await getPin();
      const q = await getSecurityQA();
      setPinExists(!!existingPin);
      setQuestion(q);
      setMode(existingPin ? 'change' : 'set');
    })();
  }, []);

  const handleSetPin = async () => {
    if (!newPin || !confirmPin || newPin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match or are empty.');
      return;
    }
    if (!question || !answer) {
      Alert.alert('Error', 'Please provide a security question and answer.');
      return;
    }

    await savePin(newPin);
    await saveSecurityQA(question, answer);
    Alert.alert('Success', 'PIN set successfully!');
    resetFields();
    setMode('change');
    setPinExists(true);
  };

  const handleChangePin = async () => {
    const isValid = await validatePin(oldPin);
    if (!isValid) {
      Alert.alert('Invalid PIN', 'The old PIN you entered is incorrect.');
      return;
    }
    if (!newPin || newPin !== confirmPin) {
      Alert.alert('Error', 'New PINs do not match.');
      return;
    }
    await savePin(newPin);
    Alert.alert('Success', 'PIN changed successfully!');
    resetFields();
  };

  const handleResetPin = async () => {
    const valid = await validateSecurityAnswer(resetAnswer);
    if (!valid) {
      Alert.alert('Error', 'Incorrect answer to security question.');
      return;
    }
    if (!newPin || newPin !== confirmPin) {
      Alert.alert('Error', 'New PINs do not match.');
      return;
    }
    await savePin(newPin);
    Alert.alert('Success', 'PIN reset successfully!');
    resetFields();
    setMode('change');
  };

  const resetFields = () => {
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setAnswer('');
    setResetAnswer('');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
                   <View style={styles.headerLeft}>
                      <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
                      <Text style={styles.title}> 🔐 PIN Protection</Text>
                    </View>       
                </View> 

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.tabButton, mode === 'set' && styles.activeTab]}
          onPress={() => setMode('set')}
        >
          <Text style={styles.tabText}>Set PIN</Text>
        </TouchableOpacity>
        {pinExists && (
          <>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'change' && styles.activeTab]}
              onPress={() => setMode('change')}
            >
              <Text style={styles.tabText}>Change PIN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'reset' && styles.activeTab]}
              onPress={() => setMode('reset')}
            >
              <Text style={styles.tabText}>Forgot PIN</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {mode === 'set' && (
        <>
          <TextInput
            secureTextEntry
            placeholder="Enter new PIN"
            value={newPin}
            onChangeText={setNewPin}
            style={styles.input}
          />
          <TextInput
            secureTextEntry
            placeholder="Confirm new PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            style={styles.input}
          />
          <TextInput
            placeholder="Security Question"
            value={question}
            onChangeText={setQuestion}
            style={styles.input}
          />
          <TextInput
            placeholder="Answer"
            value={answer}
            onChangeText={setAnswer}
            style={styles.input}
          />
          <Button title="Set PIN" onPress={handleSetPin} />
        </>
      )}

      {mode === 'change' && (
        <>
          <TextInput
            secureTextEntry
            placeholder="Enter old PIN"
            value={oldPin}
            onChangeText={setOldPin}
            style={styles.input}
          />
          <TextInput
            secureTextEntry
            placeholder="Enter new PIN"
            value={newPin}
            onChangeText={setNewPin}
            style={styles.input}
          />
          <TextInput
            secureTextEntry
            placeholder="Confirm new PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            style={styles.input}
          />
          <Button title="Change PIN" onPress={handleChangePin} />
        </>
      )}

      {mode === 'reset' && (
        <>
          <Text style={styles.questionText}>Q: {question}</Text>
          <TextInput
            placeholder="Your Answer"
            value={resetAnswer}
            onChangeText={setResetAnswer}
            style={styles.input}
          />
          <TextInput
            secureTextEntry
            placeholder="New PIN"
            value={newPin}
            onChangeText={setNewPin}
            style={styles.input}
          />
          <TextInput
            secureTextEntry
            placeholder="Confirm New PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            style={styles.input}
          />
          <Button title="Reset PIN" onPress={handleResetPin} />
        </>
      )}
    </ScrollView>
  );
};

export default PinProtectionScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f6faff',
    flexGrow: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 8,
    color: '#222',
  },
   header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#0984e3',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  marginBottom: 24,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 6, // For Android
  // Optional: Use gradient background with expo-linear-gradient
},
headerLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},

headerRight: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10, // Optional for spacing (or use marginRight)
},

logo: {
  width: 28,
  height: 28,
  resizeMode: 'contain',
  marginRight: 8,
},

title: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#fff',
},
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#2c3e50',
  },
  input: {
    borderColor: '#ced6e0',
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#dfe6e9',
    margin: 4,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#74b9ff',
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  questionText: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  },
});