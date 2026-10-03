import { StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { useConnectivity } from '../context/ConnectivityContext';
import { colors, spacing, typography } from '../theme';

export const OFFLINE_BANNER_TEXT = "You're offline. Your saved information is still here. Requests will send when you reconnect.";
const TAGLINE = 'Tuloy ang alaga, kahit offline';

interface Props {
  showTagline?: boolean;
  /** Gallery only: render even when online. */
  preview?: boolean;
}

/** Slim, non-blocking navy banner shown only while offline (never red, hidden while unknown). */
export default function OfflineBanner({ showTagline, preview }: Props) {
  const { isOnline } = useConnectivity();
  if (!preview && isOnline !== false) return null;
  return (
    <View style={styles.bar} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="offline" size={18} color={colors.offlineText} />
      <View style={styles.texts}>
        <Text style={styles.text}>{OFFLINE_BANNER_TEXT}</Text>
        {showTagline ? <Text style={styles.tagline}>{TAGLINE}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.offlineBg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  texts: { flex: 1, gap: 2 },
  text: { color: colors.offlineText, fontSize: typography.small, lineHeight: 20 },
  tagline: { color: colors.offlineText, fontSize: typography.caption, fontStyle: 'italic', opacity: 0.9 },
});
