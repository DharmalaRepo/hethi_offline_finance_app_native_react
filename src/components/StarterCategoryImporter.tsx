import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Checkbox } from 'react-native-paper';
import uuid from 'react-native-uuid';
import { Ionicons } from '@expo/vector-icons';

import { useAppData } from '../context/AppDataProvider';
import type { Category } from '../models/Category';
import type { SubCategory } from '../models/SubCategory';
import { showToast } from '../utils/transactionUtils';
import { saveCategories } from '../services/mockDataService';

// Can return Category[] or {name, subcategories: string[]}[]
import { loadPredefinedCategories } from '../screens/DataManagementScreen';

type Props = {
    visible: boolean;
    onClose: () => void;
};

type PredefCat = { name: string; subcategories: string[] };

export type Selection = Record<
    string, // category name
    {
        catChecked: boolean;
        subs: Record<string, boolean>; // subName -> checked
    }
>;

const ciEq = (a = '', b = '') => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Normalize whatever loadPredefinedCategories returns into PredefCat[] */
function toPredefsFromAny(input: unknown): PredefCat[] {
    const arr = Array.isArray(input) ? input : [];
    if (arr.length === 0) return [];

    // If already in {name, subcategories: string[]} shape
    if (
        typeof arr[0]?.name === 'string' &&
        Array.isArray(arr[0]?.subcategories) &&
        (arr[0]?.subcategories as any[]).every((s) => typeof s === 'string')
    ) {
        return arr as PredefCat[];
    }

    // Else treat as Category[]
    return (arr as Category[]).map((c) => ({
        name: c.name,
        subcategories: (c.subcategories ?? []).map((s: SubCategory) => s.name),
    }));
}

const StarterCategoryImporter: React.FC<Props> = ({ visible, onClose }) => {
    const { categories, reloadAppData } = useAppData();

    const [predefs, setPredefs] = useState<PredefCat[]>([]);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [sel, setSel] = useState<Selection>({});

    useEffect(() => {
        if (!visible) return;
        (async () => {
            try {
                const raw = await loadPredefinedCategories();     // Category[] or PredefCat[]
                const list = toPredefsFromAny(raw);               // PredefCat[]
                setPredefs(list);

                // init selection map
                const initSel: Selection = {};
                list.forEach((c) => {
                    initSel[c.name] = {
                        catChecked: false,
                        subs: Object.fromEntries((c.subcategories || []).map((s) => [s, false])),
                    };
                });
                setSel(initSel);

                // expand all by default
                setExpanded(Object.fromEntries(list.map((c) => [c.name, false])));
            } catch (e) {
                console.error('loadPredefinedCategories error', e);
                showToast('error', 'Failed to load starter categories');
            }
        })();
    }, [visible]);

    // Filtered list by search
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return predefs;
        return predefs
            .map((cat) => {
                if (cat.name.toLowerCase().includes(q)) return cat;
                const subMatch = (cat.subcategories || []).filter((s) => s.toLowerCase().includes(q));
                if (subMatch.length) return { ...cat, subcategories: subMatch };
                return null;
            })
            .filter(Boolean) as PredefCat[];
    }, [predefs, search]);

    const toggleCat = (catName: string) => {
        setSel((prev) => {
            const current = prev[catName];
            if (!current) return prev;
            const newVal = !current.catChecked;
            return {
                ...prev,
                [catName]: {
                    catChecked: newVal,
                    subs: Object.fromEntries(Object.keys(current.subs).map((sn) => [sn, newVal])),
                },
            };
        });
    };

    const toggleSub = (catName: string, subName: string) => {
        setSel((prev) => {
            const current = prev[catName];
            if (!current) return prev;
            const subs = { ...current.subs, [subName]: !current.subs[subName] };
            const allSelected = Object.values(subs).length ? Object.values(subs).every(Boolean) : false;
            return { ...prev, [catName]: { catChecked: allSelected, subs } };
        });
    };

    const doImport = async () => {
        try {
            const existing: Category[] = [...categories];
            let changed = false;

            const findCat = (name: string) => existing.find((c) => ciEq(c.name, name));
            const ensureCategory = (name: string): Category => {
                const found = findCat(name);
                if (found) return found;
                const created: Category = { id: uuid.v4().toString(), name, subcategories: [] };
                existing.push(created);
                changed = true;
                return created;
            };

            for (const cat of predefs) {
                const picked = sel[cat.name];
                if (!picked) continue;

                const someSubChecked = Object.values(picked.subs).some(Boolean);
                if (picked.catChecked || someSubChecked) {
                    const targetCat = ensureCategory(cat.name);

                    const selectedSubs = picked.catChecked
                        ? cat.subcategories
                        : Object.entries(picked.subs)
                            .filter(([, v]) => v)
                            .map(([k]) => k);

                    const targetCatSubs = targetCat.subcategories || [];
                    for (const subName of selectedSubs) {
                        if (!targetCatSubs.some((s) => ciEq(s.name, subName))) {
                            const newSub: SubCategory = {
                                id: uuid.v4().toString(),
                                name: subName,
                                categoryId: targetCat.id,
                            };
                            targetCatSubs.push(newSub);
                            changed = true;
                        }
                    }
                    targetCat.subcategories = targetCatSubs;
                }
            }

            if (changed) {
                await saveCategories(existing);
                await reloadAppData();
                showToast('success', 'Starter categories imported');
            } else {
                showToast('warning', 'Nothing selected to import');
            }

            onClose();
        } catch (e) {
            console.error('Import error', e);
            showToast('error', 'Failed to import categories');
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Import Starter Categories</Text>
                        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                            <Ionicons name="close" size={20} color="#1a3c70" />
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View style={styles.searchRow}>
                        <Ionicons name="search" size={16} color="#1a3c70" />
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search categories or subcategories"
                            style={styles.searchInput}
                        />
                    </View>

                    {/* List */}
                    <ScrollView style={{ maxHeight: 420 }}>
                        {filtered.map((cat) => {
                            const selected = sel[cat.name] ?? { catChecked: false, subs: {} };
                            const isExpanded = expanded[cat.name];
                            const exists = categories.some((c) => ciEq(c.name, cat.name));

                            return (
                                <View key={cat.name} style={styles.catBlock}>
                                    <View style={styles.catRow}>
                                        <Checkbox
                                            status={selected.catChecked ? 'checked' : 'unchecked'}
                                            onPress={() => toggleCat(cat.name)}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setExpanded((e) => ({ ...e, [cat.name]: !isExpanded }))}
                                            style={{ flex: 1 }}
                                        >
                                            <Text style={styles.catName}>
                                                {cat.name}
                                                {exists ? '  • already exists' : ''}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => setExpanded((e) => ({ ...e, [cat.name]: !isExpanded }))}
                                            style={styles.expandBtn}
                                        >
                                            <Ionicons
                                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#1a3c70"
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    {isExpanded && (
                                        <View style={styles.subList}>
                                            {(cat.subcategories || []).map((sub) => {
                                                const checked = selected.subs?.[sub] || false;
                                                return (
                                                    <View key={sub} style={styles.subRow}>
                                                        <Checkbox
                                                            status={checked ? 'checked' : 'unchecked'}
                                                            onPress={() => toggleSub(cat.name, sub)}
                                                        />
                                                        <Text style={styles.subName}>{sub}</Text>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {filtered.length === 0 && (
                            <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 12 }}>
                                No matches
                            </Text>
                        )}
                    </ScrollView>

                    {/* Footer actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose} style={[styles.btn, { backgroundColor: '#e5e7eb' }]}>
                            <Text style={[styles.btnText, { color: '#111827' }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={doImport} style={[styles.btn, { backgroundColor: '#0a66e4' }]}>
                            <Text style={styles.btnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default StarterCategoryImporter;

const styles = {
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    } as const,
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 14,
    } as const,
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    } as const,
    title: { fontSize: 16, fontWeight: '800', color: '#1a3c70' } as const,
    iconBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#eef2ff',
    } as const,
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
        marginBottom: 10,
    } as const,
    searchInput: { flex: 1, marginLeft: 8 } as const,
    catBlock: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 10,
        marginBottom: 8,
    } as const,
    catRow: { flexDirection: 'row', alignItems: 'center' } as const,
    catName: { fontSize: 14, fontWeight: '700', color: '#111827' } as const,
    expandBtn: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#eef2ff',
    } as const,
    subList: { marginTop: 6, paddingLeft: 8 } as const,
    subRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 } as const,
    subName: { fontSize: 13, color: '#111827' } as const,
    footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 } as const,
    btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 } as const,
    btnText: { color: '#fff', fontWeight: '800' } as const,
};