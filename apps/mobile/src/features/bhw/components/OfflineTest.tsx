import { Platform, StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Notice from '../../../shared/components/Notice';
import { newId } from '../../../shared/utils/id';
import { spacing } from '../../../shared/theme';
import type { useOfflineSync } from '../hooks/useOfflineSync';
import SyncResultNotice from './SyncResultNotice';

type OfflineSync = ReturnType<typeof useOfflineSync>;

/** R3: create a record with no network, then push it with "Sync Now". */
export default function OfflineTest({ sync, onSynced }: { sync: OfflineSync; onSynced?: () => void }) {
  async function addOfflineRecord() {
    const id = newId();
    await sync.saveOffline({
      id,
      entity: 'connection_test',
      message: `BHW offline test record ${new Date().toLocaleTimeString()}`,
    });
  }

  async function runSync() {
    const result = await sync.syncNow();
    if (result && result.synced > 0) onSynced?.();
  }

  return (
    <Card
      title="Offline storage test"
      subtitle={`${Platform.OS === 'web' ? 'Browser localStorage' : 'SQLite'} · ${sync.pendingCount} pending`}
    >
      <Text style={styles.help}>Works without internet: records are saved on this device first, then uploaded on Sync Now.</Text>
      <View style={styles.row}>
        <Button title="Add Offline Test Record" variant="secondary" onPress={addOfflineRecord} style={styles.flex} />
        <Button title={`Sync Now (${sync.pendingCount})`} onPress={runSync} loading={sync.syncing} disabled={sync.pendingCount === 0} style={styles.flex} />
      </View>
      {sync.storageError ? <Notice tone="error" message={sync.storageError} /> : null}
      {sync.actionError ? <Notice tone="error" message={sync.actionError} /> : null}
      {sync.offlineNotice ? <Notice tone="info" message={sync.offlineNotice} /> : null}
      <SyncResultNotice result={sync.lastResult} />
    </Card>
  );
}

const styles = StyleSheet.create({
  help: { fontSize: 13, color: '#5C6B66' },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  flex: { flexGrow: 1, flexBasis: 180 },
});
