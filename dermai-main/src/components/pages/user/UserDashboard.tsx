import { Link } from "react-router-dom";
import {
  Camera,
  MapPin,
  ChevronRight,
  Calendar,
  User,
  TrendingUp,
  Shield,
  Clock,
  LogOut,
  Settings,
  Bell,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { skinConditions } from "./SkinLibraryPage";

type AppointmentRecord = {
  id: string;
  clinicId: number;
  clinicName: string;
  patientName?: string;
  patientAge?: number;
  patientAvatar?: string;
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
  createdAt: string;
};

const recentAnalyses = [
  {
    id: 1,
    conditionId: "tinea-pedis",
    condition: "Tinea Pedis",
    confidence: 85,
    date: "Jan 15, 2025",
    severity: "Mild",
    severityColor: "bg-green-50 text-green-600 border border-green-200",
    bodyPart: "Feet",
  },
  {
    id: 2,
    conditionId: "acne-vulgaris",
    condition: "Acne Vulgaris",
    confidence: 82,
    date: "Jan 10, 2025",
    severity: "Moderate",
    severityColor: "bg-amber-50 text-amber-600 border border-amber-200",
    bodyPart: "Face",
  },
  {
    id: 3,
    conditionId: "atopic-dermatitis",
    condition: "Atopic Dermatitis",
    confidence: 80,
    date: "Dec 28, 2024",
    severity: "Mild",
    severityColor: "bg-green-50 text-green-600 border border-green-200",
    bodyPart: "Arms/Legs",
  },
];

const buildSharedAppointmentSeed = (): AppointmentRecord[] => {
  const getConditionImage = (conditionId: string) =>
    skinConditions.find((item) => item.id === conditionId)?.image || skinConditions[0]?.image;
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  return [
    {
      id: "shared-demo-001",
      clinicId: 1,
      clinicName: "Cebu Skin Institute",
      patientName: "Maria Santos",
      patientAge: 27,
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
      id: "shared-demo-002",
      clinicId: 2,
      clinicName: "SkinMD Dermatology Center",
      patientName: "Maria Santos",
      patientAge: 27,
      consultationType: "face-to-face",
      conditionId: "acne-vulgaris",
      conditionName: "Acne Vulgaris",
      conditionImage: getConditionImage("acne-vulgaris"),
      date: formatDate(tomorrow),
      time: "10:00",
      notes: "Acne breakout follow-up.",
      status: "scheduled",
      clinicNote: "Your schedule has been assigned by the clinic.",
      createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "shared-demo-003",
      clinicId: 3,
      clinicName: "DermaPlus Clinic",
      patientName: "Maria Santos",
      patientAge: 27,
      consultationType: "face-to-face",
      conditionId: "melasma",
      conditionName: "Melasma",
      conditionImage: getConditionImage("melasma"),
      date: "",
      time: "",
      notes: "Pigmentation concerns on cheeks.",
      status: "rejected",
      clinicNote: "Request declined by clinic scheduling.",
      createdAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
    },
  ];
};

const skinTips = [
  {
    title: "Daily Sunscreen",
    desc: "Apply SPF 30+ sunscreen daily, even on cloudy days in Cebu.",
    icon: Shield,
  },
  {
    title: "Stay Hydrated",
    desc: "Drink 8+ glasses of water daily for healthy skin.",
    icon: TrendingUp,
  },
];

export default function UserDashboard() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [profile, setProfile] = useState<{ fullName: string; profilePicture?: string }>({
    fullName: "Maria Santos",
  });
  const [history, setHistory] = useState(recentAnalyses);

  type PatientNotif = {
    id: string;
    type: "appointment-scheduled" | "appointment-rejected";
    title: string;
    message: string;
    clinicName?: string;
    timestamp: string;
    read: boolean;
  };
  const [notifications, setNotifications] = useState<PatientNotif[]>([]);

  const loadNotifications = () => {
    const email = localStorage.getItem("dermai_current_user_email") || "";
    if (!email) return;
    try {
      const raw = localStorage.getItem(`dermai_patient_notifications_${email}`);
      const parsed = raw ? (JSON.parse(raw) as PatientNotif[]) : [];
      setNotifications(parsed);
    } catch { setNotifications([]); }
  };

  const dismissNotif = (id: string) => {
    const email = localStorage.getItem("dermai_current_user_email") || "";
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    localStorage.setItem(`dermai_patient_notifications_${email}`, JSON.stringify(updated));
  };

  const clearAllNotifs = () => {
    const email = localStorage.getItem("dermai_current_user_email") || "";
    setNotifications([]);
    localStorage.setItem(`dermai_patient_notifications_${email}`, "[]");
  };

  useEffect(() => {
    // Load profile
    const loadProfile = () => {
      const savedProfile = localStorage.getItem("dermai_user_profile");
      if (savedProfile) {
        try {
          setProfile(JSON.parse(savedProfile));
        } catch (e) {}
      }
    };

    loadProfile();
    loadNotifications();
    window.addEventListener("storage", loadProfile);

    // Load history
    const savedHistory = localStorage.getItem("dermai_skin_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (parsed && parsed.length > 0) {
          setHistory(parsed.slice(0, 3));
        }
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem("dermai_appointments");
      const parsed = raw ? (JSON.parse(raw) as AppointmentRecord[]) : [];
      if (parsed.length === 0) {
        const seeded = buildSharedAppointmentSeed();
        localStorage.setItem("dermai_appointments", JSON.stringify(seeded));
        setAppointments(seeded);
        return;
      }
      setAppointments(parsed);
    } catch {
      setAppointments([]);
    }

    return () => window.removeEventListener("storage", loadProfile);
  }, []);

  const fallbackImage = skinConditions[0]?.image;
  const latestAppointment = [...appointments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  const normalizedLatestStatus = latestAppointment
    ? latestAppointment.status === "accepted"
      ? "scheduled"
      : latestAppointment.status
    : null;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
            Good morning, {profile.fullName.split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here's your skin health overview — stay informed, stay healthy.
          </p>
        </motion.div>

        {/* Clinic Notifications */}
        {notifications.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-magenta-500" />
                <span className="text-sm font-bold text-gray-800">Clinic Notifications</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-magenta-500 text-white font-bold">{notifications.length}</span>
              </div>
              <button onClick={clearAllNotifs} className="text-xs text-gray-400 hover:text-gray-600 font-medium">Clear all</button>
            </div>
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border ${
                    notif.type === "appointment-scheduled"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  {notif.type === "appointment-scheduled" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${notif.type === "appointment-scheduled" ? "text-green-800" : "text-red-800"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{notif.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {new Date(notif.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {new Date(notif.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                    </p>
                  </div>
                  <button
                    onClick={() => dismissNotif(notif.id)}
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Scans", value: "12", icon: Camera, color: "text-magenta-500 bg-magenta-50" },
            { label: "Conditions Found", value: "5", icon: Calendar, color: "text-blue-500 bg-blue-50" },
            { label: "Clinics Saved", value: "3", icon: MapPin, color: "text-emerald-500 bg-emerald-50" },
            { label: "Last Scan", value: "2d ago", icon: Clock, color: "text-amber-500 bg-amber-50" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-all hover:shadow-sm"
            >
              <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-display font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Link
              to="/dashboard/scan"
              className="group flex items-center gap-5 bg-gradient-to-r from-magenta-500 to-magenta-600 rounded-2xl p-6 text-white hover:shadow-lg hover:shadow-magenta-500/20 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Camera className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg mb-0.5">Scan Your Skin</h3>
                <p className="text-magenta-100 text-sm">AI-powered analysis in seconds</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/60 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Link
              to="/dashboard/clinics"
              className="group flex items-center gap-5 bg-white rounded-2xl p-6 border border-gray-100 hover:border-magenta-200 hover:shadow-sm transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-magenta-50 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <MapPin className="w-7 h-7 text-magenta-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg text-gray-900 mb-0.5">Find a Clinic</h3>
                <p className="text-gray-400 text-sm">Verified dermatologists near you</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 group-hover:text-magenta-400 transition-all" />
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Link
              to="/appointment"
              className="group flex items-center gap-5 bg-white rounded-2xl p-6 border border-gray-100 hover:border-magenta-200 hover:shadow-sm transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Calendar className="w-7 h-7 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg text-gray-900 mb-0.5">Book Appointment</h3>
                <p className="text-gray-400 text-sm">Submit request for clinic scheduling</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 group-hover:text-amber-500 transition-all" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mb-8 bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <h2 className="font-display font-bold text-gray-900">My Appointments</h2>
            <Link to="/appointment" className="text-xs text-magenta-600 font-semibold hover:text-magenta-700">
              Manage
            </Link>
          </div>
          <div className="px-6 pb-5 space-y-3">
            {appointments.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 flex gap-3">
                <img
                  src={item.conditionImage || fallbackImage}
                  alt={item.conditionName || "Skin condition"}
                  className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.conditionName || "Skin concern"}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${
                        (item.status === "accepted" ? "scheduled" : item.status) === "scheduled"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : item.status === "rejected"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.status === "accepted" ? "scheduled" : item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 truncate">{item.clinicName}</p>
                  <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Face-to-face
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {item.date || "To be assigned"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {appointments.length === 0 && <p className="text-xs text-gray-500">No appointment requests yet.</p>}
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Recent Analyses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="font-display font-bold text-gray-900">Recent Analyses</h2>
              <Link to="/dashboard/history" className="text-xs text-magenta-500 font-semibold flex items-center gap-1 hover:text-magenta-600 transition-colors">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="px-6 pb-5 space-y-3">
              {history.map((analysis: any, i) => (
                <Link key={analysis.id} to={`/library/${analysis.conditionId || 'tinea-versicolor'}`} className="block">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.08 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/70 hover:bg-gray-50 transition-colors group cursor-pointer"
                  >
                    <div className="relative w-12 h-12 shrink-0">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        />
                        <path
                          className="text-magenta-500"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeDasharray={`${analysis.confidence}, 100`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-700">
                        {analysis.confidence}%
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{analysis.condition}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {analysis.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {analysis.bodyPart}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-magenta-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </motion.div>
                </Link>
              ))}
              {history.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">No analysis history yet.</p>
                  <Link to="/dashboard/scan" className="text-magenta-500 text-xs font-semibold mt-2 inline-block">Start your first scan</Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Skin Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {skinTips.map((tip) => (
              <div key={tip.title} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-magenta-50 flex items-center justify-center shrink-0">
                  <tip.icon className="w-5 h-5 text-magenta-500" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{tip.title}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Health Reminder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-gradient-to-br from-magenta-50 to-pink-50 rounded-2xl border border-magenta-100 p-5"
          >
            <p className="text-xs font-semibold text-magenta-600 mb-1">⚕️ Reminder</p>
            <p className="text-xs text-magenta-500 leading-relaxed">
              DERMAI provides AI-assisted analysis only. Always consult a licensed dermatologist for proper diagnosis and treatment.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
