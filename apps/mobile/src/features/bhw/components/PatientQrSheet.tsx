import { useEffect, useRef } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import DemoBadge from '../../../shared/components/DemoBadge';
import { colors, radius, spacing, touch, typography } from '../../../shared/theme';
import { patientQrReference } from '../patientQr';
import PatientQrCode from './PatientQrCode';

interface Props {
  visible: boolean;
  /** Only `id` is encoded. Name and barangay are shown as plain text beside it. */
  patient: { id: string; full_name: string; barangay: string | null } | null;
  onClose: () => void;
}

const NOTE = 'Reference only. No health data is stored in this code.';

/**
 * Bottom sheet with a patient reference QR code. Dismissed by Close, the
 * backdrop, Android back and Escape on web. Focus moves into the sheet.
 */
export default function PatientQrSheet({ visible, patient, onClose }: Props) {
  const sheetRef = useRef<View>(null);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const timer = setTimeout(() => (sheetRef.current as unknown as { focus?: () => void } | null)?.focus?.(), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [visible, onClose]);

  if (!patient) return null;

  const reference = patientQrReference(patient.id);
  const title = `Patient QR · ${patient.full_name}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close patient QR code" />
        <View ref={sheetRef} focusable style={styles.sheet} accessibilityViewIsModal aria-modal role="dialog" aria-label={title}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.titleRow}>
              <Text style={styles.title} accessibilityRole="header">
                Patient QR code
              </Text>
              <DemoBadge />
            </View>

            <View style={styles.body}>
              <PatientQrCode value={reference} size={200} />
              <View style={styles.info}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{patient.full_name}</Text>
                <Text style={styles.label}>Barangay</Text>
                <Text style={styles.value}>{patient.barangay?.trim() || 'Not recorded'}</Text>
                <Text style={styles.note}>{NOTE}</Text>
              </View>
            </View>

            <View style={styles.refBox} accessible accessibilityLabel={`Reference text: ${reference}`}>
              <Text style={styles.label}>Reference</Text>
              <Text style={styles.reference} selectable>
                {reference}
              </Text>
            </View>

            <Button title="Close" variant="secondary" onPress={onClose} accessibilityLabel="Close patient QR code" style={styles.close} />
          </ScrollView>
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
    maxHeight: '90%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  content: { padding: spacing.xl, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { fontSize: typography.title, fontWeight: '700', color: colors.text, flexShrink: 1 },
  // Wraps below the code on narrow screens; sits beside it when there is room.
  body: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: spacing.lg },
  info: { flexGrow: 1, flexBasis: 160, gap: 2 },
  label: { fontSize: typography.caption, color: colors.muted, fontWeight: '600', marginTop: spacing.xs },
  value: { fontSize: typography.body, color: colors.text, fontWeight: '700' },
  note: { fontSize: typography.small, lineHeight: 20, color: colors.text, marginTop: spacing.md },
  refBox: { backgroundColor: colors.mutedBg, borderRadius: radius.sm, padding: spacing.md },
  reference: { fontSize: typography.small, color: colors.text, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
  close: { minHeight: touch.min },
});
