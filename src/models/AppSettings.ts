export interface AppSettings {
  defaultAccountId?: string;
  defaultPersonId?: string;
  defaultCategoryId?: string;
  defaultSubCategoryId?: string;
  toogleTheme?: boolean;
  lastBackupDate?: string;
  scheduledBackup?: boolean;
  backupFrequency?: 'daily' | 'weekly' | 'monthly';
  profileName?: string;
  profileNotes?: string;
  theme?: 'light' | 'dark'; // ✅ Add this line
}