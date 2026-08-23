import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/lib/theme';
import { ALARM_CHANNEL_ID, ALARM_CATEGORY_ID } from '../src/lib/notifications';
// Side-effect import: defineTask() runs at module load so the OS can find
// our background poll handler by name on each wakeup. Do NOT remove.
import '../src/lib/background-poll';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'alarm.wav',
      vibrationPattern: [0, 500, 250, 500],
      lightColor: colors.primary,
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }

  await Notifications.setNotificationCategoryAsync(ALARM_CATEGORY_ID, [
    {
      identifier: 'open',
      buttonTitle: 'Open',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'snooze',
      buttonTitle: 'Snooze 1h',
      options: { opensAppToForeground: false },
    },
  ]);
}

export default function RootLayout() {
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const receivedListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    configureNotifications();

    receivedListener.current = Notifications.addNotificationReceivedListener(
      () => {},
    );

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as
          | { taskId?: string; type?: string }
          | undefined;
        const action = response.actionIdentifier;
        if (action === 'snooze' && data?.taskId) {
          router.push(`/(tabs)/tasks?focus=${data.taskId}`);
          return;
        }
        if (data?.taskId) {
          router.push(`/(tabs)/tasks?focus=${data.taskId}`);
        }
      });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      if (receivedListener.current) {
        Notifications.removeNotificationSubscription(receivedListener.current);
      }
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </SafeAreaProvider>
  );
}
