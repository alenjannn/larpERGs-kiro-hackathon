import Card from '../../../shared/components/Card';
import RecordListItem from '../../../shared/components/RecordListItem';
import Notice from '../../../shared/components/Notice';
import type { HealthRecord } from '../../../shared/types/db.types';

interface Props {
  title: string;
  subtitle?: string;
  records: HealthRecord[];
  bhwName?: string;
  emptyText: string;
}

/** A titled group of health records written by the patient's BHW. */
export default function HealthRecordCard({ title, subtitle, records, bhwName, emptyText }: Props) {
  return (
    <Card title={title} subtitle={subtitle}>
      {records.length === 0 ? <Notice tone="info" message={emptyText} /> : null}
      {records.map((r) => (
        <RecordListItem key={r.id} record={r} context={bhwName ? `Recorded by ${bhwName}` : undefined} />
      ))}
    </Card>
  );
}
