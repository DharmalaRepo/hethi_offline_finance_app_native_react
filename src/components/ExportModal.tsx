import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { Transaction } from '../models/Transaction';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import * as Print from 'expo-print';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categoryMap: Record<string, string>;
  subCategoryMap: Record<string, string>;
  personsMap: Record<string, string>;
  accountsMap: Record<string, string>;
}

const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  transactions,
  categoryMap,
  subCategoryMap,
  personsMap,
  accountsMap,
}) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'date',
    'category',
    'subCategory',
    'person',
    'account',
    'amount',
  ]);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
    );
  };

  const filteredTxns = transactions.filter((tx) =>
    selectedType === 'all' ? true : tx.type === selectedType
  );

  const getReadableValue = (tx: Transaction, col: string) => {
    switch (col) {
      case 'category':
        return categoryMap[tx.categoryId] || tx.categoryId;
      case 'subCategory':
        return tx.subCategoryId ? subCategoryMap[tx.subCategoryId] || tx.subCategoryId : '';
      case 'person':
        return personsMap[tx.personId] || tx.personId;
      case 'account':
        return accountsMap[tx.accountId] || tx.accountId;
      case 'amount':
        return tx.amount.toString();
      default:
        return (tx as any)[col] ?? '';
    }
  };

  const generateCSV = () => {
    const headers = selectedColumns.join(',');
    const rows = filteredTxns.map((tx) =>
      selectedColumns.map((col) => `"${getReadableValue(tx, col)}"`).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  const generateExcel = () => {
    const data = filteredTxns.map((tx) => {
      const row: any = {};
      selectedColumns.forEach((col) => {
        row[col] = getReadableValue(tx, col);
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    return wbout;
  };

  const generatePDFHtml = () => {
    const headers = selectedColumns.map((col) => `<th>${col.toUpperCase()}</th>`).join('');
    const rows = filteredTxns.map((tx) => {
      const cols = selectedColumns
        .map((col) => `<td>${getReadableValue(tx, col)}</td>`)
        .join('');
      return `<tr>${cols}</tr>`;
    });
    return `
      <html>
        <body>
          <h2 style="text-align:center;">Transaction Report</h2>
          <table border="1" cellspacing="0" cellpadding="6" style="width: 100%; font-size: 12px;">
            <thead><tr>${headers}</tr></thead>
            <tbody>${rows.join('')}</tbody>
          </table>
        </body>
      </html>
    `;
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      Alert.alert('Please select at least one column.');
      return;
    }

    try {
      let fileUri = '';
      if (selectedFormat === 'csv') {
        const csv = generateCSV();
        fileUri = FileSystem.documentDirectory + 'transactions.csv';
        await FileSystem.writeAsStringAsync(fileUri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } else if (selectedFormat === 'excel') {
        const excel = generateExcel();
        fileUri = FileSystem.documentDirectory + 'transactions.xlsx';
        await FileSystem.writeAsStringAsync(fileUri, excel, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else if (selectedFormat === 'pdf') {
        const html = generatePDFHtml();
        const { uri } = await Print.printToFileAsync({ html });
        fileUri = uri;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Sharing not available on this device');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Export Failed', 'An error occurred while exporting the file.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.header}>Export Transactions</Text>

          <Text style={styles.section}>Select Columns</Text>
          <ScrollView>
            {['date', 'category', 'subCategory', 'person', 'account', 'amount', 'note'].map((col) => (
              <View key={col} style={styles.row}>
                <Text>{col}</Text>
                <Switch
                  value={selectedColumns.includes(col)}
                  onValueChange={() => toggleColumn(col)}
                />
              </View>
            ))}
          </ScrollView>

          <Text style={styles.section}>Transaction Type</Text>
          <View style={styles.buttonRow}>
            {['all', 'income', 'expense'].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type as any)}
                style={[
                  styles.selectButton,
                  selectedType === type && styles.selected,
                ]}
              >
                <Text style={styles.selectText}>{type.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.section}>Select Format</Text>
          <View style={styles.buttonRow}>
            {['csv', 'excel', 'pdf'].map((fmt) => (
              <TouchableOpacity
                key={fmt}
                style={[
                  styles.selectButton,
                  selectedFormat === fmt && styles.selected,
                ]}
                onPress={() => setSelectedFormat(fmt as any)}
              >
                <Text style={styles.selectText}>{fmt.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
              <Text style={styles.buttonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 16 },
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: '90%' },
  header: { fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginBottom: 10 },
  section: { fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
  selectButton: { padding: 8, borderRadius: 6, backgroundColor: '#ccc' },
  selected: { backgroundColor: '#007bff' },
  selectText: { color: 'white', fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelBtn: { backgroundColor: '#6c757d', flex: 1, marginRight: 5, padding: 12, borderRadius: 6 },
  exportBtn: { backgroundColor: '#007bff', flex: 1, marginLeft: 5, padding: 12, borderRadius: 6 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});

export default ExportModal;