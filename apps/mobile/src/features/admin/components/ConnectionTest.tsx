import ConnectionTestPanel from '../../../shared/components/ConnectionTestPanel';

/** Admin sees connection-test records from every role (cross-role visibility). */
export default function ConnectionTest() {
  return <ConnectionTestPanel clientType="admin" showAllRoles />;
}
