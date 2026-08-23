import { NativeModules, Platform } from 'react-native';

type PrivacyBridge = {
  startSyncIndicator: () => Promise<boolean>;
  stopSyncIndicator: () => Promise<boolean>;
};

function getBridge(): PrivacyBridge | null {
  if (Platform.OS !== 'android') return null;
  const bridge = (NativeModules as any).InboxPrivacyBridge as
    | PrivacyBridge
    | undefined;
  return bridge ?? null;
}

/**
 * Start the foreground sync indicator. On Android 14+ this lights up the
 * system privacy dot in the status bar and surfaces an ongoing
 * low-priority notification while the agent is syncing email.
 *
 * No-op on iOS and when the native bridge is unavailable.
 */
export async function startSyncIndicator(): Promise<boolean> {
  const bridge = getBridge();
  if (!bridge) return false;
  try {
    await bridge.startSyncIndicator();
    return true;
  } catch {
    return false;
  }
}

/**
 * Stop the foreground sync indicator and dismiss the ongoing notification.
 * No-op on iOS and when the native bridge is unavailable.
 */
export async function stopSyncIndicator(): Promise<boolean> {
  const bridge = getBridge();
  if (!bridge) return false;
  try {
    await bridge.stopSyncIndicator();
    return true;
  } catch {
    return false;
  }
}

/**
 * Wrap an async operation so the privacy indicator is shown for its duration.
 * Always stops the indicator even if the inner call throws.
 */
export async function withSyncIndicator<T>(fn: () => Promise<T>): Promise<T> {
  if (Platform.OS !== 'android') return fn();
  const bridge = getBridge();
  if (!bridge) return fn();
  try {
    await bridge.startSyncIndicator();
    return await fn();
  } finally {
    try {
      await bridge.stopSyncIndicator();
    } catch {
      // swallow — best effort
    }
  }
}
