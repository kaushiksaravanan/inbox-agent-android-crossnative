import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inbox as InboxIcon } from 'lucide-react-native';
import { openLocalDb } from '../../src/lib/local-db';
import { colors, fontSizes, radii, spacing } from '../../src/lib/theme';

interface ProcessedRow {
  gmail_id: string;
  seen_at: number | null;
  task_count: number;
}

interface SeenRow {
  gmail_id: string;
  seen_at: number | null;
}

interface TaskCountRow {
  source_email_id: string | null;
  n: number;
}

function dayLabel(ms: number | null | undefined): string {
  if (!ms) return 'Earlier';
  const d = new Date(ms);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 86_400_000;
  if (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
    return 'Today';
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (
    d.getFullYear() === yest.getFullYear() &&
    d.getMonth() === yest.getMonth() &&
    d.getDate() === yest.getDate()
  )
    return 'Yesterday';
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function timeLabel(ms: number | null | undefined): string {
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryScreen() {
  const [rows, setRows] = useState<ProcessedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const db = await openLocalDb();
    const seen = await db.getAllAsync<SeenRow>(
      'SELECT gmail_id, seen_at FROM emails_seen ORDER BY seen_at DESC LIMIT 200',
    );
    // Build task-count map keyed by source_email_id.
    const counts = await db.getAllAsync<TaskCountRow>(
      `SELECT source_email_id, COUNT(*) AS n
         FROM tasks
        WHERE source_email_id IS NOT NULL
        GROUP BY source_email_id`,
    );
    const countMap = new Map<string, number>();
    for (const c of counts) {
      if (c.source_email_id) countMap.set(c.source_email_id, c.n);
    }
    const merged: ProcessedRow[] = seen.map((s) => ({
      gmail_id: s.gmail_id,
      seen_at: s.seen_at,
      task_count: countMap.get(s.gmail_id) ?? 0,
    }));
    setRows(merged);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Count processed today for the summary line.
  const processedToday = useMemo(() => {
    const now = new Date();
    return rows.filter((r) => {
      if (!r.seen_at) return false;
      const d = new Date(r.seen_at);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }).length;
  }, [rows]);

  const sections = useMemo(() => {
    const groups = new Map<string, ProcessedRow[]>();
    for (const r of rows) {
      const label = dayLabel(r.seen_at);
      const arr = groups.get(label) ?? [];
      arr.push(r);
      groups.set(label, arr);
    }
    return Array.from(groups.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [rows]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const renderItem = ({ item }: { item: ProcessedRow }) => (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <View style={styles.rowHeader}>
          <Text style={styles.primaryLine} numberOfLines={1}>
            Processed at {timeLabel(item.seen_at)}
          </Text>
          <Text style={styles.taskBadge}>
            {item.task_count}{' '}
            {item.task_count === 1 ? 'task' : 'tasks'}
          </Text>
        </View>
        <Text style={styles.secondaryLine} numberOfLines={1}>
          {item.task_count === 0
            ? 'No tasks extracted from this pass.'
            : `Generated ${item.task_count} task${item.task_count === 1 ? '' : 's'} from this email.`}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.muted}>Loading history…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
          Processed {processedToday}{' '}
          {processedToday === 1 ? 'email' : 'emails'} today
        </Text>
      </View>
      <View style={styles.explainer}>
        <Text style={styles.explainerText}>
          We don’t store email content. This shows when we last looked at your
          inbox and how many tasks each pass produced.
        </Text>
      </View>
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <InboxIcon color={colors.primary} size={56} strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>Nothing processed yet</Text>
          <Text style={styles.emptyBody}>
            When we scan your inbox, you’ll see timestamps and task counts
            here.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.gmail_id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
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
  explainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explainerText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: colors.textMuted },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  separator: { height: spacing.xs },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowBody: { flex: 1 },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  primaryLine: {
    fontWeight: '600',
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  taskBadge: {
    fontWeight: '700',
    fontSize: fontSizes.xs,
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  secondaryLine: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
