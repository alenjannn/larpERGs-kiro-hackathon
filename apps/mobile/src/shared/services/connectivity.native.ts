// Native connectivity via NetInfo (iOS/Android only; works in Expo Go).
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type ConnectivityListener = (online: boolean | null) => void;

function toOnline(state: NetInfoState): boolean | null {
  if (state.isConnected === null) return null;
  // isInternetReachable is null while unknown; only an explicit false means no internet.
  return state.isConnected && state.isInternetReachable !== false;
}

export function subscribeConnectivity(listener: ConnectivityListener): () => void {
  return NetInfo.addEventListener((state) => listener(toOnline(state)));
}
