import { useEffect, useRef, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Icon from './Icon';
import { colors, layout, radius, shadow, spacing, text } from '../theme';

interface Props {
  visible: boolean;
  /** Called by the close button, the backdrop, Android back and Escape on web. */
  onClose: () => void;
  /** Accessible name of the dialog (also the visible title unless `title` is false). */
  label: string;
  /** Show `label` as the heading with a close button. Default true. */
  title?: boolean;
  /** Muted line under the title, e.g. the Filipino form. */
  subtitle?: string;
  children: ReactNode;
}

/**
 * Modal sheet: bottom sheet on phones, centred dialog on wide screens.
 * Focus moves into it when it opens (web). Shared by every confirm/form sheet.
 */
export default function Sheet({ visible, onClose, label, title = true, subtitle, children }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= layout.table;
  const sheetRef = useRef<View>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    const timer = setTimeout(() => (sheetRef.current as unknown as { focus?: () => void } | null)?.focus?.(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType={wide ? 'fade' : 'slide'} onRequestClose={onClose}>
      <View style={[styles.root, wide && styles.rootWide]}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View
          ref={sheetRef}
          focusable
          style={[styles.sheet, wide && styles.sheetWide]}
          accessibilityViewIsModal
          aria-modal
          role="dialog"
          aria-label={label}
        >
          {!wide ? <View style={styles.grabber} /> : null}
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {title ? (
              <View style={styles.header}>
                <View style={styles.titles}>
                  <Text style={styles.title} accessibilityRole="header">
                    {label}
                  </Text>
                  {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
                <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} style={styles.close}>
                  <Icon name="close" size={16} color={colors.muted} />
                </Pressable>
              </View>
            ) : null}
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Two buttons side by side, wrapping on narrow screens (Cancel left, main action right). */
export function SheetActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

export const sheetActionStyle = { flexGrow: 1, flexBasis: 140 } as const;

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  rootWide: { justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    width: '100%',
    maxWidth: layout.maxSheet,
    maxHeight: '92%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    ...shadow.overlay,
  },
  sheetWide: { borderRadius: radius.xl, maxHeight: '88%' },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginTop: spacing.sm },
  content: { padding: spacing.xl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  titles: { flex: 1, gap: 2 },
  title: text.title,
  subtitle: text.muted,
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.mutedBg,
    marginTop: -spacing.xs,
    marginRight: -spacing.xs,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.xs },
});
