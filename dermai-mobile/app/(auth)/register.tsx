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
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, CEBU_DISTRICTS } from '@/lib/constants';
import {
  getPatientAccounts,
  savePatientAccount,
  setCurrentUserEmail,
  upsertPlatformUser,
} from '@/lib/store';
import type { PatientAccount, PlatformUser } from '@/lib/store';

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'] as const;

export default function RegisterScreen() {
  const router = useRouter();

  // Step flow: 'enter' = Google/email entry, 'form' = full registration form
  const [step, setStep] = useState<'enter' | 'form'>('enter');
  const [emailInput, setEmailInput] = useState('');
  const [emailInputError, setEmailInputError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    age: '',
  });
  const [gender, setGender] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  function setError(field: string, msg: string) {
    setErrors((prev) => ({ ...prev, [field]: msg }));
  }
  function clearError(field: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function update(field: keyof typeof form) {
    return (value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleContinueWithEmail() {
    setEmailInputError('');
    const trimmed = emailInput.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailInputError('Please enter a valid email address.');
      return;
    }
    setForm((prev) => ({ ...prev, email: trimmed }));
    setStep('form');
  }

  function handleGoogleSignUp() {
    Alert.alert('Coming Soon', 'Google sign-up will be available soon.');
  }

  async function handleRegister() {
    const { fullName, email, phone, password, confirmPassword, age } = form;
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email address.';
    if (!password.trim()) newErrors.password = 'Password is required.';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
    if (age && (isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120)) newErrors.age = 'Enter a valid age.';
    if (!agreedToTerms) newErrors.terms = 'You must agree to the Terms of Service.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const accounts = await getPatientAccounts();
      if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
        setError('email', 'An account with that email already exists.');
        return;
      }

      const newAccount: PatientAccount = {
        id: `user_${Date.now()}`,
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        password,
        phone: phone.trim(),
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
        location: location || undefined,
        createdAt: new Date().toISOString(),
      };

      await savePatientAccount(newAccount);

      const platformUser: PlatformUser = {
        id: newAccount.id,
        fullName: newAccount.fullName,
        email: newAccount.email,
        role: 'user',
        plan: 'free',
        status: 'active',
        createdAt: newAccount.createdAt,
      };
      await upsertPlatformUser(platformUser);

      await setCurrentUserEmail(newAccount.email);
      router.replace('/(auth)/subscription-choice');
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
        {/* Brand */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>DA</Text>
          </View>
          <Text style={styles.appName}>DermAI</Text>
          <Text style={styles.tagline}>Create Your Account</Text>
        </View>

        {/* ── Step 1: Google + Email entry ── */}
        {step === 'enter' && (
          <View style={styles.card}>
            <Text style={styles.title}>Patient Registration</Text>

            {/* Continue with Google */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignUp} activeOpacity={0.8}>
              <View style={styles.googleIcon}>
                {/* G color blocks */}
                <View style={[styles.gSegment, { backgroundColor: '#EA4335', top: 0, left: 4, width: 5, height: 9 }]} />
                <View style={[styles.gSegment, { backgroundColor: '#4285F4', top: 4, right: 0, width: 9, height: 5 }]} />
                <View style={[styles.gSegment, { backgroundColor: '#FBBC05', bottom: 0, left: 4, width: 5, height: 9 }]} />
                <View style={[styles.gSegment, { backgroundColor: '#34A853', top: 4, left: 0, width: 9, height: 5 }]} />
                <View style={[styles.gCenter, { backgroundColor: COLORS.surface }]} />
              </View>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email label + input */}
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={[styles.emailInput, emailInputError ? styles.inputError : null]}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textLight}
              value={emailInput}
              onChangeText={(v) => { setEmailInput(v); setEmailInputError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailInputError ? <Text style={styles.errorText}>{emailInputError}</Text> : null}

            <TouchableOpacity style={styles.continueBtn} onPress={handleContinueWithEmail} activeOpacity={0.85}>
              <Text style={styles.continueBtnText}>Continue with email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Full registration form ── */}
        {step === 'form' && (
          <View style={styles.card}>
            <TouchableOpacity style={styles.backBtn} onPress={() => { setStep('enter'); setErrors({}); }} activeOpacity={0.7}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Complete Registration</Text>
            <Text style={styles.subtitle}>
              Get AI-powered skin analysis and connect with dermatologists
            </Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.fullName ? styles.inputError : null]}
              placeholder="Juan Dela Cruz"
              placeholderTextColor={COLORS.textLight}
              value={form.fullName}
              onChangeText={(v) => { update('fullName')(v); clearError('fullName'); }}
              autoCapitalize="words"
            />
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textLight}
              value={form.email}
              onChangeText={(v) => { update('email')(v); clearError('email'); }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+63 9XX XXX XXXX"
              placeholderTextColor={COLORS.textLight}
              value={form.phone}
              onChangeText={update('phone')}
              keyboardType="phone-pad"
            />
          </View>

          {/* Age */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={[styles.input, errors.age ? styles.inputError : null]}
              placeholder="e.g. 25"
              placeholderTextColor={COLORS.textLight}
              value={form.age}
              onChangeText={(v) => { update('age')(v); clearError('age'); }}
              keyboardType="number-pad"
            />
            {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.optionRow}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.optionBtn, gender === g && styles.optionBtnActive]}
                  onPress={() => setGender(g)}
                >
                  <Text style={[styles.optionBtnTxt, gender === g && styles.optionBtnTxtActive]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cebu District */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location (Cebu District)</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDistrictPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: location ? COLORS.text : COLORS.textLight, fontSize: 15 }}>
                {location || 'Select your district'}
              </Text>
            </TouchableOpacity>
            {showDistrictPicker && (
              <View style={styles.districtList}>
                {CEBU_DISTRICTS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={styles.districtItem}
                    onPress={() => { setLocation(d); setShowDistrictPicker(false); }}
                  >
                    <Text style={[styles.districtItemTxt, location === d && { color: COLORS.primary, fontWeight: '600' }]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]}
                placeholder="At least 6 characters"
                placeholderTextColor={COLORS.textLight}
                value={form.password}
                onChangeText={(v) => { update('password')(v); clearError('password'); }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.showBtn}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
              placeholder="Repeat your password"
              placeholderTextColor={COLORS.textLight}
              value={form.confirmPassword}
              onChangeText={(v) => { update('confirmPassword')(v); clearError('confirmPassword'); }}
              secureTextEntry={!showPassword}
            />
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </View>

          {/* Terms */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms ? <Text style={styles.errorText}>{errors.terms}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  brandContainer: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  appName: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  tagline: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 20, lineHeight: 19 },

  /* Google button */
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    marginBottom: 4,
  },
  googleIcon: { width: 20, height: 20, position: 'relative' },
  gSegment: { position: 'absolute', borderRadius: 1 },
  gCenter: { position: 'absolute', width: 10, height: 10, borderRadius: 5, top: 5, left: 5 },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.text },

  /* Divider */
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textLight, fontWeight: '500' },

  /* Email step inputs */
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, letterSpacing: 1.2, marginBottom: 8, textTransform: 'uppercase' },
  emailInput: {
    backgroundColor: COLORS.primaryXLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
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

  /* Back button */
  backBtn: { marginBottom: 12 },
  backBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },

  /* Form inputs */
  inputGroup: { marginBottom: 14 },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, marginRight: 8 },
  showBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
  },
  showBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  inputError: { borderColor: COLORS.danger },
  errorText: { color: COLORS.danger, fontSize: 12, marginTop: 3 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  optionBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  optionBtnTxt: { fontSize: 13, color: COLORS.textSecondary },
  optionBtnTxtActive: { color: COLORS.primary, fontWeight: '600' },
  districtList: {
    marginTop: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 200,
  },
  districtItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  districtItemTxt: { fontSize: 14, color: COLORS.text },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  termsText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: { color: COLORS.textSecondary, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
