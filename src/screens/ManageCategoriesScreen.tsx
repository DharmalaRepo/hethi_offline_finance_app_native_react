import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import CategoryModal from '../components/CategoryModal';
import SubcategoryModal from '../components/SubcategoryModal';
import { reloadConfig } from '../../utils/configLoader'; // or wherever it's defined

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
}

const ManageCategoriesScreen = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    applySearchFilterSort();
  }, [searchText, categories, sortAsc]);

  const reloadConfig = async () => {
      setCategories(await getAllCategories());
      setPersons(await getAllPersons());
      setAccounts(await getAccounts());
    };

  const loadCategories = async () => {
    const data = await AsyncStorage.getItem('categories');
    if (data) {
      const parsed = JSON.parse(data);
      setCategories(parsed);
    }
  };

  const saveCategories = async (updated: Category[]) => {
    setCategories(updated);
    await AsyncStorage.setItem('categories', JSON.stringify(updated));
  };

  const handleAddCategory = (name: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
      subcategories: [],
    };
    const updated = [...categories, newCategory];
    saveCategories(updated);
  };

  const handleEditCategory = (name: string) => {
    if (!editingCategory) return;
    const updated = categories.map((cat) =>
      cat.id === editingCategory.id ? { ...cat, name } : cat
    );
    saveCategories(updated);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => {
          const updated = categories.filter((c) => c.id !== id);
          saveCategories(updated);
        },
        style: 'destructive',
      },
    ]);
  };

  const handleAddSubcategory = (name: string) => {
    if (!selectedCategory) return;
    const updated = categories.map((cat) =>
      cat.id === selectedCategory.id
        ? {
            ...cat,
            subcategories: [...cat.subcategories, { id: Date.now().toString(), name }],
          }
        : cat
    );
    saveCategories(updated);
  };

  const handleEditSubcategory = (name: string) => {
    if (!selectedCategory || !editingSubcategory) return;
    const updated = categories.map((cat) => {
      if (cat.id !== selectedCategory.id) return cat;
      return {
        ...cat,
        subcategories: cat.subcategories.map((sub) =>
          sub.id === editingSubcategory.id ? { ...sub, name } : sub
        ),
      };
    });
    saveCategories(updated);
    setEditingSubcategory(null);
  };

  const handleDeleteSubcategory = (subcategoryId: string) => {
    if (!selectedCategory) return;
    const updated = categories.map((cat) => {
      if (cat.id !== selectedCategory.id) return cat;
      return {
        ...cat,
        subcategories: cat.subcategories.filter((sub) => sub.id !== subcategoryId),
      };
    });
    saveCategories(updated);
  };

  const applySearchFilterSort = () => {
    const sorted = [...categories].sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

    if (!searchText.trim()) {
      setFilteredCategories(sorted);
      return;
    }

    const query = searchText.toLowerCase();
    const result = sorted.filter((cat) => {
      const categoryMatch = cat.name.toLowerCase().includes(query);
      const subcategoryMatch = cat.subcategories.some((sub) =>
        sub.name.toLowerCase().includes(query)
      );
      return categoryMatch || subcategoryMatch;
    });

    setFilteredCategories(result);
  };

  return (
    <View style={styles.container}>

    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333' }}>Manage Categories</Text>
      <TouchableOpacity
              onPress={reloadConfig}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#007bff',
                borderRadius: 6,
                paddingVertical: 4,
                paddingHorizontal: 8,
                backgroundColor: '#e6f0ff',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#007bff',
                  marginRight: 6,
                }}
              >
                ⟳
              </Text>
              <Text style={{ fontSize: 14, color: '#007bff' }}>Reload</Text>
            </TouchableOpacity>
    </View>

      <TextInput
        placeholder="Search categories or subcategories..."
        style={styles.searchBox}
        value={searchText}
        onChangeText={setSearchText}
      />

      <TouchableOpacity style={styles.sortButton} onPress={() => setSortAsc(!sortAsc)}>
        <Text style={styles.sortText}>
          Sort: {sortAsc ? 'Ascending 🔼' : 'Descending 🔽'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowCategoryModal(true)}
      >
        <Text style={styles.addButtonText}>+ Add Category</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.categoryBox}>
            <View style={styles.rowSpaceBetween}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <View style={styles.rowButtons}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingCategory(item);
                    setShowCategoryModal(true);
                  }}
                >
                  <Ionicons name="create-outline" size={22} color="blue" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(item.id)}
                  style={{ marginLeft: 10 }}
                >
                  <Ionicons name="trash-outline" size={22} color="red" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowSubModal(true);
                  }}
                  style={{ marginLeft: 10 }}
                >
                  <Ionicons name="list-outline" size={22} color="green" />
                </TouchableOpacity>
              </View>
            </View>
            {item.subcategories.length > 0 && (
              <View style={styles.subcategoryList}>
                {item.subcategories.map((sub) => (
                  <Text key={sub.id} style={styles.subText}>
                    • {sub.name}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      />

      <CategoryModal
        visible={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={(name) =>
          editingCategory ? handleEditCategory(name) : handleAddCategory(name)
        }
        isEdit={!!editingCategory}
        defaultName={editingCategory?.name || ''}
      />

      <SubcategoryModal
        visible={showSubModal}
        onClose={() => {
          setShowSubModal(false);
          setSelectedCategory(null);
          setEditingSubcategory(null);
        }}
        onSave={(name) => handleAddSubcategory(name)}
        category={selectedCategory}
        subcategories={selectedCategory?.subcategories || []}
        onEdit={(sub) => {
          setEditingSubcategory(sub);
        }}
        onDelete={(subId) => handleDeleteSubcategory(subId)}
        onSaveEdit={(name) => handleEditSubcategory(name)}
        editingSub={editingSubcategory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f7ff',
    padding: 16,
  },
  searchBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderColor: '#007bff',
    borderWidth: 1,
  },
  sortButton: {
    marginBottom: 12,
  },
  sortText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categoryBox: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#d0e2ff',
    borderWidth: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subcategoryList: {
    marginTop: 6,
    paddingLeft: 10,
  },
  subText: {
    fontSize: 14,
    color: '#333',
  },
});

export default ManageCategoriesScreen;