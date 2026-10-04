import type { ReactNode } from 'react';
import Disclosure from './Disclosure';

/** Demo diagnostics (connection and offline tests), collapsed at the end of a role's home screen. */
export default function DeveloperTools({ children }: { children: ReactNode }) {
  return (
    <Disclosure icon="tools" title="Developer tools" subtitle="Connection and storage tests for the demo">
      {children}
    </Disclosure>
  );
}
