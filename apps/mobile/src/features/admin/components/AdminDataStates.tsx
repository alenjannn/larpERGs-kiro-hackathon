import EmptyState from '../../../shared/components/EmptyState';
import LastUpdated from '../../../shared/components/LastUpdated';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import Notice from '../../../shared/components/Notice';

interface Props {
  loading: boolean;
  hasData: boolean;
  error: string | null;
  fromCache?: boolean;
  cachedAt?: string | null;
  fetchError?: string | null;
  onRetry: () => void;
}

/** Loading, error (no data), and offline/cached states shared by the RHU screens. */
export default function AdminDataStates({ loading, hasData, error, fromCache, cachedAt, fetchError, onRetry }: Props) {
  if (loading && !hasData) return <LoadingSpinner />;
  if (!hasData && error) {
    return (
      <>
        <Notice tone="error" message={error} />
        <EmptyState
          title="Could not load the RHU workspace"
          message="Connect once to load this information. After that, the last copy stays on this device."
          action={{ label: 'Try again', onPress: onRetry }}
        />
      </>
    );
  }
  return (
    <>
      {error ? <Notice tone="error" message={error} /> : null}
      {fromCache && cachedAt ? <LastUpdated at={cachedAt} /> : null}
      {fetchError ? (
        <Notice tone={fromCache ? 'info' : 'warning'} message={fromCache ? `Showing saved information. ${fetchError}` : fetchError} />
      ) : null}
    </>
  );
}
