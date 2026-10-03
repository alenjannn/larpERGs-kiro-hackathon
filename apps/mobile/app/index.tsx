import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useEffectiveRole } from '../src/shared/hooks/useEffectiveRole';
import { ROLE_META } from '../src/shared/config/demo';
import { colors } from '../src/shared/theme';

export default function Index() {
  // Auth role, or the saved demo persona (Spec 02, K1).
  const { role, loading } = useEffectiveRole();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!role) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={ROLE_META[role].href} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
