import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  setDateRange: React.Dispatch<
    React.SetStateAction<{ startDate: Date | null; endDate: Date | null }>
  >;
  onApply: () => void;
}

const DateRangeFilter: React.FC<Props> = ({ dateRange, setDateRange, onApply }) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleDateChange = (
    type: 'start' | 'end',
    event: any,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      if (type === 'start') setShowStartPicker(false);
      else setShowEndPicker(false);
    }

    if (selectedDate) {
      setDateRange((prev) => ({
        ...prev,
        [type === 'start' ? 'startDate' : 'endDate']: selectedDate,
      }));
    }
  };

  const handleCancel = () => {
    setDateRange({ startDate: null, endDate: null });
    onApply(); // Optionally reapply to reset the list
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Start Date:</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowStartPicker(true)}
      >
        <Text style={styles.dateText}>
          {dateRange.startDate
            ? dateRange.startDate.toDateString()
            : 'Select Start Date'}
        </Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={dateRange.startDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, d) => handleDateChange('start', e, d)}
        />
      )}

      <Text style={styles.label}>End Date:</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowEndPicker(true)}
      >
        <Text style={styles.dateText}>
          {dateRange.endDate
            ? dateRange.endDate.toDateString()
            : 'Select End Date'}
        </Text>
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={dateRange.endDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, d) => handleDateChange('end', e, d)}
        />
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
          <Text style={styles.btnText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f4f4f4',
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  dateButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateText: {
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  applyBtn: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  cancelBtn: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default DateRangeFilter;