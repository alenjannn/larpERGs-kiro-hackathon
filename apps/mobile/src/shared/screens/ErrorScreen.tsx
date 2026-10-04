import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, type ErrorBoundaryProps } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../components/Button';
import Icon from '../components/Icon';
import Text from '../components/Text';
import { colors, radius, spacing, text } from '../theme';

/**
 * Route error boundary (exported by app/_layout.tsx). A render error shows
 * this recovery screen instead of a blank page, online or offline. It uses no
 * app context, because the providers may be what failed.
 */
export default function ErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const [retrying, setRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const tryAgain = async () => {
    setRetrying(true);
    try {
      await retry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card} accessibilityRole="alert">
          <View style={styles.iconWrap}>
            <Icon name="alert" size={26} color={colors.error} />
          </View>
          <Text style={styles.title} accessibilityRole="header" aria-level={1}>
            This screen couldn&apos;t be shown
          </Text>
          <Text style={styles.body}>
            Something went wrong while showing this page. Information saved on this device is still there. Try again, or go back to the start.
          </Text>
          <View style={styles.actions}>
            <Button title="Try again" icon="repeat" onPress={() => void tryAgain()} loading={retrying} style={styles.action} />
            <Button title="Go to start" variant="secondary" onPress={() => router.replace('/')} style={styles.action} />
          </View>
          <Button
            title={showDetails ? 'Hide technical details' : 'Show technical details'}
            variant="ghost"
            compact
            trailingIcon={showDetails ? 'chevron-up' : 'chevron-down'}
            onPress={() => setShowDetails((s) => !s)}
            style={styles.details}
          />
          {showDetails ? (
            <Text style={styles.code} selectable>
              {error.message || String(error)}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.lg + 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.errorBg, alignItems: 'center', justifyContent: 'center' },
  title: { ...text.title, textAlign: 'center' },
  body: { ...text.body, color: colors.muted, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignSelf: 'stretch', marginTop: spacing.xs },
  action: { flexGrow: 1, flexBasis: 160 },
  details: { alignSelf: 'center' },
  code: { ...text.caption, alignSelf: 'stretch', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.mutedBg, fontFamily: 'monospace' },
});
