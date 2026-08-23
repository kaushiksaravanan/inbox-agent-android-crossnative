import { View, StyleSheet } from 'react-native';
import {
  Briefcase,
  User,
  CreditCard,
  Plane,
  MessageSquare,
  Newspaper,
  Pin,
} from 'lucide-react-native';
import { colors } from '../lib/theme';

export type Category =
  | 'work'
  | 'personal'
  | 'finance'
  | 'travel'
  | 'social'
  | 'newsletter'
  | 'other';

const ICONS = {
  work: Briefcase,
  personal: User,
  finance: CreditCard,
  travel: Plane,
  social: MessageSquare,
  newsletter: Newspaper,
  other: Pin,
} as const;

const TINTS: Record<Category, string> = {
  work: colors.info,
  personal: colors.primary,
  finance: colors.success,
  travel: colors.primarySoft,
  social: colors.primary,
  newsletter: colors.textMuted,
  other: colors.textSecondary,
};

interface Props {
  category: Category;
  size?: number;
}

export function CategoryIcon({ category, size = 32 }: Props) {
  const tint = TINTS[category] ?? colors.textMuted;
  const Icon = ICONS[category] ?? ICONS.other;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: tint + '22',
        },
      ]}
    >
      <Icon color={tint} size={size * 0.55} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CategoryIcon;
