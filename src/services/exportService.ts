import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as SharingWeb from 'expo-sharing';
import { Transaction } from '../models/Transaction';
import { Category } from '../models/Category';
import { Person } from '../models/Person';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

// ✅ Export to CSV
export const exportToCSV = async (
  data: Transaction[],
  categories: Category[],
  persons: Person[],
  fileName = 'transactions_export.csv'
) => {
  try {
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const personMap = Object.fromEntries(persons.map(p => [p.id, p.name]));

    const header = 'Date,Type,Amount,Category,SubCategory,Person,Note\n';
    const rows = data.map(tx => {
      const category = categoryMap[tx.categoryId] || '';
      const subcategory = tx.subCategoryId ? tx.subCategoryId : '';
      const person = personMap[tx.personId] || '';
      return `${formatDate(tx.date)},${tx.type},${tx.amount},"${category}","${subcategory}","${person}","${tx.note || ''}"`;
    });

    const csv = header + rows.join('\n');

    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });

    await Sharing.shareAsync(fileUri);
  } catch (err) {
    console.error('CSV Export Error:', err);
    throw err;
  }
};

// ✅ Export to PDF
export const exportToPDF = async (
  data: Transaction[],
  categories: Category[],
  persons: Person[],
  fileName = 'transactions_export.pdf'
) => {
  try {
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const personMap = Object.fromEntries(persons.map(p => [p.id, p.name]));

    const rows = data.map(tx => {
      const category = categoryMap[tx.categoryId] || '';
      const person = personMap[tx.personId] || '';
      return `
        <tr>
          <td>${formatDate(tx.date)}</td>
          <td>${tx.type}</td>
          <td>${tx.amount}</td>
          <td>${category}</td>
          <td>${tx.subCategoryId || ''}</td>
          <td>${person}</td>
          <td>${tx.note || ''}</td>
        </tr>
      `;
    });

    const html = `
      <html>
        <body>
          <h1>Transactions Report</h1>
          <table border="1" style="width:100%; border-collapse: collapse;">
            <tr>
              <th>Date</th><th>Type</th><th>Amount</th><th>Category</th><th>SubCategory</th><th>Person</th><th>Note</th>
            </tr>
            ${rows.join('')}
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    await Sharing.shareAsync(uri);
  } catch (err) {
    console.error('PDF Export Error:', err);
    throw err;
  }
};