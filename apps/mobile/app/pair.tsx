import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Inbox } from 'lucide-react-native';
import { supabase } from '../src/lib/supabase';
import { colors, spacing, radii, fontSizes } from '../src/lib/theme';

const CODE_LEN = 6;

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data;
  } catch {
    return null;
  }
}

export default function PairScreen() {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LEN).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputs = useRef<Array<TextInput | null>>([]);
  const submittedRef = useRef(false);

  const setDigit = (idx: number, value: string) => {
    // Paste-friendly: if value contains 6 digits, fill all
    if (value.length > 1) {
      const cleaned = value.replace(/\D/g, '').slice(0, CODE_LEN);
      if (cleaned.length === CODE_LEN) {
        setDigits(cleaned.split(''));
        inputs.current[CODE_LEN - 1]?.focus();
        return;
      }
      // partial paste — distribute from current index
      const next = [...digits];
      let i = idx;
      for (const ch of cleaned) {
        if (i >= CODE_LEN) break;
        next[i++] = ch;
      }
      setDigits(next);
      inputs.current[Math.min(i, CODE_LEN - 1)]?.focus();
      return;
    }
    const next = [...digits];
    next[idx] = value.replace(/\D/g, '');
    setDigits(next);
    if (next[idx] && idx < CODE_LEN - 1) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
    }
  };

  const submit = async () => {
    const code = digits.join('');
    if (code.length !== CODE_LEN) {
      setError('Enter all 6 digits.');
      return;
    }
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        'pair-device',
        { body: { action: 'redeem', code } },
      );
      if (fnErr) throw fnErr;
      const sessionPayload = (data as
        | { access_token?: string; refresh_token?: string; error?: string }
        | null) ?? {};
      if (sessionPayload.error) {
        const msg = sessionPayload.error;
        if (msg.includes('expired')) setError('Code expired. Generate a new one on web.');
        else if (msg.includes('used')) setError('Code already used.');
        else setError('Invalid code.');
        setSubmitting(false);
        submittedRef.current = false;
        return;
      }
      if (!sessionPayload.access_token || !sessionPayload.refresh_token) {
        setError('Pairing failed. Try again.');
        setSubmitting(false);
        submittedRef.current = false;
        return;
      }
      await supabase.auth.setSession({
        access_token: sessionPayload.access_token,
        refresh_token: sessionPayload.refresh_token,
      });

      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken) {
        setNotice(
          'Paired, but notifications are off. Enable them in system settings to get alarms.',
        );
      } else {
        const { error: regErr } = await supabase.functions.invoke(
          'register-push-token',
          { body: { token: pushToken, platform: Platform.OS } },
        );
        if (regErr) {
          setNotice(
            'Paired, but failed to register for alarms. Open Settings to retry.',
          );
        }
      }
      router.replace('/(tabs)/tasks');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Pairing failed.';
      if (msg.toLowerCase().includes('expired'))
        setError('Code expired. Generate a new one on web.');
      else if (msg.toLowerCase().includes('used'))
        setError('Code already used.');
      else setError('Invalid code. Check the code on web.');
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  const filled = digits.every((d) => d.length === 1);

  // Auto-submit once all 6 digits are filled.
  useEffect(() => {
    if (filled && !submitting && !submittedRef.current) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Soft amber gradient blob (faked with overlapping circles) */}
      <View pointerEvents="none" style={styles.blobTop} />
      <View pointerEvents="none" style={styles.blobBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Inbox color={colors.primaryForeground} size={40} strokeWidth={2} />
            </View>
            <Text style={styles.title}>Inbox Agent</Text>
            <Text style={styles.tagline}>
              Pair this phone with your Inbox Agent web account
            </Text>
          </View>

          <View style={styles.codeRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputs.current[i] = r;
                }}
                value={d}
                onChangeText={(v) => setDigit(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={CODE_LEN}
                style={[styles.codeInput, d ? styles.codeInputFilled : null]}
                autoFocus={i === 0}
                selectTextOnFocus
                returnKeyType="next"
                editable={!submitting}
                accessibilityLabel={`Digit ${i + 1}`}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
              />
            ))}
          </View>

          <Text style={styles.subtitle}>
            Open Inbox Agent on web → Devices → Pair new phone, then enter the
            code shown.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}
          {notice && <Text style={styles.notice}>{notice}</Text>}

          <TouchableOpacity
            disabled={!filled || submitting}
            onPress={submit}
            style={[
              styles.submit,
              (!filled || submitting) && styles.submitDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.submitText}>Pair device</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  blobTop: {
    position: 'absolute',
    top: -120,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    opacity: 0.7,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -160,
    left: -120,
    width: 360,
    height: 360,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    opacity: 0.25,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontWeight: '700',
    fontSize: fontSizes['4xl'],
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  tagline: {
    
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  codeInput: {
    width: 48,
    height: 64,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontWeight: '700',
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  subtitle: {
    
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  error: {
    fontWeight: '500',
    fontSize: fontSizes.sm,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  notice: {
    fontWeight: '500',
    fontSize: fontSizes.sm,
    color: colors.warning,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  submit: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.full,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontWeight: '700',
    fontSize: fontSizes.md,
    color: colors.primaryForeground,
  },
});
