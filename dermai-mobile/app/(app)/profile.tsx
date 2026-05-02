import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CEBU_DISTRICTS } from '@/lib/constants';
import {
  getCurrentUser,
  getSkinHistory,
  getAppointments,
  getUserSubscription,
  savePatientAccount,
  clearCurrentUser,
} from '@/lib/store';
import type { PatientAccount, SubscriptionRecord } from '@/lib/store';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<PatientAccount | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [apptCount, setApptCount] = useState(0);
  const [sub, setSub] = useState<SubscriptionRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', dateOfBirth: '', gender: '', district: '', address: '' });
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const u = await getCurrentUser();
    setUser(u);
    if (!u) return;
    setForm({
      fullName: u.fullName ?? '',
      phone: u.phone ?? '',
      dateOfBirth: u.dateOfBirth ?? '',
      gender: u.gender ?? '',
      district: (u as any).district ?? '',
      address: u.address ?? '',
    });
    const history = await getSkinHistory(u.id);
    setScanCount(history.length);
    const appts = await getAppointments(u.id);
    setApptCount(appts.length);
    const s = await getUserSubscription(u.id);
    setSub(s);
  }

  async function handleSave() {
    if (!user) return;
    if (!form.fullName.trim()) {
      Alert.alert('Name Required', 'Full name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const updated: PatientAccount = {
        ...user,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
        gender: form.gender.trim(),
        district: form.district.trim(),
        address: form.address.trim(),
      } as any;
      await savePatientAccount(updated);
      setUser(updated);
      setEditing(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePickImage() {
    Alert.alert('Profile Picture', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission Denied', 'Camera access is required.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            saveProfileImage(result.assets[0]);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission Denied', 'Photo library access is required.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
          });
          if (!result.canceled && result.assets[0]) {
            saveProfileImage(result.assets[0]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function saveProfileImage(asset: ImagePicker.ImagePickerAsset) {
    if (!user) return;
    // Check size (~2MB limit on base64)
    if (asset.base64 && asset.base64.length > 2 * 1024 * 1024) {
      Alert.alert('Too Large', 'Image must be under 2MB. Try a smaller photo.');
      return;
    }
    const uri = asset.base64
      ? `data:image/jpeg;base64,${asset.base64}`
      : asset.uri;
    const updated: PatientAccount = { ...user, profileImage: uri };
    await savePatientAccount(updated);
    setUser(updated);
  }

  async function handleRemoveImage() {
    if (!user) return;
    const updated: PatientAccount = { ...user, profileImage: undefined };
    await savePatientAccount(updated);
    setUser(updated);
  }

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearCurrentUser();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const isPremium = sub?.plan === 'premium';

  // Guest / not logged in
  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.guestTitle}>No Account Yet</Text>
          <Text style={styles.guestSub}>Sign in or create an account to view and manage your profile.</Text>
          <TouchableOpacity style={styles.guestBtn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.guestBtnTxt}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.guestBtnOutline} onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.guestBtnOutlineTxt}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>
                  {user.fullName
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={14} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
          {user.profileImage && (
            <TouchableOpacity onPress={handleRemoveImage} style={styles.removeImgBtn}>
              <Text style={styles.removeImgTxt}>Remove Photo</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.userName}>{user.fullName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={[styles.planBadge, isPremium && styles.planBadgePremium]}>
            <Ionicons
              name={isPremium ? 'star' : 'person'}
              size={14}
              color={isPremium ? COLORS.primary : COLORS.textSecondary}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.planBadgeTxt, isPremium && styles.planBadgeTxtPremium]}>
              {isPremium ? 'Premium' : 'Free Plan'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard value={String(scanCount)} label="Scans" />
          <StatCard value={String(apptCount)} label="Appointments" />
          <StatCard
            value={new Date(user.createdAt).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })}
            label="Member Since"
          />
        </View>

        {/* Profile info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <InfoRow label="Full Name" value={user.fullName} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone || 'Not set'} />
          <InfoRow label="Date of Birth" value={user.dateOfBirth || 'Not set'} />
          <InfoRow label="Gender" value={user.gender || 'Not set'} />
          <InfoRow label="District" value={(user as any).district || 'Not set'} />
          <InfoRow label="Address" value={user.address || 'Not set'} last />
        </View>

        {/* Quick links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuRow
            icon="star"
            iconColor={COLORS.warning}
            label="Subscription Plan"
            value={isPremium ? 'Premium' : 'Free'}
            onPress={() => router.push('/(app)/subscription')}
          />
          <MenuRow
            icon="medkit-outline"
            iconColor="#16a34a"
            label="Find Clinics"
            onPress={() => router.push('/(app)/clinics')}
          />
          <MenuRow
            icon="notifications-outline"
            iconColor="#2563eb"
            label="Notifications"
            onPress={() => router.push('/(app)/notifications')}
          />
          <MenuRow
            icon="settings-outline"
            iconColor={COLORS.textSecondary}
            label="Settings"
            onPress={() => router.push('/(app)/settings')}
            last
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} style={{ marginRight: 8 }} />
          <Text style={styles.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit modal */}
      <EditModal
        visible={editing}
        form={form}
        saving={saving}
        onChange={(field, val) => setForm((p) => ({ ...p, [field]: val }))}
        onSave={handleSave}
        onClose={() => setEditing(false)}
      />
    </SafeAreaView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, last && { borderBottomWidth: 0 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.menuIconCircle, { backgroundColor: (iconColor ?? COLORS.primary) + '18' }]}>
        <Ionicons name={icon} size={18} color={iconColor ?? COLORS.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );
}

function EditModal({
  visible,
  form,
  saving,
  onChange,
  onSave,
  onClose,
}: {
  visible: boolean;
  form: Record<string, string>;
  saving: boolean;
  onChange: (field: string, val: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const [districtOpen, setDistrictOpen] = useState(false);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onSave} disabled={saving}>
              <Text style={[styles.modalSave, saving && { opacity: 0.5 }]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {[
              { field: 'fullName', label: 'Full Name *', placeholder: 'Juan Dela Cruz' },
              { field: 'phone', label: 'Phone Number', placeholder: '+63 9XX XXX XXXX', keyboard: 'phone-pad' },
              { field: 'dateOfBirth', label: 'Date of Birth', placeholder: '1990-01-15' },
              { field: 'gender', label: 'Gender', placeholder: 'Male / Female / Other' },
            ].map((f) => (
              <View key={f.field} style={styles.formGroup}>
                <Text style={styles.formLabel}>{f.label}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.textLight}
                  value={form[f.field]}
                  onChangeText={(v) => onChange(f.field, v)}
                  keyboardType={(f as any).keyboard ?? 'default'}
                  autoCapitalize={f.field === 'fullName' ? 'words' : 'none'}
                />
              </View>
            ))}

            {/* District picker */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>District</Text>
              <TouchableOpacity
                style={styles.formInput}
                onPress={() => setDistrictOpen(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  { flex: 1 },
                  form.district ? { color: COLORS.text } : { color: COLORS.textLight },
                ]}>
                  {form.district || 'Select district…'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="123 Street, City, Province"
                placeholderTextColor={COLORS.textLight}
                value={form.address}
                onChangeText={(v) => onChange('address', v)}
                autoCapitalize="words"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* District selection modal */}
      <Modal visible={districtOpen} animationType="slide" transparent>
        <View style={styles.districtOverlay}>
          <View style={styles.districtSheet}>
            <View style={styles.districtHeader}>
              <Text style={styles.districtTitle}>Select District</Text>
              <TouchableOpacity onPress={() => setDistrictOpen(false)}>
                <Text style={styles.districtClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CEBU_DISTRICTS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.districtItem,
                    form.district === d && styles.districtItemActive,
                  ]}
                  onPress={() => {
                    onChange('district', d);
                    setDistrictOpen(false);
                  }}
                >
                  <Text style={[
                    styles.districtItemTxt,
                    form.district === d && styles.districtItemTxtActive,
                  ]}>{d}</Text>
                  {form.district === d && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 8,
    right: -4,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarOverlayTxt: { fontSize: 14 },  removeImgBtn: { marginBottom: 6 },
  removeImgTxt: { color: COLORS.danger, fontSize: 12, fontWeight: '600' },
  avatarTxt: { color: '#fff', fontSize: 28, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 10 },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: COLORS.border,
    borderRadius: 20,
  },
  planBadgePremium: { backgroundColor: COLORS.primaryLight },
  planBadgeTxt: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  planBadgeTxtPremium: { color: COLORS.primary },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  editLink: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  infoValue: { fontSize: 13, color: COLORS.text, fontWeight: '500', flex: 2, textAlign: 'right' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  menuValue: { fontSize: 13, color: COLORS.textSecondary },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutTxt: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
  // Guest state
  guestContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  guestIconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  guestTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  guestSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  guestBtn: {
    backgroundColor: COLORS.primary, borderRadius: 30,
    paddingVertical: 14, paddingHorizontal: 48, alignSelf: 'stretch', alignItems: 'center',
  },
  guestBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  guestBtnOutline: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 30,
    paddingVertical: 14, paddingHorizontal: 48, alignSelf: 'stretch', alignItems: 'center',
  },
  guestBtnOutlineTxt: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  // Modal
  modalSafe: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalCancel: { color: COLORS.textSecondary, fontSize: 15 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  modalSave: { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  modalContent: { padding: 20, gap: 4 },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  formInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    flexDirection: 'row',
    alignItems: 'center',
  },
  districtOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  districtSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  districtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  districtTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  districtClose: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  districtItemActive: { backgroundColor: COLORS.primaryLight },
  districtItemTxt: { fontSize: 15, color: COLORS.text },
  districtItemTxtActive: { color: COLORS.primary, fontWeight: '600' },
});
