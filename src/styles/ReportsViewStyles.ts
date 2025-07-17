import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
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
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
  },
  txnRow: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  // 👇 Add these missing styles
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 12,
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
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  // Add to ReportsViewStyles.ts

toggleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginVertical: 10,
  paddingHorizontal: 10,
},

label: {
  fontSize: 16,
  fontWeight: '500',
  color: '#333',
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

note: {
  fontSize: 14,
  color: '#666',
  fontStyle: 'italic',
  marginTop: 4,
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
exportButton: {
  backgroundColor: '#007bff',
  paddingVertical: 10,
  paddingHorizontal: 20,
  marginTop: 15,
  borderRadius: 8,
  alignItems: 'center',
  alignSelf: 'flex-start'
},
exportText: {
  color: '#fff',
  fontWeight: 'bold'
},
comparisonHeaderRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
  flexWrap: 'wrap',
},

exportButtonRow: {
  flexDirection: 'row',
  gap: 10, // or use marginRight on each button if needed
},

exportButton: {
  backgroundColor: '#007bff',
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 6,
  marginLeft: 8,
},

exportText: {
  color: '#fff',
  fontWeight: '600',
},
});

export default styles;