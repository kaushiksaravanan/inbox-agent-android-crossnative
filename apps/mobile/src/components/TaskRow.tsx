import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { PriorityDot, Priority } from './PriorityDot';
import { CategoryIcon, Category } from './CategoryIcon';
import { colors, fontSizes, radii, spacing } from '../lib/theme';

export interface Task {
  id: string;
  title: string;
  detail?: string | null;
  priority?: Priority | null;
  category?: Category | null;
  due_at?: string | null;
  status?: string | null;
}

interface Props {
  task: Task;
  highlighted?: boolean;
  onPress?: (task: Task) => void;
  onDone?: (task: Task) => void;
  onSnooze?: (task: Task) => void;
}

function relativeTime(iso?: string | null): string | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  const now = Date.now();
  const diff = target - now;
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const past = diff < 0;
  let value: string;
  if (abs < minute) value = 'now';
  else if (abs < hour) value = `${Math.round(abs / minute)}m`;
  else if (abs < day) value = `${Math.round(abs / hour)}h`;
  else value = `${Math.round(abs / day)}d`;
  if (value === 'now') return 'now';
  return past ? `${value} ago` : `in ${value}`;
}

export function TaskRow({
  task,
  highlighted = false,
  onPress,
  onDone,
  onSnooze,
}: Props) {
  const due = useMemo(() => relativeTime(task.due_at), [task.due_at]);
  const priority = (task.priority ?? 'normal') as Priority;
  const category = (task.category ?? 'other') as Category;

  return (
    <Pressable
      onPress={() => onPress?.(task)}
      style={({ pressed }) => [
        styles.row,
        highlighted && styles.rowHighlighted,
        pressed && styles.rowPressed,
      ]}
    >
      <PriorityDot priority={priority} size={12} />
      <View style={styles.iconCol}>
        <CategoryIcon category={category} size={36} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {task.title}
        </Text>
        {!!task.detail && (
          <Text style={styles.detail} numberOfLines={2}>
            {task.detail}
          </Text>
        )}
        <View style={styles.metaRow}>
          {due && <Text style={styles.due}>{due}</Text>}
        </View>
      </View>
      <View style={styles.actions}>
        {onDone && (
          <TouchableOpacity
            style={[styles.action, styles.actionDone]}
            onPress={() => onDone(task)}
            accessibilityLabel="Mark done"
          >
            <Check color={colors.success} size={18} strokeWidth={3} />
          </TouchableOpacity>
        )}
        {onSnooze && (
          <TouchableOpacity
            style={[styles.action, styles.actionSnooze]}
            onPress={() => onSnooze(task)}
            accessibilityLabel="Snooze"
          >
            <Clock color={colors.warning} size={18} strokeWidth={2.4} />
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowHighlighted: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  rowPressed: {
    opacity: 0.7,
  },
  iconCol: {
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    fontWeight: '700',
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  detail: {
    
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  due: {
    fontWeight: '500',
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  action: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDone: {
    backgroundColor: colors.success + '22',
  },
  actionDoneText: {
    color: colors.success,
    fontSize: 18,
    fontWeight: '700',
  },
  actionSnooze: {
    backgroundColor: colors.warning + '22',
  },
  actionSnoozeText: {
    color: colors.warning,
    fontSize: 16,
  },
});

export default TaskRow;
