import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../models/Category';
import { SubCategory } from '../models/SubCategory';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { saveCategories, addCategory } from '../services/mockDataService';
import SubcategoryModal from '../components/SubcategoryModal';
import CategoryModal from '../components/CategoryModal';
import { useAppData } from '../context/AppDataProvider';


const ManageCategoriesScreen = () => {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<SubCategory | null>(null);

  const {
    persons,
    categories,
    transactions,
    reloadAppData,
  } = useAppData();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      reloadCategories();
    }
  }, [isFocused]);

  useEffect(() => {
    applySearchFilterSort();
  }, [searchText, categories, sortAsc]);

  const reloadCategories = async () => {
    await reloadAppData();
  };

  const handleAddCategory = async (name: string) => {
    try {
      await reloadAppData();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleEditCategory = (name: string) => {
    //console.log('Inside handleEditCategory');
    if (!editingCategory) return;
    const updated = categories.map((cat) =>
      cat.id === editingCategory.id ? { ...cat, name } : cat
    );
    saveCategories(updated);
    setEditingCategory(null);
    reloadAppData();
  };

  const handleDeleteCategory = (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: () => {
          const updated = categories.filter((c) => c.id !== id);
          saveCategories(updated);
          reloadAppData();
        },
        style: 'destructive',
      },
    ]);
  };

  const handleAddSubcategory = async (name: string) => {
    if (!selectedCategory) return;
    const updated = categories.map((cat) =>
      cat.id === selectedCategory.id
        ? {
          ...cat,
          subcategories: [...(cat.subcategories ?? []), { id: Date.now().toString(), name, categoryId: selectedCategory.id, }]
        }
        : cat
    );
    await saveCategories(updated);
    await reloadAppData();
  };

  const handleEditSubcategory = (name: string) => {
    if (!selectedCategory || !editingSubcategory) return;
    const updated = categories.map((cat) => {
      if (cat.id !== selectedCategory.id) return cat;
      return {
        ...cat,
        subcategories: (cat.subcategories ?? []).map((sub: SubCategory) =>
          sub.id === editingSubcategory.id ? { ...sub, name } : sub
        ),
      };
    });
    saveCategories(updated);
    setEditingSubcategory(null);
    reloadAppData();
  };

  const handleDeleteSubcategory = (subcategoryId: string) => {
    if (!selectedCategory) return;
    const updated = categories.map((cat) => {
      if (cat.id !== selectedCategory.id) return cat;
      return {
        ...cat,
        subcategories: (cat.subcategories ?? []).filter((sub: SubCategory) => sub.id !== subcategoryId),
      };
    });
    saveCategories(updated);
    reloadAppData();
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
      const subcategoryMatch = cat.subcategories?.some((sub: SubCategory) =>
        sub.name.toLowerCase().includes(query)
      );
      return categoryMatch || subcategoryMatch;
    });

    setFilteredCategories(result);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.title}> Menu Categories</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={reloadCategories} style={styles.iconButton}>
            <Ionicons name="refresh" size={22} color="#e6f0ff" />
          </TouchableOpacity>
        </View>
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
            {(item.subcategories?.length ?? 0) > 0 && (
              <View style={styles.subcategoryList}>
                {item.subcategories?.map((sub) => (
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
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#2c3e50',
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
  iconButton: {
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
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