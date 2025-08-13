import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { YearlySummaryResult } from './reportExportUtils';

export const convertSummaryToCSV = (summary: YearlySummaryResult): string => {
  const { months, rows } = summary;

  const header = ['Category', ...months, 'Total', 'Average', 'Contribution (%)'];
  const lines = [header.join(',')];

  rows.forEach(row => {
    const line = [
      row.category,
      ...months.map(month => row.monthly[month] ?? 0),
      row.total,
      row.average.toFixed(2),
      row.percentContribution.toFixed(2)
    ];
    lines.push(line.join(','));
  });

  return lines.join('\n');
};

export const generateCSV = async (filename: string, csvData: string) => {
  const fileUri = FileSystem.documentDirectory + `${filename}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csvData, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await shareAsync(fileUri);
};

export const generatePDF = async (html: string, filename: string) => {
  const { uri } = await Print.printToFileAsync({ html });
  const pdfPath = `${FileSystem.documentDirectory}${filename}.pdf`;

  await FileSystem.copyAsync({
    from: uri,
    to: pdfPath,
  });
  
  return pdfPath;
};