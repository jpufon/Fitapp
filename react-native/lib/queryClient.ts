import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  focusManager,
  onlineManager,
  QueryClient,
} from '@tanstack/react-query';

let configured = false;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});

export function configureQueryClient(): void {
  if (configured) {
    return;
  }

  configured = true;

  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
  });

  const onAppStateChange = (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  };

  AppState.addEventListener('change', onAppStateChange);
}
