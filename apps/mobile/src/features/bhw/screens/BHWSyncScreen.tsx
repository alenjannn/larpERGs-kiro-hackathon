import { Platform, StyleSheet, Text, View } from 'react-native';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import StatTile from '../../../shared/components/StatTile';
import { useOnlineStatus } from '../../../shared/hooks/useOnlineStatus';
import { colors, spacing } from '../../../shared/theme';
import SyncResultNotice from '../components/SyncResultNotice';
import SyncStatus from '../components/SyncStatus';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function BHWSyncScreen() {
  const sync = useOfflineSync();
  const online = useOnlineStatus();
  const syncedCount = sync.items.filter((i) => i.sync_status === 'synced').length;
  const failedCount = sync.items.filter((i) => i.sync_status === 'failed').length;

  return (
    <Screen
      title="Sync"
      subtitle="Send field records to the demo server"
      refreshing={sync.loading && sync.items.length > 0}
      onRefresh={sync.reloadQueue}
    >
      <Card
        title={online === null ? 'Connection: checked on sync' : online ? '🟢 Online' : '🔴 Offline'}
        subtitle={`Local storage: ${Platform.OS === 'web' ? 'browser localStorage' : 'SQLite (tuloy_offline.db)'}`}
      >
        <View style={styles.stats}>
          <StatTile label="Pending" value={sync.pendingCount - failedCount} />
          <StatTile label="Failed (will retry)" value={failedCount} />
          <StatTile label="Synced" value={syncedCount} />
        </View>
        <Button title={`Sync Now (${sync.pendingCount})`} onPress={sync.syncNow} loading={sync.syncing} disabled={sync.pendingCount === 0} />
        {online === false ? <Notice tone="info" message="You're offline. Keep collecting — records stay on this device until you sync." /> : null}
        {sync.storageError ? <Notice tone="error" message={sync.storageError} /> : null}
        {sync.actionError ? <Notice tone="error" message={sync.actionError} /> : null}
        <SyncResultNotice result={sync.lastResult} />
      </Card>

      <Card
        title="Offline queue"
        subtitle="Patients sync first, then records"
        right={syncedCount > 0 ? <Button compact variant="secondary" title="Clear synced" onPress={sync.clearSynced} /> : null}
      >
        <SyncStatus items={sync.items} />
      </Card>
      <Text style={styles.footnote}>Tip: turn on airplane mode / DevTools “Offline”, add records, then come back online and tap Sync Now.</Text>
      <Text style={styles.footnote}>Sync Now sends records to the demo server only. Full cloud sync is deferred.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footnote: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
