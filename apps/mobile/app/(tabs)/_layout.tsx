import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { CheckCircle2, Inbox, Settings } from 'lucide-react-native';
import { colors, spacing } from '../../src/lib/theme';

type IconName = 'tasks' | 'inbox' | 'settings';

function TabIcon({
  name,
  focused,
}: {
  name: IconName;
  focused: boolean;
}) {
  const color = focused ? colors.primary : colors.textMuted;
  const props = { color, size: 22, strokeWidth: focused ? 2.4 : 2 };
  let Icon;
  switch (name) {
    case 'tasks':
      Icon = CheckCircle2;
      break;
    case 'inbox':
      Icon = Inbox;
      break;
    case 'settings':
      Icon = Settings;
      break;
  }
  return (
    <View style={styles.icon}>
      <Icon {...props} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="tasks" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="inbox" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
