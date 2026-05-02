import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import {
  getCurrentUser,
  getSkinHistory,
  getAppointments,
  saveAppointment,
  getUserSubscription,
  getAppNotifications,
  getSavedClinics,
} from '@/lib/store';
import type { PatientAccount, Appointment, SubscriptionRecord, AppNotification, ScanResult } from '@/lib/store';

interface QuickAction {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description: string;
  route: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: 'camera-outline',
    label: 'Start Skin Scan',
    description: 'AI-powered analysis',
    route: '/(app)/scan',
    color: COLORS.primary,
  },
  {
    icon: 'clipboard-outline',
    label: 'Scan History',
    description: 'View past results',
    route: '/(app)/history',
    color: '#7c3aed',
  },
  {
    icon: 'calendar-outline',
    label: 'Appointments',
    description: 'Book & manage',
    route: '/(app)/appointments',
    color: '#2563eb',
  },
  {
    icon: 'medkit-outline',
    label: 'Find Clinics',
    description: 'Nearby dermatologists',
    route: '/(app)/clinics',
    color: '#16a34a',
  },
  {
    icon: 'star-outline',
    label: 'Upgrade Plan',
    description: 'Unlock premium features',
    route: '/(app)/subscription',
    color: COLORS.warning,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<PatientAccount | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [conditionsFound, setConditionsFound] = useState(0);
  const [lastScanLabel, setLastScanLabel] = useState('Never');
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [nextAppt, setNextAppt] = useState<Appointment | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clinicsSavedCount, setClinicsSavedCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const u = await getCurrentUser();
    setUser(u);
    if (!u) return;

    const history = await getSkinHistory(u.id);
    setScanCount(history.length);
    setRecentScans(history.slice(0, 3));

    // Conditions found = unique condition names
    const uniqueConditions = new Set(history.map((h) => h.condition));
    setConditionsFound(uniqueConditions.size);

    // Last scan relative time
    if (history.length > 0) {
      const diff = Date.now() - new Date(history[0].date).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) setLastScanLabel(`${mins}m ago`);
      else if (mins < 1440) setLastScanLabel(`${Math.floor(mins / 60)}h ago`);
      else setLastScanLabel(`${Math.floor(mins / 1440)}d ago`);
    } else {
      setLastScanLabel('Never');
    }

    let appts = await getAppointments(u.id);

    // Seed demo appointments on first load (mirrors web buildSharedAppointmentSeed)
    if (appts.length === 0) {
      const today = new Date();
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const d1 = new Date(today); d1.setDate(d1.getDate() + 5);
      const d2 = new Date(today); d2.setDate(d2.getDate() + 10);
      const d3 = new Date(today); d3.setDate(d3.getDate() - 3);
      const seeds: Appointment[] = [
        {
          id: 'appt-demo-001',
          userId: u.id,
          clinicId: 1,
          clinicName: 'Cebu Skin Institute',
          clinicAddress: 'Mango Ave, Cebu City',
          doctorName: 'Dr. Maria Santos',
          specialty: 'Fungal & Parasitic Infections',
          consultationType: 'face-to-face',
          patientName: u.fullName,
          patientEmail: u.email,
          date: fmt(d1),
          time: '10:00 AM',
          status: 'pending',
          notes: 'Skin discoloration concern.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'appt-demo-002',
          userId: u.id,
          clinicId: 2,
          clinicName: 'SkinMD Dermatology Center',
          clinicAddress: 'AS Fortuna St, Mandaue City',
          doctorName: 'Dr. Anna Cruz',
          specialty: 'Pigmentation & Dermatitis',
          consultationType: 'face-to-face',
          patientName: u.fullName,
          patientEmail: u.email,
          date: fmt(d2),
          time: '2:00 PM',
          status: 'scheduled',
          notes: 'Follow-up for melasma treatment.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'appt-demo-003',
          userId: u.id,
          clinicId: 3,
          clinicName: 'DermaPlus Clinic',
          clinicAddress: 'Osmeña Blvd, Cebu City',
          doctorName: 'Dr. Ramon Lopez',
          specialty: 'Bacterial & Fungal Infections',
          consultationType: 'face-to-face',
          patientName: u.fullName,
          patientEmail: u.email,
          date: fmt(d3),
          time: '9:00 AM',
          status: 'rejected',
          clinicNote: 'Slot unavailable on that date.',
          createdAt: new Date().toISOString(),
        },
      ];
      for (const seed of seeds) await saveAppointment(seed);
      appts = seeds;
    }

    const upcoming = appts.find(
      (a) => (a.status === 'pending' || a.status === 'scheduled' || a.status === 'confirmed') && (a.date ?? '') >= new Date().toISOString().slice(0, 10)
    );
    setNextAppt(upcoming ?? null);

    const sub = await getUserSubscription(u.id);
    setSubscription(sub);

    const notifs = await getAppNotifications(u.id);
    setUnreadCount(notifs.filter((n) => !n.read).length);

    const saved = await getSavedClinics(u.id);
    setClinicsSavedCount(saved.length);
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  const isPremium = subscription?.plan === 'premium';
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
            <Text style={styles.headerSub}>How is your skin doing today?</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/(app)/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : String(unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Plan banner */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => router.push('/(app)/subscription')}
          >
            <Ionicons name="star" size={22} color={COLORS.warning} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.premiumBannerTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumBannerSub}>
                {subscription?.scansUsed
                  ? `${subscription.scansUsed} of 3 free scans used — upgrade for unlimited`
                  : '3 free scans available — upgrade for unlimited'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        {isPremium && (
          <View style={styles.premiumActiveBadge}>
            <Ionicons name="star" size={16} color={COLORS.primary} />
            <Text style={[styles.premiumActiveTxt, { marginLeft: 6 }]}>Premium Plan Active</Text>
          </View>
        )}

        {/* Stats row - matching web dashboard */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{scanCount}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{conditionsFound}</Text>
            <Text style={styles.statLabel}>Conditions Found</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{clinicsSavedCount}</Text>
            <Text style={styles.statLabel}>Clinics Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{lastScanLabel}</Text>
            <Text style={styles.statLabel}>Last Scan</Text>
          </View>
        </View>

        {/* Quick scan CTA */}
        <TouchableOpacity
          style={styles.scanCta}
          onPress={() => router.push('/(app)/scan')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.scanCtaTitle}>Start AI Skin Analysis</Text>
            <Text style={styles.scanCtaSub}>
              Answer a few questions and upload a photo for instant diagnosis
            </Text>
          </View>
          <Ionicons name="scan" size={32} color={COLORS.primary} style={{ marginLeft: 10 }} />
        </TouchableOpacity>

        {/* Quick actions grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={26} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionDesc}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About DermAI</Text>
          <Text style={styles.infoText}>
            DermAI uses artificial intelligence to analyze skin conditions, provide preliminary
            assessments, and help you connect with licensed dermatologists near you.
            Always consult a medical professional for diagnosis and treatment.
          </Text>
        </View>

        {/* Recent Analyses */}
        {recentScans.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Analyses</Text>
            <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
              {recentScans.map((scan) => {
                return (
                  <TouchableOpacity
                    key={scan.id}
                    style={styles.recentCard}
                    onPress={() => router.push('/(app)/history')}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentCondition}>{scan.condition}</Text>
                      <Text style={styles.recentDate}>
                        {new Date(scan.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.recentRight}>
                      <Text style={styles.recentConfidence}>{scan.confidence}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Upcoming Appointment */}
        {nextAppt && (
          <>
            <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
            <TouchableOpacity
              style={styles.apptCard}
              onPress={() => router.push('/(app)/appointments')}
            >
              <Text style={styles.apptClinic}>{nextAppt.clinicName}</Text>
              {nextAppt.doctorName && <Text style={styles.apptDoctor}>{nextAppt.doctorName}</Text>}
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                <Text style={styles.apptInfo}>📅 {nextAppt.date}</Text>
                <Text style={styles.apptInfo}>🕐 {nextAppt.time}</Text>
                <Text style={styles.apptInfo}>🏥 In-Person</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Skin Tips */}
        <Text style={styles.sectionTitle}>Skin Tips</Text>
        <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 24 }}>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>☀️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Daily Sunscreen</Text>
              <Text style={styles.tipText}>Apply SPF 30+ daily, even on cloudy days. Reapply every 2 hours when outdoors.</Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>💧</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Stay Hydrated</Text>
              <Text style={styles.tipText}>Drink 8+ glasses of water daily. Hydration helps maintain skin elasticity and health.</Text>
            </View>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>🌙</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Night Routine</Text>
              <Text style={styles.tipText}>Cleanse and moisturize before bed. Let your skin repair itself overnight.</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  notifBtn: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  premiumBannerTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  premiumBannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  premiumActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  premiumActiveTxt: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: COLORS.textSecondary },
  scanCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  scanCtaTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scanCtaSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '30%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    minWidth: '28%',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  actionDesc: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },
  infoCard: {
    backgroundColor: COLORS.primaryLight,
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  infoText: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  // Recent analyses
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentCondition: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  recentDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  recentRight: { alignItems: 'flex-end', gap: 4 },
  recentConfidence: { fontSize: 16, fontWeight: '800' },
  recentBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  recentBadgeTxt: { fontSize: 10, fontWeight: '700' },
  // Upcoming appointment
  apptCard: {
    marginHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  apptClinic: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  apptDoctor: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  apptInfo: { fontSize: 12, color: COLORS.textSecondary },
  // Skin tips
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipEmoji: { fontSize: 28, marginTop: 2 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  tipText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
