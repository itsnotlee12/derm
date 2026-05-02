import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SAMPLE_CLINICS, MAX_FREE_SCANS } from '@/lib/constants';
import {
  BODY_LOCATIONS,
  SYMPTOM_PATTERNS,
  IMPACT_LEVELS,
  DURATIONS,
  HOUSEHOLD_OPTIONS,
  diagnoseCondition,
  CONDITION_MAP,
} from '@/lib/conditions';
import {
  getCurrentUser,
  saveScanResult,
  getUserSubscription,
  setUserSubscription,
  addAppNotification,
} from '@/lib/store';
import type { ScanResult } from '@/lib/store';

type Step = 'welcome' | 'questionnaire' | 'upload' | 'analyzing' | 'result';

// ─── Step indicator ──────────────────────────────────────────────────────────

const SCAN_STEPS = [
  { number: 1, label: 'Questions' },
  { number: 2, label: 'Photo' },
  { number: 3, label: 'Results' },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.stepIndicatorRow}>
      {SCAN_STEPS.map((s, i) => {
        const done = currentStep > s.number;
        const active = currentStep === s.number;
        return (
          <View key={s.number} style={styles.stepIndicatorItem}>
            <View style={styles.stepIndicatorLabelRow}>
              {i > 0 && (
                <View style={[styles.stepConnector, (done || active) && styles.stepConnectorActive]} />
              )}
              <View style={[
                styles.stepCircle,
                active && styles.stepCircleActive,
                done && styles.stepCircleDone,
              ]}>
                {done
                  ? <Ionicons name="checkmark" size={14} color="#fff" />
                  : <Text style={[styles.stepCircleTxt, (active || done) && { color: '#fff' }]}>{s.number}</Text>
                }
              </View>
              {i < SCAN_STEPS.length - 1 && (
                <View style={[styles.stepConnector, done && styles.stepConnectorActive]} />
              )}
            </View>
            <Text style={[
              styles.stepIndicatorLabel,
              (active || done) && styles.stepIndicatorLabelActive,
            ]}>{s.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scansUsed, setScansUsed] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadScanInfo();
    }, [])
  );

  async function loadScanInfo() {
    const user = await getCurrentUser();
    if (!user) return;
    const sub = await getUserSubscription(user.id);
    setIsPremium(sub?.plan === 'premium');
    setScansUsed(sub?.scansUsed ?? 0);
  }

  async function checkCanScan(): Promise<boolean> {
    const user = await getCurrentUser();
    // No user = demo/prototype mode, always allow
    if (!user) return true;
    const isDemoAccount = user.email.toLowerCase().endsWith('@dermai.ph');
    const sub = await getUserSubscription(user.id);
    const premium = sub?.plan === 'premium';
    const used = sub?.scansUsed ?? 0;
    setIsPremium(premium);
    setScansUsed(used);
    return premium || isDemoAccount || used < MAX_FREE_SCANS;
  }

  function reset() {
    setStep('welcome');
    setAnswers({});
    setImageUri(null);
    setResult(null);
    loadScanInfo();
  }

  async function pickImage(fromCamera: boolean) {
    const permResult = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permResult.granted) {
      Alert.alert('Permission Required', fromCamera
        ? 'Camera access is needed to take a photo.'
        : 'Photo library access is needed to select an image.');
      return;
    }

    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    };

    const res = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);

    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
    }
  }

  async function runAnalysis() {
    if (!imageUri) {
      Alert.alert('No Image', 'Please upload or take a photo first.');
      return;
    }

    setStep('analyzing');
    const user = await getCurrentUser();

    await new Promise((r) => setTimeout(r, 2800));

    const { conditionKey, confidence, condition, secondaryResult } = diagnoseCondition(answers);
    const referralSuggested = condition.severity === 'severe' || confidence < condition.referralThreshold || !!secondaryResult;

    const scanResult: ScanResult = {
      id: `scan_${Date.now()}`,
      userId: user?.id ?? 'demo',
      date: new Date().toISOString(),
      imageUri,
      answers,
      condition: condition.name,
      confidence,
      severity: condition.severity,
      category: condition.category,
      description: condition.description,
      symptoms: condition.symptoms,
      careTips: condition.careTips,
      referralSuggested,
      referralReason: referralSuggested
        ? condition.severity === 'severe'
          ? 'This condition requires professional medical evaluation.'
          : secondaryResult
          ? 'Multiple possible conditions detected — a specialist can provide a definitive diagnosis.'
          : 'Low diagnostic confidence — a specialist can provide a definitive diagnosis.'
        : undefined,
      isGovernmentReportable: condition.isGovernmentReportable ?? false,
      secondaryCondition: secondaryResult?.condition.name,
      secondaryConfidence: secondaryResult?.confidence,
      status: confidence < 60 ? 'flagged' : 'pending',
    };

    if (user) {
      await saveScanResult(user.id, scanResult);
      const isDemoAccount = user.email.toLowerCase().endsWith('@dermai.ph');
      const sub = await getUserSubscription(user.id);
      if (!isDemoAccount && sub?.plan !== 'premium') {
        await setUserSubscription(user.id, {
          ...(sub ?? { userId: user.id, email: user.email, plan: 'free' as const }),
          scansUsed: (sub?.scansUsed ?? 0) + 1,
        });
      }
      await addAppNotification(user.id, {
        type: 'scan',
        title: 'Scan Complete',
        message: `Your scan result is ready: ${condition.name} (${confidence}% confidence).`,
        userId: user.id,
      });
    }

    setResult(scanResult);
    setStep('result');
  }

  // ─── Welcome ───────────────────────────────────────────────────────────────
  if (step === 'welcome') {
    const scansLeft = Math.max(0, MAX_FREE_SCANS - scansUsed);
    const limitReached = !isPremium && scansLeft === 0;
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.welcomeContainer}>
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeTitle}>Scan Your Skin</Text>
            <Text style={styles.welcomeSub}>Get an AI-powered preliminary assessment of your skin condition</Text>
          </View>

          <StepIndicator currentStep={0} />

          <View style={styles.card}>
            <View style={styles.welcomeIconCircle}>
              <Ionicons name="camera-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.welcomeCardTitle}>Ready to analyze your skin?</Text>
            <Text style={styles.welcomeCardSub}>
              Answer a few questions about your symptoms, upload a clear photo of the affected area,
              and get an AI-powered assessment with care recommendations.
            </Text>

            {[
              { n: 1, label: 'Answer Questions', desc: 'Tell us about your symptoms' },
              { n: 2, label: 'Upload Photo', desc: 'Take or upload a photo of the area' },
              { n: 3, label: 'View Result', desc: 'Get your AI diagnosis & care tips' },
            ].map((s) => (
              <View key={s.n} style={styles.welcomeStep}>
                <View style={styles.welcomeStepNum}>
                  <Text style={styles.welcomeStepNumTxt}>{s.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.welcomeStepLabel}>{s.label}</Text>
                  <Text style={styles.welcomeStepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}

            {!isPremium && (
              <View style={[styles.quotaBanner, limitReached && styles.quotaBannerDanger]}>
                <Ionicons
                  name={limitReached ? 'lock-closed' : 'camera-outline'}
                  size={18}
                  color={limitReached ? COLORS.danger : COLORS.primary}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.quotaTitle, limitReached && { color: COLORS.danger }]}>
                    {limitReached ? 'Free scans used' : `Free Plan: ${MAX_FREE_SCANS} Scans`}
                  </Text>
                  <Text style={styles.quotaSub}>
                    {limitReached
                      ? 'Upgrade to Premium for unlimited scans'
                      : `You have ${scansLeft} free skin scan${scansLeft !== 1 ? 's' : ''}. Upgrade for unlimited access.`}
                  </Text>
                </View>
                {limitReached && (
                  <TouchableOpacity
                    style={styles.quotaUpgradeBtn}
                    onPress={() => router.push('/(app)/subscription')}
                  >
                    <Text style={styles.quotaUpgradeTxt}>Upgrade</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {isPremium && (
              <View style={styles.quotaBannerPremium}>
                <Ionicons name="star" size={16} color={COLORS.primary} />
                <Text style={[styles.quotaTitle, { marginLeft: 8, color: COLORS.primary }]}>Premium — Unlimited Scans</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.ctaBtn, limitReached && styles.ctaBtnOutline]}
              onPress={limitReached
                ? () => router.push('/(app)/subscription')
                : async () => {
                    const can = await checkCanScan();
                    if (!can) { router.push('/(app)/subscription'); return; }
                    setStep('questionnaire');
                  }}
            >
              <Text style={[styles.ctaBtnTxt, limitReached && { color: COLORS.primary }]}>
                {limitReached ? 'Upgrade to Continue' : 'Begin Analysis'}
              </Text>
            </TouchableOpacity>

            <View style={styles.disclaimerRow}>
              <Ionicons name="warning-outline" size={13} color={COLORS.warning} />
              <Text style={styles.disclaimerTxt}>
                {' '}DermAI provides preliminary assessments only. Always consult a licensed dermatologist.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Questionnaire ──────────────────────────────────────────────────────────
  if (step === 'questionnaire') {
    const canProceed =
      !!answers.bodyLocation &&
      !!answers.symptomPattern &&
      !!answers.impactLevel &&
      !!answers.duration &&
      !!answers.household;

    return (
      <SafeAreaView style={styles.safe}>
        <StepIndicator currentStep={1} />
        <ScrollView contentContainerStyle={styles.pageContainer}>
          <View style={styles.card}>
            <TouchableOpacity style={styles.backRow} onPress={reset}>
              <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
              <Text style={styles.backTxt}> Back</Text>
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Pre-Analysis Questionnaire</Text>

            <View style={styles.conditionsBox}>
              <Text style={styles.conditionsBoxTitle}>AI Target Conditions Covered</Text>
              <Text style={styles.conditionsBoxText}>
                Fungal (Tinea Versicolor, Tinea Corporis, Tinea Pedis), Acne Vulgaris, Inflammatory
                (Prickly Heat, Contact Dermatitis, Atopic Dermatitis), Pigmentation (Melasma), and
                Bacterial/Mycobacterial (Impetigo, Leprosy-sign alerts with confidential DOH/CHO referral).
              </Text>
            </View>

            <QuestionBlock
              question="Where on your body is the concern?"
              options={BODY_LOCATIONS}
              selected={answers.bodyLocation}
              onSelect={(v) => setAnswers((a) => ({ ...a, bodyLocation: v }))}
            />
            <QuestionBlock
              question="Which symptom pattern is closest?"
              options={SYMPTOM_PATTERNS}
              selected={answers.symptomPattern}
              onSelect={(v) => setAnswers((a) => ({ ...a, symptomPattern: v }))}
            />
            <QuestionBlock
              question="Which best describes your condition right now?"
              options={IMPACT_LEVELS}
              selected={answers.impactLevel}
              onSelect={(v) => setAnswers((a) => ({ ...a, impactLevel: v }))}
            />
            <QuestionBlock
              question="How long have you had it?"
              options={DURATIONS}
              selected={answers.duration}
              onSelect={(v) => setAnswers((a) => ({ ...a, duration: v }))}
            />
            <QuestionBlock
              question="Does anyone at home have it?"
              options={HOUSEHOLD_OPTIONS}
              selected={answers.household}
              onSelect={(v) => setAnswers((a) => ({ ...a, household: v }))}
            />

            <TouchableOpacity
              style={[styles.ctaBtn, !canProceed && styles.ctaBtnDisabled]}
              disabled={!canProceed}
              onPress={() => setStep('upload')}
            >
              <Text style={styles.ctaBtnTxt}>Next: Upload Photo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Upload ─────────────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <SafeAreaView style={styles.safe}>
        <StepIndicator currentStep={2} />
        <ScrollView contentContainerStyle={styles.pageContainer}>
          <View style={styles.card}>
            <TouchableOpacity style={styles.backRow} onPress={() => setStep('questionnaire')}>
              <Ionicons name="arrow-back" size={16} color={COLORS.textSecondary} />
              <Text style={styles.backTxt}> Back</Text>
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Upload a Photo</Text>

            <TouchableOpacity
              style={[styles.uploadZone, imageUri ? styles.uploadZoneSelected : null]}
              onPress={() => pickImage(false)}
              activeOpacity={0.8}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
              ) : (
                <View style={styles.uploadZoneInner}>
                  <Ionicons name="camera-outline" size={40} color={COLORS.primary} />
                  <Text style={styles.uploadZoneTitle}>Tap to upload a photo</Text>
                  <Text style={styles.uploadZoneSub}>JPG, PNG, or HEIC up to 10MB</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.pickerRow}>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(false)}>
                <Ionicons name="images-outline" size={18} color={COLORS.primary} />
                <Text style={styles.pickerBtnTxt}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(true)}>
                <Ionicons name="camera-outline" size={18} color={COLORS.primary} />
                <Text style={styles.pickerBtnTxt}>Camera</Text>
              </TouchableOpacity>
            </View>

            {imageUri && (
              <TouchableOpacity onPress={() => setImageUri(null)} style={styles.clearBtn}>
                <Text style={styles.clearBtnTxt}>Remove photo</Text>
              </TouchableOpacity>
            )}

            <View style={styles.guidelinesBox}>
              <Text style={styles.guidelinesTitle}>Photo Guidelines</Text>
              {[
                { icon: 'sunny-outline' as const, text: 'Good lighting — use natural light' },
                { icon: 'search-outline' as const, text: 'Close-up of the affected area' },
                { icon: 'color-wand-outline' as const, text: 'No filters or editing' },
              ].map((g) => (
                <View key={g.text} style={styles.guidelineRow}>
                  <Ionicons name={g.icon} size={14} color={COLORS.textSecondary} />
                  <Text style={styles.guidelineTxt}> {g.text}</Text>
                </View>
              ))}
              <Text style={styles.guidelinesNote}>
                Before AI analysis, the system automatically checks photo quality and confirms if human skin is detected.
              </Text>
            </View>

            {!isPremium && (
              <View style={styles.quotaBanner}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.quotaTitle}>Free Plan: {MAX_FREE_SCANS} Scans</Text>
                  <Text style={styles.quotaSub}>
                    You have {Math.max(0, MAX_FREE_SCANS - scansUsed)} free skin scan{Math.max(0, MAX_FREE_SCANS - scansUsed) !== 1 ? 's' : ''}. Upgrade for unlimited access.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.quotaUpgradeBtn}
                  onPress={() => router.push('/(app)/subscription')}
                >
                  <Text style={styles.quotaUpgradeTxt}>Upgrade</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.ctaBtn, !imageUri && styles.ctaBtnDisabled]}
              disabled={!imageUri}
              onPress={runAnalysis}
            >
              <Text style={styles.ctaBtnTxt}>Analyze Skin Condition</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Analyzing ──────────────────────────────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <SafeAreaView style={styles.safe}>
        <StepIndicator currentStep={2} />
        <View style={styles.analyzingContainer}>
          <View style={styles.card}>
            <View style={styles.analyzingIconCircle}>
              <Ionicons name="sparkles" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.analyzingTitle}>Analyzing your photo...</Text>
            <Text style={styles.analyzingSub}>Our AI is examining your skin condition</Text>
            <View style={styles.analyzeBarBg}>
              <View style={styles.analyzeBarFill} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Result ─────────────────────────────────────────────────────────────────
  if (step === 'result' && result) {
    return <ResultScreen result={result} onReset={reset} onFindClinic={() => router.push('/(app)/clinics')} />;
  }

  return null;
}

// ─── Question block (all-at-once pill style) ──────────────────────────────────

function QuestionBlock({
  question,
  options,
  selected,
  onSelect,
}: {
  question: string;
  options: readonly string[];
  selected: string | undefined;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={styles.qBlock}>
      <Text style={styles.qBlockQuestion}>{question}</Text>
      <View style={styles.pillRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.pill, selected === opt && styles.pillSelected]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.pillTxt, selected === opt && styles.pillTxtSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({
  result,
  onReset,
  onFindClinic,
}: {
  result: ScanResult;
  onReset: () => void;
  onFindClinic: () => void;
}) {
  const condKey = Object.keys(CONDITION_MAP).find(
    (k) => CONDITION_MAP[k].name === result.condition
  ) ?? '';
  const conditionData = CONDITION_MAP[condKey];
  const isGovReportable = result.isGovernmentReportable ?? false;

  const verifiedClinics = SAMPLE_CLINICS.filter((c) => c.verified).slice(0, 2);

  return (
    <SafeAreaView style={styles.safe}>
      <StepIndicator currentStep={3} />
      <ScrollView contentContainerStyle={styles.pageContainer} showsVerticalScrollIndicator={false}>

        {/* ── Single merged analysis card ── */}
        <View style={styles.card}>

          {/* Condition header */}
          <View style={[styles.categoryBadge, { backgroundColor: isGovReportable ? COLORS.dangerLight : COLORS.primaryLight }]}>
            <Text style={[styles.categoryBadgeTxt, isGovReportable && { color: COLORS.danger }]}>
              {isGovReportable ? 'Urgent: Government-Reportable Condition' : result.category}
            </Text>
          </View>

          {/* Leprosy: hide name, show DOH referral */}
          {isGovReportable ? (
            <>
              <Text style={styles.resultConditionName}>Skin Concern Requires Immediate Attention</Text>
              <View style={[styles.disclaimerResultBox, { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger + '44', marginTop: 12 }]}>
                <View style={styles.rowCenter}>
                  <Ionicons name="medical-outline" size={16} color={COLORS.danger} />
                  <Text style={[styles.disclaimerResultTitle, { color: COLORS.danger }]}> Confidential DOH Referral</Text>
                </View>
                <Text style={[styles.disclaimerResultTxt, { color: '#7f1d1d' }]}>
                  Signs detected may be consistent with a government-reportable condition. The specific condition name is not shown to protect your privacy.{'\n\n'}
                  Please contact the Department of Health (DOH) immediately:{'\n'}
                  {'  '}📞 <Text style={{ fontWeight: '700' }}>DOH Hotline: 1555</Text> (free call){'\n'}
                  {'  '}🏥 Visit your nearest City Health Office (CHO){'\n\n'}
                  <Text style={{ fontWeight: '700' }}>Free treatment is available</Text> under the National Leprosy Control Program (NLCP).
                </Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.resultConditionName}>Possible {result.condition}</Text>
              {conditionData?.localName && (
                <Text style={styles.resultLocalName}>{conditionData.localName} (Filipino name)</Text>
              )}
            </>
          )}

          {/* Secondary possibility (30% rule) */}
          {result.secondaryCondition && (
            <View style={[styles.disclaimerResultBox, { backgroundColor: '#fef3c7', borderColor: '#d97706' + '44', marginTop: 12 }]}>
              <View style={styles.rowCenter}>
                <Ionicons name="alert-circle-outline" size={15} color={COLORS.warning} />
                <Text style={[styles.disclaimerResultTitle, { color: COLORS.warning }]}> Could Also Be</Text>
              </View>
              <Text style={[styles.disclaimerResultTxt, { color: '#78350f' }]}>
                <Text style={{ fontWeight: '700' }}>{result.secondaryCondition}</Text> is also a possibility ({result.secondaryConfidence}% confidence).{'\n'}
                Two conditions scored within 30% of each other — a licensed dermatologist can provide a definitive diagnosis.
              </Text>
            </View>
          )}

          <Text style={styles.resultSectionTitle}>AI Confidence Score</Text>
          <View style={styles.confRow}>
            <View style={styles.confBarBg}>
              <View style={[styles.confBarFill, { width: `${result.confidence}%` as any, backgroundColor: COLORS.primary }]} />
            </View>
            <Text style={[styles.confPct, { color: COLORS.primary }]}>{result.confidence}%</Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.rowCenter}>
              <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.metaTxt}> {result.answers?.bodyLocation ?? '—'}</Text>
            </View>
            <Text style={styles.metaTxt}>
              {new Date(result.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>

          {/* What is it — hidden for government-reportable */}
          {!isGovReportable && (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.resultSectionTitle}>What is it?</Text>
              <Text style={styles.resultBodyText}>{result.description}</Text>
            </>
          )}

          {/* Symptoms */}
          <View style={styles.sectionDivider} />
          <Text style={styles.resultSectionTitle}>Common Symptoms</Text>
          {result.symptoms.map((s) => (
            <View key={s} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletTxt}>{s}</Text>
            </View>
          ))}

          {/* Who does it affect */}
          {conditionData?.whoAffected && (
            <>
              <View style={styles.sectionDivider} />
              <View style={styles.whoBox}>
                <View style={styles.rowCenter}>
                  <View style={styles.whoIconCircle}>
                    <Ionicons name="people-outline" size={16} color={COLORS.primary} />
                  </View>
                  <Text style={styles.whoTitle}> Who does it affect?</Text>
                </View>
                <Text style={styles.whoTxt}>{conditionData.whoAffected}</Text>
              </View>
            </>
          )}

          {/* Care tips — replaced by DOH block for government-reportable */}
          {!isGovReportable && (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.resultSectionTitle}>Basic Care Tips</Text>
              {result.careTips.map((t) => (
                <View key={t} style={styles.careRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.careTxt}> {t}</Text>
                </View>
              ))}
            </>
          )}

          {/* When to see a doctor */}
          {conditionData?.whenToSeeDoctor && (
            <>
              <View style={styles.sectionDivider} />
              <View style={styles.doctorBox}>
                <View style={styles.rowCenter}>
                  <Ionicons name="medical-outline" size={16} color="#92400e" />
                  <Text style={styles.doctorTitle}> When to See a Doctor</Text>
                </View>
                <Text style={styles.doctorTxt}>{conditionData.whenToSeeDoctor}</Text>
              </View>
            </>
          )}

          {/* Disclaimer */}
          <View style={styles.sectionDivider} />
          <View style={styles.disclaimerResultBox}>
            <View style={styles.rowCenter}>
              <Ionicons name="warning-outline" size={15} color={COLORS.danger} />
              <Text style={styles.disclaimerResultTitle}> Medical Disclaimer</Text>
            </View>
            <Text style={styles.disclaimerResultTxt}>
              This information is for educational purposes only and is NOT a medical diagnosis.
              Always consult a licensed dermatologist for proper evaluation and treatment.
            </Text>
          </View>

        </View>
        {/* ── End merged analysis card ── */}

        {/* Clinics */}
        <View style={styles.card}>
          <Text style={styles.resultSectionTitle}>Recommended Clinics Near You</Text>
          {verifiedClinics.map((clinic) => (
            <View key={clinic.id} style={styles.clinicRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.rowCenter}>
                  <Text style={styles.clinicName}>{clinic.name}</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={10} color={COLORS.success} />
                    <Text style={styles.verifiedTxt}> Verified</Text>
                  </View>
                </View>
                <View style={styles.rowCenter}>
                  <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.clinicAddr}> {clinic.address}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.clinicViewBtn} onPress={onFindClinic}>
                <Text style={styles.clinicViewTxt}>View</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.allClinicsRow} onPress={onFindClinic}>
            <Text style={styles.allClinicsTxt}>View all clinics</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.resultBtnRow}>
          <TouchableOpacity style={styles.resultBtnOutline} onPress={onReset}>
            <Text style={styles.resultBtnOutlineTxt}>Scan Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultBtnFilled} onPress={onFindClinic}>
            <Text style={styles.resultBtnFilledTxt}>Find a Clinic</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepIndicatorItem: { alignItems: 'center', flex: 1 },
  stepIndicatorLabelRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' },
  stepConnector: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 2 },
  stepConnectorActive: { backgroundColor: COLORS.primary },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.border,
  },
  stepCircleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepCircleDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepCircleTxt: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  stepIndicatorLabel: { fontSize: 10, color: COLORS.textSecondary, marginTop: 5, fontWeight: '500', textAlign: 'center' },
  stepIndicatorLabelActive: { color: COLORS.primary, fontWeight: '700' },

  welcomeContainer: { paddingBottom: 32 },
  welcomeHeader: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 8 },
  welcomeTitle: { fontSize: 26, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  welcomeSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  welcomeIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 12,
  },
  welcomeCardTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  welcomeCardSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  welcomeStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  welcomeStepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  welcomeStepNumTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  welcomeStepLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  welcomeStepDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 20,
    marginHorizontal: 16, marginTop: 12,
    padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  pageContainer: { paddingBottom: 32 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 14 },

  quotaBanner: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fbcfe8',
    borderRadius: 14, padding: 14, marginBottom: 14,
    backgroundColor: '#fdf4ff',
  },
  quotaBannerDanger: { borderColor: '#fca5a5', backgroundColor: '#fee2e2' },
  quotaBannerPremium: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.primaryLight, borderRadius: 12,
    padding: 12, marginVertical: 14,
  },
  quotaTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  quotaSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  quotaUpgradeBtn: {
    backgroundColor: COLORS.primary, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  quotaUpgradeTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },

  ctaBtn: {
    backgroundColor: COLORS.primary, borderRadius: 30,
    paddingVertical: 15, alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.primary, shadowOpacity: 0.3,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  ctaBtnOutline: {
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary,
    shadowOpacity: 0,
  },
  ctaBtnDisabled: { opacity: 0.4, shadowOpacity: 0 },
  ctaBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  disclaimerRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 14 },
  disclaimerTxt: { fontSize: 11, color: COLORS.textSecondary, flex: 1, lineHeight: 17 },

  conditionsBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: 12,
    padding: 12, marginBottom: 18,
    borderWidth: 1, borderColor: COLORS.borderDark ?? '#f9a8d4',
  },
  conditionsBoxTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  conditionsBoxText: { fontSize: 11, color: COLORS.text, lineHeight: 17 },
  qBlock: { marginBottom: 20 },
  qBlockQuestion: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 10 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: COLORS.background,
  },
  pillSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  pillTxt: { fontSize: 13, color: COLORS.text },
  pillTxtSelected: { color: COLORS.primary, fontWeight: '600' },

  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backTxt: { fontSize: 13, color: COLORS.textSecondary },
  uploadZone: {
    borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed',
    borderRadius: 16, minHeight: 175, overflow: 'hidden',
    marginBottom: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  uploadZoneSelected: { borderStyle: 'solid', backgroundColor: '#fff' },
  uploadZoneInner: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 24 },
  uploadZoneTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  uploadZoneSub: { fontSize: 12, color: COLORS.primary, marginTop: 5, opacity: 0.8 },
  preview: { width: '100%', height: 220 },
  pickerRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  pickerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 30,
    paddingVertical: 13, backgroundColor: COLORS.primaryLight,
    gap: 6,
  },
  pickerBtnTxt: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  clearBtn: { alignItems: 'center', marginBottom: 8 },
  clearBtnTxt: { color: COLORS.danger, fontSize: 12, fontWeight: '600' },
  guidelinesBox: {
    backgroundColor: '#f8fafc', borderRadius: 14,
    padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  guidelinesTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  guidelineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7, gap: 8 },
  guidelineTxt: { fontSize: 12, color: COLORS.text, flex: 1 },
  guidelinesNote: { fontSize: 11, color: COLORS.textSecondary, marginTop: 10, lineHeight: 16, fontStyle: 'italic' },

  analyzingContainer: { flex: 1, justifyContent: 'center', paddingBottom: 60 },
  analyzingIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  analyzingTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 8 },
  analyzingSub: { fontSize: 13, color: COLORS.primary, textAlign: 'center', marginBottom: 20 },
  analyzeBarBg: { height: 6, backgroundColor: COLORS.primaryLight, borderRadius: 3, overflow: 'hidden' },
  analyzeBarFill: { height: 6, width: '40%', backgroundColor: COLORS.primary, borderRadius: 3 },

  categoryBadge: {
    alignSelf: 'flex-start', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10,
  },
  categoryBadgeTxt: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  resultConditionName: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  resultLocalName: { fontSize: 13, color: COLORS.primary, marginBottom: 16 },
  resultSectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  confBarBg: { flex: 1, height: 8, backgroundColor: COLORS.primaryLight, borderRadius: 4, overflow: 'hidden' },
  confBarFill: { height: 8, borderRadius: 4 },
  confPct: { fontSize: 16, fontWeight: '800', minWidth: 40, textAlign: 'right' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaTxt: { fontSize: 12, color: COLORS.textSecondary },
  refOnly: { fontSize: 11, color: COLORS.textSecondary },
  refImgWrap: { marginRight: 10, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  refImg: { width: 150, height: 110, borderRadius: 10 },
  refSevBadge: { position: 'absolute', bottom: 6, left: 6, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  refSevTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  severityCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 6 },
  severityLabel: { fontSize: 15, fontWeight: '700' },
  sevBarRow: { flexDirection: 'row', gap: 3, marginVertical: 10, height: 6, borderRadius: 3, overflow: 'hidden' },
  sevSegment: { flex: 1, height: 6 },
  sectionDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  resultBodyText: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 7, marginRight: 10 },
  bulletTxt: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 20 },
  whoBox: { backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 14 },
  whoIconCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  whoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  whoTxt: { fontSize: 13, color: COLORS.text, marginTop: 8, lineHeight: 19 },
  careRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  careTxt: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 19 },
  doctorBox: { backgroundColor: '#fef9c3', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fde68a' },
  doctorTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  doctorTxt: { fontSize: 13, color: '#78350f', lineHeight: 19 },
  disclaimerResultBox: { backgroundColor: '#fff1f2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fecdd3' },
  disclaimerResultTitle: { fontSize: 13, fontWeight: '700', color: COLORS.danger, marginBottom: 6 },
  disclaimerResultTxt: { fontSize: 12, color: '#9f1239', lineHeight: 18 },

  // ── Referral card ──────────────────────────────────────────────────────────
  referralCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    padding: 18,
    marginBottom: 12,
  },
  referralCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  referralCardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralCardTitle: { fontSize: 15, fontWeight: '800', color: '#9a3412' },
  referralCardSub: { fontSize: 12, color: '#c2410c', marginTop: 2 },
  referralUrgencyBadge: {
    backgroundColor: '#ea580c',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  referralUrgencyTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  referralCardReason: {
    fontSize: 13,
    color: '#7c2d12',
    lineHeight: 19,
    backgroundColor: '#ffedd5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  referralCardSteps: { gap: 8, marginBottom: 16 },
  referralStep: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  referralStepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralStepTxt: { fontSize: 13, color: '#7c2d12', flex: 1, lineHeight: 18 },
  referralCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 13,
  },
  referralCardBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

  clinicRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  clinicName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginRight: 6 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#dcfce7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  verifiedTxt: { fontSize: 10, color: COLORS.success, fontWeight: '600' },
  clinicAddr: { fontSize: 11, color: COLORS.textSecondary },
  clinicViewBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  clinicViewTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  allClinicsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  allClinicsTxt: { color: COLORS.primary, fontWeight: '600', fontSize: 13, marginRight: 4 },
  resultBtnRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16 },
  resultBtnOutline: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 30, paddingVertical: 14, alignItems: 'center',
  },
  resultBtnOutlineTxt: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
  resultBtnFilled: {
    flex: 1, backgroundColor: COLORS.primary,
    borderRadius: 30, paddingVertical: 14, alignItems: 'center',
  },
  resultBtnFilledTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
