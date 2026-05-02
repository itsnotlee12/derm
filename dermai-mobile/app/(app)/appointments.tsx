import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, STATUS_COLORS, SAMPLE_CLINICS } from '@/lib/constants';
import {
  getCurrentUser,
  getAppointments,
  saveAppointment,
  addAppNotification,
} from '@/lib/store';
import type { Appointment, PatientAccount } from '@/lib/store';

type Tab = 'upcoming' | 'past';

export default function AppointmentsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [user, setUser] = useState<PatientAccount | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    const u = await getCurrentUser();
    setUser(u);
    if (!u) return;
    const appts = await getAppointments(u.id);
    setAppointments(appts);
  }

  const today = new Date().toISOString().slice(0, 10);

  const upcomingAppts = appointments.filter(
    (a) =>
      (a.status === 'pending' || a.status === 'scheduled' || a.status === 'confirmed') && (a.date ?? '') >= today
  );
  const pastAppts = appointments.filter(
    (a) =>
      a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected' || (a.date ?? '') < today
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowBooking(true)}
        >
          <Text style={styles.addBtnTxt}>+ Book</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['upcoming', 'past'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabTxt, tab === t && styles.tabTxtActive]}>
              {t === 'upcoming' ? `Upcoming (${upcomingAppts.length})` : `Past (${pastAppts.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {(tab === 'upcoming' ? upcomingAppts : pastAppts).length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📅</Text>
              <Text style={styles.emptyTitle}>
                {tab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
              </Text>
              {tab === 'upcoming' && (
                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => setShowBooking(true)}
                >
                  <Text style={styles.bookBtnTxt}>Book Appointment</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            (tab === 'upcoming' ? upcomingAppts : pastAppts).map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} />
            ))
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

      <BookingModal
        visible={showBooking}
        user={user}
        onClose={() => setShowBooking(false)}
        onSaved={() => {
          setShowBooking(false);
          loadData();
        }}
      />
    </SafeAreaView>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  const sc = STATUS_COLORS[appt.status] ?? STATUS_COLORS.pending;

  // Status step tracker (mirrors web AppointmentStatusPage)
  const STEPS = ['Request Sent', 'Clinic Review', 'Scheduled', 'Completed'] as const;
  const getStepIndex = (status: string) => {
    if (status === 'completed') return 3;
    if (status === 'scheduled' || status === 'confirmed') return 2;
    if (status === 'pending') return 1;
    return 0;
  };
  const currentStep = appt.status === 'rejected' || appt.status === 'cancelled' ? -1 : getStepIndex(appt.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.clinicName}>{appt.clinicName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusTxt, { color: sc.text }]}>{sc.label}</Text>
        </View>
      </View>
      {appt.doctorName ? <Text style={styles.doctorName}>{appt.doctorName}</Text> : null}
      {appt.specialty ? <Text style={styles.specialty}>{appt.specialty}</Text> : null}
      <View style={styles.infoRow}>
        {appt.date ? <Text style={styles.infoItem}>📅 {appt.date}</Text> : null}
        {appt.time ? <Text style={styles.infoItem}>🕐 {appt.time}</Text> : null}
        <Text style={styles.infoItem}>🏥 In-Person</Text>
      </View>

      {/* Step Tracker */}
      {currentStep >= 0 && (
        <View style={styles.stepTracker}>
          {STEPS.map((step, idx) => (
            <View key={step} style={styles.stepItem}>
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.stepCircle,
                    idx <= currentStep ? styles.stepCircleActive : styles.stepCircleInactive,
                  ]}
                >
                  {idx <= currentStep ? (
                    <Text style={styles.stepCheck}>✓</Text>
                  ) : (
                    <Text style={styles.stepNum}>{idx + 1}</Text>
                  )}
                </View>
                {idx < STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      idx < currentStep ? styles.stepLineActive : styles.stepLineInactive,
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  idx <= currentStep && { color: COLORS.primary, fontWeight: '600' },
                ]}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>
      )}

      {appt.notes ? (
        <Text style={styles.reason} numberOfLines={2}>
          Note: {appt.notes}
        </Text>
      ) : null}
      {appt.clinicNote ? (
        <View style={styles.referralTag}>
          <Text style={styles.referralTagTxt}>Clinic note: {appt.clinicNote}</Text>
        </View>
      ) : null}
    </View>
  );
}

function BookingModal({
  visible,
  user,
  onClose,
  onSaved,
}: {
  visible: boolean;
  user: PatientAccount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const defaultClinic = SAMPLE_CLINICS.filter(c => c.verified)[0];
  const defaultDoctor = defaultClinic.doctors[0];
  const [notes, setNotes] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [patientContact, setPatientContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiConditionName, setAiConditionName] = useState('');
  const [aiConfidence, setAiConfidence] = useState('');
  const [skinPhotoUri, setSkinPhotoUri] = useState<string | null>(null);

  async function handleTakePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setSkinPhotoUri(result.assets[0].uri);
    }
  }

  function showPhotoOptions() {
    handleTakePhoto();
  }

  async function handleBook() {
    if (!user) return;
    if (!skinPhotoUri) {
      Alert.alert('Photo Required', 'Please upload a photo of your skin condition before submitting.');
      return;
    }
    setSaving(true);
    try {
      const appt: Appointment = {
        id: `appt_${Date.now()}`,
        userId: user.id,
        clinicId: defaultClinic.id,
        clinicName: defaultClinic.name,
        clinicAddress: defaultClinic.address,
        doctorName: defaultDoctor.name,
        specialty: defaultDoctor.specialization,
        consultationType: 'face-to-face',
        patientName: patientName.trim() || user.fullName,
        patientEmail: patientEmail.trim() || user.email,
        patientAddress: patientAddress.trim() || undefined,
        patientContact: patientContact.trim() || undefined,
        notes: notes.trim() || undefined,
        ...(aiConditionName.trim() ? { conditionName: aiConditionName.trim() } : {}),
        ...(aiConfidence !== '' ? { conditionId: aiConfidence } : {}),
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...(skinPhotoUri ? { skinPhotoUri } : {}),
      };
      await saveAppointment(appt);
      await addAppNotification(user.id, {
        type: 'appointment',
        title: 'Appointment Request Sent',
        message: `Your appointment request has been submitted. The clinic will reply with a confirmed date and time.`,
        userId: user.id,
      });
      Alert.alert('Booked!', 'Your appointment has been submitted and is pending confirmation.');
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.modalSafe}>
          {/* Header Section */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
            {/* Back button */}
            <TouchableOpacity onPress={onClose} style={{ paddingVertical: 4, marginBottom: 6, alignSelf: 'flex-start' }}>
              <Text style={[styles.modalCancel, { fontWeight: '600', fontSize: 15 }]}>Back</Text>
            </TouchableOpacity>
            {/* Title */}
            <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4 }}>
              Enter Appointment Information
            </Text>
            {/* Subtitle */}
            <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 13, marginBottom: 12 }}>
              Please fill in your details to book with {defaultClinic.name}
            </Text>
            {/* Clinic info card */}
            <View style={{
              backgroundColor: '#fdf2f8',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#f3d0e8',
              paddingHorizontal: 14,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 }}>DERMATOLOGY CLINIC</Text>
                <Text style={{ fontWeight: '800', fontSize: 14, color: COLORS.text }} numberOfLines={2}>{defaultClinic.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 5 }}>CONSULTATION MODE</Text>
                <View style={{ backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Face to Face</Text>
                </View>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {/* Patient Information */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Your full name"
                  placeholderTextColor={COLORS.textLight}
                  value={patientName}
                  onChangeText={setPatientName}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Email</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textLight}
                  value={patientEmail}
                  onChangeText={setPatientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Address</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Current address"
                  placeholderTextColor={COLORS.textLight}
                  value={patientAddress}
                  onChangeText={setPatientAddress}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalLabel}>Contact Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="09xx xxx xxxx"
                  placeholderTextColor={COLORS.textLight}
                  value={patientContact}
                  onChangeText={setPatientContact}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Skin Photo Upload */}
            <Text style={styles.modalLabel}>
              Skin Condition Photo{' '}
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>*</Text>
            </Text>
            {skinPhotoUri ? (
              <View style={styles.photoPreviewBox}>
                <Image source={{ uri: skinPhotoUri }} style={styles.photoPreview} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.photoRemoveBtn}
                  onPress={() => setSkinPhotoUri(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoUploadBox} onPress={showPhotoOptions} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                <Text style={styles.photoUploadTxt}>Tap to add a photo</Text>
                <Text style={styles.photoUploadSub}>Tap to take a photo with your camera</Text>
              </TouchableOpacity>
            )}

            {/* AI Skin Analysis Result */}
            <View style={styles.aiBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Ionicons name="scan-outline" size={18} color={COLORS.primary} />
                <Text style={styles.aiBoxTitle}>
                  AI Skin Analysis Result{' '}
                  <Text style={{ color: COLORS.textLight, fontWeight: '400' }}>(optional)</Text>
                </Text>
              </View>
              <Text style={styles.aiBoxSub}>
                If you've used the DermAI scanner, paste the result here so the clinic can review it.
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiLabel}>DETECTED CONDITION</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Tinea Versicolor"
                    placeholderTextColor={COLORS.textLight}
                    value={aiConditionName}
                    onChangeText={setAiConditionName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.aiLabel}>CONFIDENCE %</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 87"
                    placeholderTextColor={COLORS.textLight}
                    value={aiConfidence}
                    onChangeText={setAiConfidence}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.modalLabel}>Additional Notes</Text>
            <TextInput
              style={[styles.modalInput, styles.textArea]}
              placeholder="e.g. Symptoms duration, specific doctor request, etc."
              placeholderTextColor={COLORS.primary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.sendBtn, saving && { opacity: 0.6 }]}
              onPress={handleBook}
              disabled={saving}
            >
              <Text style={styles.sendBtnTxt}>{saving ? 'Sending…' : 'Send Appointment Request'}</Text>
            </TouchableOpacity>
            <Text style={styles.sendNote}>The clinic will reply with a confirmed date and time.</Text>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  addBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: COLORS.border,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: COLORS.surface },
  tabTxt: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  tabTxtActive: { color: COLORS.primary },
  list: { paddingHorizontal: 16, gap: 12 },
  empty: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  bookBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 11,
    marginTop: 8,
  },
  bookBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  clinicName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  doctorName: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  specialty: { fontSize: 11, color: COLORS.primary, marginBottom: 8, marginTop: 1 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  infoItem: { fontSize: 12, color: COLORS.textSecondary },
  reason: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  referralTag: {
    marginTop: 6,
    backgroundColor: '#fff7ed',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  referralTagTxt: { fontSize: 11, color: '#c2410c' },
  // Step tracker
  stepTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: COLORS.primary },
  stepCircleInactive: { backgroundColor: COLORS.border },
  stepCheck: { color: '#fff', fontSize: 12, fontWeight: '700' },
  stepNum: { color: COLORS.textLight, fontSize: 11, fontWeight: '600' },
  stepLine: { flex: 1, height: 2, marginHorizontal: 2 },
  stepLineActive: { backgroundColor: COLORS.primary },
  stepLineInactive: { backgroundColor: COLORS.border },
  stepLabel: { fontSize: 9, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
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
  modalContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  sendBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sendNote: { fontSize: 12, color: COLORS.primary, textAlign: 'center', marginTop: 10 },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownVal: { fontSize: 15, color: COLORS.text, flex: 1 },
  dropdownPlaceholder: { fontSize: 15, color: COLORS.textLight, flex: 1 },
  dropdownList: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 14 },
  dropdownItemBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  dropdownItemActive: { backgroundColor: '#e0f2fe' },
  dropdownItemTxt: { fontSize: 15, color: COLORS.text },
  dropdownItemTxtActive: { color: '#0369a1', fontWeight: '600' },
  photoUploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
  },
  photoUploadTxt: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  photoUploadSub: { fontSize: 12, color: COLORS.textSecondary },
  photoPreviewBox: { borderRadius: 14, overflow: 'hidden', position: 'relative' },
  photoPreview: { width: '100%', height: 180, borderRadius: 14 },
  photoRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  aiBox: {
    backgroundColor: '#fff0fa',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 8,
  },
  aiBoxTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  aiBoxSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  aiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  clinicScroll: { marginBottom: 8 },
  clinicChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  clinicChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  clinicChipTxt: { fontSize: 13, color: COLORS.text },
  clinicChipTxtActive: { color: '#fff', fontWeight: '600' },
  clinicDetail: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 3,
  },
  clinicDetailName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  clinicDetailAddr: { fontSize: 12, color: COLORS.textSecondary },
  clinicDetailHours: { fontSize: 12, color: COLORS.textSecondary },
  clinicDetailRating: { fontSize: 12, color: COLORS.textSecondary },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  optionChipTxt: { fontSize: 13, color: COLORS.text },
  optionChipTxtActive: { color: COLORS.primary, fontWeight: '600' },
  doctorSpecTxt: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  timeChipTxt: { fontSize: 12, color: COLORS.text },
  timeChipTxtActive: { color: '#fff', fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 11,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnTxt: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  typeBtnTxtActive: { color: '#fff' },
});
