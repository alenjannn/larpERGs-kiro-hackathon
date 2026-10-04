import { StyleSheet, Text } from 'react-native';
import Card from '../../../shared/components/Card';
import DemoBadge from '../../../shared/components/DemoBadge';
import Notice from '../../../shared/components/Notice';
import { text } from '../../../shared/theme';
import type { Admin, BHW } from '../../../shared/types/db.types';

/** Shows the Admin -> BHW link: who manages this BHW and where they are assigned. */
export default function AssignmentCard({ bhw, admin, patientCount }: { bhw: BHW | null; admin: Admin | null; patientCount: number }) {
  if (!bhw) {
    return <Notice tone="warning" message="BHW profile not found. Run supabase/seed.sql to create the demo personas." />;
  }
  return (
    <Card title={`Assignment · ${bhw.barangay}`} subtitle={`Managed by ${admin?.full_name ?? 'unknown admin'} · ${admin?.office ?? ''}`} right={<DemoBadge />}>
      <Text style={styles.text}>
        {patientCount} patient{patientCount === 1 ? '' : 's'} assigned to you by your Admin.
      </Text>
      {bhw.status === 'inactive' ? (
        <Notice tone="warning" message="Your account was deactivated by the Admin. Records you sync are still accepted in this demo." />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  text: text.body,
});
