import { useEffect, useRef } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import { colors, radius, spacing, typography } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Disables both buttons and shows a spinner on confirm. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Bottom confirmation sheet. Dismissed by Cancel, the backdrop, Android back
 * and Escape on web. Focus moves into the sheet when it opens.
 */
export default function ConfirmSheet({ visible, title, message, confirmLabel, cancelLabel = 'Cancel', destructive, busy, onConfirm, onCancel }: Props) {
  const sheetRef = useRef<View>(null);
  const cancel = () => {
    if (!busy) onCancel();
  };

  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    // Move focus into the sheet once it has rendered.
    const timer = setTimeout(() => (sheetRef.current as unknown as { focus?: () => void } | null)?.focus?.(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [visible, busy, onCancel]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={cancel}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={cancel} accessibilityRole="button" accessibilityLabel={cancelLabel} />
        <View ref={sheetRef} focusable style={styles.sheet} accessibilityViewIsModal aria-modal role="dialog" aria-label={title}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button title={cancelLabel} variant="secondary" onPress={cancel} disabled={busy} style={styles.action} />
            <Button
              title={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              loading={busy}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(22, 50, 79, 0.45)' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: typography.title, fontWeight: '700', color: colors.text },
  message: { fontSize: typography.body, lineHeight: typography.lineHeight, color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  action: { flexGrow: 1, flexBasis: 140 },
});
