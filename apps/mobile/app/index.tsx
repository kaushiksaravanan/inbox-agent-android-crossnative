import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { colors } from '../src/lib/theme';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let mounted = true;

    const refreshSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setAuthed(!!data.session);
      setLoading(false);
    };

    refreshSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthed(!!session);
    });

    const appSub = AppState.addEventListener('change', (next) => {
      if (
        appState.current.match(/inactive|background/) &&
        next === 'active'
      ) {
        // Re-validate session on foreground — refresh token may have been
        // revoked while we were backgrounded.
        refreshSession();
      }
      appState.current = next;
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      appSub.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return authed ? <Redirect href="/(tabs)/tasks" /> : <Redirect href="/pair" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
