// src/screens/SetupWizardScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getAppSettings, saveAppSettings } from '../services/settingsService';
import { AppSettings } from '../models/AppSettings';
import { getAccounts } from '../services/mockDataService';
import { getAllPersons } from '../services/mockDataService';
import { getAllCategories, getSubCategoriesByCategoryId } from '../services/mockDataService';
import { showToast } from '../utils/toastUtils';
import { Account } from '../models/Account';
import { Person } from '../models/Person';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { useContext } from 'react';
import { useThemeContext } from '../components/ThemeContext';

const SetupWizardScreen = () => {
  const [settings, setSettings] = useState<AppSettings>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const { toggleTheme } = useThemeContext();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const settingsData = await getAppSettings();
    setSettings(settingsData);

    const accs = await getAccounts();
    const pers = await getAllPersons();
    const cats = await getAllCategories();

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
      <Text style={styles.title}>🧭 Setup Wizard</Text>

      <Text style={styles.label}>Default Account</Text>
      <Picker
        selectedValue={settings.defaultAccountId}
        onValueChange={(val) => setSettings({ ...settings, defaultAccountId: val })}
        style={styles.picker}
      >
        <Picker.Item label="Select Account" value="" />
        {accounts.map((a) => (
          <Picker.Item key={a.id} label={a.accountTypeOrName} value={a.id} />
        ))}
      </Picker>

      <Text style={styles.label}>Default Person</Text>
      <Picker
        selectedValue={settings.defaultPersonId}
        onValueChange={(val) => setSettings({ ...settings, defaultPersonId: val })}
        style={styles.picker}
      >
        <Picker.Item label="Select Person" value="" />
        {persons.map((p) => (
          <Picker.Item key={p.id} label={p.name} value={p.id} />
        ))}
      </Picker>

      <Text style={styles.label}>Default Category</Text>
      <Picker
        selectedValue={settings.defaultCategoryId}
        onValueChange={async (val) => {
          setSettings({ ...settings, defaultCategoryId: val, defaultSubCategoryId: '' });
          const subs = await getSubCategoriesByCategoryId({ categoryId: val });
          setSubcategories(subs);
        }}
        style={styles.picker}
      >
        <Picker.Item label="Select Category" value="" />
        {categories.map((c) => (
          <Picker.Item key={c.id} label={c.name} value={c.id} />
        ))}
      </Picker>

      <Text style={styles.label}>Default Subcategory</Text>
      <Picker
        selectedValue={settings.defaultSubCategoryId}
        onValueChange={(val) => setSettings({ ...settings, defaultSubCategoryId: val })}
        style={styles.picker}
      >
        <Picker.Item label="Select Subcategory" value="" />
        {subcategories.map((sc) => (
          <Picker.Item key={sc.id} label={sc.name} value={sc.id} />
        ))}
      </Picker>

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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1a3c70',
  },
  label: {
    fontWeight: '600',
    marginTop: 14,
    color: '#333',
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
});

export default SetupWizardScreen;