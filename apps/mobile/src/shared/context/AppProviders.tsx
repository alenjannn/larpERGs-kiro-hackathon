import type { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { ConnectivityProvider } from './ConnectivityContext';
import { DemoRoleProvider } from './DemoRoleContext';
import { SyncProvider } from './SyncContext';

/** The shared contexts: Auth, Connectivity, DemoRole, and Sync, mounted once in app/_layout.tsx. */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ConnectivityProvider>
        <DemoRoleProvider>
          <SyncProvider>{children}</SyncProvider>
        </DemoRoleProvider>
      </ConnectivityProvider>
    </AuthProvider>
  );
}
