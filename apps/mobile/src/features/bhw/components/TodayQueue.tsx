import Card from '../../../shared/components/Card';
import EmptyState from '../../../shared/components/EmptyState';
import LastUpdated from '../../../shared/components/LastUpdated';
import type { TodayItem, TodayKind } from '../today';
import TodayWorkItem from './TodayWorkItem';

const SECTIONS: { kind: TodayKind; title: string; subtitle: string }[] = [
  {
    kind: 'attendance_unconfirmed',
    title: 'Attendance not yet confirmed',
    subtitle: 'The appointment date has passed and nobody has confirmed attendance yet',
  },
  { kind: 'missed', title: 'Confirmed missed', subtitle: 'The clinic recorded these appointments as missed' },
  { kind: 'follow_up', title: 'Follow-ups due', subtitle: `Appointments in the next 7 days, or still without a date` },
  { kind: 'barrier', title: 'Open barriers', subtitle: 'From your latest visit with each patient' },
];

/**
 * Today work items other than help requests (B-1.1 – B-1.5). "Attendance not
 * yet confirmed" and "Confirmed missed" are separate sections (B-1.3).
 */
export default function TodayQueue({
  items,
  cachedAt,
  onLogVisit,
}: {
  items: TodayItem[];
  cachedAt: string | null;
  onLogVisit: (patientId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <Card title="Follow-up">
        {cachedAt ? <LastUpdated at={cachedAt} /> : null}
        <EmptyState title="Nothing else needs follow-up today." icon="check" />
      </Card>
    );
  }
  return (
    <>
      {SECTIONS.map((section) => {
        const list = items.filter((i) => i.kind === section.kind);
        if (list.length === 0) return null;
        return (
          <Card key={section.kind} title={`${section.title} (${list.length})`} subtitle={section.subtitle}>
            {cachedAt ? <LastUpdated at={cachedAt} /> : null}
            {list.map((item) => (
              <TodayWorkItem key={item.key} item={item} onLogVisit={onLogVisit} />
            ))}
          </Card>
        );
      })}
    </>
  );
}
