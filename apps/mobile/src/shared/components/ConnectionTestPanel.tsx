import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import Button from './Button';
import Card from './Card';
import Icon, { type IconName } from './Icon';
import LoadingSpinner from './LoadingSpinner';
import Notice from './Notice';
import { useAsyncData } from '../hooks/useAsyncData';
import { fetchConnectionTests, insertConnectionTest } from '../services/api';
import { toUserMessage } from '../services/supabase';
import { formatDateTime } from '../utils/date';
import { colors, spacing, text } from '../theme';
import type { ClientType } from '../types/db.types';

const ROLE_ICON: Record<ClientType, IconName> = { patient: 'person', bhw: 'clinic', admin: 'tools', system: 'tools' };

interface Props {
  clientType: Exclude<ClientType, 'system'>;
  /** Admin view: list records from every role (cross-role visibility). */
  showAllRoles?: boolean;
}

/** R1: proves this role can read from and write to Supabase `connection_test`. */
export default function ConnectionTestPanel({ clientType, showAllRoles }: Props) {
  const { data, error, loading, reload } = useAsyncData(
    () => fetchConnectionTests(showAllRoles ? undefined : clientType, showAllRoles ? 15 : 5),
    [clientType, showAllRoles]
  );
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  async function addRecord() {
    setAdding(true);
    setAddError(null);
    try {
      await insertConnectionTest(`${clientType.toUpperCase()} connection test`, clientType);
      await reload();
    } catch (e) {
      console.error('Insert connection_test failed:', e);
      setAddError(toUserMessage(e, 'Could not add test record.'));
    } finally {
      setAdding(false);
    }
  }

  const status = error
    ? { icon: 'alert' as const, color: colors.error, label: 'Not connected' }
    : data
      ? { icon: 'check' as const, color: colors.success, label: 'Connected to Supabase' }
      : { icon: 'clock' as const, color: colors.muted, label: 'Connecting…' };

  return (
    <Card
      title="Database connection test"
      subtitle={showAllRoles ? 'Records from all roles' : undefined}
      right={<Button compact variant="secondary" title="Add test record" onPress={addRecord} loading={adding} disabled={!!error && !data} />}
    >
      <View style={styles.status} accessible accessibilityLabel={`Status: ${status.label}`}>
        <Icon name={status.icon} size={14} color={status.color} />
        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
      </View>
      {error ? <Notice tone="error" message={error} /> : null}
      {addError ? <Notice tone="error" message={addError} /> : null}
      {loading && !data ? <LoadingSpinner /> : null}
      {data && data.length === 0 ? <Text style={styles.muted}>No test records yet.</Text> : null}
      {data?.map((row) => (
        <View key={row.id} style={styles.row}>
          <Icon name={ROLE_ICON[row.client_type] ?? 'circle'} size={14} color={colors.muted} style={styles.icon} />
          <Text style={styles.message} numberOfLines={1}>
            {row.message}
          </Text>
          <Text style={styles.meta}>
            {row.client_type} · {formatDateTime(row.created_at)}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statusText: { ...text.label },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  icon: { width: 22 },
  message: { flex: 1, minWidth: 160, ...text.small },
  meta: text.caption,
  muted: text.muted,
});
