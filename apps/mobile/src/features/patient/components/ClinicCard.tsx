import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import DemoBadge from '../../../shared/components/DemoBadge';
import Icon from '../../../shared/components/Icon';
import type { Clinic } from '../../../shared/types/db.types';
import { formatDateDMY } from '../../../shared/utils/date';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { PATIENT_COPY, PHILHEALTH_YAKAP_URL } from '../copy';

const UNKNOWN = PATIENT_COPY.unknown;

/** Link to the official PhilHealth YAKAP page; disabled offline. */
export function PhilHealthLink({ isOnline }: { isOnline: boolean | null }) {
  const offline = isOnline === false;
  return (
    <View style={styles.linkWrap}>
      <Button
        title={PATIENT_COPY.philhealthLink}
        variant="secondary"
        disabled={offline}
        onPress={() => {
          Linking.openURL(PHILHEALTH_YAKAP_URL).catch((e: unknown) => console.warn('Could not open the PhilHealth page:', e));
        }}
        accessibilityLabel={offline ? `${PATIENT_COPY.philhealthLink} (${PATIENT_COPY.needsConnection})` : `${PATIENT_COPY.philhealthLink}, opens in the browser`}
      />
      {offline ? <Text style={styles.muted}>{PATIENT_COPY.needsConnection}</Text> : null}
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

interface Props {
  clinic: Clinic;
  /** null = not the patient's clinic; otherwise whether the clinic has confirmed it. */
  mine: { confirmed: boolean } | null;
  isOnline: boolean | null;
}

/** One clinic, expandable. Opening it never books anything (P-5.3). Unknown stays "Unknown". */
export default function ClinicCard({ clinic, mine, isOnline }: Props) {
  const [open, setOpen] = useState(false);
  const accreditation =
    clinic.yakap_accreditation === 'listed' ? `Listed (source: ${clinic.source?.trim() || UNKNOWN})` : UNKNOWN;
  const services = clinic.services?.filter((s) => s.trim()).join(', ');
  const tag = mine ? (mine.confirmed ? 'Your clinic' : 'Your clinic (confirmation pending)') : null;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${clinic.name}${tag ? `, ${tag}` : ''}. ${open ? 'Hide details' : 'Show details'}`}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text style={styles.name}>{clinic.name}</Text>
          <Text style={styles.muted}>{clinic.address?.trim() || UNKNOWN}</Text>
          {tag ? (
            <View style={styles.tag}>
              <Icon name="person" size={13} color={colors.primary} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ) : null}
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
      </Pressable>

      {open ? (
        <View style={styles.details}>
          <DemoBadge />
          <Field label="Services" value={services || UNKNOWN} />
          <Field label="Address" value={clinic.address?.trim() || UNKNOWN} />
          <Field label="Contact" value={clinic.contact?.trim() || UNKNOWN} />
          <Field label="YAKAP accreditation" value={accreditation} />
          <Field label="Availability" value={UNKNOWN} />
          <Field label="Source" value={clinic.source?.trim() || UNKNOWN} />
          <Field label="Last verified" value={clinic.last_verified_at ? formatDateDMY(clinic.last_verified_at) : 'Not verified'} />
          <Text style={styles.note}>{PATIENT_COPY.noBooking}</Text>
          <PhilHealthLink isOnline={isOnline} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg + 2, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', boxShadow: '0 1px 2px rgba(16, 42, 67, 0.04), 0 2px 8px rgba(16, 42, 67, 0.04)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg, minHeight: 44 },
  headerText: { flex: 1, gap: 2 },
  name: { fontSize: typography.body, fontWeight: '700', color: colors.text },
  tag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  tagText: { fontSize: typography.small, color: colors.primary, fontWeight: '700' },
  details: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  field: { gap: 2 },
  fieldLabel: { fontSize: 12, color: colors.muted, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  fieldValue: { fontSize: typography.body, color: colors.text },
  note: { fontSize: typography.body, color: colors.text, lineHeight: typography.lineHeight },
  muted: { fontSize: typography.small, color: colors.muted },
  linkWrap: { gap: spacing.xs },
});
