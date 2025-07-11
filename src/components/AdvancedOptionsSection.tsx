import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PersonPicker from './PersonPicker'; // You must have this as a reusable component

interface Props {
  isReversible: boolean;
  onToggleReversible: (val: boolean) => void;
  fromOrToPersonId?: string;
  onPersonChange: (id: string) => void;
  dueDate?: string;
  onDueDateChange: (date: string) => void;
  isSettled: boolean;
  onToggleSettled: (val: boolean) => void;
  isAutoReverseEntry: boolean;
  onToggleAutoReverse: (val: boolean) => void;
  onEditReverse?: () => void;
}

const AdvancedOptionsSection = ({
  isReversible,
  onToggleReversible,
  fromOrToPersonId,
  onPersonChange,
  dueDate,
  onDueDateChange,
  isSettled,
  onToggleSettled,
  isAutoReverseEntry,
  onToggleAutoReverse,
  onEditReverse,
}: Props) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (_: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      onDueDateChange(selected.toISOString().split('T')[0]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Advanced Options</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Reversible Entry</Text>
        <Switch value={isReversible} onValueChange={onToggleReversible} />
      </View>

      {isReversible && (
        <>
          <PersonPicker
            label="From / To Person"
            selectedId={fromOrToPersonId}
            onSelect={onPersonChange}
          />

          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>
              Due Date: {dueDate || 'Select Date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dueDate ? new Date(dueDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Mark as Completed</Text>
            <Switch value={isSettled} onValueChange={onToggleSettled} />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Auto Reverse Entry</Text>
            <Switch value={isAutoReverseEntry} onValueChange={onToggleAutoReverse} />
          </View>

          {isAutoReverseEntry && (
            <TouchableOpacity onPress={onEditReverse} style={styles.editBtn}>
              <Text style={styles.editText}>✏️ Edit Reverse Entry</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 10,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  label: {
    fontSize: 15,
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    paddingVertical: 8,
    color: '#007bff',
  },
  editBtn: {
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#e1ecff',
    borderRadius: 6,
    marginTop: 10,
  },
  editText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
});

export default AdvancedOptionsSection;