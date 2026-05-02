import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SAMPLE_CLINICS, CEBU_DISTRICTS } from '@/lib/constants';
import { getCurrentUser, getSavedClinics, saveClinic, unsaveClinic } from '@/lib/store';

type Clinic = (typeof SAMPLE_CLINICS)[0];

const ALL_DISTRICTS = 'All Districts';
const DISTRICTS = [ALL_DISTRICTS, ...CEBU_DISTRICTS];
const VERIFIED_CLINICS = SAMPLE_CLINICS.filter((c) => c.verified);

// Bounds centered around a single clinic for its inline map
function getLocalBounds(lat: number, lng: number) {
  const delta = 0.025;
  return { minLat: lat - delta, maxLat: lat + delta, minLng: lng - delta, maxLng: lng + delta };
}

/** Inline mini-map showing a single clinic's pin */
function ClinicMiniMap({ clinic, onOpenMaps }: { clinic: Clinic; onOpenMaps: () => void }) {
  const { width } = useWindowDimensions();
  const mapWidth = width - 64; // card has 16px margin + 16px padding each side
  const mapHeight = 180;
  const bounds = getLocalBounds(clinic.lat, clinic.lng);

  const x = ((clinic.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * mapWidth;
  const y = ((bounds.maxLat - clinic.lat) / (bounds.maxLat - bounds.minLat)) * mapHeight;

  return (
    <View style={miniMapStyles.wrapper}>
      <View style={[miniMapStyles.container, { width: mapWidth, height: mapHeight }]}>
        {/* Grid lines */}
        {[0.33, 0.66].map((f) => (
          <View key={`h${f}`} style={[miniMapStyles.gridH, { top: mapHeight * f, width: mapWidth }]} />
        ))}
        {[0.33, 0.66].map((f) => (
          <View key={`v${f}`} style={[miniMapStyles.gridV, { left: mapWidth * f, height: mapHeight }]} />
        ))}

        {/* Cross-hair center ring */}
        <View style={[miniMapStyles.ring, { left: mapWidth / 2 - 30, top: mapHeight / 2 - 30 }]} />

        {/* Pin */}
        <View style={[miniMapStyles.pinWrap, { left: x - 14, top: y - 32 }]}>
          <View style={miniMapStyles.pin}>
            <Text style={miniMapStyles.pinEmoji}>🏥</Text>
          </View>
          <View style={miniMapStyles.pinTail} />
        </View>

        {/* Label badge */}
        <View style={miniMapStyles.badge}>
          <Text style={miniMapStyles.badgeTxt} numberOfLines={1}>📍 {clinic.name}</Text>
        </View>

        {/* Open in Maps button */}
        <TouchableOpacity style={miniMapStyles.openBtn} onPress={onOpenMaps} activeOpacity={0.8}>
          <Text style={miniMapStyles.openBtnTxt}>🗺 Open in Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Single clinic card with expandable inline map */
function ClinicCard({
  clinic,
  onViewDetails,
  isSaved,
  onToggleSave,
}: {
  clinic: Clinic;
  onViewDetails: (c: Clinic) => void;
  isSaved: boolean;
  onToggleSave: (clinicId: number) => void;
}) {
  const router = useRouter();
  const [showMap, setShowMap] = useState(false);

  function openMaps() {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${clinic.lat},${clinic.lng}`
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => setShowMap((v) => !v)}
    >
      {/* Name + verified badge + save button */}
      <View style={styles.cardHeader}>
        <Text style={styles.clinicName} numberOfLines={2}>{clinic.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {clinic.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeTxt}>✓ Verified</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={(e) => { e.stopPropagation?.(); onToggleSave(clinic.id); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSaved ? COLORS.primary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info rows */}
      <View style={styles.infoRows}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoValue} numberOfLines={2}>{clinic.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={styles.infoValue}>{clinic.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={styles.infoValue}>{clinic.hours}</Text>
        </View>
      </View>

      {/* Doctors */}
      <Text style={styles.doctorsLabel}>DOCTORS</Text>
      <View style={styles.doctorsList}>
        {clinic.doctors.map((doc, i) => (
          <View key={i} style={styles.doctorRow}>
            <Text style={styles.doctorIcon}>🩺</Text>
            <Text style={styles.doctorName}>{doc.name}</Text>
            <Text style={styles.doctorSpec} numberOfLines={1}> · {doc.specialization}</Text>
          </View>
        ))}
      </View>

      {/* Service fee */}
      <View style={styles.feeRow}>
        <Text style={styles.feeLabel}>Service Fee : </Text>
        <Text style={styles.feeValue}>Starts at ₱{clinic.consultationFee}</Text>
      </View>

      {/* Inline map (expands when card is tapped) */}
      {showMap && (
        <ClinicMiniMap clinic={clinic} onOpenMaps={openMaps} />
      )}

      {/* Hint text when map is hidden */}
      {!showMap && (
        <Text style={styles.tapHint}>Tap card to view location map</Text>
      )}

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={(e) => { e.stopPropagation?.(); onViewDetails(clinic); }}
        >
          <Text style={styles.viewDetailsTxt}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.appointmentBtn}
          onPress={(e) => { e.stopPropagation?.(); router.push('/(app)/appointments'); }}
        >
          <Text style={styles.appointmentTxt}>📅 Appointment</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

/** Detail modal — matches web UI */
function DetailModal({ clinic, onClose }: { clinic: Clinic; onClose: () => void }) {
  const router = useRouter();
  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.detailOverlay}>
        <View style={styles.detailSheet}>
          {/* Header */}
          <View style={styles.detailTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailName}>{clinic.name}</Text>
              {clinic.verified && (
                <View style={[styles.verifiedBadge, { marginTop: 6 }]}>
                  <Text style={styles.verifiedBadgeTxt}>✓ Verified Clinic</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.detailBody} showsVerticalScrollIndicator={false}>
            {/* Contact info */}
            <View style={styles.infoRows}>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoValue}>{clinic.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📞</Text>
                <Text style={styles.infoValue}>{clinic.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🕐</Text>
                <Text style={styles.infoValue}>{clinic.hours}</Text>
              </View>
            </View>

            {/* Doctors */}
            <Text style={styles.detailSectionTitle}>DOCTORS</Text>
            <View style={styles.doctorCards}>
              {clinic.doctors.map((doc, i) => (
                <View key={i} style={styles.doctorCard}>
                  <Text style={{ fontSize: 20 }}>🩺</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorCardName}>{doc.name}</Text>
                    <Text style={styles.doctorCardSpec}>{doc.specialization}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Conditions */}
            <Text style={styles.detailSectionTitle}>CONDITIONS & SERVICES TREATED</Text>
            <View style={styles.chips}>
              {clinic.conditionsTreated.map((s, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipTxt}>{s}</Text>
                </View>
              ))}
            </View>

            {/* Service fee */}
            <View style={styles.detailFeeRow}>
              <Text style={styles.detailFeeLabel}>Service Fee : </Text>
              <Text style={styles.detailFeeValue}>Starts at ₱{clinic.consultationFee}</Text>
            </View>

            {/* Book appointment */}
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => { onClose(); router.push('/(app)/appointments'); }}
            >
              <Text style={styles.bookBtnTxt}>📅 Book Appointment</Text>
            </TouchableOpacity>
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function ClinicsScreen() {
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(ALL_DISTRICTS);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [detailClinic, setDetailClinic] = useState<Clinic | null>(null);
  const [tab, setTab] = useState<'all' | 'saved'>('all');
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const u = await getCurrentUser();
        if (!u) return;
        setUserId(u.id);
        const ids = await getSavedClinics(u.id);
        setSavedIds(new Set(ids));
      })();
    }, [])
  );

  async function handleToggleSave(clinicId: number) {
    if (!userId) return;
    if (savedIds.has(clinicId)) {
      await unsaveClinic(userId, clinicId);
      setSavedIds((prev) => { const s = new Set(prev); s.delete(clinicId); return s; });
    } else {
      await saveClinic(userId, clinicId);
      setSavedIds((prev) => new Set(prev).add(clinicId));
    }
  }

  const source = tab === 'saved'
    ? VERIFIED_CLINICS.filter((c) => savedIds.has(c.id))
    : VERIFIED_CLINICS;

  const filtered = source.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.doctors.some((d) => d.name.toLowerCase().includes(q)) ||
      c.conditionsTreated.some((s) => s.toLowerCase().includes(q));
    const matchDistrict =
      selectedDistrict === ALL_DISTRICTS || c.district === selectedDistrict;
    return matchSearch && matchDistrict;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Derma Clinics in Cebu</Text>
        <Text style={styles.headerSub}>Discover verified dermatology clinics near you</Text>
      </View>

      {/* All / Saved tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabPill, tab === 'all' && styles.tabPillActive]}
          onPress={() => setTab('all')}
        >
          <Text style={[styles.tabPillTxt, tab === 'all' && styles.tabPillTxtActive]}>All Clinics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabPill, tab === 'saved' && styles.tabPillActive]}
          onPress={() => setTab('saved')}
        >
          <Ionicons
            name="bookmark"
            size={13}
            color={tab === 'saved' ? '#fff' : COLORS.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.tabPillTxt, tab === 'saved' && styles.tabPillTxtActive]}>
            Saved{savedIds.size > 0 ? ` (${savedIds.size})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search card */}
      <View style={styles.searchCard}>
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search clinic name or doctor name..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.districtPicker}
          onPress={() => setShowDistrictPicker(true)}
        >
          <Text style={styles.districtPickerText}>{selectedDistrict}</Text>
          <Text style={styles.chevron}>▾</Text>
        </TouchableOpacity>

        <View style={styles.verifiedBanner}>
          <Text style={styles.verifiedBannerText}>✓ Showing verified clinics only</Text>
        </View>
      </View>

      {/* Clinic list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {filtered.map((clinic) => (
          <ClinicCard
            key={clinic.id}
            clinic={clinic}
            onViewDetails={setDetailClinic}
            isSaved={savedIds.has(clinic.id)}
            onToggleSave={handleToggleSave}
          />
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>{tab === 'saved' ? '🔖' : '🔍'}</Text>
            <Text style={styles.emptyTitle}>
              {tab === 'saved' ? 'No Saved Clinics' : 'No Clinics Found'}
            </Text>
            <Text style={styles.emptySub}>
              {tab === 'saved'
                ? 'Tap the bookmark icon on any clinic to save it here.'
                : 'Try adjusting your search or district filter.'}
            </Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* District Picker Modal */}
      <Modal visible={showDistrictPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDistrictPicker(false)}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select District</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {DISTRICTS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pickerItem, selectedDistrict === d && styles.pickerItemActive]}
                  onPress={() => { setSelectedDistrict(d); setShowDistrictPicker(false); }}
                >
                  <Text style={[styles.pickerItemTxt, selectedDistrict === d && styles.pickerItemTxtActive]}>
                    {d}
                  </Text>
                  {selectedDistrict === d && <Text style={{ color: COLORS.primary }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Detail Modal */}
      {detailClinic && (
        <DetailModal clinic={detailClinic} onClose={() => setDetailClinic(null)} />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  headerSub: { fontSize: 13, color: COLORS.textSecondary },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: COLORS.primaryXLight,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  tabPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabPillTxt: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  tabPillTxtActive: { color: '#fff' },

  saveBtn: {
    padding: 2,
  },

  searchCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryXLight,
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  districtPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryXLight,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  districtPickerText: { fontSize: 14, color: COLORS.text },
  chevron: { fontSize: 14, color: COLORS.primary },
  verifiedBanner: {
    backgroundColor: '#dcfce7',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  verifiedBannerText: { fontSize: 12, fontWeight: '600', color: '#16a34a' },

  list: { paddingHorizontal: 16, gap: 14 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  clinicName: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.text },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifiedBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#16a34a' },

  infoRows: { gap: 6, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoIcon: { fontSize: 13, marginTop: 1 },
  infoValue: { flex: 1, fontSize: 12, color: COLORS.primaryDark, lineHeight: 18 },

  doctorsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  doctorsList: { gap: 5, marginBottom: 12 },
  doctorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doctorIcon: { fontSize: 13 },
  doctorName: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  doctorSpec: { fontSize: 11, color: COLORS.textSecondary, flex: 1 },

  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryXLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  feeLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  feeValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

  tapHint: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },

  btnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  viewDetailsBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    backgroundColor: COLORS.surface,
  },
  viewDetailsTxt: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  appointmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
  },
  appointmentTxt: { fontSize: 13, fontWeight: '600', color: '#fff' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary },

  // ── District picker modal ─────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  pickerSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerItemActive: { backgroundColor: COLORS.primaryXLight, borderRadius: 10 },
  pickerItemTxt: { fontSize: 14, color: COLORS.text },
  pickerItemTxtActive: { fontWeight: '700', color: COLORS.primary },

  // ── Detail modal ──────────────────────────────────────────────────────────
  detailOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  detailSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },
  detailTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  detailName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryXLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  detailBody: { padding: 20 },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  doctorCards: { gap: 8 },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.primaryXLight,
    borderRadius: 12,
  },
  doctorCardName: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  doctorCardSpec: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { backgroundColor: COLORS.primaryLight, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 5 },
  chipTxt: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  detailFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryXLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  detailFeeLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  detailFeeValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  bookBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
  },
  bookBtnTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ─── Mini-map styles ──────────────────────────────────────────────────────────

const miniMapStyles = StyleSheet.create({
  wrapper: { marginVertical: 10 },
  container: {
    backgroundColor: '#d4edda',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    position: 'relative',
  },
  gridH: { position: 'absolute', height: 1, backgroundColor: 'rgba(0,0,0,0.07)' },
  gridV: { position: 'absolute', width: 1, backgroundColor: 'rgba(0,0,0,0.07)' },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(190,24,93,0.15)',
    backgroundColor: 'rgba(190,24,93,0.04)',
  },
  pinWrap: { position: 'absolute', alignItems: 'center', zIndex: 10 },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinEmoji: { fontSize: 16 },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
    marginTop: -1,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '75%',
  },
  badgeTxt: { fontSize: 11, fontWeight: '600', color: COLORS.text },
  openBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  openBtnTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
