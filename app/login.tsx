import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Eye, EyeOff, LogIn } from 'lucide-react-native';
import { COLORS, SPACING, FONTS } from '@/constants/theme';
import supabase, { getLastProtectedRoute, resolveAdminState } from '@/lib/supabase';
import { useAppTheme } from '@/lib/theme';
import { isEmailBlocked } from '@/lib/auth-guard';

function getRouteForRole(route: string, isAdmin: boolean) {
  if (isAdmin) {
    return route.startsWith('/(admin)') ? route : '/(admin)';
  }
  return route.startsWith('/(admin)') ? '/(tabs)' : route;
}

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ auth?: string }>();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (params.auth === '1') return;
    router.replace('/(guest)');
  }, [params.auth, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Login', 'Please enter email and password');
      return;
    }

    setSubmitting(true);
    try {
      const blocked = await isEmailBlocked(email);
      if (blocked) {
        throw new Error('This account has been banned. Please contact the church admin.');
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error('No user returned');

      const isAdmin = await resolveAdminState(user.id, user.email ?? undefined);
      const fallback = isAdmin ? '/(admin)' : '/(tabs)';
      const nextRoute = await getLastProtectedRoute(fallback);
      router.replace(getRouteForRole(nextRoute || fallback, isAdmin) as any);
    } catch (e: any) {
      if (email.trim()) {
        try {
          const blocked = await isEmailBlocked(email);
          if (blocked) {
            Alert.alert('Account banned', 'This account has been banned. Please contact the church admin.');
            return;
          }
        } catch {
          // Fall back to original auth error below.
        }
      }
      Alert.alert('Login failed', e.message ?? 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Forgot Password', 'Enter your email first, then tap Forgot Password again.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;
      Alert.alert('Password reset', 'Check your email for the password reset link.');
    } catch (e: any) {
      Alert.alert('Forgot Password', e.message ?? 'Unable to send reset email right now.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.brandCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Christ Revealed</Text>
        <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>Sign in to continue watching sermons, joining discussions, and managing your playlists.</Text>
      </View>

      <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surfaceAlt, color: colors.text }]}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={colors.mutedText}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
        <View style={[styles.passwordWrap, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
          <TextInput
            style={[styles.passwordInput, { color: colors.text }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.mutedText}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeButton}>
            {showPassword ? <EyeOff size={18} color={colors.mutedText} /> : <Eye size={18} color={colors.mutedText} />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleLogin} disabled={submitting}>
          {submitting ? <ActivityIndicator color={COLORS.white} /> : <LogIn size={18} color={COLORS.white} />}
          <Text style={styles.buttonText}>{submitting ? 'Signing in...' : 'Login'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/signup?auth=1')}>
          <Text style={[styles.link, { color: colors.primary }]}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={[styles.secondaryLink, { color: colors.accent }]}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    justifyContent: 'center',
    minHeight: 760,
    gap: SPACING.md,
  },
  brandCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#E6EEFB',
  },
  eyebrow: {
    color: COLORS.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginTop: SPACING.sm,
    color: COLORS.text,
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: SPACING.sm,
    color: COLORS.gray,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#E6EEFB',
  },
  label: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9E6FF',
    backgroundColor: '#F8FBFF',
    borderRadius: 16,
    padding: SPACING.md,
    fontSize: FONTS.sizes.medium,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E6FF',
    backgroundColor: '#F8FBFF',
    borderRadius: 16,
    paddingRight: SPACING.sm,
  },
  passwordInput: {
    flex: 1,
    padding: SPACING.md,
    fontSize: FONTS.sizes.medium,
  },
  eyeButton: {
    padding: SPACING.sm,
  },
  button: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.accent,
    borderRadius: 999,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.large,
    fontWeight: '800',
  },
  link: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
    marginTop: SPACING.lg,
    fontWeight: '700',
  },
  secondaryLink: {
    color: COLORS.accent,
    fontSize: FONTS.sizes.medium,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontWeight: '700',
  },
});
