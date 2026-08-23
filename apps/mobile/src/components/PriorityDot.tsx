import { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../lib/theme';

export type Priority = 'urgent' | 'high' | 'normal' | 'low';

const COLOR_BY_PRIORITY: Record<Priority, string> = {
  urgent: colors.danger,
  high: colors.primary,
  normal: colors.info,
  low: colors.textMuted,
};

interface Props {
  priority: Priority;
  size?: number;
  style?: ViewStyle;
}

export function PriorityDot({ priority, size = 10, style }: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (priority === 'urgent') {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 600 }),
          withTiming(1, { duration: 600 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = 1;
      opacity.value = 1;
    }
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [priority, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLOR_BY_PRIORITY[priority],
        },
        animStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    marginRight: 8,
  },
});

export default PriorityDot;
