import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useDemoRole } from '../context/DemoRoleContext';
import { colors, spacing } from '../theme';
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

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
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

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>TULOY Health</Text>
        <Text style={styles.subtitle}>Unified Healthcare Platform</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.formTitle}>{isSignUp ? 'Patient Account Registration' : 'Sign In'}</Text>
        
        {errorMsg && <View style={styles.noticeContainer}><Notice tone="error" message={errorMsg} /></View>}

        <TextField
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="user@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
        />

        {isSignUp && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>ℹ️ Note: Self-registration is for Patients. BHW and Admin accounts are provisioned securely by your Administrator.</Text>
          </View>
        )}

        <Button
          title={isSignUp ? 'Sign Up as Patient' : 'Sign In'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.switchModeBtn}>
          <Text style={styles.switchModeText}>
            {isSignUp ? 'Already have an account? Sign In' : "New patient? Create a Patient Account"}
          </Text>
        </TouchableOpacity>
      </Card>

      <Card style={styles.demoCard}>
        <Text style={styles.demoTitle}>⚡ Hackathon Quick-Access Demo</Text>
        <Text style={styles.demoDesc}>Bypass authentication to evaluate any portal:</Text>
        <View style={styles.demoButtonsRow}>
          {(['admin', 'bhw', 'patient'] as DemoRole[]).map((r) => (
            <Button
              key={r}
              title={`${ROLE_META[r].emoji} ${ROLE_META[r].label}`}
              onPress={() => handleDemoAccess(r)}
              variant="secondary"
              style={styles.demoBtn}
            />
          ))}
        </View>
        <TouchableOpacity onPress={() => router.navigate('/demo')} style={styles.fullDemoBtn}>
          <Text style={styles.fullDemoText}>📋 Open Full Persona & Reset Dashboard →</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.lg, maxWidth: 500, alignSelf: 'center', width: '100%' },
  headerContainer: { alignItems: 'center', marginVertical: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.primary, marginBottom: spacing.xs },
  subtitle: { fontSize: 15, color: colors.muted },
  card: { padding: spacing.lg, marginBottom: spacing.lg },
  formTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  noticeContainer: { marginBottom: spacing.md },
  infoBox: { backgroundColor: colors.infoBg, padding: spacing.md, borderRadius: 8, marginVertical: spacing.sm },
  infoText: { fontSize: 12, color: colors.info, lineHeight: 16 },
  submitBtn: { marginTop: spacing.md },
  switchModeBtn: { marginTop: spacing.md, alignItems: 'center' },
  switchModeText: { color: colors.info, fontSize: 14, fontWeight: '600' },
  demoCard: { padding: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  demoTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  demoDesc: { fontSize: 13, color: colors.muted, marginBottom: spacing.md },
  demoButtonsRow: { flexDirection: 'row', gap: spacing.xs },
  demoBtn: { flex: 1 },
  fullDemoBtn: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.xs },
  fullDemoText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});
