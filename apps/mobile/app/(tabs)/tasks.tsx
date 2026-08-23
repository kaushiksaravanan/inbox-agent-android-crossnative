import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircle2, HelpCircle } from 'lucide-react-native';
import type { Task as SharedTask } from '@inbox/shared';
import { TaskRow, Task as RowTask } from '../../src/components/TaskRow';
import {
  colors,
  fontSizes,
  fontWeights,
  radii,
  spacing,
} from '../../src/lib/theme';
import { pushTasksToWidget } from '../../src/lib/widget';
import { withSyncIndicator } from '../../src/lib/privacy';
import { getAllTasks, updateTask } from '../../src/lib/local-db';
import { pollGmailAndExtract } from '../../src/lib/poll-gmail';
import { isGmailConnected, useGmailAuth } from '../../src/lib/gmail-oauth';
import { loadDemoTasks } from '../../src/lib/demo-emails';

// Local row shape rendered by TaskRow. The component only consumes a
// subset of the shared Task type, so we project the SQLite-backed rows
// onto its narrower interface.
type Task = SharedTask;

function toRowTask(t: Task): RowTask {
  return {
    id: t.id,
    title: t.title,
    detail: t.detail,
    priority: t.priority as RowTask['priority'],
    category: t.category as RowTask['category'],
    due_at: t.due_at,
    status: t.status,
  };
}

export default function TasksScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const listRef = useRef<FlatList<Task> | null>(null);

  // Gmail OAuth hook — mounted here so the empty-state "Connect Gmail"
  // CTA can drive promptAsync directly.
  const { promptAsync, isAuthenticating, isConnected: hookConnected } =
    useGmailAuth();

  const reloadTasks = useCallback(async () => {
    const rows = await getAllTasks();
    // Hide done tasks and order by due_at like the old screen did.
    const open = rows
      .filter((t) => t.status !== 'done')
      .sort((a, b) => {
        const ad = a.due_at ? new Date(a.due_at).getTime() : Infinity;
        const bd = b.due_at ? new Date(b.due_at).getTime() : Infinity;
        return ad - bd;
      });
    setTasks(open);

    // Push top 3 to Android home-screen widget (no-op on iOS).
    const top3 = open.slice(0, 3).map((t) => {
      const due = t.due_at ? new Date(t.due_at) : null;
      const time = due
        ? due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';
      return {
        title: t.title ?? '',
        detail: t.detail ?? '',
        time,
        priority: t.priority ?? 'low',
      };
    });
    pushTasksToWidget(top3).catch(() => {});
  }, []);

  // Initial load + Gmail connection probe.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const isConn = await isGmailConnected();
        if (!cancelled) setConnected(isConn);
      } catch {
        if (!cancelled) setConnected(false);
      }
      await reloadTasks();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadTasks]);

  // Keep `connected` in sync with the OAuth hook's view of the world
  // (it flips true after a successful prompt).
  useEffect(() => {
    if (hookConnected) setConnected(true);
  }, [hookConnected]);

  // Scroll to focused task on notification tap.
  useEffect(() => {
    if (!focus || !tasks.length) return;
    const idx = tasks.findIndex((t) => t.id === focus);
    if (idx >= 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: idx, animated: true });
      });
    }
  }, [focus, tasks]);

  const runPoll = useCallback(async () => {
    try {
      const result = await pollGmailAndExtract();
      await reloadTasks();
      setStatusBanner(
        result.newTasks > 0
          ? `${result.newTasks} new task${result.newTasks === 1 ? '' : 's'}`
          : 'Up to date',
      );
    } catch (err) {
      setStatusBanner(
        err instanceof Error ? err.message : 'Refresh failed',
      );
    } finally {
      setRefreshing(false);
      // Auto-clear banner after a short delay.
      setTimeout(() => setStatusBanner(null), 2500);
    }
  }, [reloadTasks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Wrap the fetch in the system privacy indicator so the Android
    // privacy dot lights up while we're syncing email-derived tasks.
    withSyncIndicator(runPoll);
  }, [runPoll]);

  const onConnectGmail = useCallback(async () => {
    try {
      await promptAsync();
    } catch {
      // Hook surfaces its own error state — just swallow here.
    }
  }, [promptAsync]);

  const onTryDemo = useCallback(async () => {
    try {
      const added = await loadDemoTasks();
      await reloadTasks();
      setStatusBanner(
        added > 0 ? `Loaded ${added} demo task${added === 1 ? '' : 's'}` : 'Demo data already loaded',
      );
      setTimeout(() => setStatusBanner(null), 2500);
    } catch (err) {
      setStatusBanner(err instanceof Error ? err.message : 'Demo load failed');
      setTimeout(() => setStatusBanner(null), 2500);
    }
  }, [reloadTasks]);

  const onDone = useCallback(async (task: RowTask) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    await updateTask(task.id, {
      status: 'done',
    });
  }, []);

  const onSnooze = useCallback(async (task: RowTask) => {
    const next = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, due_at: next } : t)),
    );
    await updateTask(task.id, { due_at: next });
  }, []);

  const toggleWhy = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Render the derivation details for a task. Surfaces the rule id and
  // every matched span (with quoted text) so the user can see exactly
  // why a piece of email turned into a task.
  const renderWhy = (task: Task) => {
    const d = task.derivedFrom;
    if (!d) {
      return (
        <Text style={styles.whyBody}>No provenance recorded.</Text>
      );
    }
    let ruleId = '';
    let spans: Array<{ field?: string; text: string }> = [];
    if (d.source === 'rule') {
      ruleId = d.ruleId;
      spans = d.matchedSpans;
    } else if (d.source === 'regex') {
      ruleId = d.patternId;
      spans = d.matchedSpans;
    } else if (d.source === 'model') {
      ruleId = d.modelId;
      spans = d.matchedSpans;
    }
    return (
      <View>
        <Text style={styles.whyLabel}>Rule</Text>
        <Text style={styles.whyValue}>{ruleId || d.source}</Text>
        {spans.length > 0 && (
          <>
            <Text style={[styles.whyLabel, { marginTop: spacing.sm }]}>
              Matched
            </Text>
            {spans.map((s, i) => (
              <View key={i} style={styles.whySpan}>
                {!!s.field && (
                  <Text style={styles.whySpanField}>{s.field}:</Text>
                )}
                <Text style={styles.whySpanText}>“{s.text}”</Text>
              </View>
            ))}
          </>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.muted}>Loading tasks…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty-state branches — drive based on Gmail connection state.
  const showConnectEmpty = !connected && tasks.length === 0;
  const showConnectedEmpty = connected && tasks.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <Text style={styles.subtitle}>
          {tasks.length} open
          {statusBanner ? ` · ${statusBanner}` : ''}
        </Text>
      </View>
      <FlatList
        ref={listRef}
        data={tasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={
          tasks.length === 0 ? styles.emptyContainer : undefined
        }
        renderItem={({ item }) => {
          const open = !!expanded[item.id];
          return (
            <View>
              <TaskRow
                task={toRowTask(item)}
                highlighted={item.id === focus}
                onDone={onDone}
                onSnooze={onSnooze}
              />
              <Pressable
                onPress={() => toggleWhy(item.id)}
                style={styles.whyToggle}
                accessibilityLabel="Why this task?"
              >
                <HelpCircle
                  color={colors.textMuted}
                  size={14}
                  strokeWidth={2}
                />
                <Text style={styles.whyToggleText}>
                  {open ? 'Hide why' : 'Why?'}
                </Text>
              </Pressable>
              {open && <View style={styles.whyCard}>{renderWhy(item)}</View>}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 200);
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          showConnectEmpty ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <CheckCircle2
                  color={colors.primary}
                  size={56}
                  strokeWidth={1.6}
                />
              </View>
              <Text style={styles.emptyTitle}>Connect Gmail</Text>
              <Text style={styles.emptyBody}>
                Let Inbox Agent read recent mail to extract tasks. Everything
                stays on-device.
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onConnectGmail}
                disabled={isAuthenticating}
                accessibilityLabel="Connect Gmail"
              >
                <Text style={styles.primaryButtonText}>
                  {isAuthenticating ? 'Connecting…' : 'Connect Gmail'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onTryDemo}
                accessibilityLabel="Try demo mode"
              >
                <Text style={styles.secondaryButtonText}>Try Demo Mode</Text>
              </TouchableOpacity>
            </View>
          ) : showConnectedEmpty ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <CheckCircle2
                  color={colors.primary}
                  size={56}
                  strokeWidth={1.6}
                />
              </View>
              <Text style={styles.emptyTitle}>No tasks yet</Text>
              <Text style={styles.emptyBody}>Pull to refresh.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontWeight: '700',
    fontSize: 32,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: {
    color: colors.textMuted,
  },
  separator: { height: spacing.xs },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontWeight: '700',
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  // Pill-shaped primary CTA, theme primary color.
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.md,
  },
  // Smaller pill, surface background, for the demo affordance.
  secondaryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
    fontSize: fontSizes.sm,
  },
  // "Why?" affordance — a small inline toggle under each task row.
  whyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: spacing.lg + spacing.md,
    marginTop: -spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  whyToggleText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  whyCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  whyLabel: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  whyValue: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginTop: 2,
  },
  whySpan: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  whySpanField: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.textMuted,
    marginRight: 4,
  },
  whySpanText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  whyBody: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});
