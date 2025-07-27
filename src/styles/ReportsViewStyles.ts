import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8fbff',
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthPicker: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 5,
    padding: 8,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: '#636e72',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 5,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#2d3436',
  },
  income: {
    color: '#27ae60',
    fontWeight: '500',
    fontSize: 14,
  },
  expense: {
    color: '#e74c3c',
    fontWeight: '500',
    fontSize: 14,
  },
  savings: {
    color: '#2c3e50',
    fontWeight: 'bold',
    fontSize: 14,
  },
  comparisonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  subheading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  exportButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportButton: {
    backgroundColor: '#0984e3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  exportText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 2,
    marginBottom: 16, 
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#dfe6e9',
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: '#dcdde1',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#2d3436',
  },
  note: {
    marginTop: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#636e72',
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
headerLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},
title: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#fff',
},
iconButton: {
  marginLeft: 12,
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

  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#e6f2ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  monthInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  filters: {
    marginBottom: 16,
  },
  searchBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterBtn: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007bff',
    marginHorizontal: 4,
  },
  selectedFilter: {
    backgroundColor: '#007bff',
    color: '#fff',
  },
  txnRow: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#e6f2ff',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tableCellHeader: {
    flex: 1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
row: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#e0e0e0',
},

col: {
  flex: 1,
  textAlign: 'center',
  fontSize: 14,
},
exportButtons: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: 10,
  gap: 12,
},
exportBtn: {
  backgroundColor: '#007bff',
  padding: 10,
  borderRadius: 8,
},
});

export default styles;