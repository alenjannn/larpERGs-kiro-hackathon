import { StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import type { BHW, Clinic } from '../../../shared/types/db.types';
import { colors, spacing, text } from '../../../shared/theme';
import { PATIENT_COPY, PATIENT_COPY_FIL } from '../copy';

const UNKNOWN = PATIENT_COPY.unknown;

/** Assigned BHW and clinic contacts (DEMO). Missing values stay "Unknown". */
export default function CareTeamContacts({ bhw, clinic }: { bhw: BHW | null; clinic: Clinic | null }) {
  return (
    <Card title={PATIENT_COPY.careTeam} subtitle={PATIENT_COPY_FIL.careTeam} right={<DemoBadge />}>
      <View style={styles.block}>
        <Text style={styles.label}>{PATIENT_COPY.yourHealthWorker}</Text>
        {bhw ? (
          <>
            <Text style={styles.name}>{bhw.full_name}</Text>
            <Text style={styles.body}>Barangay: {bhw.barangay?.trim() || UNKNOWN}</Text>
            <Text style={styles.body}>Phone: {bhw.phone?.trim() || UNKNOWN}</Text>
          </>
        ) : (
          <Text style={styles.body}>{PATIENT_COPY.noHealthWorker}</Text>
        )}
      </View>
      <View style={[styles.block, styles.divided]}>
        <Text style={styles.label}>{PATIENT_COPY.yourClinic}</Text>
        <Text style={styles.name}>{clinic?.name ?? UNKNOWN}</Text>
        <Text style={styles.body}>Contact: {clinic?.contact?.trim() || UNKNOWN}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  block: { gap: 2, paddingVertical: spacing.xs },
  divided: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  label: text.overline,
  name: { ...text.bodyStrong, fontWeight: '700' },
  body: text.body,
});
