import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { getPatientAccounts, setCurrentUserEmail } from '@/lib/store';

const DEMO_CREDENTIALS = [
  { role: 'Patient', email: 'user@dermai.ph', password: 'user1234' },
];

export default function LoginScreen() {
  const router = useRouter();
  const [loginStep, setLoginStep] = useState<'enter' | 'password'>('enter');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  function handleContinueWithEmail() {
    setError('');
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoginStep('password');
  }

  function handleGoogleSignIn() {
    Alert.alert('Coming Soon', 'Google sign-in will be available soon.');
  }

  function fillCredentials(cred: (typeof DEMO_CREDENTIALS)[0]) {
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
    setLoginStep('password');
  }

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    setLoading(true);
    try {
      const accounts = await getPatientAccounts();
      const patientMatch = accounts.find(
        (a) => a.email.toLowerCase() === normalizedEmail && a.password === password
      );
      if (patientMatch) {
        await setCurrentUserEmail(patientMatch.email);
        router.replace('/(app)');
        return;
      }
      const demoMatch = DEMO_CREDENTIALS.find(
        (c) => c.email === normalizedEmail && c.password === password
      );
      if (demoMatch) {
        await setCurrentUserEmail(demoMatch.email);
        router.replace('/(app)');
      } else {
        setError('Invalid email or password. Use your registered account or the demo credentials below.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Welcome Back</Text>

          {/* ── Step 1: Google + Email entry ── */}
          {loginStep === 'enter' && (
            <>
              {/* Demo credentials */}
              <View style={styles.demoSection}>
                <Text style={styles.demoLabel}>Demo Accounts — tap to fill</Text>
                {DEMO_CREDENTIALS.map((cred) => (
                  <TouchableOpacity
                    key={cred.email}
                    style={styles.demoCard}
                    onPress={() => fillCredentials(cred)}
                  >
                    <Text style={styles.demoRole}>{cred.role}</Text>
                    <View>
                      <Text style={styles.demoCredText}>{cred.email}</Text>
                      <Text style={styles.demoCredText}>{cred.password}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Continue with Google */}
              <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} activeOpacity={0.8}>
                <View style={styles.googleDot} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerTxt}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email input */}
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput
                style={[styles.emailInput, error ? styles.inputError : null]}
                placeholder="you@example.com"
                placeholderTextColor="#f9a8d4"
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.continueBtn} onPress={handleContinueWithEmail} activeOpacity={0.85}>
                <Text style={styles.continueBtnText}>Continue with email</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 2: Password entry ── */}
          {loginStep === 'password' && (
            <>
              <TouchableOpacity style={styles.backBtn} onPress={() => { setLoginStep('enter'); setError(''); }} activeOpacity={0.7}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>

              {/* Email display */}
              <View style={styles.emailDisplay}>
                <Text style={styles.emailDisplayText} numberOfLines={1}>{email}</Text>
                <TouchableOpacity onPress={() => { setLoginStep('enter'); setError(''); }}>
                  <Text style={styles.emailDisplayChange}>Change</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.emailInput, styles.passwordInput, error ? styles.inputError : null]}
                  placeholder="Enter your password"
                  placeholderTextColor="#f9a8d4"
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(''); }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color="#be185d"
                  />
                </TouchableOpacity>
              </View>
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.continueBtn, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.continueBtnText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotRow}
                onPress={() =>
                  Alert.alert('Reset Password', 'Please contact support@dermai.ph to reset your password.')
                }
              >
                <Text style={styles.forgotTxt}>Forgot Password?</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.primary },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logoWrap: { alignItems: 'center', marginBottom: 16 },
  logo: { width: 64, height: 64 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#500724',
    textAlign: 'center',
    marginBottom: 20,
  },
  demoSection: { marginBottom: 20 },
  demoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f472b6',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff1f2',
    marginBottom: 6,
  },
  demoRole: { fontSize: 13, fontWeight: '700', color: '#be185d' },
  demoCredText: {
    fontSize: 11,
    color: '#be185d',
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  /* Google button */
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  googleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ea4335',
  },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#500724' },

  /* Divider */
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#fce7f3' },
  dividerTxt: { fontSize: 12, color: '#f9a8d4' },

  /* Email step */
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f9a8d4',
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#fbcfe8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#500724',
    backgroundColor: '#fff1f2',
    marginBottom: 8,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  continueBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  inputError: { borderColor: '#dc2626' },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: { fontSize: 12, color: '#dc2626', marginBottom: 4 },

  /* Password step */
  backBtn: { marginBottom: 12 },
  backBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  emailDisplayText: { flex: 1, fontSize: 14, color: '#500724', fontWeight: '500' },
  emailDisplayChange: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  passwordWrap: { position: 'relative', marginBottom: 0 },
  passwordInput: { paddingRight: 44, marginBottom: 0 },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 8,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  forgotRow: { alignItems: 'center', marginTop: 12 },
  forgotTxt: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: COLORS.textSecondary },
  footerLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
});
