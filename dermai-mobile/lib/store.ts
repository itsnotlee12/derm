import AsyncStorage from '@react-native-async-storage/async-storage';

// â”€â”€â”€ Key constants (mirror web localStorage keys exactly) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const KEYS = {
  PATIENT_ACCOUNTS: 'dermai_patient_accounts',
  CURRENT_USER_EMAIL: 'dermai_current_user_email',
  SKIN_HISTORY: 'dermai_skin_history',
  USER_SUBSCRIPTION: 'dermai_user_subscription',
  APPOINTMENTS: 'dermai_appointments',
  PLATFORM_USERS: 'dermai_platform_users',
  PLATFORM_SCANS: 'dermai_platform_scans',
  PLATFORM_TRANSACTIONS: 'dermai_platform_transactions',
  ADMIN_NOTIFICATIONS: 'dermai_admin_notifications',
  HELPDESK_TICKETS: 'dermai_helpdesk_tickets',
  NOTIF_PREFS: 'dermai_notif_prefs',
  SAVED_CLINICS: 'dermai_saved_clinics',
};

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface PatientAccount {
  id: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  age?: number;
  gender?: string;
  location?: string; // Cebu district
  dateOfBirth?: string;
  address?: string;
  profileImage?: string; // base64 data URI
  createdAt: string;
}

export interface ScanResult {
  id: string;
  userId: string;
  date: string;
  imageUri?: string;
  answers: Record<string, string>;
  condition: string;
  confidence: number;
  severity: 'mild' | 'moderate' | 'severe';
  category: string;
  description: string;
  symptoms: string[];
  careTips: string[];
  referralSuggested: boolean;
  referralReason?: string;
  localName?: string;
  status: 'pending' | 'validated' | 'flagged';
  /** Second possibility when it scores within 30% of primary (paper §) */
  secondaryCondition?: string;
  secondaryConfidence?: number;
  /** True for government-reportable conditions (Leprosy) — name must NOT be shown on-screen */
  isGovernmentReportable?: boolean;
}

export interface Appointment {
  id: string;
  userId: string;
  clinicId?: number;
  clinicName: string;
  clinicAddress?: string;
  doctorName?: string;
  specialty?: string;
  consultationType: 'face-to-face';
  conditionId?: string;
  conditionName?: string;
  notes?: string;
  patientName?: string;
  patientEmail?: string;
  patientAddress?: string;
  patientContact?: string;
  date?: string;
  time?: string;
  status: 'pending' | 'scheduled' | 'rejected' | 'confirmed' | 'completed' | 'cancelled';
  clinicNote?: string;
  skinPhotoUri?: string;
  createdAt: string;
}

export interface SubscriptionRecord {
  userId: string;
  email: string;
  plan: 'free' | 'premium';
  billingCycle?: 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
  transactionId?: string;
  scansUsed?: number;
  isDemoAccount?: boolean;
  cardLast4?: string;
  cardExpiry?: string;
}

export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  role: 'user';
  plan: 'free' | 'premium';
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface PlatformScan {
  id: string;
  userId: string;
  userEmail: string;
  date: string;
  condition: string;
  confidence: number;
  severity: string;
  referralSuggested: boolean;
  status: 'pending' | 'validated' | 'flagged';
}

export interface PlatformTransaction {
  id: string;
  userId?: string;
  userEmail: string;
  userName: string;
  plan: string;
  amount: number;
  date: string;
  method?: string;
  billingCycle?: string;
  status: 'paid' | 'completed' | 'refunded';
}

export interface AdminNotificationEntry {
  id: string;
  type: 'clinic-approved' | 'clinic-rejected' | 'new-subscription' | 'new-ticket';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  meta?: Record<string, string>;
}

export interface HelpdeskTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'appointment' | 'scan' | 'subscription' | 'general';
  subtype?: 'appointment-scheduled' | 'appointment-rejected';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// â”€â”€â”€ Generic helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getPatientAccounts(): Promise<PatientAccount[]> {
  return getJSON<PatientAccount[]>(KEYS.PATIENT_ACCOUNTS, []);
}

export async function savePatientAccount(account: PatientAccount): Promise<void> {
  const accounts = await getPatientAccounts();
  const idx = accounts.findIndex((a) => a.email === account.email);
  if (idx >= 0) {
    accounts[idx] = account;
  } else {
    accounts.push(account);
  }
  await setJSON(KEYS.PATIENT_ACCOUNTS, accounts);
}

export async function getCurrentUserEmail(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.CURRENT_USER_EMAIL);
}

export async function setCurrentUserEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.CURRENT_USER_EMAIL, email);
}

export async function clearCurrentUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.CURRENT_USER_EMAIL);
}

const DEMO_ACCOUNTS: Record<string, PatientAccount> = {
  'user@dermai.ph': {
    id: 'demo_patient',
    fullName: 'Demo Patient',
    email: 'user@dermai.ph',
    password: 'user1234',
    phone: '+63 912 345 6789',
    gender: 'Female',
    dateOfBirth: '1998-05-20',
    address: 'Mango Avenue, Cebu City',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
};

export async function getCurrentUser(): Promise<PatientAccount | null> {
  const email = await getCurrentUserEmail();
  if (!email) return null;
  const accounts = await getPatientAccounts();
  const found = accounts.find((a) => a.email === email);
  if (found) return found;
  // Fall back to seeded demo account
  return DEMO_ACCOUNTS[email.toLowerCase()] ?? null;
}

// â”€â”€â”€ Skin History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const _now = new Date();
const _daysAgo = (d: number) => new Date(_now.getTime() - d * 86400000).toISOString();


const DEMO_SCAN_HISTORY: ScanResult[] = [
  {
    id: 'demo_scan_1',
    userId: 'demo_patient',
    date: _daysAgo(3),
    condition: 'Tinea Versicolor',
    confidence: 87,
    severity: 'mild',
    category: 'Fungal Infection',
    description: 'A common fungal skin infection caused by Malassezia yeast, creating discolored patches on the skin. Especially common in warm, humid climates like Cebu.',
    symptoms: ['Patches lighter or darker than surrounding skin', 'Mild itching when sweating', 'Patches that do not tan evenly'],
    careTips: ['Use antifungal shampoo as body wash', 'Keep skin dry and clean', 'Wear breathable fabrics'],
    referralSuggested: false,
    localName: 'An-an',
    status: 'validated',
    answers: { bodyLocation: 'Back/Shoulders' },
  },
  {
    id: 'demo_scan_2',
    userId: 'demo_patient',
    date: _daysAgo(7),
    condition: 'Tinea Corporis',
    confidence: 84,
    severity: 'mild',
    category: 'Fungal Infection',
    description: 'A fungal skin infection causing ring-shaped, scaly patches on the body. Also called Ringworm, it spreads through contact with infected persons or animals.',
    symptoms: ['Red, ring-shaped rash with clear center', 'Slightly raised scaly border', 'Itching or stinging sensation'],
    careTips: ['Apply OTC antifungal cream (e.g., clotrimazole)', 'Keep area clean and dry', 'Avoid sharing towels or clothing'],
    referralSuggested: false,
    localName: 'Buni',
    status: 'validated',
    answers: { bodyLocation: 'Arms/Legs' },
  },
  {
    id: 'demo_scan_3',
    userId: 'demo_patient',
    date: _daysAgo(12),
    condition: 'Tinea Pedis',
    confidence: 85,
    severity: 'mild',
    category: 'Fungal Infection',
    description: "Fungal infection affecting the skin of the feet, particularly between toes. Common among wet market workers and those who wear closed shoes for extended periods.",
    symptoms: ['Itching and burning between toes', 'Scaly, peeling skin on feet', 'Blisters on sole'],
    careTips: ['Keep feet clean and dry', 'Apply antifungal powder daily', 'Wear breathable footwear'],
    referralSuggested: false,
    localName: 'Alipunga',
    status: 'validated',
    answers: { bodyLocation: 'Feet' },
  },
  {
    id: 'demo_scan_4',
    userId: 'demo_patient',
    date: _daysAgo(15),
    condition: 'Acne Vulgaris',
    confidence: 79,
    severity: 'moderate',
    category: 'Acne',
    description: 'A common skin condition where hair follicles become clogged with oil and dead skin cells, causing whiteheads, blackheads, or pimples.',
    symptoms: ['Whiteheads and blackheads', 'Red tender bumps', 'Pimples with pus'],
    careTips: ['Wash face twice daily with gentle cleanser', 'Avoid touching face', 'Use non-comedogenic products'],
    referralSuggested: true,
    referralReason: 'Moderate severity warrants dermatologist consultation for topical or oral treatment.',
    localName: 'Tagihawat',
    secondaryCondition: 'Prickly Heat',
    secondaryConfidence: 61,
    status: 'pending',
    answers: { bodyLocation: 'Face' },
  },
  {
    id: 'demo_scan_5',
    userId: 'demo_patient',
    date: _daysAgo(20),
    condition: 'Prickly Heat',
    confidence: 83,
    severity: 'mild',
    category: 'Inflammatory Skin Condition',
    description: 'A skin rash caused by blocked sweat glands, common in tropical climates. Small red bumps appear when sweat cannot evaporate properly.',
    symptoms: ['Small red or clear bumps', 'Prickling or stinging sensation', 'Rash in areas covered by clothing'],
    careTips: ['Move to a cool area', 'Wear lightweight cotton clothing', 'Apply calamine lotion'],
    referralSuggested: false,
    localName: 'Bungang Araw',
    status: 'validated',
    answers: { bodyLocation: 'Neck/Chest' },
  },
  {
    id: 'demo_scan_6',
    userId: 'demo_patient',
    date: _daysAgo(28),
    condition: 'Melasma',
    confidence: 72,
    severity: 'mild',
    category: 'Pigmentation Disorder',
    description: 'A condition causing brown or gray-brown patches, usually on the face, due to excess melanin production from prolonged UV exposure.',
    symptoms: ['Brown or grayish patches on cheeks', 'Symmetrical discoloration', 'Darkening with sun exposure'],
    careTips: ['Apply broad-spectrum SPF 30+ sunscreen daily', 'Avoid peak sun hours', 'Use vitamin C serum'],
    referralSuggested: false,
    localName: 'Melasma',
    status: 'validated',
    answers: { bodyLocation: 'Face/Neck' },
  },
  {
    id: 'demo_scan_7',
    userId: 'demo_patient',
    date: _daysAgo(35),
    condition: 'Contact Dermatitis',
    confidence: 74,
    severity: 'moderate',
    category: 'Inflammatory Skin Condition',
    description: 'Skin inflammation caused by direct contact with an irritant or allergen. Common triggers include soaps, cosmetics, and jewelry.',
    symptoms: ['Red, itchy rash at contact site', 'Dry, cracked skin', 'Bumps and blisters'],
    careTips: ['Identify and avoid the irritant', 'Apply cool, wet cloths', 'Use hydrocortisone cream for itching'],
    referralSuggested: true,
    referralReason: 'Moderate severity — a dermatologist can identify the allergen and prescribe treatment.',
    secondaryCondition: 'Atopic Dermatitis',
    secondaryConfidence: 66,
    status: 'validated',
    answers: { bodyLocation: 'Arms/Legs' },
  },
  {
    id: 'demo_scan_8',
    userId: 'demo_patient',
    date: _daysAgo(45),
    condition: 'Atopic Dermatitis',
    confidence: 80,
    severity: 'moderate',
    category: 'Inflammatory Skin Condition',
    description: 'A chronic inflammatory skin condition causing dry, itchy, and inflamed skin. Tends to flare periodically and is associated with asthma and hay fever.',
    symptoms: ['Dry, sensitive skin', 'Intense itching, especially at night', 'Red to brownish-gray patches'],
    careTips: ['Moisturize twice daily with fragrance-free lotion', 'Use mild unscented soap', 'Avoid scratching'],
    referralSuggested: true,
    referralReason: 'Chronic condition — requires a dermatologist-supervised management plan.',
    localName: 'Eczema',
    status: 'validated',
    answers: { bodyLocation: 'Arms/Legs' },
  },
  {
    id: 'demo_scan_9',
    userId: 'demo_patient',
    date: _daysAgo(55),
    condition: 'Impetigo',
    confidence: 76,
    severity: 'moderate',
    category: 'Bacterial Skin Infection',
    description: 'A highly contagious bacterial skin infection causing red sores that ooze fluid and form a yellowish-brown crust. Common in children.',
    symptoms: ['Red sores that rupture and ooze', 'Honey-colored crusty patches', 'Itchy blisters around nose and mouth'],
    careTips: ['Keep area clean with mild soap', 'Apply prescribed antibiotic ointment', 'Cover sores with a clean bandage'],
    referralSuggested: true,
    referralReason: 'Requires prescription antibiotic treatment — see a doctor promptly.',
    localName: 'Nana sa Balat',
    status: 'flagged',
    answers: { bodyLocation: 'Face' },
  },
  {
    id: 'demo_scan_10',
    userId: 'demo_patient',
    date: _daysAgo(68),
    condition: 'Leprosy',
    confidence: 71,
    severity: 'severe',
    category: 'Bacterial/Mycobacterial Infection',
    description:
      'A chronic bacterial infection affecting skin, peripheral nerves, and mucous membranes. Early signs include numb skin patches, discoloration, or non-healing wounds. Fully treatable with Multi-Drug Therapy (MDT) — free at all government health centers under the DOH National Leprosy Control Program.',
    symptoms: [
      'Pale or reddish patches on the skin with loss of sensation',
      'Numb skin areas (no feeling of pain, heat, or touch)',
      'Wounds or sores that do not heal normally',
      'Weakness in hands, feet, or eyelids',
    ],
    careTips: [
      'Seek medical attention immediately — this is urgent',
      'Do not delay — early treatment prevents permanent disability',
      'Avoid self-medication; consult a doctor as soon as possible',
      'Complete the full Multi-Drug Therapy (MDT) course as prescribed',
      'Visit your nearest government health center (treatment is free)',
    ],
    referralSuggested: true,
    referralReason: 'Government-reportable condition — immediate referral to a DOH health center is required.',
    localName: 'Ketong',
    isGovernmentReportable: true,
    status: 'flagged',
    answers: { bodyLocation: 'Arms/Legs' },
  },
];

export async function getSkinHistory(userId: string): Promise<ScanResult[]> {
  const allHistory = await getJSON<Record<string, ScanResult[]>>(KEYS.SKIN_HISTORY, {});
  const stored = allHistory[userId] ?? [];
  if (userId === 'demo_patient') {
    // Always include all demo entries, even when new ones are added later
    const storedIds = new Set(stored.map((r) => r.id));
    const merged = [...stored, ...DEMO_SCAN_HISTORY.filter((r) => !storedIds.has(r.id))];
    return merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  return stored;
}

const DEMO_APPOINTMENTS: Appointment[] = [
  {
    id: 'demo_appt_1',
    userId: 'demo_patient',
    clinicId: 1,
    clinicName: 'DermCare Skin Clinic',
    clinicAddress: '12 Mabini St, Makati City',
    doctorName: 'Dr. Maria Santos',
    specialty: 'Dermatologist',
    consultationType: 'face-to-face',
    conditionName: 'Acne Vulgaris',
    patientName: 'Demo Patient',
    patientEmail: 'user@dermai.ph',
    patientContact: '09171234567',
    date: '2026-04-15',
    time: '10:00 AM',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo_appt_2',
    userId: 'demo_patient',
    clinicId: 2,
    clinicName: 'SkinHealth Derma Center',
    clinicAddress: '45 Rizal Ave, Quezon City',
    doctorName: 'Dr. Jose Reyes',
    specialty: 'Dermatologist',
    consultationType: 'face-to-face',
    conditionName: 'Tinea Versicolor',
    patientName: 'Demo Patient',
    patientEmail: 'user@dermai.ph',
    patientContact: '09171234567',
    status: 'pending',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo_appt_3',
    userId: 'demo_patient',
    clinicId: 1,
    clinicName: 'DermCare Skin Clinic',
    clinicAddress: '12 Mabini St, Makati City',
    doctorName: 'Dr. Maria Santos',
    specialty: 'Dermatologist',
    consultationType: 'face-to-face',
    conditionName: 'Melasma',
    patientName: 'Demo Patient',
    patientEmail: 'user@dermai.ph',
    patientContact: '09171234567',
    date: '2026-03-20',
    time: '2:00 PM',
    status: 'completed',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo_appt_4',
    userId: 'demo_patient',
    clinicId: 2,
    clinicName: 'SkinHealth Derma Center',
    clinicAddress: '45 Rizal Ave, Quezon City',
    doctorName: 'Dr. Jose Reyes',
    specialty: 'Dermatologist',
    consultationType: 'face-to-face',
    conditionName: 'Atopic Dermatitis',
    patientName: 'Demo Patient',
    patientEmail: 'user@dermai.ph',
    patientContact: '09171234567',
    date: '2026-03-05',
    time: '11:00 AM',
    status: 'cancelled',
    createdAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function saveScanResult(userId: string, result: ScanResult): Promise<void> {
  const allHistory = await getJSON<Record<string, ScanResult[]>>(KEYS.SKIN_HISTORY, {});
  const userHistory = allHistory[userId] ?? [];
  userHistory.unshift(result);
  allHistory[userId] = userHistory;
  await setJSON(KEYS.SKIN_HISTORY, allHistory);

  const scan: PlatformScan = {
    id: result.id,
    userId,
    userEmail: '',
    date: result.date,
    condition: result.condition,
    confidence: result.confidence,
    severity: result.severity,
    referralSuggested: result.referralSuggested,
    status: result.confidence < 60 ? 'flagged' : 'pending',
  };
  const platformScans = await getJSON<PlatformScan[]>(KEYS.PLATFORM_SCANS, []);
  platformScans.unshift(scan);
  await setJSON(KEYS.PLATFORM_SCANS, platformScans);
}

export async function deleteScanResult(userId: string, scanId: string): Promise<void> {
  const allHistory = await getJSON<Record<string, ScanResult[]>>(KEYS.SKIN_HISTORY, {});
  const userHistory = allHistory[userId] ?? [];
  allHistory[userId] = userHistory.filter((r) => r.id !== scanId);
  await setJSON(KEYS.SKIN_HISTORY, allHistory);
}

// ─── Subscriptions ───────────────────────────────────────────────────────────
const _subNow = new Date();
const _demoSubEnd = new Date(_subNow.getFullYear(), _subNow.getMonth() + 1, 4);
const DEMO_SUBSCRIPTION: SubscriptionRecord = {
  userId: 'demo_patient',
  email: 'user@dermai.ph',
  plan: 'premium',
  billingCycle: 'monthly',
  startDate: new Date(_subNow.getFullYear(), _subNow.getMonth() - 2, 4).toISOString(),
  endDate: _demoSubEnd.toISOString(),
  transactionId: 'txn_demo',
  scansUsed: 0,
  cardLast4: '4242',
  cardExpiry: '12/27',
};

export async function getUserSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const allSubs = await getJSON<Record<string, SubscriptionRecord>>(KEYS.USER_SUBSCRIPTION, {});
  if (allSubs[userId]) return allSubs[userId];
  if (userId === 'demo_patient') return DEMO_SUBSCRIPTION;
  return null;
}

export async function setUserSubscription(userId: string, record: SubscriptionRecord): Promise<void> {
  const allSubs = await getJSON<Record<string, SubscriptionRecord>>(KEYS.USER_SUBSCRIPTION, {});
  allSubs[userId] = record;
  await setJSON(KEYS.USER_SUBSCRIPTION, allSubs);

  const scan: PlatformTransaction = {
    id: `txn_${Date.now()}`,
    userId,
    userEmail: record.email,
    userName: '',
    plan: record.plan,
    amount: record.billingCycle === 'yearly' ? 1999 : 199,
    date: new Date().toISOString(),
    billingCycle: record.billingCycle,
    status: 'paid',
  };
  if (record.plan === 'premium') {
    const txns = await getJSON<PlatformTransaction[]>(KEYS.PLATFORM_TRANSACTIONS, []);
    txns.unshift(scan);
    await setJSON(KEYS.PLATFORM_TRANSACTIONS, txns);

    await pushAdminNotification({
      type: 'new-subscription',
      title: 'New Premium Subscription',
      message: `${record.email} subscribed to the ${record.billingCycle} plan.`,
    });
  }
}

// ─── Appointments ────────────────────────────────────────────────────────────
export async function getAppointments(userId: string): Promise<Appointment[]> {
  const all = await getJSON<Record<string, Appointment[]>>(KEYS.APPOINTMENTS, {});
  const stored = all[userId] ?? [];
  if (userId === 'demo_patient' && stored.length === 0) return DEMO_APPOINTMENTS;
  return stored;
}

export async function saveAppointment(appt: Appointment): Promise<void> {
  const all = await getJSON<Record<string, Appointment[]>>(KEYS.APPOINTMENTS, {});
  const userAppts = all[appt.userId] ?? [];
  const idx = userAppts.findIndex((a) => a.id === appt.id);
  if (idx >= 0) userAppts[idx] = appt;
  else userAppts.unshift(appt);
  all[appt.userId] = userAppts;
  await setJSON(KEYS.APPOINTMENTS, all);
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const all = await getJSON<Record<string, Appointment[]>>(KEYS.APPOINTMENTS, {});
  return Object.values(all).flat();
}

// ─── Notification Preferences ────────────────────────────────────────────────
export interface NotifPrefs {
  appointmentReminders: boolean;
  scanResultAlerts: boolean;
}

export async function getNotifPrefs(userId: string): Promise<NotifPrefs> {
  const raw = await getJSON<Record<string, NotifPrefs>>(KEYS.NOTIF_PREFS, {});
  return raw[userId] ?? { appointmentReminders: true, scanResultAlerts: true };
}

export async function saveNotifPrefs(userId: string, prefs: NotifPrefs): Promise<void> {
  const raw = await getJSON<Record<string, NotifPrefs>>(KEYS.NOTIF_PREFS, {});
  raw[userId] = prefs;
  await setJSON(KEYS.NOTIF_PREFS, raw);
}

// ─── Admin Notifications ─────────────────────────────────────────────────────
export async function pushAdminNotification(
  entry: Omit<AdminNotificationEntry, 'id' | 'timestamp' | 'read'>
): Promise<void> {
  const notifications = await getJSON<AdminNotificationEntry[]>(KEYS.ADMIN_NOTIFICATIONS, []);
  const newEntry: AdminNotificationEntry = {
    ...entry,
    id: `notif_${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newEntry);
  await setJSON(KEYS.ADMIN_NOTIFICATIONS, notifications);
}

export async function getAdminNotifications(): Promise<AdminNotificationEntry[]> {
  return getJSON<AdminNotificationEntry[]>(KEYS.ADMIN_NOTIFICATIONS, []);
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  const notifications = await getJSON<AdminNotificationEntry[]>(KEYS.ADMIN_NOTIFICATIONS, []);
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx >= 0) notifications[idx].read = true;
  await setJSON(KEYS.ADMIN_NOTIFICATIONS, notifications);
}

// ─── Helpdesk Tickets ────────────────────────────────────────────────────────
export async function addHelpdeskTicket(
  ticket: Omit<HelpdeskTicket, 'id' | 'createdAt' | 'status'>
): Promise<void> {
  const tickets = await getJSON<HelpdeskTicket[]>(KEYS.HELPDESK_TICKETS, []);
  tickets.unshift({
    ...ticket,
    id: `ticket_${Date.now()}`,
    status: 'open',
    createdAt: new Date().toISOString(),
  });
  await setJSON(KEYS.HELPDESK_TICKETS, tickets);
  await pushAdminNotification({
    type: 'new-ticket',
    title: 'New Support Ticket',
    message: `${ticket.userEmail}: ${ticket.subject}`,
  });
}

export async function getHelpdeskTickets(): Promise<HelpdeskTicket[]> {
  return getJSON<HelpdeskTicket[]>(KEYS.HELPDESK_TICKETS, []);
}

// ─── App Notifications ────────────────────────────────────────────────────────
const APP_NOTIF_KEY_PREFIX = 'dermai_app_notifications_';

export async function getAppNotifications(userId: string): Promise<AppNotification[]> {
  const raw = await AsyncStorage.getItem(APP_NOTIF_KEY_PREFIX + userId);
  return raw ? JSON.parse(raw) : [];
}

export async function addAppNotification(
  userId: string,
  notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
): Promise<void> {
  const notifications = await getAppNotifications(userId);
  notifications.unshift({
    ...notif,
    id: `appnotif_${Date.now()}`,
    timestamp: new Date().toISOString(),
    read: false,
  });
  await AsyncStorage.setItem(APP_NOTIF_KEY_PREFIX + userId, JSON.stringify(notifications));
}

export async function markAppNotificationRead(userId: string, id: string): Promise<void> {
  const notifications = await getAppNotifications(userId);
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx >= 0) notifications[idx].read = true;
  await AsyncStorage.setItem(APP_NOTIF_KEY_PREFIX + userId, JSON.stringify(notifications));
}

// ─── Platform / Admin ────────────────────────────────────────────────────────
export async function getPlatformUsers(): Promise<PlatformUser[]> {
  return getJSON<PlatformUser[]>(KEYS.PLATFORM_USERS, []);
}

export async function getPlatformScans(): Promise<PlatformScan[]> {
  return getJSON<PlatformScan[]>(KEYS.PLATFORM_SCANS, []);
}

export async function getPlatformTransactions(): Promise<PlatformTransaction[]> {
  return getJSON<PlatformTransaction[]>(KEYS.PLATFORM_TRANSACTIONS, []);
}

export async function getAuditLogs(): Promise<{ id: string; action: string; timestamp: string }[]> {
  return getJSON('dermai_audit_logs', []);
}

// ─── Saved Clinics ────────────────────────────────────────────────────────────
const DEMO_SAVED_CLINIC_IDS: Record<string, number[]> = {
  demo_patient: [1, 2, 3],
};

export async function getSavedClinics(userId: string): Promise<number[]> {
  const all = await getJSON<Record<string, number[]>>(KEYS.SAVED_CLINICS, {});
  if (all[userId] !== undefined) return all[userId];
  return DEMO_SAVED_CLINIC_IDS[userId] ?? [];
}

export async function saveClinic(userId: string, clinicId: number): Promise<void> {
  const all = await getJSON<Record<string, number[]>>(KEYS.SAVED_CLINICS, {});
  const saved = all[userId] ?? DEMO_SAVED_CLINIC_IDS[userId] ?? [];
  if (!saved.includes(clinicId)) {
    all[userId] = [...saved, clinicId];
    await setJSON(KEYS.SAVED_CLINICS, all);
  }
}

export async function unsaveClinic(userId: string, clinicId: number): Promise<void> {
  const all = await getJSON<Record<string, number[]>>(KEYS.SAVED_CLINICS, {});
  const saved = all[userId] ?? DEMO_SAVED_CLINIC_IDS[userId] ?? [];
  all[userId] = saved.filter((id) => id !== clinicId);
  await setJSON(KEYS.SAVED_CLINICS, all);
}
