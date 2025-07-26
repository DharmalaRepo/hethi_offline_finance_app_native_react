import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getAppSettings } from '../services/mockDataService';
import { showToast } from '../utils/toastUtils';
import { navigationRef } from '../navigation/NavigationService';

export const useAutoLock = () => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const resetLockTimer = async () => {
    const settings = await getAppSettings();
    if (!settings?.autoLockEnabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute();
        if (currentRoute?.name !== 'LockScreen') {
          showToast('info', 'App locked due to inactivity');
          navigationRef.navigate('LockScreen');
        }
      }
    }, (settings.autoLockTime || 1) * 60 * 1000); // default 1 min
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        resetLockTimer();
      }
      appState.current = nextAppState;
    });

    resetLockTimer(); // trigger on mount

    return () => {
      subscription.remove();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
};