import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReminderCardProps {
  title: string;
  dueDate: string; // should be a human-readable string (e.g., "2025-07-23" or "Today")
  color?: string;  // optional background color
}

const ReminderCard: React.FC<ReminderCardProps> = ({ title, dueDate, color = '#ffeaa7' }) => {
  return (
    <View style={[styles.card, { backgroundColor: color }]}>
      <Ionicons name="alarm-outline" size={24} color="#2d3436" style={styles.icon} />
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.date}>Due: {dueDate}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  date: {
    fontSize: 14,
    color: '#636e72',
  },
});

export default ReminderCard;