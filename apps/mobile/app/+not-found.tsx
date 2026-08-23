import { StyleSheet, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSizes, radii, spacing } from '../src/lib/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Text style={styles.code}>404</Text>
          <Text style={styles.title}>Page not found</Text>
          <Text style={styles.body}>
            The screen you're looking for doesn't exist.
          </Text>
          <Link href="/(tabs)/tasks" asChild>
            <Text style={styles.link}>Go to tasks</Text>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  code: {
    fontWeight: '700',
    fontSize: 96,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: '700',
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  body: {
    
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  link: {
    fontWeight: '700',
    fontSize: fontSizes.md,
    color: colors.primaryForeground,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
});
