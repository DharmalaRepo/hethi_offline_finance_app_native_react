import React, { useEffect, useState } from 'react';
import {
    Modal,
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Transaction } from '../models/Transaction';
import { generateYearlyCategorySummary } from '../utils/reportExportUtils';
import { formatCurrency } from '../utils/formatUtils';
import { format } from 'date-fns';
import { Category } from '../models/Category';
import { getAllCategories_ } from '../services/mockDataService';
import * as Print from 'expo-print';

interface Props {
    visible: boolean;
    onClose: () => void;
    transactions: Transaction[];
}

const YearlySummaryExportModal: React.FC<Props> = ({ visible, onClose, transactions }) => {
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [months, setMonths] = useState<string[]>([]);
    const fromMonthYear = format(new Date(), 'yyyy-MM');
    const [categories, setCategories] = useState<Category[]>([]);
    const [incomeRows, setIncomeRows] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'expense' | 'income' | 'net'>('net');

    useEffect(() => {
        const loadData = async () => {
            const cats = await getAllCategories_();
            setCategories(cats);

            // Split by type
            const expenseTxns = transactions.filter((t) => t.type === 'expense');
            const incomeTxns = transactions.filter((t) => t.type === 'income');

            const expenseSummary = generateYearlyCategorySummary(expenseTxns, cats, fromMonthYear);
            const incomeSummary = generateYearlyCategorySummary(incomeTxns, cats, fromMonthYear);

            setSummaryData(expenseSummary.rows);
            setMonths(expenseSummary.months);
            setIncomeRows(incomeSummary.rows); // new
        };

        loadData();
    }, [transactions]);

    const handleExportCSV = async () => {
        try {
            // Build CSV Header
            const header = ['Category', ...months, 'Total', 'Average', '% Contribution'];

            // Build CSV Rows
            const rows = summaryData.map((item: any) => {
                const monthValues = months.map((m) => item.monthly[m]?.toFixed(2) || '0.00');
                return [
                    item.category,
                    ...monthValues,
                    item.total.toFixed(2),
                    item.average.toFixed(2),
                    item.percentContribution.toFixed(2),
                ];
            });

            const csvArray = [header, ...rows];
            const csvString = csvArray.map((r) => r.join(',')).join('\n');


            const filename = `Export Yearly Summary_${Date.now()}.csv`;
            const path = `${FileSystem.documentDirectory}${filename}`;

            try {
                await FileSystem.writeAsStringAsync(path, csvString, {
                    encoding: FileSystem.EncodingType.UTF8,
                });

                if (!(await Sharing.isAvailableAsync())) {
                    alert('Sharing is not available on this device');
                    return;
                }

                await Sharing.shareAsync(path);
            } catch (error) {
                console.error('Export error:', error);
                alert('Failed to export CSV');
            }


        } catch (err: any) {
            console.error('Export CSV Error:', err);
            Alert.alert('Export Failed', err?.message || 'Unable to export CSV');
        }
    };



    const handleExportPDF = async () => {
        try {
            let fileUri = '';
            //console.log('inside handleExportPDF');
            const html = buildSummaryHtml(summaryData, incomeRows, months);

            const { uri } = await Print.printToFileAsync({ html });
            fileUri = uri;
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Sharing not available on this device');
            }


        } catch (err: any) {
            console.error('Export PDF Error:', err);
            Alert.alert('Export Failed', err.message || 'Unable to export PDF');
        }
    };


    const buildSummaryHtml = (summaryData: any[], incomeRows: any[], months: string[]): string => {
        const headerRow = ['Category', ...months, 'Total', 'Average', '% Contribution']
            .map((h) => `<th>${h}</th>`)
            .join('');

        const format = (val: number) => Number(val).toFixed(2);

        const rows = [];

        // 🧾 Expense Rows
        summaryData.forEach((item) => {
            const monthCells = months.map((m) => `<td>${format(item.monthly[m] || 0)}</td>`).join('');
            rows.push(`
                <tr>
                    <td>${item.category}</td>
                    ${monthCells}
                    <td>${format(item.total)}</td>
                    <td>${format(item.average)}</td>
                    <td>${format(item.percentContribution)}%</td>
                </tr>`);
        });

        // ➕ Total Expense Row
        const totalExpenseByMonth = months.map((m) =>
            summaryData.reduce((acc, row) => acc + (row.monthly[m] || 0), 0)
        );
        const totalExpense = summaryData.reduce((acc, r) => acc + r.total, 0);
        const avgExpense = summaryData.reduce((acc, r) => acc + r.average, 0);
        rows.push(`
            <tr style="background-color:#f3f3f3;">
            <td><b>Total Expense</b></td>
            ${totalExpenseByMonth.map((v) => `<td><b>${format(v)}</b></td>`).join('')}
            <td><b>${format(totalExpense)}</b></td>
            <td><b>${format(avgExpense)}</b></td>
            <td><b>100%</b></td>
            </tr>
        `);

        // 💰 Total Income Row
        const totalIncomeByMonth = months.map((m) =>
            incomeRows.reduce((acc, row) => acc + (row.monthly[m] || 0), 0)
        );
        const totalIncome = incomeRows.reduce((acc, r) => acc + r.total, 0);
        const avgIncome = incomeRows.reduce((acc, r) => acc + r.average, 0);
        rows.push(`
            <tr style="background-color:#e0f7fa;">
            <td><b>Total Income</b></td>
            ${totalIncomeByMonth.map((v) => `<td><b>${format(v)}</b></td>`).join('')}
            <td><b>${format(totalIncome)}</b></td>
            <td><b>${format(avgIncome)}</b></td>
            <td><b>-</b></td>
            </tr>
        `);

        // 💵 Net Savings Row
        const netByMonth = months.map((_, i) => totalIncomeByMonth[i] - totalExpenseByMonth[i]);
        const netTotal = totalIncome - totalExpense;
        const nonZero = netByMonth.filter((v) => v !== 0);
        const netAverage = nonZero.length ? netByMonth.reduce((a, b) => a + b, 0) / nonZero.length : 0;
        rows.push(`
            <tr style="background-color:#fff9c4;">
            <td><b>Net Savings</b></td>
            ${netByMonth
                .map((v) => `<td style="color:${v >= 0 ? 'green' : 'red'}"><b>${format(v)}</b></td>`)
                .join('')}
            <td style="color:${netTotal >= 0 ? 'green' : 'red'}"><b>${format(netTotal)}</b></td>
            <td style="color:${netTotal >= 0 ? 'green' : 'red'}"><b>${format(netAverage)}</b></td>
            <td>-</td>
            </tr>
        `);

        return `
        <html>
            <head>
            <style>
                body::before {
                content: "HETHI SOLUTIONS";
                position: fixed;
                top: 35%;
                left: 5%;
                font-size: 48px;
                color: rgba(200, 200, 200, 0.15);
                transform: rotate(-30deg);
                z-index: 0;
                width: 100%;
                text-align: center;
                pointer-events: none;
                }
                table {
                border-collapse: collapse;
                width: 100%;
                font-size: 10px;
                }
                th, td {
                border: 1px solid #ccc;
                padding: 4px;
                text-align: center;
                }
                th {
                background-color: #f2f2f2;
                }
                td:first-child {
                text-align: left;
                }
            </style>
            </head>
            <body>
            <h3 style="text-align:center;">Yearly Category Summary</h3>
            <table>
                <thead>
                <tr>${headerRow}</tr>
                </thead>
                <tbody>
                ${rows.join('')}
                </tbody>
            </table>
            </body>
        </html>`;
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <Text style={styles.title}>Yearly Category Summary</Text>
                <View style={styles.toggleRow}>
                    {['expense', 'income', 'net'].map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            onPress={() => setViewMode(mode as any)}
                            style={[
                                styles.toggleButton,
                                viewMode === mode && styles.toggleButtonActive,
                            ]}
                        >
                            <Text style={viewMode === mode ? styles.toggleButtonTextActive : styles.toggleButtonText}>
                                {mode === 'expense' ? 'Expenses' : mode === 'income' ? 'Income' : 'Net Summary'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView horizontal>
                    <View>
                        <View style={styles.headerRow}>
                            <Text style={styles.headerCell}>Category</Text>
                            {months.map((m) => (
                                <Text key={m} style={styles.headerCell}>{m}</Text>
                            ))}
                            <Text style={styles.headerCell}>Total</Text>
                            <Text style={styles.headerCell}>Avg</Text>
                            <Text style={styles.headerCell}>%</Text>
                        </View>


                        {/* 📊 EXPENSE CATEGORY ROWS */}
                        {(viewMode === 'expense' || viewMode === 'net') &&
                            <>
                                {summaryData.map((item, idx) => (
                                    <View key={idx} style={styles.dataRow}>
                                        <Text style={styles.cell}>{item.category}</Text>
                                        {months.map((m) => (
                                            <Text key={m} style={styles.cell}>
                                                {item.monthly[m] ? formatCurrency(item.monthly[m]) : '-'}
                                            </Text>
                                        ))}
                                        <Text style={styles.cell}>{formatCurrency(item.total)}</Text>
                                        <Text style={styles.cell}>{formatCurrency(item.average)}</Text>
                                        <Text style={styles.cell}>{item.percentContribution.toFixed(1)}%</Text>
                                    </View>
                                ))}

                                {/* ➕ EXPENSE TOTAL ROW */}
                                <View style={[styles.dataRow, { backgroundColor: '#f3f3f3' }]}>
                                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>Total Expense</Text>
                                    {months.map((m) => {
                                        const sum = summaryData.reduce((acc, row) => acc + (row.monthly[m] || 0), 0);
                                        return (
                                            <Text key={m} style={[styles.cell, { fontWeight: 'bold' }]}>
                                                {formatCurrency(sum)}
                                            </Text>
                                        );
                                    })}
                                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>
                                        {formatCurrency(summaryData.reduce((acc, row) => acc + row.total, 0))}
                                    </Text>
                                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>
                                        {formatCurrency(summaryData.reduce((acc, row) => acc + row.average, 0))}
                                    </Text>
                                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>100%</Text>
                                </View>
                            </>
                        }


                        {/* 💰 INCOME TOTAL ROW */}
                        {(viewMode === 'income' || viewMode === 'net') &&
                            <>
                                <View style={[styles.dataRow, { backgroundColor: '#e0f7fa' }]}>
                                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>Total Income</Text>
                                    {months.map((m) => {
                                        const sum = incomeRows.reduce((acc, row) => acc + (row.monthly[m] || 0), 0);
                                        return (
                                            <Text key={m} style={[styles.cell, { fontWeight: 'bold' }]}>
                                                {formatCurrency(sum)}
                                            </Text>
                                        );
                                    })}
                                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>
                                        {formatCurrency(incomeRows.reduce((acc, row) => acc + row.total, 0))}
                                    </Text>
                                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>
                                        {formatCurrency(incomeRows.reduce((acc, row) => acc + row.average, 0))}
                                    </Text>
                                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>-</Text>
                                </View>
                            </>
                        }


                        {/* 💵 SAVINGS ROW (INCOME - EXPENSE) */}
                        {(viewMode === 'net') &&
                            <>
                                <View style={[styles.dataRow, { backgroundColor: '#fff9c4' }]}>
                                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>Net Savings</Text>
                                    {months.map((m) => {
                                        const income = incomeRows.reduce((acc, row) => acc + (row.monthly[m] || 0), 0);
                                        const expense = summaryData.reduce((acc, row) => acc + (row.monthly[m] || 0), 0);
                                        const savings = income - expense;
                                        return (
                                            <Text
                                                key={m}
                                                style={[
                                                    styles.cell,
                                                    {
                                                        fontWeight: 'bold',
                                                        color: savings >= 0 ? 'green' : 'red',
                                                    },
                                                ]}
                                            >
                                                {formatCurrency(savings)}
                                            </Text>
                                        );
                                    })}
                                    <Text
                                        style={[
                                            styles.cell,
                                            {
                                                fontWeight: 'bold',
                                                color:
                                                    incomeRows.reduce((acc, row) => acc + row.total, 0) -
                                                        summaryData.reduce((acc, row) => acc + row.total, 0) >=
                                                        0
                                                        ? 'green'
                                                        : 'red',
                                            },
                                        ]}
                                    >
                                        {formatCurrency(
                                            incomeRows.reduce((acc, row) => acc + row.total, 0) -
                                            summaryData.reduce((acc, row) => acc + row.total, 0)
                                        )}
                                    </Text>
                                    <Text style={[
                                        styles.cell,
                                        {
                                            fontWeight: 'bold',
                                            color:
                                                incomeRows.reduce((acc, row) => acc + row.total, 0) -
                                                    summaryData.reduce((acc, row) => acc + row.total, 0) >= 0
                                                    ? 'green'
                                                    : 'red',
                                        }
                                    ]}>
                                        {formatCurrency(
                                            (() => {
                                                const monthlySavings = months.map((m) =>
                                                    incomeRows.reduce((acc, row) => acc + (row.monthly[m] || 0), 0) -
                                                    summaryData.reduce((acc, row) => acc + (row.monthly[m] || 0), 0)
                                                );
                                                const nonZero = monthlySavings.filter((v) => v !== 0);
                                                const avg = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
                                                return avg;
                                            })()
                                        )}
                                    </Text>
                                    <Text style={[styles.cell, { fontWeight: 'bold' }]}>-</Text>
                                </View>
                            </>
                        }

                    </View>
                </ScrollView>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.button} onPress={handleExportCSV}>
                        <Text style={styles.buttonText}>Export CSV</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleExportPDF}>
                        <Text style={styles.buttonText}>Export PDF</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

export default YearlySummaryExportModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        paddingBottom: 32,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#eee',
        paddingVertical: 4,
    },
    headerCell: {
        minWidth: 80,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    dataRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderColor: '#ddd',
        paddingVertical: 4,
    },
    cell: {
        minWidth: 80,
        textAlign: 'center',
        fontSize: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
    },
    button: {
        backgroundColor: '#2196f3',
        padding: 10,
        borderRadius: 6,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    closeBtn: {
        marginTop: 16,
        alignSelf: 'center',
    },
    closeText: {
        color: '#666',
        textDecorationLine: 'underline',
    }, toggleRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
    },
    toggleButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginHorizontal: 6,
        borderRadius: 4,
        backgroundColor: '#e0e0e0',
    },
    toggleButtonActive: {
        backgroundColor: '#2196f3',
    },
    toggleButtonText: {
        color: '#333',
    },
    toggleButtonTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
});