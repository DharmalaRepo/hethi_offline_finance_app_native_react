// src/screens/SetupWizardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getAppSettings, saveAppSettings, getPin } from '../services/mockDataService';
import { AppSettings } from '../models/AppSettings';
import { getAccounts } from '../services/mockDataService';
import { getAllPersons } from '../services/mockDataService';
import { getCategories, getSubCategoriesByCategoryId } from '../services/mockDataService';
import { showToast } from '../utils/toastUtils';
import { Account } from '../models/Account';
import { Person } from '../models/Person';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { useContext } from 'react';
import { useThemeContext } from '../components/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { MoreStackParamList } from '../navigation/routes'; // Adjust path
import { StackNavigationProp } from '@react-navigation/stack';
import { ToastAndroid } from 'react-native';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';


const SetupWizardScreen = () => {
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const { toggleTheme } = useThemeContext();
  const [isPinSet, setIsPinSet] = useState(false);
  const navigation = useNavigation<StackNavigationProp<MoreStackParamList>>();
  const [settings, setSettings] = useState<AppSettings>({
    pinEnabled: false,
    biometricEnabled: false,
    autoLockEnabled: false,
    autoLockTime: 5,
    securityQuestionEnabled: false,
    securityQuestion: '',
    securityAnswer: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const checkPin = async () => {
      const pin = await getPin();
      setIsPinSet(!!pin); // true if pin is set
    };
    checkPin();
  }, []);

  const loadInitialData = async () => {
    const settingsData = await getAppSettings();
    setSettings(settingsData);

    const accs = await getAccounts();
    const pers = await getAllPersons();
    const cats = await getCategories();

    setAccounts(accs);
    setPersons(pers);
    setCategories(cats);

    if (settingsData.defaultCategoryId) {
      const subs = await getSubCategoriesByCategoryId({ categoryId:settingsData.defaultCategoryId});
      setSubcategories(subs);
    }
  };

  const handleSave = async () => {
    await saveAppSettings(settings);
    showToast('success', 'Settings saved successfully');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
              <View style={styles.header}>
                       <View style={styles.headerLeft}>
                          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
                          <Text style={styles.title}> 🧭 Setup Wizard</Text>
                        </View>       
                    </View> 
                    
     <View style={styles.switchRow}>
        <Text style={styles.label}>Enable Dark Theme</Text>
        <Switch
          value={settings.theme === 'dark'}
          onValueChange={(val) =>
            setSettings({ ...settings, theme: val ? 'dark' : 'light' })
          }
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Scheduled Backups</Text>
        <Switch
          value={settings.scheduledBackup || false}
          onValueChange={(val) => setSettings({ ...settings, scheduledBackup: val })}
        />
      </View>

      <Text style={styles.label}>Backup Frequency</Text>
      <Picker
        selectedValue={settings.backupFrequency || ''}
        onValueChange={(val) =>
          setSettings({ ...settings, backupFrequency: val as 'daily' | 'weekly' | 'monthly' })
        }
        style={styles.picker}
        enabled={settings.scheduledBackup}
      >
        <Picker.Item label="Select Frequency" value="" />
        <Picker.Item label="Daily" value="daily" />
        <Picker.Item label="Weekly" value="weekly" />
        <Picker.Item label="Monthly" value="monthly" />
      </Picker>

      <Text style={styles.label}>Profile Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={settings.profileName || ''}
        onChangeText={(val) => setSettings({ ...settings, profileName: val })}
      />

      <Text style={styles.label}>Profile Notes</Text>
      <TextInput
        style={styles.input}
        placeholder="Notes or details"
        value={settings.profileNotes || ''}
        onChangeText={(val) => setSettings({ ...settings, profileNotes: val })}
        multiline
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Security Settings</Text>

        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: isPinSet ? '#333' : '#aaa' }]}>
            Use pin for login
          </Text>
          <Switch
            value={settings.pinEnabled || false}
            onValueChange={(val) => {
              if (!isPinSet) {
                ToastAndroid.show(
                  'PIN not set. Please set a PIN before enabling it.',
                  ToastAndroid.LONG
                );
                return;
              }
              setSettings({ ...settings, pinEnabled: val });
            }}
          />
        </View>

        {settings.pinEnabled && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              navigation.navigate('SetPin');
              Toast.show({
                type: 'info',
                text1: 'PIN Info',
                text2: 'Use the screen to set or change your PIN',
              });
            }}
          >
            <Text style={styles.buttonText}>Set / Change PIN</Text>
          </TouchableOpacity>
        )}


        <View style={styles.switchRow}>
          <Text style={styles.label}>Use Biometric for login</Text>
          <Switch
            value={settings.biometricEnabled || false}
            onValueChange={(val) => setSettings({ ...settings, biometricEnabled: val })}
          />
        </View>
        
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>💾 Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f2f9ff',
  },
  screen: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#2c3e50',
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
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  saveBtn: {
    backgroundColor: '#1a3c70',
    padding: 14,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
  marginTop: 24,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderColor: '#ccc',
},
sectionTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 10,
},
button: {
  backgroundColor: '#0984e3',
  padding: 10,
  borderRadius: 8,
  marginTop: 10,
  alignItems: 'center',
},
buttonText: {
  color: 'white',
  fontWeight: 'bold',
},
});

export default SetupWizardScreen;