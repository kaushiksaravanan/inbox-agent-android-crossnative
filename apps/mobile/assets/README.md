# Mobile assets

This directory should contain the following assets before building the app.
They are referenced from `app.json` / `app.config.ts`.

| File | Purpose | Recommended size |
| --- | --- | --- |
| `icon.png` | App icon (iOS + general) | 1024 x 1024 PNG, square, no transparency |
| `adaptive-icon.png` | Android adaptive icon foreground | 1024 x 1024 PNG, transparent background, content within the inner 66% safe zone |
| `splash.png` | Splash screen image (if used) | 1242 x 2436 PNG, centered logo on `#fef9f3` |
| `alarm.wav` | Custom alarm sound for high-priority notifications | Short WAV (~2-5s), 44.1 kHz, 16-bit PCM |

## Notes

- The app uses an amber brand palette; background `#fef9f3`, primary `#ea7c1c`.
- `alarm.wav` is bundled into the Android notification channel `"alarms"` and
  is referenced in the `expo-notifications` plugin config. Replace the file
  with your final sound before shipping.
- Until these files exist, `expo prebuild` / `expo run:android` will fail to
  resolve the asset paths in `app.json`. Drop in placeholders during initial
  bring-up if needed.
