import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
  // ——— existing keys (kept) + upgrades ———
  activeBtn: {
    backgroundColor: '#0a66e4',
  },

  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 12,
  },

  col: {
    flex: 1,
  },

  container: {
    backgroundColor: '#f9fbff',
    padding: 16,
  },

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  dateBtn: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    padding: 12,
  },

  dateField: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: 12,
  },

  dateFieldDisabled: {
    opacity: 0.7,
  },

  dateFieldText: {
    color: '#2d3436',
    fontSize: 14,
    marginLeft: 8,
  },

  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    borderWidth: 1,
    elevation: 8,
    left: 0,
    maxHeight: 240,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    top: 48,
    zIndex: 1001,
  },

  dropdownItem: {
    backgroundColor: '#fff',
    borderBottomColor: '#eef2f7',
    borderBottomWidth: 1,
    padding: 12,
  },

  fullImage: {
    height: '90%',
    width: '90%',
  },

  header: {
    alignItems: 'center',
    backgroundColor: '#0a66e4',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },

  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },

  iconBtn: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },

  iconBtnDisabled: {
    opacity: 0.5,
  },

  iconButton: {
    marginLeft: 12,
  },

  input: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    borderRadius: 10,
    borderWidth: 1,
    color: '#0f172a',
    height: 44,
    paddingHorizontal: 12,
  },

  inputWrap: {
    position: 'relative',
  },

  label: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },

  logo: {
    height: 28,
    marginRight: 8,
    resizeMode: 'contain',
    width: 28,
  },

  modalBackground: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },

  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },

  modalContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    flex: 1,
  },

  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },

  quickCard: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },

  quickLinks: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  quickText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  saveBtn: {
    alignItems: 'center',
    backgroundColor: '#0a66e4',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    marginTop: 20,
    // subtle shadow to lift the CTA
    shadowColor: '#0a66e4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 3,
  },

  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  screen: {
    backgroundColor: '#f5f6fa',
    flex: 1,
  },

  sectionTitle: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    marginLeft: 4,
  },

  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },

  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },

  toggleBtn: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#0a66e4',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    margin: 4,
    padding: 12,
  },

  toggleText: {
    color: '#0f172a',
    fontWeight: '700',
  },

  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },

  warningIcon: {
    color: 'orange',
    fontSize: 16,
    marginLeft: 8,
  },

  // ——— tasteful additions (optional to use) ———
  chip: {
    backgroundColor: '#eef2ff',
    borderColor: '#dbeafe',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  chipText: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: '700',
  },

  helperText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
  },

  inputError: {
    borderColor: '#dc2626',
  },

  inputFocused: {
    borderColor: '#0a66e4',
    shadowColor: '#0a66e4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  link: {
    color: '#0a66e4',
    fontWeight: '800',
  },

  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sectionSubtitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },

  separator: {
    backgroundColor: '#eef2f7',
    height: 1,
    marginVertical: 8,
    width: '100%',
  },
});