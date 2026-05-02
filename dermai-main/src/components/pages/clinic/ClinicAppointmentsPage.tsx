import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  MapPin,
  ScanSearch,
  Stethoscope,
  User,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { skinConditions } from "@/components/pages/user/SkinLibraryPage";
import { useClinicVerification } from "@/hooks/useClinicVerification";
import { logActivity } from "@/lib/auditLog";

type AppointmentRecord = {
  id: string;
  clinicId: number;
  clinicName: string;
  patientName?: string;
  patientAge?: number;
  patientAvatar?: string;
  patientEmail?: string;
  patientAddress?: string;
  patientContact?: string;
  consultationType: "face-to-face";
  conditionId?: string;
  conditionName?: string;
  conditionImage?: string;
  date: string;
  time: string;
  notes: string;
  status: "pending" | "accepted" | "scheduled" | "rejected";
  meetingLink?: string;
  clinicNote?: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  doctorStatus?: "pending-review" | "approved" | "rejected";
  doctorNote?: string;
  doctorReviewedAt?: string;
  scheduleSentToDoctor?: boolean;
  createdAt: string;
  skinPhotoUrl?: string;
  aiConditionName?: string;
  aiConfidence?: number;
};

type DoctorAccount = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  clinicName: string;
};

type ClinicSettings = {
  openTime: string;
  closeTime: string;
  slotsPerDay: number;
};

const DEFAULT_SETTINGS: ClinicSettings = {
  openTime: "09:00",
  closeTime: "18:00",
  slotsPerDay: 10,
};

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const buildPrototypeFlowAppointments = (
  clinicName: string,
  clinicSeedKey: string
): AppointmentRecord[] => {
  const getConditionImage = (conditionId: string) =>
    skinConditions.find((item) => item.id === conditionId)?.image || skinConditions[0]?.image;
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const dayAfterTomorrow = new Date(now);
  dayAfterTomorrow.setDate(now.getDate() + 2);

  return [
    {
      id: `${clinicSeedKey}-demo-flow-001`,
      clinicId: 2,
      clinicName,
      patientName: "Maria Santos",
      patientAge: 27,
      patientAvatar: "https://randomuser.me/api/portraits/women/44.jpg",
      consultationType: "face-to-face",
      conditionId: "tinea-versicolor",
      conditionName: "Tinea Versicolor",
      conditionImage: getConditionImage("tinea-versicolor"),
      date: "",
      time: "",
      notes: "The patient has frequent skin rashes and allergic reactions.",
      status: "pending",
      createdAt: now.toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-002`,
      clinicId: 2,
      clinicName,
      patientName: "Juan Cruz",
      patientAge: 31,
      patientAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
      consultationType: "face-to-face",
      conditionId: "acne-rosacea",
      conditionName: "Acne Rosacea",
      conditionImage: getConditionImage("acne-rosacea"),
      date: "",
      time: "",
      notes: "The patient reports acne breakouts after dietary changes.",
      status: "pending",
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-003`,
      clinicId: 2,
      clinicName,
      patientName: "Ana Reyes",
      patientAge: 24,
      patientAvatar: "https://randomuser.me/api/portraits/women/68.jpg",
      consultationType: "face-to-face",
      conditionId: "melasma",
      conditionName: "Melasma",
      conditionImage: getConditionImage("melasma"),
      date: "",
      time: "",
      notes: "The patient notices pigmentation and uneven skin tone.",
      status: "pending",
      createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-004`,
      clinicId: 2,
      clinicName,
      patientName: "Liza Morales",
      consultationType: "face-to-face",
      conditionId: "eczema",
      conditionName: "Atopic Dermatitis",
      conditionImage: getConditionImage("eczema"),
      date: formatDateKey(tomorrow),
      time: "10:00",
      notes: "Follow-up consultation.",
      status: "scheduled",
      createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-005`,
      clinicId: 2,
      clinicName,
      patientName: "Carlos Bautista",
      patientAge: 29,
      patientAvatar: "https://randomuser.me/api/portraits/men/45.jpg",
      consultationType: "face-to-face",
      conditionId: "eczema",
      conditionName: "Atopic Dermatitis",
      conditionImage: getConditionImage("eczema"),
      date: "",
      time: "",
      notes: "Dry and itchy skin patches for over a week.",
      status: "pending",
      createdAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-006`,
      clinicId: 2,
      clinicName,
      patientName: "Diana Lim",
      patientAge: 26,
      patientAvatar: "https://randomuser.me/api/portraits/women/33.jpg",
      consultationType: "face-to-face",
      conditionId: "melasma",
      conditionName: "Melasma",
      conditionImage: getConditionImage("melasma"),
      date: "",
      time: "",
      notes: "Facial dark patches becoming more visible under sun exposure.",
      status: "pending",
      createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-007`,
      clinicId: 2,
      clinicName,
      patientName: "Mark Aquino",
      patientAge: 34,
      patientAvatar: "https://randomuser.me/api/portraits/men/22.jpg",
      consultationType: "face-to-face",
      conditionId: "acne-rosacea",
      conditionName: "Acne Rosacea",
      conditionImage: getConditionImage("acne-rosacea"),
      date: formatDateKey(tomorrow),
      time: "11:30",
      notes: "Recurring acne flare-up and redness.",
      status: "scheduled",
      meetingLink: "https://meet.google.com/dermai-followup",
      createdAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-008`,
      clinicId: 2,
      clinicName,
      patientName: "Sophia Dela Cruz",
      patientAge: 22,
      patientAvatar: "https://randomuser.me/api/portraits/women/12.jpg",
      patientEmail: "sophia.delacruz@email.com",
      patientAddress: "123 Sampaguita St., Quezon City",
      patientContact: "09171234567",
      consultationType: "face-to-face",
      conditionId: "tinea-pedis",
      conditionName: "Tinea Pedis",
      conditionImage: getConditionImage("tinea-pedis"),
      date: "",
      time: "",
      notes: "Itchy and peeling skin between the toes, started two weeks ago.",
      status: "pending",
      aiConditionName: "Tinea Pedis",
      aiConfidence: 87,
      createdAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-009`,
      clinicId: 2,
      clinicName,
      patientName: "Ramon Villanueva",
      patientAge: 45,
      patientAvatar: "https://randomuser.me/api/portraits/men/61.jpg",
      patientEmail: "ramon.villanueva@email.com",
      patientAddress: "456 Mabini Ave., Manila",
      patientContact: "09281234567",
      consultationType: "face-to-face",
      conditionId: "warts",
      conditionName: "Warts",
      conditionImage: getConditionImage("warts"),
      date: "",
      time: "",
      notes: "Small rough bumps on the back of both hands. Getting larger.",
      status: "pending",
      aiConditionName: "Warts",
      aiConfidence: 91,
      createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-010`,
      clinicId: 2,
      clinicName,
      patientName: "Camille Torres",
      patientAge: 19,
      patientAvatar: "https://randomuser.me/api/portraits/women/55.jpg",
      patientEmail: "camille.torres@email.com",
      patientAddress: "789 Rizal Blvd., Pasig City",
      patientContact: "09391234567",
      consultationType: "face-to-face",
      conditionId: "chickenpox",
      conditionName: "Chickenpox",
      conditionImage: getConditionImage("chickenpox"),
      date: formatDateKey(tomorrow),
      time: "09:00",
      notes: "Fluid-filled blisters on torso and arms. Mild fever.",
      status: "scheduled",
      aiConditionName: "Chickenpox",
      aiConfidence: 94,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-011`,
      clinicId: 2,
      clinicName,
      patientName: "Eduardo Mercado",
      patientAge: 38,
      patientAvatar: "https://randomuser.me/api/portraits/men/78.jpg",
      patientEmail: "eduardo.mercado@email.com",
      patientAddress: "22 Bonifacio St., Makati",
      patientContact: "09451234567",
      consultationType: "face-to-face",
      conditionId: "impetigo",
      conditionName: "Impetigo",
      conditionImage: getConditionImage("impetigo"),
      date: "",
      time: "",
      notes: "Crusty yellow sores around the mouth and on the chin.",
      status: "pending",
      aiConditionName: "Impetigo",
      aiConfidence: 79,
      createdAt: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-012`,
      clinicId: 2,
      clinicName,
      patientName: "Jasmine Reyes",
      patientAge: 30,
      patientAvatar: "https://randomuser.me/api/portraits/women/72.jpg",
      patientEmail: "jasmine.reyes@email.com",
      patientAddress: "5 Katipunan Ave., Diliman",
      patientContact: "09561234567",
      consultationType: "face-to-face",
      conditionId: "tinea-corporis",
      conditionName: "Tinea Corporis",
      conditionImage: getConditionImage("tinea-corporis"),
      date: formatDateKey(tomorrow),
      time: "14:00",
      notes: "Ring-shaped red patches on the upper back for three weeks.",
      status: "scheduled",
      aiConditionName: "Tinea Corporis",
      aiConfidence: 83,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-013`,
      clinicId: 2,
      clinicName,
      patientName: "Bernard Ocampo",
      patientAge: 52,
      patientAvatar: "https://randomuser.me/api/portraits/men/90.jpg",
      patientEmail: "bernard.ocampo@email.com",
      patientAddress: "38 Taft Ave., Manila",
      patientContact: "09671234567",
      consultationType: "face-to-face",
      conditionId: "leprosy",
      conditionName: "Leprosy",
      conditionImage: getConditionImage("leprosy"),
      date: "",
      time: "",
      notes: "Light-colored skin patches with reduced sensation on forearms.",
      status: "pending",
      aiConditionName: "Leprosy",
      aiConfidence: 68,
      createdAt: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-014`,
      clinicId: 2,
      clinicName,
      patientName: "Nicole Garcia",
      patientAge: 25,
      patientAvatar: "https://randomuser.me/api/portraits/women/29.jpg",
      patientEmail: "nicole.garcia@email.com",
      patientAddress: "17 España Blvd., Sampaloc",
      patientContact: "09781234567",
      consultationType: "face-to-face",
      conditionId: "atopic-dermatitis",
      conditionName: "Atopic Dermatitis",
      conditionImage: getConditionImage("atopic-dermatitis"),
      date: formatDateKey(tomorrow),
      time: "15:30",
      notes: "Severe itching on elbows and back of knees. Family history of asthma.",
      status: "scheduled",
      aiConditionName: "Atopic Dermatitis",
      aiConfidence: 89,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-015`,
      clinicId: 2,
      clinicName,
      patientName: "Ana Mendoza",
      patientAge: 28,
      patientAvatar: "https://randomuser.me/api/portraits/women/34.jpg",
      patientEmail: "ana.mendoza@email.com",
      patientAddress: "12 Tandang Sora Ave., Quezon City",
      patientContact: "09181234501",
      consultationType: "face-to-face",
      conditionId: "tinea-corporis",
      conditionName: "Tinea Corporis",
      conditionImage: getConditionImage("tinea-corporis"),
      date: "",
      time: "",
      notes: "Circular, scaly red patches on the upper arm and shoulder. Mildly itchy.",
      status: "pending",
      aiConditionName: "Tinea Corporis (Ringworm)",
      aiConfidence: 85,
      createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-016`,
      clinicId: 2,
      clinicName,
      patientName: "Jose Santos",
      patientAge: 41,
      patientAvatar: "https://randomuser.me/api/portraits/men/43.jpg",
      patientEmail: "jose.santos@email.com",
      patientAddress: "88 Aurora Blvd., Cubao, Quezon City",
      patientContact: "09281234502",
      consultationType: "face-to-face",
      conditionId: "tinea-pedis",
      conditionName: "Tinea Pedis",
      conditionImage: getConditionImage("tinea-pedis"),
      date: formatDateKey(tomorrow),
      time: "10:00",
      notes: "Cracking and peeling between the 4th and 5th toes. Foul odor present.",
      status: "scheduled",
      aiConditionName: "Tinea Pedis (Athlete's Foot)",
      aiConfidence: 90,
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-017`,
      clinicId: 2,
      clinicName,
      patientName: "Maria Cruz",
      patientAge: 16,
      patientAvatar: "https://randomuser.me/api/portraits/women/66.jpg",
      patientEmail: "maria.cruz@email.com",
      patientAddress: "5 Libertad St., Mandaluyong",
      patientContact: "09381234503",
      consultationType: "face-to-face",
      conditionId: "acne-rosacea",
      conditionName: "Acne Vulgaris",
      conditionImage: getConditionImage("acne-rosacea"),
      date: "",
      time: "",
      notes: "Multiple inflamed pimples on forehead and cheeks. Blackheads also present.",
      status: "pending",
      aiConditionName: "Acne Vulgaris (Taghiyawat)",
      aiConfidence: 93,
      createdAt: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-018`,
      clinicId: 2,
      clinicName,
      patientName: "Pedro Ramos",
      patientAge: 33,
      patientAvatar: "https://randomuser.me/api/portraits/men/53.jpg",
      patientEmail: "pedro.ramos@email.com",
      patientAddress: "22 Del Pilar St., Pasay City",
      patientContact: "09481234504",
      consultationType: "face-to-face",
      conditionId: "atopic-dermatitis",
      conditionName: "Atopic Dermatitis",
      conditionImage: getConditionImage("atopic-dermatitis"),
      date: formatDateKey(tomorrow),
      time: "13:00",
      notes: "Chronic dry and itchy patches on inner wrists and ankles. Gets worse in dry season.",
      status: "scheduled",
      aiConditionName: "Atopic Dermatitis (Eczema)",
      aiConfidence: 82,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-019`,
      clinicId: 2,
      clinicName,
      patientName: "Liza Bautista",
      patientAge: 27,
      patientAvatar: "https://randomuser.me/api/portraits/women/48.jpg",
      patientEmail: "liza.bautista@email.com",
      patientAddress: "9 Dapitan St., Sta. Mesa, Manila",
      patientContact: "09581234505",
      consultationType: "face-to-face",
      conditionId: "warts",
      conditionName: "Warts",
      conditionImage: getConditionImage("warts"),
      date: "",
      time: "",
      notes: "Cluster of warts on the right index finger and palm. Slightly painful.",
      status: "pending",
      aiConditionName: "Verruca Vulgaris (Common Warts)",
      aiConfidence: 88,
      createdAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-020`,
      clinicId: 2,
      clinicName,
      patientName: "Carlo Navarro",
      patientAge: 50,
      patientAvatar: "https://randomuser.me/api/portraits/men/67.jpg",
      patientEmail: "carlo.navarro@email.com",
      patientAddress: "34 Shaw Blvd., Mandaluyong",
      patientContact: "09681234506",
      consultationType: "face-to-face",
      conditionId: "impetigo",
      conditionName: "Impetigo",
      conditionImage: getConditionImage("impetigo"),
      date: formatDateKey(dayAfterTomorrow),
      time: "09:30",
      notes: "Honey-colored crusted sores near the nose and mouth. Spreading to the neck.",
      status: "scheduled",
      aiConditionName: "Impetigo Contagiosa",
      aiConfidence: 76,
      createdAt: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-021`,
      clinicId: 2,
      clinicName,
      patientName: "Tricia Lim",
      patientAge: 23,
      patientAvatar: "https://randomuser.me/api/portraits/women/82.jpg",
      patientEmail: "tricia.lim@email.com",
      patientAddress: "67 Morayta St., Sampaloc, Manila",
      patientContact: "09781234507",
      consultationType: "face-to-face",
      conditionId: "tinea-corporis",
      conditionName: "Tinea Corporis",
      conditionImage: getConditionImage("tinea-corporis"),
      date: "",
      time: "",
      notes: "Buni on the lower back. Started as a small patch, now coin-sized.",
      status: "pending",
      aiConditionName: "Tinea Corporis (Buni)",
      aiConfidence: 78,
      createdAt: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-022`,
      clinicId: 2,
      clinicName,
      patientName: "Andres Padilla",
      patientAge: 36,
      patientAvatar: "https://randomuser.me/api/portraits/men/85.jpg",
      patientEmail: "andres.padilla@email.com",
      patientAddress: "45 Reposo St., Makati City",
      patientContact: "09881234508",
      consultationType: "face-to-face",
      conditionId: "tinea-pedis",
      conditionName: "Tinea Pedis",
      conditionImage: getConditionImage("tinea-pedis"),
      date: formatDateKey(dayAfterTomorrow),
      time: "16:00",
      notes: "Athlete's foot affecting both feet. Blistering present on left sole.",
      status: "scheduled",
      aiConditionName: "Tinea Pedis (Athlete's Foot)",
      aiConfidence: 86,
      createdAt: new Date(now.getTime() - 9 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-023`,
      clinicId: 2,
      clinicName,
      patientName: "Marivic Santos",
      patientAge: 21,
      patientAvatar: "https://randomuser.me/api/portraits/women/91.jpg",
      patientEmail: "marivic.santos@email.com",
      patientAddress: "101 Leveriza St., Pasay City",
      patientContact: "09181234509",
      consultationType: "face-to-face",
      conditionId: "acne-rosacea",
      conditionName: "Acne Vulgaris",
      conditionImage: getConditionImage("acne-rosacea"),
      date: "",
      time: "",
      notes: "Severe cystic acne on jaw and neck area. Painful to touch.",
      status: "pending",
      aiConditionName: "Acne Vulgaris (Taghiyawat)",
      aiConfidence: 95,
      createdAt: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: `${clinicSeedKey}-demo-flow-024`,
      clinicId: 2,
      clinicName,
      patientName: "Diego Fernandez",
      patientAge: 44,
      patientAvatar: "https://randomuser.me/api/portraits/men/74.jpg",
      patientEmail: "diego.fernandez@email.com",
      patientAddress: "3 Scout Reyes St., Quezon City",
      patientContact: "09281234510",
      consultationType: "face-to-face",
      conditionId: "warts",
      conditionName: "Warts",
      conditionImage: getConditionImage("warts"),
      date: formatDateKey(dayAfterTomorrow),
      time: "11:00",
      notes: "Multiple plantar warts on right foot sole. Painful when walking.",
      status: "scheduled",
      aiConditionName: "Verruca Vulgaris (Plantar Warts)",
      aiConfidence: 80,
      createdAt: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString(),
    },
  ];
};

export default function ClinicAppointmentsPage() {
  const { status: verificationStatus } = useClinicVerification();
  const fallbackConditionImage = skinConditions[0]?.image;
  const clinicName = localStorage.getItem("dermai_clinic_name") || "SkinMD Dermatology Center";
  const clinicKey = normalizeText(clinicName);
  const daySlotsStorageKey = `dermai_clinic_day_slots_${clinicKey}`;

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  });

  const [daySlotLimits, setDaySlotLimits] = useState<Record<string, number>>({});
  const [slotInput, setSlotInput] = useState("");

  const [pendingAssign, setPendingAssign] = useState<{
    appointmentId: string;
    date: string;
    time: string;
  } | null>(null);

  const [viewingPatient, setViewingPatient] = useState<AppointmentRecord | null>(null);
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null);

  const [assignDoctorModal, setAssignDoctorModal] = useState<{ appointmentId: string } | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const clinicDoctors = useMemo<DoctorAccount[]>(() => {
    try {
      const raw = localStorage.getItem("dermai_doctor_accounts");
      const all = raw ? (JSON.parse(raw) as DoctorAccount[]) : [];
      return all.filter((d) =>
        d.clinicName.toLowerCase().replace(/[^a-z0-9]/g, "") === clinicKey
      );
    } catch {
      return [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicKey]);

  const [assignError, setAssignError] = useState("");

  const clinicSettings = useMemo(() => {
    try {
      const raw = localStorage.getItem("dermai_clinic_settings");
      return raw
        ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as ClinicSettings) }
        : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }, []);

  const refreshClinicAppointments = () => {
    try {
      const raw = localStorage.getItem("dermai_appointments");
      let parsed = raw ? (JSON.parse(raw) as AppointmentRecord[]) : [];

      let clinicAppointments = parsed.filter((item) => {
        const normalizedItemClinic = normalizeText(item.clinicName);
        return (
          normalizedItemClinic === clinicKey ||
          normalizedItemClinic.includes(clinicKey) ||
          clinicKey.includes(normalizedItemClinic)
        );
      });

      // Always merge any missing seed appointments so demo data stays visible.
      {
        const seeded = buildPrototypeFlowAppointments(clinicName, clinicKey);
        const existingIds = new Set(parsed.map((item) => item.id));
        const toAdd = seeded.filter((item) => !existingIds.has(item.id));

        if (toAdd.length > 0) {
          parsed = [...toAdd, ...parsed];
          localStorage.setItem("dermai_appointments", JSON.stringify(parsed));

          clinicAppointments = parsed.filter((item) => {
            const normalizedItemClinic = normalizeText(item.clinicName);
            return (
              normalizedItemClinic === clinicKey ||
              normalizedItemClinic.includes(clinicKey) ||
              clinicKey.includes(normalizedItemClinic)
            );
          });
        }
      }

      setAppointments(clinicAppointments);
    } catch {
      setAppointments([]);
    }
  };

  useEffect(() => {
    refreshClinicAppointments();
    try {
      const raw = localStorage.getItem(daySlotsStorageKey);
      const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      setDaySlotLimits(parsed);
    } catch {
      setDaySlotLimits({});
    }
  }, [clinicKey, daySlotsStorageKey]);

  const getSlotsForDate = (date: string) => daySlotLimits[date] ?? clinicSettings.slotsPerDay;

  useEffect(() => {
    setSlotInput(String(getSlotsForDate(selectedDate)));
  }, [selectedDate, daySlotLimits, clinicSettings.slotsPerDay]);

  const saveSlotForSelectedDate = () => {
    const value = Number(slotInput);
    if (!Number.isFinite(value) || value < 1) {
      setAssignError("Slots per day must be at least 1.");
      return;
    }
    setAssignError("");
    const next = { ...daySlotLimits, [selectedDate]: value };
    setDaySlotLimits(next);
    localStorage.setItem(daySlotsStorageKey, JSON.stringify(next));
  };

  const calendarCells = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const offset = (start.getDay() + 6) % 7;
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - offset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}`;

      return {
        key,
        date,
        inCurrentMonth: date.getMonth() === currentMonth.getMonth(),
      };
    });
  }, [currentMonth]);

  const appointmentsByDate = useMemo(() => {
    return appointments.reduce<Record<string, AppointmentRecord[]>>((acc, item) => {
      if (!item.date) return acc;
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [appointments]);

  const unscheduledQueue = appointments
    .filter((a) => !a.date && a.status === "pending")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const selectedDayAppointments = (appointmentsByDate[selectedDate] || []).sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const scheduledCount = appointments.filter(
    (a) => !!a.date && (a.status === "scheduled" || a.status === "accepted")
  ).length;
  const rejectedCount = appointments.filter((a) => a.status === "rejected").length;

  const getScheduledCount = (date: string) =>
    (appointmentsByDate[date] || []).filter((a) => a.status !== "rejected").length;

  const rejectRequest = (id: string) => {
    let allAppointments: AppointmentRecord[] = [];
    try {
      const raw = localStorage.getItem("dermai_appointments");
      allAppointments = raw ? (JSON.parse(raw) as AppointmentRecord[]) : [];
    } catch {
      allAppointments = [];
    }

    const updatedAll = allAppointments.map((appt) =>
      appt.id === id
        ? {
            ...appt,
            status: "rejected" as const,
            clinicNote: "Request declined by clinic scheduling.",
          }
        : appt
    );

    localStorage.setItem("dermai_appointments", JSON.stringify(updatedAll));
    const appt = appointments.find((a) => a.id === id);
    const clinicName = appt?.clinicName || "Clinic";
    logActivity(
      "clinic",
      clinicName,
      "Appointment Rejected",
      appt?.patientName || "Patient",
      `Clinic declined appointment request. Reason: Request declined by clinic scheduling.`,
      "appointment"
    );
    // Notify patient
    if (appt?.patientEmail) {
      const pNotifKey = `dermai_patient_notifications_${appt.patientEmail}`;
      const pNotifs = JSON.parse(localStorage.getItem(pNotifKey) || "[]") as object[];
      pNotifs.unshift({
        id: `pn-${Date.now()}`,
        type: "appointment-rejected",
        title: "Appointment Request Declined",
        message: `${clinicName} has declined your appointment request. You may book with another clinic anytime.`,
        clinicName,
        timestamp: new Date().toISOString(),
        appointmentId: id,
        read: false,
      });
      localStorage.setItem(pNotifKey, JSON.stringify(pNotifs.slice(0, 50)));
    }
    refreshClinicAppointments();
  };

  const startScheduleAssignment = (appointmentId: string) => {
    setAssignError("");
    setPendingAssign({
      appointmentId,
      date: selectedDate,
      time: clinicSettings.openTime,
    });
  };

  const confirmAssign = () => {
    if (!pendingAssign) return;
    setAssignError("");

    if (
      pendingAssign.time < clinicSettings.openTime ||
      pendingAssign.time > clinicSettings.closeTime
    ) {
      setAssignError(
        `Time must be between ${clinicSettings.openTime} and ${clinicSettings.closeTime}.`
      );
      return;
    }

    const capacity = getSlotsForDate(pendingAssign.date);
    const used = getScheduledCount(pendingAssign.date);
    if (used >= capacity) {
      setAssignError(
        `Cannot assign to ${pendingAssign.date}. Day is full (${used}/${capacity} slots).`
      );
      return;
    }

    let allAppointments: AppointmentRecord[] = [];
    try {
      const raw = localStorage.getItem("dermai_appointments");
      allAppointments = raw ? (JSON.parse(raw) as AppointmentRecord[]) : [];
    } catch {
      allAppointments = [];
    }

    const updatedAll = allAppointments.map((appt) => {
      if (appt.id !== pendingAssign.appointmentId) return appt;
      return {
        ...appt,
        date: pendingAssign.date,
        time: pendingAssign.time,
        status: "scheduled" as const,
        clinicNote: "Your schedule has been assigned by the clinic.",
      };
    });

    localStorage.setItem("dermai_appointments", JSON.stringify(updatedAll));
    const appt = appointments.find((a) => a.id === pendingAssign.appointmentId);
    const clinicName = appt?.clinicName || "Clinic";
    logActivity(
      "clinic",
      clinicName,
      "Appointment Accepted",
      appt?.patientName || "Patient",
      `Clinic scheduled appointment on ${pendingAssign.date} at ${pendingAssign.time} (${appt?.consultationType || "consultation"}).`,
      "appointment"
    );
    // Notify patient
    if (appt?.patientEmail) {
      const pNotifKey = `dermai_patient_notifications_${appt.patientEmail}`;
      const pNotifs = JSON.parse(localStorage.getItem(pNotifKey) || "[]") as object[];
      const formattedDate = pendingAssign.date
        ? new Date(pendingAssign.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
        : pendingAssign.date;
      const formattedTime = pendingAssign.time
        ? new Date(`1970-01-01T${pendingAssign.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
        : pendingAssign.time;
      pNotifs.unshift({
        id: `pn-${Date.now()}`,
        type: "appointment-scheduled",
        title: "Appointment Scheduled!",
        message: `${clinicName} has confirmed your appointment on ${formattedDate} at ${formattedTime}.`,
        clinicName,
        date: pendingAssign.date,
        time: pendingAssign.time,
        timestamp: new Date().toISOString(),
        appointmentId: pendingAssign.appointmentId,
        read: false,
      });
      localStorage.setItem(pNotifKey, JSON.stringify(pNotifs.slice(0, 50)));
    }
    refreshClinicAppointments();
    setPendingAssign(null);
  };

  const assignDoctor = () => {
    if (!assignDoctorModal || !selectedDoctorId) return;
    const doc = clinicDoctors.find((d) => d.id === selectedDoctorId);
    if (!doc) return;
    try {
      const raw = localStorage.getItem("dermai_appointments");
      const all = raw ? (JSON.parse(raw) as AppointmentRecord[]) : [];
      const appt = all.find((a) => a.id === assignDoctorModal.appointmentId);
      const updated = all.map((a) => {
        if (a.id !== assignDoctorModal.appointmentId) return a;
        return {
          ...a,
          assignedDoctorId: doc.email,
          assignedDoctorName: doc.name,
          doctorStatus: "pending-review" as const,
        };
      });
      localStorage.setItem("dermai_appointments", JSON.stringify(updated));
      // Notify doctor
      const doctorNotifKey = `dermai_doctor_notifications_${doc.email}`;
      const doctorNotifs = JSON.parse(localStorage.getItem(doctorNotifKey) || "[]") as object[];
      doctorNotifs.unshift({
        id: `dn-${Date.now()}`,
        type: "new-assignment",
        title: "New Appointment for Review",
        message: `${appt?.patientName || "A patient"} has been assigned to you for review. Please evaluate the AI analysis and approve or reject.`,
        timestamp: new Date().toISOString(),
        appointmentId: assignDoctorModal.appointmentId,
        read: false,
      });
      localStorage.setItem(doctorNotifKey, JSON.stringify(doctorNotifs.slice(0, 100)));
    } catch { /* silent */ }
    setAssignDoctorModal(null);
    setSelectedDoctorId("");
    setAssignError("");
    refreshClinicAppointments();
  };

  const sendScheduleToDoctor = (appointmentId: string) => {
    try {
      const raw = localStorage.getItem("dermai_appointments");
      const all = raw ? (JSON.parse(raw) as AppointmentRecord[]) : [];
      const appt = all.find((a) => a.id === appointmentId);
      if (!appt || !appt.assignedDoctorId) return;
      const updated = all.map((a) =>
        a.id === appointmentId ? { ...a, scheduleSentToDoctor: true } : a
      );
      localStorage.setItem("dermai_appointments", JSON.stringify(updated));
      // Notify doctor with full appointment details
      const doctorNotifKey = `dermai_doctor_notifications_${appt.assignedDoctorId}`;
      const doctorNotifs = JSON.parse(localStorage.getItem(doctorNotifKey) || "[]") as object[];
      doctorNotifs.unshift({
        id: `dn-sched-${Date.now()}`,
        type: "schedule-sent",
        title: "Appointment Finalized",
        message: `Your appointment with ${appt.patientName || "Patient"} has been confirmed for ${appt.date} at ${appt.time}. Condition: ${appt.conditionName || "skin concern"}.`,
        timestamp: new Date().toISOString(),
        appointmentId,
        patientName: appt.patientName,
        conditionName: appt.conditionName,
        date: appt.date,
        time: appt.time,
        read: false,
      });
      localStorage.setItem(doctorNotifKey, JSON.stringify(doctorNotifs.slice(0, 100)));
      refreshClinicAppointments();
    } catch { /* silent */ }
  };

  if (verificationStatus !== "verified") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Required</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          {verificationStatus === "rejected"
            ? "Your clinic registration was rejected. Please update your profile and contact admin."
            : "Your clinic is pending admin verification. Appointment management will be available once approved."}
        </p>
        <Link
          to="/clinic/settings"
          className="px-5 py-2 rounded-xl bg-[#c0166a] text-white text-sm font-semibold hover:bg-[#a01259] transition-colors"
        >
          {verificationStatus === "rejected" ? "Update Profile" : "View Profile"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Appointments</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Select a patient, set date and time in a modal, then confirm.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Total Requests", value: appointments.length, icon: Calendar },
          { label: "Queue", value: unscheduledQueue.length, icon: Clock },
          { label: "Scheduled", value: scheduledCount, icon: CheckCircle2 },
          { label: "Rejected", value: rejectedCount, icon: XCircle },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-white p-4 rounded-2xl border border-magenta-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-pink-100">
                  <Icon className="w-4 h-4 text-magenta-500" />
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {assignError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {assignError}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 inline-flex items-center gap-2">
              <Calendar className="w-4 h-4 text-magenta-500" /> {monthLabel}
            </h2>
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() =>
                  setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-magenta-100 bg-magenta-50 p-3">
            <p className="text-xs font-semibold text-magenta-700 mb-2">Dynamic Slots for {selectedDate}</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={slotInput}
                onChange={(e) => setSlotInput(e.target.value)}
                className="w-24 px-3 py-2 rounded-lg border border-magenta-200 text-xs text-magenta-900 outline-none"
              />
              <button
                onClick={saveSlotForSelectedDate}
                className="px-3 py-2 rounded-lg bg-magenta-500 text-white text-xs font-semibold hover:bg-magenta-600"
              >
                Save Day Slots
              </button>
              <span className="text-[11px] text-magenta-600">
                Default: {clinicSettings.slotsPerDay}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <p key={day}>{day}</p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((cell) => {
              const dayAppointments = appointmentsByDate[cell.key] || [];
              const used = dayAppointments.filter((a) => a.status !== "rejected").length;
              const capacity = getSlotsForDate(cell.key);
              const isSelected = selectedDate === cell.key;

              return (
                <div
                  key={cell.key}
                  onClick={() => { setSelectedDate(cell.key); setDayDetailDate(cell.key); }}
                  className={`min-h-[106px] rounded-xl border p-2 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "border-magenta-300 bg-magenta-50"
                      : cell.inCurrentMonth
                      ? "border-gray-100 bg-white hover:bg-gray-50"
                      : "border-gray-100 bg-gray-50 text-gray-300"
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      cell.inCurrentMonth ? "text-gray-900" : "text-gray-300"
                    }`}
                  >
                    {cell.date.getDate()}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">{used}/{capacity} slots</p>

                  <div className="mt-2 space-y-1">
                    {dayAppointments.some((a) => a.status === "scheduled" || a.status === "accepted") && (
                      <div className="h-1.5 rounded-full bg-green-400" />
                    )}
                    {dayAppointments.some((a) => a.status === "pending") && (
                      <div className="h-1.5 rounded-full bg-amber-400" />
                    )}
                    {dayAppointments.some((a) => a.status === "rejected") && (
                      <div className="h-1.5 rounded-full bg-red-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Scheduled on {selectedDate}</h3>
            {selectedDayAppointments.length === 0 && (
              <div className="border border-dashed border-gray-200 rounded-xl p-3 text-xs text-gray-500">
                No scheduled patients yet.
              </div>
            )}
            <div className="space-y-2">
              {selectedDayAppointments.map((appointment, i) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-gray-100 p-3"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={appointment.conditionImage || fallbackConditionImage}
                      alt={appointment.conditionName || "Condition"}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {appointment.patientName || appointment.id}
                        </p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">
                          {appointment.time || "time pending"}
                        </span>
                      </div>
                      {appointment.patientAge && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{appointment.patientAge} years old</p>
                      )}
                      <p className="text-[11px] text-magenta-600 mt-0.5">
                        {appointment.conditionName || "Skin concern"}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">{appointment.notes || "No patient notes"}</p>
                      {appointment.assignedDoctorName && (
                        <p className="text-[10px] text-blue-600 mt-0.5 flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" /> {appointment.assignedDoctorName}
                        </p>
                      )}
                    </div>
                  </div>
                  {appointment.scheduleSentToDoctor ? (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-blue-600 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Schedule sent to doctor
                      </span>
                    </div>
                  ) : appointment.assignedDoctorId && appointment.date ? (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => sendScheduleToDoctor(appointment.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <Stethoscope className="w-3 h-3" /> Send Schedule to Doctor
                      </button>
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-gray-900">List of Queue</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              {unscheduledQueue.length} pending
            </span>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            Click "Schedule Date & Time" on a patient card to open the scheduler modal.
          </p>

          <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
            {unscheduledQueue.length === 0 && (
              <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500">No unscheduled requests.</p>
              </div>
            )}

            {unscheduledQueue.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-xl border border-gray-100 p-3 bg-gray-50/70"
              >
                <div className="flex items-start gap-3 mb-2">
                  <img
                    src={
                      appointment.patientAvatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        appointment.patientName || "Patient"
                      )}&background=fce7f3&color=c0166a`
                    }
                    alt={appointment.patientName || "Patient"}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {appointment.patientName || `Queue #${appointment.id.slice(-4)}`}
                        </p>
                        {appointment.patientAge && (
                          <p className="text-[10px] text-gray-400">{appointment.patientAge} years old</p>
                        )}
                        <p className="text-[11px] text-magenta-600 mt-0.5">
                          {appointment.conditionName || "Skin concern"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {new Date(appointment.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                        pending
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-700 mb-2">
                  <p className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Face-to-Face
                  </p>
                  <p className="text-[11px] text-gray-500">{appointment.notes || "No patient notes"}</p>
                </div>

                <div className="space-y-2">
                  {/* Doctor assignment status */}
                  {appointment.assignedDoctorName && (
                    <div className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1.5 rounded-lg border ${
                      appointment.doctorStatus === "approved"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : appointment.doctorStatus === "rejected"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      <Stethoscope className="w-3 h-3 shrink-0" />
                      {appointment.assignedDoctorName} —&nbsp;
                      {appointment.doctorStatus === "approved"
                        ? "Approved"
                        : appointment.doctorStatus === "rejected"
                        ? "Rejected"
                        : "Pending Review"}
                    </div>
                  )}
                  {appointment.doctorNote && (
                    <p className={`text-[10px] px-2 py-1 rounded-lg ${
                      appointment.doctorStatus === "rejected"
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-green-50 text-green-600 border border-green-200"
                    }`}>
                      <strong>Dr. Note:</strong> {appointment.doctorNote}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setViewingPatient(appointment)}
                      className="inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-[#c0166a] text-white text-[11px] font-semibold hover:bg-[#a01258] transition-colors"
                    >
                      <User className="w-3.5 h-3.5" /> View Details
                    </button>
                    <button
                      onClick={() => {
                        setAssignDoctorModal({ appointmentId: appointment.id });
                        setSelectedDoctorId(
                          clinicDoctors.find((d) => d.email === appointment.assignedDoctorId)?.id || ""
                        );
                      }}
                      disabled={clinicDoctors.length === 0}
                      title={clinicDoctors.length === 0 ? "No doctors in clinic" : "Assign to doctor for review"}
                      className="inline-flex items-center justify-center gap-1 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      {appointment.assignedDoctorId ? "Reassign" : "Assign Doc"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3 text-[11px] text-gray-600">
            <p className="font-semibold mb-1">Queue Rule</p>
            <p>First submitted requests stay on top. Open scheduler modal, set date/time, then confirm.</p>
          </div>
        </div>
      </div>

      {/* ── Day Detail Modal ─────────────────────────────────── */}
      {dayDetailDate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={() => setDayDetailDate(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#c0166a] to-[#9b1257] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-base leading-tight">
                  {new Date(dayDetailDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
                <p className="text-pink-200 text-xs mt-0.5">
                  {(appointmentsByDate[dayDetailDate] || []).filter((a) => a.status !== "rejected").length} patient(s) scheduled
                </p>
              </div>
              <button
                onClick={() => setDayDetailDate(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <XCircle className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {(appointmentsByDate[dayDetailDate] || []).filter((a) => a.status !== "rejected").length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No patients scheduled for this date.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(appointmentsByDate[dayDetailDate] || [])
                    .filter((a) => a.status !== "rejected")
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((appt) => (
                      <div key={appt.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              appt.patientAvatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(appt.patientName || "P")}&background=fce7f3&color=c0166a`
                            }
                            alt={appt.patientName}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {appt.patientName || "Unknown Patient"}
                            </p>
                            {appt.patientAge && (
                              <p className="text-[11px] text-gray-400">{appt.patientAge} years old</p>
                            )}
                          </div>
                          <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-magenta-50 text-magenta-700 border border-magenta-200">
                            <Clock className="w-3 h-3" />
                            {appt.time
                              ? new Date(`1970-01-01T${appt.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
                              : "TBD"}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span className="text-[11px] text-blue-700 font-medium">
                            {appt.assignedDoctorName || <span className="text-gray-400 italic">No doctor assigned yet</span>}
                          </span>
                          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            appt.status === "scheduled" || appt.status === "accepted"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
              <button
                onClick={() => setDayDetailDate(null)}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Patient Details Review Modal ─────────────────────── */}
      {viewingPatient && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#c0166a] to-[#9b1257] px-6 py-5 flex items-center gap-4">
              <img
                src={
                  viewingPatient.patientAvatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingPatient.patientName || "P")}&background=fce7f3&color=c0166a`
                }
                alt={viewingPatient.patientName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/60"
              />
              <div>
                <p className="text-white font-bold text-lg leading-tight">
                  {viewingPatient.patientName || "Unknown Patient"}
                </p>
                {viewingPatient.patientAge && (
                  <p className="text-pink-200 text-sm">{viewingPatient.patientAge} years old</p>
                )}
                <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30`}>
                  <MapPin className="w-3 h-3" /> Face-to-Face
                </span>
              </div>
              <button
                onClick={() => setViewingPatient(null)}
                className="ml-auto w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <XCircle className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">

              {/* ── Personal Information ── */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Personal Information</p>
                <div className="space-y-2">
                  {(
                    [
                      { label: "Full Name",      value: viewingPatient.patientName },
                      { label: "Email",          value: viewingPatient.patientEmail },
                      { label: "Address",        value: viewingPatient.patientAddress },
                      { label: "Contact Number", value: viewingPatient.patientContact },
                    ] as { label: string; value?: string }[]
                  ).map(({ label, value }) => (
                    <div key={label} className="grid grid-cols-[140px_1fr] items-start gap-2">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide pt-0.5">{label}</span>
                      <span className="text-sm text-gray-800 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 min-h-[34px]">
                        {value || <span className="text-gray-300 italic">—</span>}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-[140px_1fr] items-start gap-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide pt-0.5">Consultation</span>
                    <span className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg text-sm font-semibold border bg-magenta-50 text-magenta-700 border-magenta-200">
                      <MapPin className="w-3.5 h-3.5" /> Face to Face
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Uploaded Skin Photo ── */}
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Uploaded Skin Photo</p>
                {viewingPatient.skinPhotoUrl ? (
                  <img
                    src={viewingPatient.skinPhotoUrl}
                    alt="Patient skin photo"
                    className="w-full max-h-52 object-contain rounded-xl border border-gray-200 bg-gray-50"
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-xs text-gray-400 italic">
                    No skin photo uploaded.
                  </div>
                )}
              </div>

              {/* ── AI Analysis Result ── */}
              <div className="rounded-xl border border-blue-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
                  <ScanSearch className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">AI Analysis Result</span>
                </div>
                <div className="px-4 py-3 space-y-2">
                <div className="grid grid-cols-[140px_1fr] items-start gap-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide pt-0.5">Detected Condition</span>
                    <span className="text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                      {viewingPatient.aiConditionName || viewingPatient.conditionName || <span className="text-gray-300 italic">—</span>}
                    </span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Confidence</span>
                    {viewingPatient.aiConfidence !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${Math.min(viewingPatient.aiConfidence, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-blue-700 w-14 text-right">
                          {viewingPatient.aiConfidence}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-300 italic">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Additional Notes ── */}
              <div className="grid grid-cols-[140px_1fr] items-start gap-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide pt-0.5">Additional Notes</span>
                <span className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 leading-relaxed min-h-[60px]">
                  {viewingPatient.notes || <span className="text-gray-300 italic">No additional notes.</span>}
                </span>
              </div>

              {/* Submission time */}
              <p className="text-[11px] text-gray-400 pt-1">
                Submitted: {new Date(viewingPatient.createdAt).toLocaleString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>

            {/* Footer actions */}
            <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setViewingPatient(null);
                  rejectRequest(viewingPatient.id);
                }}
                className="py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
              >
                Reject Request
              </button>
              <button
                onClick={() => {
                  setViewingPatient(null);
                  startScheduleAssignment(viewingPatient.id);
                }}
                disabled={
                  !!(viewingPatient.assignedDoctorId && viewingPatient.doctorStatus !== "approved")
                }
                title={
                  viewingPatient.assignedDoctorId && viewingPatient.doctorStatus !== "approved"
                    ? "Waiting for doctor's review approval"
                    : "Schedule this appointment"
                }
                className="py-3 rounded-xl bg-[#c0166a] text-white text-sm font-semibold hover:bg-[#a01258] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {viewingPatient.assignedDoctorId && viewingPatient.doctorStatus !== "approved"
                  ? "Awaiting Doctor Review"
                  : "Schedule Appointment"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {pendingAssign && (
        <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-magenta-100 shadow-xl p-5">
            <h3 className="text-base font-display font-bold text-gray-900 mb-1">Schedule Date & Time</h3>
            <p className="text-xs text-gray-500 mb-4">Choose appointment date and time, then confirm.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={pendingAssign.date}
                  onChange={(e) =>
                    setPendingAssign((prev) =>
                      prev
                        ? {
                            ...prev,
                            date: e.target.value,
                          }
                        : prev
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-magenta-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Time</label>
                <input
                  type="time"
                  value={pendingAssign.time}
                  onChange={(e) =>
                    setPendingAssign((prev) =>
                      prev
                        ? {
                            ...prev,
                            time: e.target.value,
                          }
                        : prev
                    )
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 outline-none focus:border-magenta-400"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setPendingAssign(null)}
                className="py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAssign}
                className="py-2.5 rounded-lg bg-magenta-500 text-white text-sm font-semibold hover:bg-magenta-600"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Doctor Modal ─────────────────────── */}
      {assignDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
          >
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-blue-500" /> Assign to Doctor
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Select a doctor to review this appointment's AI analysis.
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {clinicDoctors.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  No doctors in your clinic. Go to Doctors page to add one.
                </p>
              ) : (
                clinicDoctors.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      selectedDoctorId === doc.id
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{doc.name}</p>
                    <p className="text-[11px] text-gray-500">{doc.specialization}</p>
                  </button>
                ))
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => { setAssignDoctorModal(null); setSelectedDoctorId(""); }}
                className="py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={assignDoctor}
                disabled={!selectedDoctorId}
                className="py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Assign
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
