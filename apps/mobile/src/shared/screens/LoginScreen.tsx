import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useDemoRole } from '../context/DemoRoleContext';
import { colors, spacing, text } from '../theme';
import AuthLayout, { useWideAuth } from '../components/AuthLayout';
import BrandMark from '../components/BrandMark';
import TextField from '../components/TextField';
import Button from '../components/Button';
import Card from '../components/Card';
import Notice from '../components/Notice';
import { ROLE_META, type DemoRole } from '../config/demo';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithPassword, signUp, setDemoRole } = useAuth();
  const { selectRole } = useDemoRole();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const wide = useWideAuth();

  const emailError = submitted && !email.trim() ? 'Enter your email address.' : null;
  const passwordError = submitted && !password.trim() ? 'Enter your password.' : null;

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!email.trim() || !password.trim()) {
      setErrorMsg(null);
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    if (isSignUp) {
      // Public self-registration ALWAYS creates a Patient account for security
      const { error } = await signUp(email.trim(), password, 'patient');
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        setDemoRole('patient');
        selectRole('patient');
        router.replace(ROLE_META.patient.href);
      }
    } else {
      const { error, role: userRole } = await signInWithPassword(email.trim(), password);
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
      } else {
        const destRole = userRole || 'patient';
        setDemoRole(destRole);
        selectRole(destRole);
        router.replace(ROLE_META[destRole].href);
      }
    }
  };

  const handleDemoAccess = (role: DemoRole) => {
    setDemoRole(role);
    selectRole(role);
    router.replace(ROLE_META[role].href);
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg(null);
    setSubmitted(false);
  };

  return (
    <AuthLayout>
          {wide ? (
            <View style={styles.wideHead}>
              <Text style={styles.wideTitle} accessibilityRole="header" aria-level={1}>
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </Text>
              <Text style={styles.subtitle}>Sign in to Tuloy Health, or open a demo workspace below.</Text>
            </View>
          ) : (
            <View style={styles.brand}>
              <BrandMark size={52} />
              <Text style={styles.title} accessibilityRole="header" aria-level={1}>
                Tuloy Health
              </Text>
              <Text style={styles.subtitle}>Unified Healthcare Platform</Text>
            </View>
          )}

          <Card>
            <View style={styles.formHead}>
              <Text style={styles.formTitle} accessibilityRole="header">
                {isSignUp ? 'Create a patient account' : 'Sign in'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isSignUp ? 'For patients only. Your care team is set up by your RHU.' : 'Use the email and password from your care team.'}
              </Text>
            </View>

            {errorMsg ? <Notice tone="error" message={errorMsg} /> : null}

            <TextField
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              error={emailError}
            />

            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={() => void handleSubmit()}
              error={passwordError}
            />

            {isSignUp ? (
              <Notice tone="info" message="Self-registration is for patients. BHW and Admin accounts are created by your administrator." />
            ) : null}

            <Button title={isSignUp ? 'Create patient account' : 'Sign in'} onPress={() => void handleSubmit()} loading={loading} />

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>{isSignUp ? 'Already have an account?' : 'New patient?'}</Text>
              <Button variant="ghost" compact title={isSignUp ? 'Sign in' : 'Create an account'} onPress={switchMode} />
            </View>
          </Card>

          <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no">
            <View style={styles.line} />
            <Text style={styles.dividerText}>or explore the demo</Text>
            <View style={styles.line} />
          </View>

          <Card title="Quick demo access" subtitle="Open any workspace with synthetic DEMO DATA. No account needed.">
            <View style={styles.demoButtonsRow}>
              {(['admin', 'bhw', 'patient'] as DemoRole[]).map((r) => (
                <Button
                  key={r}
                  title={ROLE_META[r].label}
                  icon={ROLE_META[r].icon}
                  onPress={() => handleDemoAccess(r)}
                  variant="secondary"
                  style={styles.demoBtn}
                  accessibilityLabel={`Open the ${ROLE_META[r].label} demo workspace`}
                />
              ))}
            </View>
            <Button
              variant="ghost"
              title="All demo personas and data reset"
              trailingIcon="chevron-right"
              onPress={() => router.navigate('/demo')}
              style={styles.fullDemo}
            />
          </Card>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  title: { ...text.display, textAlign: 'center', marginTop: spacing.sm },
  subtitle: { ...text.body, color: colors.muted, textAlign: 'center' },
  wideHead: { gap: spacing.xs, alignItems: 'center' },
  wideTitle: { ...text.display, textAlign: 'center' },
  formHead: { gap: spacing.xs },
  formTitle: text.title,
  formSubtitle: text.muted,
  switchRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  switchText: text.muted,
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: text.caption,
  demoButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  demoBtn: { flexGrow: 1, flexBasis: 110 },
  fullDemo: { alignSelf: 'center' },
});
