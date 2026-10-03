import { AppState } from 'react-native';

// Native: the app returned to the foreground.
export function subscribeForeground(callback: () => void): () => void {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') callback();
  });
  return () => subscription.remove();
}
