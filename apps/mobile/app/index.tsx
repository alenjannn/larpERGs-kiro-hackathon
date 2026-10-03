import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/shared/context/AuthContext';
import { ROLE_META } from '../src/shared/config/demo';
import { colors } from '../src/shared/theme';

export default function Index() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || !role) {
    return <Redirect href="/login" />;
  }

  return <Redirect href={ROLE_META[role].href} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
});
