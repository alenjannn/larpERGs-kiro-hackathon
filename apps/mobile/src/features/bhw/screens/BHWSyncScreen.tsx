import { Platform, StyleSheet, View } from 'react-native';
import Text from '../../../shared/components/Text';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';
import Screen from '../../../shared/components/Screen';
import { useConnectivity } from '../../../shared/context/ConnectivityContext';
import Icon from '../../../shared/components/Icon';
import { colors, spacing, text } from '../../../shared/theme';
import SyncCounts from '../components/SyncCounts';
import SyncResultNotice from '../components/SyncResultNotice';
import SyncStatus from '../components/SyncStatus';
import { useOfflineSync } from '../hooks/useOfflineSync';

/** Sync center (B-4): what is still on this phone, and Sync Now. */
export default function BHWSyncScreen() {
  const sync = useOfflineSync();
  const { isOnline } = useConnectivity();

  return (
    <Screen
      title="Sync"
      subtitle="What is still on this device, and sending it to the demo server"
      refreshing={sync.loading && sync.items.length > 0}
      onRefresh={sync.reloadQueue}
    >
      <Card
        title={isOnline === null ? 'Connection: checked on sync' : isOnline ? 'Online' : 'Offline'}
        subtitle={`Saved in ${Platform.OS === 'web' ? 'this browser (localStorage)' : 'this phone (SQLite)'}`}
        right={
          <View style={styles.conn} accessible accessibilityLabel={isOnline === false ? 'Offline' : isOnline ? 'Online' : 'Connection unknown'}>
            <Icon name={isOnline === false ? 'offline' : isOnline ? 'check' : 'clock'} size={14} color={isOnline === false ? colors.text : isOnline ? colors.success : colors.muted} />
          </View>
        }
      >
        {sync.loading && sync.items.length === 0 ? <LoadingSpinner /> : <SyncCounts counts={sync.counts} />}
        <Button
          icon="arrow-up"
          title={sync.syncing ? 'Sending…' : `Sync Now (${sync.pendingCount})`}
          onPress={sync.syncNow}
          loading={sync.syncing}
          disabled={sync.pendingCount === 0}
          accessibilityLabel={`Sync Now, ${sync.pendingCount} item${sync.pendingCount === 1 ? '' : 's'} waiting`}
        />
        {isOnline === false && !sync.offlineNotice ? (
          <Notice tone="info" message="You're offline. Keep collecting. Everything stays on this device until you tap Sync Now while connected." />
        ) : null}
        {sync.offlineNotice ? <Notice tone="info" message={sync.offlineNotice} /> : null}
        {sync.storageError ? <Notice tone="error" message={sync.storageError} /> : null}
        {sync.actionError ? <Notice tone="error" message={sync.actionError} /> : null}
        <SyncResultNotice result={sync.lastResult} needsReview={sync.counts.needs_review} />
      </Card>
      <Card
        title="Saved on this device"
        subtitle="Patients are sent first, then records. An item shows Synced only after the server confirms it."
        right={sync.counts.synced > 0 ? <Button compact variant="secondary" title="Clear synced" onPress={sync.clearSynced} /> : null}
      >
        <SyncStatus items={sync.items} syncing={sync.syncing} />
      </Card>
      <Card title="How sync works">
        <Text style={styles.footnote}>• Sync Now sends field records to the demo server only. Full cloud sync is deferred.</Text>
        <Text style={styles.footnote}>• Tip: turn on airplane mode or DevTools “Offline”, add records, then come back online and tap Sync Now.</Text>
        {sync.counts.needs_review > 0 ? (
          <Text style={styles.footnote}>• Needs review: nothing was overwritten. Resolving this in the app isn&apos;t available yet.</Text>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footnote: text.muted,
  conn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.mutedBg, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs },
});
