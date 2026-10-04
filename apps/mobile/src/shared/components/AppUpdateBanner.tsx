import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import Button from './Button';
import Icon from './Icon';
import { registerServiceWorker, type ShellUpdate } from '../services/serviceWorker';
import { colors, spacing, text } from '../theme';

/** "A new version of Tuloy is available." + Reload. Never reloads by itself (OC-10.6). */
export default function AppUpdateBanner() {
  const [update, setUpdate] = useState<ShellUpdate | null>(null);

  useEffect(() => registerServiceWorker(setUpdate), []);

  if (!update) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Icon name="info" size={16} color={colors.info} />
      <Text style={styles.text}>A new version of Tuloy is available.</Text>
      <Button title="Reload" compact onPress={() => update.apply()} accessibilityLabel="Reload to update Tuloy" />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.infoBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  text: { ...text.label, flex: 1 },
});
