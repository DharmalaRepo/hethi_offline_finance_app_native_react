import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { useAppData } from '../context/AppDataProvider';

export interface SubcategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  category: Category | null;
  subcategories: SubCategory[];
  onEdit: (sub: SubCategory) => void;
  onDelete: (subId: string) => void;
  onSaveEdit: (name: string) => void;
  editingSub: SubCategory | null;
}

const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  visible,
  onClose,
  onSave,
  category,
  subcategories,
  onEdit,
  onDelete,
  onSaveEdit,
  editingSub,
}) => {
  const [name, setName] = useState('');
    const {
        persons,
        categories,
        accounts,
        transactions,
        recurringPayments,
        monthlyOpeningBalance,
        monthlyClosingBalance,
        reloadAppData,
      } = useAppData();

  useEffect(() => {
    setName(editingSub?.name || '');
  }, [editingSub, visible]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (editingSub) {
      onSaveEdit(trimmed);
    } else {
      onSave(trimmed);
    }
    setName('');
    reloadAppData();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {editingSub ? 'Edit Subcategory' : 'Add Subcategory'}
          </Text>
          <Text style={styles.subtitle}>
            Category: {category?.name || 'N/A'}
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Subcategory name"
            style={styles.input}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancel]}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.button, styles.save]}>
              <Text style={styles.buttonText}>{editingSub ? 'Update' : 'Save'}</Text>
            </TouchableOpacity>
          </View>

          {subcategories.length > 0 && (
            <>
              <Text style={styles.subtitle}>Existing Subcategories:</Text>
              {subcategories.map((sub) => (
                <View key={sub.id} style={styles.subRow}>
                  <Text style={styles.subText}>• {sub.name}</Text>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => onEdit(sub)}>
                      <Text style={styles.editText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(sub.id)}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007bff',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  cancel: {
    backgroundColor: '#ccc',
  },
  save: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subText: {
    flex: 1,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editText: {
    color: 'blue',
    marginRight: 8,
  },
  deleteText: {
    color: 'red',
  },
});

export default SubcategoryModal;