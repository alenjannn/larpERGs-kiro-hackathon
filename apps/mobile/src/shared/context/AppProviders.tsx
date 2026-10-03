import type { ReactNode } from 'react';
import { ConnectivityProvider } from './ConnectivityContext';
import { DemoRoleProvider } from './DemoRoleContext';
import { SyncProvider } from './SyncContext';

/** The three shared contexts allowed by tech.md §3, mounted once in app/_layout.tsx. */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConnectivityProvider>
      <DemoRoleProvider>
        <SyncProvider>{children}</SyncProvider>
      </DemoRoleProvider>
    </ConnectivityProvider>
  );
}
