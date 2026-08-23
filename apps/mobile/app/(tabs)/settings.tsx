import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import {
  isGmailConnected,
  revokeGmailAccess,
  useGmailAuth,
} from '../../src/lib/gmail-oauth';
import { pollGmailAndExtract } from '../../src/lib/poll-gmail';
import {
  getBackgroundPollStatus,
  type BackgroundPollStatus,
} from '../../src/lib/background-poll';
import {
  clearAll,
  getMeta,
  getTaskCount,
  setMeta,
} from '../../src/lib/local-db';
import { colors, fontSizes, radii, spacing } from '../../src/lib/theme';

const SYNC_INTERVAL_OPTIONS: Array<{ label: string; minutes: number }> = [
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
];

const DEFAULT_SYNC_MINUTES = 15;

function formatRelative(epochMs: number | undefined): string {
  if (!epochMs) return 'Never';
  const diff = Date.now() - epochMs;
  if (diff < 0) return 'Just now';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

// Renders the human-readable Background Sync status row. Pure function so
// it stays cheap to test without booting expo-task-manager.
function formatBackgroundStatus(
  bgPoll: BackgroundPollStatus | null,
): string {
  if (!bgPoll) return 'Checking…';
  // 1 = Restricted (Low Power), 2 = Denied, 3 = Available — see
  // BackgroundFetch.BackgroundFetchStatus enum.
  if (bgPoll.status === 1) return 'Restricted by OS';
  if (bgPoll.status === 2) return 'Disabled by user';
  if (!bgPoll.registered) return 'Off';
  const min = Math.round(bgPoll.intervalSeconds / 60);
  return `On · ~every ${min}m`;
}

export default function SettingsScreen() {
  const { promptAsync, isAuthenticating, isConnected: hookConnected } =
    useGmailAuth();

  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [syncMinutes, setSyncMinutes] = useState<number>(DEFAULT_SYNC_MINUTES);
  const [lastPollAt, setLastPollAt] = useState<number | undefined>(undefined);
  const [syncing, setSyncing] = useState(false);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [bgPoll, setBgPoll] = useState<BackgroundPollStatus | null>(null);
  const [tick, setTick] = useState(0);

  // Re-render the "last synced" label every 30s without re-querying.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(async () => {
    const [connected, storedInterval, lastPoll, count, bgStatus] =
      await Promise.all([
        isGmailConnected(),
        getMeta<number>('syncIntervalMinutes'),
        getMeta<number>('lastPollAt'),
        getTaskCount(),
        getBackgroundPollStatus().catch(
          () => null as BackgroundPollStatus | null,
        ),
      ]);
    setGmailConnected(connected);
    setSyncMinutes(
      typeof storedInterval === 'number' ? storedInterval : DEFAULT_SYNC_MINUTES,
    );
    setLastPollAt(typeof lastPoll === 'number' ? lastPoll : undefined);
    setTaskCount(count);
    setBgPoll(bgStatus);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // The OAuth hook flips isConnected when the prompt finishes — mirror to UI.
  useEffect(() => {
    if (hookConnected !== gmailConnected) {
      setGmailConnected(hookConnected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hookConnected]);

  const handleConnect = useCallback(async () => {
    try {
      await promptAsync();
      // promptAsync resolves before the hook persists tokens; let it settle.
      setTimeout(() => {
        void refresh();
      }, 500);
    } catch (err) {
      Alert.alert('Connect failed', (err as Error).message ?? 'Unknown error');
    }
  }, [promptAsync, refresh]);

  const handleDisconnect = useCallback(() => {
    Alert.alert(
      'Disconnect Gmail',
      'Revoke this app’s access to your Gmail account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await revokeGmailAccess();
            await refresh();
          },
        },
      ],
    );
  }, [refresh]);

  const handlePickInterval = useCallback(async (minutes: number) => {
    setSyncMinutes(minutes);
    await setMeta('syncIntervalMinutes', minutes);
  }, []);

  const handleSyncNow = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await pollGmailAndExtract();
      const now = Date.now();
      await setMeta('lastPollAt', now);
      setLastPollAt(now);
      const count = await getTaskCount();
      setTaskCount(count);
      Alert.alert(
        'Sync complete',
        `${res.newEmails} new email${res.newEmails === 1 ? '' : 's'}, ${res.newTasks} new task${res.newTasks === 1 ? '' : 's'}.`,
      );
    } catch (err) {
      Alert.alert('Sync failed', (err as Error).message ?? 'Unknown error');
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear all local data',
      'This deletes every task, every seen-email marker, and revokes Gmail access on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAll();
              await revokeGmailAccess();
            } finally {
              router.replace('/pair');
            }
          },
        },
      ],
    );
  }, []);

  const version = Constants.expoConfig?.version ?? '0.0.0';
  const commitHash =
    (Constants.expoConfig?.extra as { commitHash?: string } | undefined)
      ?.commitHash ?? null;

  if (gmailConnected === null) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // tick is read to keep the relative timestamp fresh.
  void tick;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Gmail account ------------------------------------------------ */}
        <Section title="Gmail account">
          <View style={styles.cardBody}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Status</Text>
              <Text
                style={[
                  styles.rowValue,
                  {
                    color: gmailConnected ? colors.success : colors.textMuted,
                  },
                ]}
              >
                {gmailConnected ? 'Connected' : 'Not connected'}
              </Text>
            </View>
            <View style={styles.cardActions}>
              {gmailConnected ? (
                <TouchableOpacity
                  onPress={handleDisconnect}
                  style={[styles.button, styles.buttonOutline]}
                >
                  <Text
                    style={[styles.buttonText, { color: colors.danger }]}
                  >
                    Disconnect
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleConnect}
                  disabled={isAuthenticating}
                  style={[
                    styles.button,
                    styles.buttonPrimary,
                    isAuthenticating && styles.buttonDisabled,
                  ]}
                >
                  {isAuthenticating ? (
                    <ActivityIndicator color={colors.primaryForeground} />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      Connect Gmail
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Section>

        {/* Sync --------------------------------------------------------- */}
        <Section title="Sync">
          <View style={styles.cardBody}>
            <Text style={styles.fieldLabel}>Interval</Text>
            <View style={styles.segmentRow}>
              {SYNC_INTERVAL_OPTIONS.map((opt) => {
                const active = opt.minutes === syncMinutes;
                return (
                  <TouchableOpacity
                    key={opt.minutes}
                    onPress={() => handlePickInterval(opt.minutes)}
                    style={[
                      styles.segment,
                      active && styles.segmentActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={handleSyncNow}
                disabled={syncing || !gmailConnected}
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  (syncing || !gmailConnected) && styles.buttonDisabled,
                ]}
              >
                {syncing ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.buttonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Sync now
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.row, styles.rowMinor]}>
              <Text style={styles.rowMutedLabel}>Last synced</Text>
              <Text style={styles.rowMutedValue}>
                {formatRelative(lastPollAt)}
              </Text>
            </View>
            <View style={[styles.row, styles.rowMinor]}>
              <Text style={styles.rowMutedLabel}>Background sync</Text>
              <Text style={styles.rowMutedValue}>
                {formatBackgroundStatus(bgPoll)}
              </Text>
            </View>
          </View>
        </Section>

        {/* Local data --------------------------------------------------- */}
        <Section title="Local data">
          <View style={styles.cardBody}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Tasks stored</Text>
              <Text style={styles.rowValue}>{taskCount}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={handleClearAll}
                style={[styles.button, styles.buttonDanger]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Clear all local data
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        {/* About -------------------------------------------------------- */}
        <Section title="About">
          <View style={styles.cardBody}>
            <Text style={styles.aboutText}>
              Your email never leaves your device. Tap any task to see why
              it&rsquo;s here.
            </Text>
            <View style={[styles.row, styles.rowMinor]}>
              <Text style={styles.rowMutedLabel}>Version</Text>
              <Text style={styles.rowMutedValue}>
                {version}
                {commitHash ? ` · ${commitHash.slice(0, 7)}` : ''}
              </Text>
            </View>
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: spacing['3xl'] },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontWeight: '700',
    fontSize: 32,
    color: colors.textPrimary,
  },

  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cardActions: {
    marginTop: spacing.md,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowMinor: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  rowLabel: {
    fontWeight: '500',
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  rowValue: {
    fontWeight: '600',
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  rowMutedLabel: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  rowMutedValue: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  fieldLabel: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primaryForeground,
  },

  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    minHeight: 44,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonOutline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },

  aboutText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
