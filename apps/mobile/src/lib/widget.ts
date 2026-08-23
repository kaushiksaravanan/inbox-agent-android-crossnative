import { NativeModules, Platform } from 'react-native';

export type WidgetTask = {
  title: string;
  detail: string;
  time: string;
  priority: string;
};

type WidgetBridge = {
  setTasks: (json: string) => Promise<boolean>;
};

export async function pushTasksToWidget(tasks: WidgetTask[]): Promise<void> {
  if (Platform.OS !== 'android') return;
  const bridge = (NativeModules as { InboxWidgetBridge?: WidgetBridge })
    .InboxWidgetBridge;
  if (!bridge || typeof bridge.setTasks !== 'function') {
    return;
  }
  try {
    const payload = JSON.stringify(tasks.slice(0, 3));
    await bridge.setTasks(payload);
  } catch (e) {
    console.warn('widget update failed', e);
  }
}
