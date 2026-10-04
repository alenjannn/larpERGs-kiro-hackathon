import { useRouter } from 'expo-router';
import { ROLE_META } from '../config/demo';
import { useAuth } from '../context/AuthContext';
import { useDemoRole } from '../context/DemoRoleContext';
import { useEffectiveRole } from './useEffectiveRole';

/** Who is signed in, and sign out. Shared by the phone header and the desktop sidebar. */
export function useAccount() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { resetRole } = useDemoRole();
  const { role, isDemoPersona } = useEffectiveRole();

  // Sign out also forgets the saved demo persona, so a reload stays on /login (OC-15.3).
  const handleSignOut = async () => {
    await signOut();
    resetRole();
    router.replace('/login');
  };

  return {
    role,
    meta: role ? ROLE_META[role] : null,
    signedIn: !!user || isDemoPersona,
    who: user?.email ?? 'Demo persona',
    email: user?.email ?? null,
    signOut: handleSignOut,
  };
}
