import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Inbox Agent',
  slug: 'inbox-agent',
  scheme: 'inbox-agent',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.inbox.agent',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#fef9f3',
    },
    permissions: [
      'SCHEDULE_EXACT_ALARM',
      'USE_FULL_SCREEN_INTENT',
      'POST_NOTIFICATIONS',
      'WAKE_LOCK',
      'VIBRATE',
      // RECEIVE_BOOT_COMPLETED lets the OS reschedule our background fetch
      // task after a device reboot. Without it, the fetch dies on reboot.
      'RECEIVE_BOOT_COMPLETED',
    ],
  },
  ios: {
    bundleIdentifier: 'com.inbox.agent',
    infoPlist: {
      UIBackgroundModes: ['fetch', 'remote-notification'],
    },
  },
  plugins: [
    [
      'expo-notifications',
      {
        // Notification accent — matches WCAG-AA accent in src/lib/theme.ts.
        color: '#c64210',
        sounds: ['./assets/alarm.wav'],
      },
    ],
    'expo-router',
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
    googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
  },
};

export default config;
