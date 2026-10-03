import { useAuth } from '../context/AuthContext';
import { useDemoRole } from '../context/DemoRoleContext';
import type { DemoRole } from '../config/demo';

/**
 * The role used by the route guards (Spec 02, decision K1).
 * A real or quick-access login wins; otherwise the demo persona saved in
 * tuloy:v1:demo_role, so a reload (online or offline) stays in the workspace.
 *
 * SECURITY NOTE: the saved persona is a client-side value. It grants exactly
 * what the existing Quick-Access demo buttons grant; there is no real
 * authentication in this demo (product.md §3). Keep this note until real auth
 * replaces demo personas.
 */
export function useEffectiveRole(): { loading: boolean; role: DemoRole | null; isDemoPersona: boolean } {
  const auth = useAuth();
  const demo = useDemoRole();
  const role = auth.role ?? demo.role;
  return { loading: auth.loading || !demo.ready, role, isDemoPersona: !auth.role && !!demo.role };
}
