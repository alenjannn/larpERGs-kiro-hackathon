import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import Card from './Card';
import LoadingSpinner from './LoadingSpinner';
import Notice from './Notice';
import { useAsyncData } from '../hooks/useAsyncData';
import { fetchConnectionTests, insertConnectionTest } from '../services/api';
import { toUserMessage } from '../services/supabase';
import { formatDateTime } from '../utils/date';
import { colors, spacing } from '../theme';
import type { ClientType } from '../types/db.types';

const ROLE_ICON: Record<ClientType, string> = { patient: '👤', bhw: '🏥', admin: '⚙️', system: '🛠️' };

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

  const status = error ? '🔴 Not connected' : data ? '🟢 Connected to Supabase' : '⏳ Connecting…';

  return (
    <Card
      title="Database connection test"
      subtitle={showAllRoles ? `${status} · records from all roles` : status}
      right={<Button compact title="Add Test Record" onPress={addRecord} loading={adding} disabled={!!error && !data} />}
    >
      {error ? <Notice tone="error" message={error} /> : null}
      {addError ? <Notice tone="error" message={addError} /> : null}
      {loading && !data ? <LoadingSpinner /> : null}
      {data && data.length === 0 ? <Text style={styles.muted}>No test records yet.</Text> : null}
      {data?.map((row) => (
        <View key={row.id} style={styles.row}>
          <Text style={styles.icon}>{ROLE_ICON[row.client_type] ?? '•'}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.border },
  icon: { width: 22, textAlign: 'center' },
  message: { flex: 1, fontSize: 14, color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  muted: { fontSize: 13, color: colors.muted },
});
