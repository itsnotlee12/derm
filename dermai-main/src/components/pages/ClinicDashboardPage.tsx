import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Video,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Mail,
  Bell,
  MoreVertical,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ── Types ─────────────────────────────────────────────────── */
type AppointmentRecord = {
  id: string;
  clinicId: number;
  clinicName: string;
  consultationType: "face-to-face";
  date: string;
  time: string;
  notes: string;
  status: "pending" | "accepted" | "scheduled" | "rejected";
  meetingLink?: string;
  clinicNote?: string;
  createdAt: string;
};

type ClinicApplication = {
  id: number;
  name: string;
  status: "pending" | "verified" | "rejected";
};


/* ── Static sample data ─────────────────────────────────────── */
const chartData = [
  { day: "1", patients: 4 },
  { day: "3", patients: 7 },
  { day: "5", patients: 5 },
  { day: "7", patients: 12 },
  { day: "9", patients: 9 },
  { day: "11", patients: 15 },
  { day: "13", patients: 11 },
  { day: "15", patients: 18 },
  { day: "17", patients: 14 },
  { day: "19", patients: 17 },
  { day: "21", patients: 13 },
  { day: "23", patients: 16 },
  { day: "25", patients: 19 },
  { day: "27", patients: 15 },
  { day: "30", patients: 17 },
];

const newPatients = [
  {
    name: "Maria Santos",
    age: 27,
    concern: "The patient has frequent skin rashes and allergic reactions.",
    type: "face-to-face",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Juan Cruz",
    age: 31,
    concern: "The patient reports acne breakouts after dietary changes.",
    type: "face-to-face",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Ana Reyes",
    age: 24,
    concern: "The patient notices pigmentation and uneven skin tone.",
    type: "face-to-face",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

const calendarAppointments = [
  {
    name: "Liza Morales",
    type: "Consultation",
    status: "visited",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    name: "Carlos Bautista",
    type: "Check-up",
    status: "today",
    time: "10:00 AM",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
  },
  {
    name: "Diana Lim",
    type: "Treatment",
    status: "today",
    time: "10:50 AM",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
  },
  {
    name: "Mark Aquino",
    type: "Treatment",
    status: "cancelled",
    avatar: "https://randomuser.me/api/portraits/men/22.jpg",
  },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ── Custom Tooltip ─────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#c0166a] text-white text-xs px-3 py-2 rounded-xl shadow-lg">
        <p className="font-bold">Sep {label}</p>
        <p>{payload[0].value} patients</p>
      </div>
    );
  }
  return null;
};

/* ── Main Component ─────────────────────────────────────────── */
export default function ClinicDashboardPage() {
  const clinicName =
    localStorage.getItem("dermai_clinic_name") || "SkinMD Dermatology Center";
  const [calMonth] = useState("March 2026");

  const appointments = useMemo<AppointmentRecord[]>(() => {
    try {
      const raw = localStorage.getItem("dermai_appointments");
      return raw ? (JSON.parse(raw) as AppointmentRecord[]) : [];
    } catch {
      return [];
    }
  }, []);

  const verificationStatus = useMemo(() => {
    try {
      const raw = localStorage.getItem("dermai_clinic_applications");
      const parsed = raw ? (JSON.parse(raw) as ClinicApplication[]) : [];
      const match = parsed.find(
        (app) => app.name.toLowerCase().trim() === clinicName.toLowerCase().trim()
      );
      return match?.status || "pending";
    } catch {
      return "pending";
    }
  }, [clinicName]);

  const pending = appointments.filter((a) => a.status === "pending").length;
  const accepted = appointments.filter(
    (a) => a.status === "accepted" || a.status === "scheduled"
  ).length;

  const isPending = verificationStatus === "pending";

  const statCards = [
    {
      label: "Total Patients",
      value: pending + accepted + 21 || 151,
      sub: "+15% vs last month",
      highlight: true,
    },
    {
      label: "Patients Online",
      value: 71,
      sub: "+12% vs last month",
      highlight: false,
    },
    {
      label: "In-Clinic Visit",
      value: 80,
      sub: "+3% vs last month",
      highlight: false,
    },
    {
      label: "Avg Time for Appointment",
      value: "41",
      sub: "min",
      highlight: false,
    },
  ];

  /* calendar week rows */
  const calDays = [10, 11, 12, 13, 14, 15, 16];
  const today = 31;

  return (
    <div className="min-h-screen bg-[#faf5f8] p-4 md:p-6 space-y-5 font-sans">

      {/* ── Top nav ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#c0166a]" />
          <span className="text-sm font-semibold text-gray-700">March 31, 2026</span>
          {verificationStatus === "verified" && (
            <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#c0166a] text-white text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
          {verificationStatus === "pending" && (
            <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold border border-pink-200">
              Pending Verification
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm hover:bg-pink-50 transition-colors">
            <Mail className="w-4 h-4 text-gray-500" />
          </button>
          <button className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm hover:bg-pink-50 transition-colors">
            <Bell className="w-4 h-4 text-gray-500" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="https://randomuser.me/api/portraits/women/65.jpg"
              className="w-8 h-8 rounded-full object-cover border-2 border-[#c0166a]"
              alt="Doctor"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-gray-800 leading-none">Dr. Alexis Wells</p>
              <p className="text-[10px] text-gray-400">Dermatologist</p>
            </div>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Account Pending Verification</p>
            <p>Your clinic application is currently being reviewed by an administrator. You cannot receive appointments yet until verified.</p>
          </div>
        </div>
      )}

      {/* ── Stat cards + Chart ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stats 2x2 */}
        <div className="lg:col-span-1 grid grid-cols-2 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`rounded-2xl p-4 flex flex-col justify-between min-h-[110px] relative overflow-hidden ${
                s.highlight
                  ? "bg-[#c0166a] text-white"
                  : "bg-white border border-gray-100 text-gray-900"
              }`}
            >
              {s.highlight && (
                <>
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
                  <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full bg-white/10" />
                </>
              )}
              <div className="flex items-center justify-between relative">
                <p className={`text-xs font-semibold ${s.highlight ? "text-pink-100" : "text-gray-500"}`}>
                  {s.label}
                </p>
                <button
                  className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                    s.highlight
                      ? "border-white/40 text-white"
                      : "border-gray-200 text-gray-400"
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="relative">
                <p className={`text-2xl font-bold leading-none ${s.highlight ? "text-white" : "text-gray-900"}`}>
                  {s.value}
                </p>
                <p className={`text-[10px] mt-1 ${s.highlight ? "text-pink-200" : "text-gray-400"}`}>
                  {s.sub}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Line chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">New Patients</h2>
            <select className="text-xs border border-gray-100 rounded-lg px-2 py-1 text-gray-500 bg-gray-50 focus:outline-none">
              <option>This month</option>
              <option>Last month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e8ec" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#bbb" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#bbb" }} axisLine={false} tickLine={false} domain={[0, 20]} ticks={[0, 5, 10, 15, 20]} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#c0166a22", strokeWidth: 2 }} />
              <Line
                type="monotone"
                dataKey="patients"
                stroke="#c0166a"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#c0166a", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── New Patients + Calendar ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* New patient cards */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">New Patients</h2>
            <Link to="/clinic/appointments" className="text-xs text-[#c0166a] font-semibold hover:underline">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {newPatients.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl border border-gray-100 p-4 flex flex-col items-center text-center gap-2 hover:border-pink-200 hover:shadow-sm transition-all"
              >
                <div className="relative">
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-pink-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=fce7f3&color=c0166a`;
                    }}
                  />
                  <span className="absolute bottom-0 right-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white bg-[#c0166a] text-white">
                    In-clinic
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.age} years old</p>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{p.concern}</p>
                <div className="flex items-center gap-2 mt-auto w-full">
                  <button disabled={isPending} className="flex-1 bg-[#c0166a] hover:bg-[#a01258] text-white text-xs font-semibold py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Accept
                  </button>
                  <button disabled={isPending} className="w-8 h-8 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4"
        >
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">{calMonth}</h2>
            <div className="flex gap-1">
              <button className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-pink-50">
                <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <button className="w-6 h-6 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center hover:bg-pink-50">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 text-center">
            {DAYS.map((d) => (
              <span key={d} className="text-[10px] text-gray-400 font-semibold">{d}</span>
            ))}
          </div>

          {/* Date row */}
          <div className="grid grid-cols-7 text-center gap-y-1">
            {calDays.map((d) => (
              <button
                key={d}
                className={`w-7 h-7 mx-auto rounded-full text-[11px] font-semibold transition-colors ${
                  d === today
                    ? "bg-[#c0166a] text-white shadow"
                    : d === 15 || d === 16
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-pink-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Appointments list */}
          <div className="space-y-2 pt-1">
            {calendarAppointments.map((a) => (
              <div key={a.name} className="flex items-center gap-2">
                <img
                  src={a.avatar}
                  alt={a.name}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=fce7f3&color=c0166a&size=56`;
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{a.name}</p>
                  <p className="text-[10px] text-gray-400">{a.type}</p>
                </div>
                {a.status === "visited" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Visited</span>
                )}
                {a.status === "today" && (
                  <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">Today at<br />{a.time}</span>
                )}
                {a.status === "cancelled" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Cancelled</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}