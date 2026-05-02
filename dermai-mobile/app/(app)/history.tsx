import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { getCurrentUser, getSkinHistory, deleteScanResult } from '@/lib/store';
import type { ScanResult } from '@/lib/store';

const CONDITION_IMAGES: Record<string, any> = {
  'Acne Rosacea': require('../../assets/images/acne-rosacea.png'),
};

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [selected, setSelected] = useState<ScanResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  async function loadHistory() {
    const user = await getCurrentUser();
    if (!user) return;
    const h = await getSkinHistory(user.id);
    setHistory(h);
  }

  async function handleDelete(item: ScanResult) {
    Alert.alert(
      'Delete Scan',
      `Are you sure you want to delete the "${item.condition}" scan result? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const user = await getCurrentUser();
            if (!user) return;
            await deleteScanResult(user.id, item.id);
            setHistory((prev) => prev.filter((h) => h.id !== item.id));
            if (selected?.id === item.id) setSelected(null);
          },
        },
      ]
    );
  }

  const filteredHistory = history.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.condition.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  if (selected) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan History</Text>
          <Text style={styles.headerSub}>{history.length} total scan{history.length !== 1 ? 's' : ''}</Text>
        </View>
        <DetailView
          result={selected}
          onBack={() => setSelected(null)}
          onDelete={() => handleDelete(selected)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
        <Text style={styles.headerSub}>{history.length} total scan{history.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Search */}
      {history.length > 0 && (
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by condition or category..."
            placeholderTextColor={COLORS.textLight}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnTxt}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>📋</Text>
          <Text style={styles.emptyTitle}>No Scans Yet</Text>
          <Text style={styles.emptySub}>
            Start your first AI skin analysis to see results here.
          </Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/(app)/scan')}
          >
            <Text style={styles.ctaBtnTxt}>Start Scan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredHistory.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>🔍</Text>
              <Text style={styles.emptyTitle}>No Results</Text>
              <Text style={styles.emptySub}>No scans match "{searchTerm}"</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredHistory.map((item) => (
                <ScanCard key={item.id} item={item} onPress={() => setSelected(item)} onDelete={() => handleDelete(item)} />
              ))}
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ScanCard({
  item,
  onPress,
  onDelete,
}: {
  item: ScanResult;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {(item.imageUri || CONDITION_IMAGES[item.condition]) ? (
        <Image
          source={item.imageUri ? { uri: item.imageUri } : CONDITION_IMAGES[item.condition]}
          style={styles.thumb}
        />
      ) : null}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.condName} numberOfLines={1}>
            {item.condition}
          </Text>

        </View>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.cardBottomRow}>
          <Text style={styles.confidence}>{item.confidence}% confidence</Text>
          <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        {item.referralSuggested && (
          <View style={styles.referralTag}>
            <Text style={styles.referralTagTxt}>🏥 Referral suggested</Text>
          </View>
        )}
        {item.status === 'flagged' && (
          <View style={styles.flagTag}>
            <Text style={styles.flagTagTxt}>⚠️ Flagged for review</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function DetailView({
  result,
  onBack,
  onDelete,
}: {
  result: ScanResult;
  onBack: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const location = result.answers?.bodyLocation;
  const scanDate = new Date(result.date).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const confColor =
    result.confidence >= 80 ? COLORS.success :
    result.confidence >= 60 ? '#f59e0b' :
    COLORS.danger;
  const isGovReportable = result.isGovernmentReportable ?? false;

  return (
    <Modal visible animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContainer}>
            {/* Scan photo */}
            {(result.imageUri || CONDITION_IMAGES[result.condition]) ? (
              <Image
                source={result.imageUri ? { uri: result.imageUri } : CONDITION_IMAGES[result.condition]}
                style={styles.detailHeroImg}
                resizeMode="cover"
              />
            ) : null}

            {/* Top pills + close */}
            <View style={styles.detailTopRow}>
              <View style={styles.detailPills}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillTxt}>{result.category}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onBack} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Condition name */}
            {isGovReportable ? (
              <>
                <Text style={styles.detailCondName}>Skin Concern Requires Immediate Attention</Text>
                <View style={[styles.disclaimerBox, { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger + '33' }]}>
                  <Ionicons name="medical-outline" size={16} color={COLORS.danger} style={{ marginTop: 1 }} />
                  <Text style={[styles.disclaimerTxt, { color: '#7f1d1d' }]}>
                    Confidential DOH Referral — specific condition name is not displayed to protect your privacy.{'\n\n'}
                    📞 <Text style={{ fontWeight: '800' }}>DOH Hotline: 1555</Text>{'\n'}
                    🏥 Visit your nearest City Health Office{'\n'}
                    Free treatment available under NLCP.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.detailCondName}>Possible {result.condition}</Text>
                {result.localName ? (
                  <Text style={styles.detailLocalName}>{result.localName} (Filipino name)</Text>
                ) : null}
              </>
            )}

            {/* Secondary possibility */}
            {result.secondaryCondition && (
              <View style={[styles.disclaimerBox, { backgroundColor: '#fef3c7', borderColor: '#d97706' + '44' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={COLORS.warning} style={{ marginTop: 1 }} />
                <Text style={[styles.disclaimerTxt, { color: '#78350f' }]}>
                  <Text style={{ fontWeight: '700' }}>Could also be: {result.secondaryCondition}</Text> ({result.secondaryConfidence}% confidence){'\n'}
                  Two conditions scored within 30% of each other — consult a dermatologist for a definitive diagnosis.
                </Text>
              </View>
            )}

            {/* Meta row */}
            <View style={styles.detailMetaRow}>
              {location ? (
                <View style={styles.detailMetaItem}>
                  <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.detailMetaTxt}>{location}</Text>
                </View>
              ) : null}
              <View style={styles.detailMetaItem}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailMetaTxt}>{scanDate}</Text>
              </View>
            </View>

            {/* Confidence */}
            <View style={styles.confRow}>
              <Text style={styles.confLabel}>Confidence Score</Text>
              <Text style={[styles.confValue, { color: confColor }]}>{result.confidence}%</Text>
            </View>
            <View style={styles.confBarBg}>
              <View style={[styles.confBarFill, { width: `${result.confidence}%`, backgroundColor: confColor }]} />
            </View>

            {/* About — hidden for government-reportable */}
            {!isGovReportable && (
              <>
                <Text style={styles.detailSectionTitle}>What is {result.condition}?</Text>
                <Text style={styles.detailBodyTxt}>{result.description}</Text>
              </>
            )}

            {/* Care tips — hidden for government-reportable */}
            {!isGovReportable && (
              <>
                <Text style={styles.detailSectionTitle}>Basic Care Tips</Text>
                {result.careTips.map((tip) => (
                  <View key={tip} style={styles.tipRow}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} style={{ marginTop: 1 }} />
                    <Text style={styles.tipTxt}>{tip}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Ionicons name="warning-outline" size={18} color={COLORS.danger} style={{ marginTop: 1 }} />
              <Text style={styles.disclaimerTxt}>
                This is <Text style={{ fontWeight: '800' }}>NOT</Text> a medical diagnosis. Please consult a licensed dermatologist for proper evaluation and treatment.
              </Text>
            </View>

            {/* Find Dermatologist */}
            <TouchableOpacity
              style={styles.findDermBtn}
              onPress={() => { onBack(); router.push('/(app)/clinics'); }}
            >
              <Text style={styles.findDermTxt}>Find a Dermatologist Near You</Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
              <Text style={styles.deleteBtnTxt}>Delete this scan</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnTxt: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' },
  deleteIcon: { fontSize: 16 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
  ctaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginTop: 8,
  },
  ctaBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  thumb: { width: 90, height: 90 },
  cardBody: { flex: 1, padding: 12 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  condName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  category: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginBottom: 6 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  confidence: { fontSize: 12, color: COLORS.textSecondary },
  date: { fontSize: 11, color: COLORS.textLight },
  referralTag: {
    marginTop: 6,
    backgroundColor: '#fff7ed',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  referralTagTxt: { fontSize: 11, color: '#c2410c' },
  flagTag: {
    marginTop: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  flagTagTxt: { fontSize: 11, color: '#b45309' },
  // Detail
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: { paddingVertical: 6 },
  backTxt: { color: COLORS.primary, fontWeight: '600', fontSize: 16 },
  detailHeaderTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  detailContainer: { paddingHorizontal: 20, paddingTop: 12 },
  detailHeroImg: { width: '100%', height: 220, borderRadius: 16, marginBottom: 16 },
  detailImg: { width: '100%', height: 220, borderRadius: 16, marginBottom: 16 },
  condCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailCondName: { fontSize: 20, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  detailCategory: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginBottom: 12, marginTop: 2 },
  confRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  confLabel: { fontSize: 13, color: COLORS.textSecondary },
  confValue: { fontSize: 13, fontWeight: '700' },
  confBarBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: 10 },
  confBarFill: { height: 8, borderRadius: 4 },
  detailDate: { fontSize: 12, color: COLORS.textSecondary },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  bodyTxt: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  bullet: { fontSize: 13, color: COLORS.text, marginBottom: 5, lineHeight: 19 },
  referralBox: {
    backgroundColor: '#fff7ed',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  referralBoxTitle: { fontSize: 15, fontWeight: '700', color: '#c2410c', marginBottom: 6 },
  referralBoxTxt: { fontSize: 13, color: '#7c2d12', lineHeight: 19 },
  // Detail view
  detailTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  detailPills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 },
  categoryPill: { backgroundColor: COLORS.primaryLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  categoryPillTxt: { color: COLORS.primary, fontWeight: '600', fontSize: 12 },
  severityPill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  severityPillTxt: { fontWeight: '600', fontSize: 12 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  detailLocalName: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12, marginTop: 2 },
  detailMetaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  detailMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  detailMetaTxt: { fontSize: 13, color: COLORS.textSecondary },
  detailSectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 20, marginBottom: 8 },
  detailBodyTxt: { fontSize: 14, color: COLORS.primary, lineHeight: 22 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  tipTxt: { fontSize: 14, color: COLORS.text, lineHeight: 21, flex: 1 },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fff0f3',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  disclaimerTxt: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 20 },
  findDermBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  findDermTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, alignSelf: 'center' },
  deleteBtnTxt: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '60%',
  },
});
