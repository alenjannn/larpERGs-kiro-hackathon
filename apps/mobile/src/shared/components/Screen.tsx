import type { ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions, type PressableStateCallbackType } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import { MAIN_CONTENT_ID } from './SkipLink';
import { colors, layout, radius, spacing, text, touch } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  /** Back link above the title, for screens below a tab (e.g. Patient visit). */
  back?: { label: string; onPress: () => void };
  /** Right side of the page header (e.g. a badge or primary action). */
  actions?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/** Scrollable, width-constrained page container used by every feature screen. */
export default function Screen({ title, subtitle, back, actions, children, refreshing, onRefresh }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= layout.table;
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, wide && styles.contentWide]}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}
      keyboardShouldPersistTaps="handled"
    >
      {/* The page's main landmark; the skip link focuses it (tabIndex -1 = focusable, not a tab stop). */}
      <View style={styles.inner} nativeID={MAIN_CONTENT_ID} role="main" tabIndex={-1}>
        <View style={styles.header}>
          {back ? (
            <Pressable
              onPress={back.onPress}
              accessibilityRole="link"
              accessibilityLabel={back.label}
              style={(state: PressableStateCallbackType & { hovered?: boolean }) => [styles.back, state.hovered && styles.backHovered]}
            >
              <Icon name="back" size={16} color={colors.primary} />
              <Text style={styles.backText}>{back.label}</Text>
            </Pressable>
          ) : null}
          <View style={styles.titleRow}>
            <View style={styles.titles}>
              <Text style={[styles.title, wide && styles.titleWide]} accessibilityRole="header" aria-level={1}>
                {title}
              </Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {actions ? <View style={styles.actions}>{actions}</View> : null}
          </View>
        </View>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  contentWide: { paddingHorizontal: spacing.xxl, paddingTop: spacing.xxl },
  inner: { width: '100%', maxWidth: layout.maxContent, alignSelf: 'center', gap: spacing.lg },
  header: { gap: spacing.sm },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    minHeight: touch.min,
    paddingHorizontal: spacing.sm,
    marginLeft: -spacing.sm,
    borderRadius: radius.md,
  },
  backHovered: { backgroundColor: colors.primaryBg },
  backText: { ...text.label, color: colors.primary },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: spacing.md },
  titles: { flex: 1, minWidth: 220, gap: spacing.xs },
  title: text.heading,
  titleWide: { fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  subtitle: { ...text.body, color: colors.muted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
});
