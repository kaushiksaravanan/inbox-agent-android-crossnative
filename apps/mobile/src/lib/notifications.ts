import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export const ALARM_CHANNEL_ID = 'alarms';
export const ALARM_CATEGORY_ID = 'alarm';

export interface AlarmTask {
  id: string;
  title: string;
  detail?: string;
  /** Local fire time. */
  fireAt: Date;
}

/**
 * Request notification permissions and return an Expo push token.
 * Also configures the high-priority "alarms" channel on Android.
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: 'Alarms',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'alarm.wav',
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#ea7c1c',
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }

  if (!Device.isDevice) {
    console.warn(
      '[notifications] Push notifications require a physical device',
    );
    return null;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[notifications] Permission not granted for notifications');
    return null;
  }

  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } })?.eas
      ?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

  if (!projectId) {
    console.warn(
      '[notifications] No EAS projectId found in app config; cannot fetch Expo push token',
    );
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (err) {
    console.warn('[notifications] Failed to get Expo push token', err);
    return null;
  }
}

/**
 * Schedule a high-priority local alarm notification for the given task.
 * Returns the scheduled notification identifier.
 */
export async function scheduleLocalAlarm(task: AlarmTask): Promise<string> {
  const fireAt = task.fireAt;

  const trigger: Notifications.CalendarTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    year: fireAt.getFullYear(),
    month: fireAt.getMonth() + 1,
    day: fireAt.getDate(),
    hour: fireAt.getHours(),
    minute: fireAt.getMinutes(),
    second: fireAt.getSeconds(),
    repeats: false,
    channelId: ALARM_CHANNEL_ID,
  };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: task.title,
      body: task.detail ?? '',
      data: { taskId: task.id },
      sound: 'alarm.wav',
      priority: Notifications.AndroidNotificationPriority.MAX,
      sticky: true,
      categoryIdentifier: ALARM_CATEGORY_ID,
    },
    trigger,
  });
}

export async function cancelLocalAlarm(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllLocalAlarms(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
