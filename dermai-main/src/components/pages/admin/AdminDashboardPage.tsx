import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Microscope,
  Users,
  Building2,
  ClipboardList,
  AlertTriangle,
  Phone,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  MapPin,
  TrendingUp,
  Activity,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CebuSkinConditionMap from "./CebuSkinConditionMap";
import { getPlatformUsers, getPlatformScans } from "@/lib/store";

const dashboardFeatures = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "analytics", label: "Analytics & Charts", icon: BarChart3 },
  { id: "activity", label: "Activity & Map", icon: Activity },
  { id: "skin-map", label: "Cebu Skin Condition Map", icon: MapPin },
];

const stats = [
  {
    label: "Total Analyses",
    value: "12,847",
    change: "+12%",
    trend: "up",
    icon: Microscope,
    color: "bg-magenta-50 text-magenta-500",
  },
  {
    label: "Total Users",
    value: "3,291",
    change: "+8%",
    trend: "up",
    icon: Users,
    color: "bg-blue-50 text-blue-500",
  },
  {
    label: "Verified Clinics",
    value: "24",
    change: "+2",
    trend: "up",
    icon: Building2,
    color: "bg-emerald-50 text-emerald-500",
  },
  {
    label: "Pending Applications",
    value: "7",
    change: "-3",
    trend: "down",
    icon: ClipboardList,
    color: "bg-amber-50 text-amber-500",
  },
  {
    label: "Flagged / Low Quality",
    value: "58",
    change: "+5",
    trend: "up",
    icon: AlertTriangle,
    color: "bg-orange-50 text-orange-500",
  },
];

const topConditions = [
  { name: "Tinea V.", count: 3420 },
  { name: "Acne", count: 2890 },
  { name: "Eczema", count: 1950 },
  { name: "Melasma", count: 1640 },
  { name: "Scabies", count: 980 },
];

const trendData = [
  { week: "W1", analyses: 120 },
  { week: "W2", analyses: 185 },
  { week: "W3", analyses: 210 },
  { week: "W4", analyses: 168 },
  { week: "W5", analyses: 245 },
  { week: "W6", analyses: 290 },
  { week: "W7", analyses: 310 },
  { week: "W8", analyses: 275 },
];

const activityLog = [
  { action: "New user registered", user: "Maria Santos", time: "5 min ago", type: "user" },
  { action: "Clinic approved", user: "Admin", time: "1 hour ago", type: "clinic" },
  { action: "Scan completed", user: "Juan Cruz", time: "2 hours ago", type: "scan" },
  { action: "New clinic application", user: "SkinCare Plus", time: "5 hours ago", type: "clinic" },
];

const cebuDistricts = [
  { name: "Cebu City", count: 4821, x: 48, y: 42 },
  { name: "Mandaue", count: 1523, x: 52, y: 35 },
  { name: "Lapu-Lapu", count: 987, x: 62, y: 40 },
  { name: "Talisay", count: 743, x: 46, y: 52 },
  { name: "Minglanilla", count: 412, x: 44, y: 58 },
  { name: "Consolacion", count: 356, x: 50, y: 28 },
  { name: "Liloan", count: 289, x: 55, y: 24 },
  { name: "Naga", count: 198, x: 42, y: 64 },
  { name: "Danao", count: 167, x: 56, y: 16 },
  { name: "Carcar", count: 143, x: 40, y: 70 },
];

const activityColors: Record<string, string> = {
  user: "bg-blue-50 text-blue-500",
  clinic: "bg-emerald-50 text-emerald-500",
  scan: "bg-magenta-50 text-magenta-500",
  alert: "bg-red-50 text-red-500",
};

export default function AdminDashboardPage() {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>("overview");
  const [showMenu, setShowMenu] = useState(false);

  const liveUsers = getPlatformUsers();
  const liveScans = getPlatformScans();
  const flaggedScans = liveScans.filter((s) => s.status === "flagged" || s.status === "invalid");

  const stats = useMemo(() => [
    {
      label: "Total Analyses",
      value: liveScans.length > 0 ? liveScans.length.toLocaleString() : "12,847",
      change: "+12%",
      trend: "up" as const,
      icon: Microscope,
      color: "bg-magenta-50 text-magenta-500",
    },
    {
      label: "Total Users",
      value: liveUsers.length > 0 ? liveUsers.length.toLocaleString() : "3,291",
      change: "+8%",
      trend: "up" as const,
      icon: Users,
      color: "bg-blue-50 text-blue-500",
    },
    {
      label: "Verified Clinics",
      value: "24",
      change: "+2",
      trend: "up" as const,
      icon: Building2,
      color: "bg-emerald-50 text-emerald-500",
    },
    {
      label: "Pending Applications",
      value: "7",
      change: "-3",
      trend: "down" as const,
      icon: ClipboardList,
      color: "bg-amber-50 text-amber-500",
    },
    {
      label: "Flagged / Low Quality",
      value: flaggedScans.length > 0 ? String(flaggedScans.length) : "58",
      change: "+5",
      trend: "up" as const,
      icon: AlertTriangle,
      color: "bg-orange-50 text-orange-500",
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [liveUsers.length, liveScans.length, flaggedScans.length]);

  return (
    <div className="space-y-6">
      {/* Page Title + Feature Menu */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Overview of your DERMAI platform activity</p>
        </div>

        {/* Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-sm font-semibold text-gray-700 transition-all"
          >
            {dashboardFeatures.find((f) => f.id === selectedFeature)?.label || "Select Feature"}
            <ChevronDown className={cn("w-4 h-4 transition-transform", showMenu && "rotate-180")} />
          </button>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[280px] overflow-hidden"
            >
              {dashboardFeatures.map((feature) => {
                const Icon = feature.icon;
                const isSelected = selectedFeature === feature.id;
                return (
                  <button
                    key={feature.id}
                    onClick={() => {
                      setSelectedFeature(feature.id);
                      setShowMenu(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-100 last:border-b-0 transition-colors",
                      isSelected
                        ? "bg-magenta-50 text-magenta-600"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isSelected ? "text-magenta-600" : "text-gray-400")} />
                    <div>
                      <p className="font-medium text-sm">{feature.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {feature.id === "overview"
                          ? "Key metrics and stats"
                          : feature.id === "analytics"
                          ? "Charts and trends"
                          : feature.id === "activity"
                          ? "Recent activity and Cebu map"
                          : "Geographic skin condition heatmap"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* Conditional Content Rendering */}
      {selectedFeature === "overview" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-semibold flex items-center gap-0.5 px-2 py-1 rounded-full ${
                        stat.trend === "up"
                          ? "text-emerald-600 bg-emerald-50"
                          : "text-amber-600 bg-amber-50"
                      }`}
                    >
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-display font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-gray-900">
                  Top 5 Detected Conditions
                </h3>
                <span className="text-xs text-gray-400">This month</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topConditions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #f3f4f6",
                        fontSize: 12,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Bar dataKey="count" fill="#A0195A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-gray-900">
                  Analysis Trends
                </h3>
                <div className="flex gap-1">
                  {["Weekly", "Monthly"].map((tab, i) => (
                    <button
                      key={tab}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        i === 0
                          ? "bg-magenta-50 text-magenta-600"
                          : "text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #f3f4f6",
                        fontSize: 12,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="analyses"
                      stroke="#A0195A"
                      strokeWidth={2.5}
                      dot={{ fill: "#A0195A", r: 4, strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#A0195A" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {selectedFeature === "analytics" && (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-gray-900">
                  Top 5 Detected Conditions
                </h3>
                <span className="text-xs text-gray-400">This month</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topConditions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #f3f4f6",
                        fontSize: 12,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Bar dataKey="count" fill="#A0195A" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-gray-900">
                  Analysis Trends
                </h3>
                <div className="flex gap-1">
                  {["Weekly", "Monthly"].map((tab, i) => (
                    <button
                      key={tab}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        i === 0
                          ? "bg-magenta-50 text-magenta-600"
                          : "text-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #f3f4f6",
                        fontSize: 12,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="analyses"
                      stroke="#A0195A"
                      strokeWidth={2.5}
                      dot={{ fill: "#A0195A", r: 4, strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#A0195A" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {selectedFeature === "activity" && (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cebu Analysis Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-gray-900">Cebu Analysis Map</h3>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-magenta-50 text-magenta-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-magenta-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Skin analysis density across Cebu</p>
          </div>

          <div className="px-6 pb-5">
            <div className="relative bg-gray-50/80 rounded-2xl overflow-hidden h-[300px] border border-gray-100">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.03))" }}>
                <path
                  d="M 52 5 C 54 8, 57 12, 58 18 C 59 22, 57 26, 56 30 C 55 34, 54 36, 53 38 C 52 40, 54 42, 55 44 C 56 46, 58 44, 60 42 C 62 40, 65 38, 66 40 C 67 42, 64 44, 62 46 C 60 48, 56 48, 54 48 C 52 48, 50 50, 49 52 C 48 54, 48 56, 47 58 C 46 60, 46 62, 45 64 C 44 66, 43 68, 42 70 C 41 72, 40 74, 39 76 C 38 78, 37 80, 36 82 C 35 84, 34 86, 35 88 C 36 90, 38 90, 39 88 C 40 86, 41 84, 42 82 C 43 80, 44 78, 44 76 C 44 74, 45 72, 46 70 C 47 68, 48 66, 48 64 C 48 62, 49 60, 50 58 C 51 56, 52 54, 52 52 C 52 50, 53 48, 55 46 C 57 44, 56 42, 55 40 C 54 38, 55 36, 56 34 C 57 32, 58 28, 57 24 C 56 20, 55 16, 54 12 C 53 8, 52 6, 52 5Z"
                  fill="#f9fafb"
                  stroke="#e5e7eb"
                  strokeWidth="0.4"
                />
                <ellipse cx="64" cy="42" rx="5" ry="2.5" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="0.4" />
              </svg>

              {cebuDistricts.map((district) => {
                const isHovered = hoveredDistrict === district.name;
                const size = Math.min(Math.max(district.count / 300, 1), 3.5);
                return (
                  <div
                    key={district.name}
                    className="absolute cursor-pointer"
                    style={{ left: `${district.x}%`, top: `${district.y}%`, transform: "translate(-50%, -50%)", zIndex: isHovered ? 30 : 10 }}
                    onMouseEnter={() => setHoveredDistrict(district.name)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                  >
                    <div
                      className="absolute inset-0 rounded-full bg-magenta-400 opacity-20 animate-ping"
                      style={{ width: `${12 * size}px`, height: `${12 * size}px`, left: `${-(12 * size - 10 * size) / 2}px`, top: `${-(12 * size - 10 * size) / 2}px`, animationDuration: "2.5s" }}
                    />
                    <div
                      className={`rounded-full border-2 border-white shadow-md transition-all duration-200 ${isHovered ? "bg-magenta-600 scale-[1.3]" : "bg-magenta-500"}`}
                      style={{ width: `${10 * size}px`, height: `${10 * size}px` }}
                    />
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 whitespace-nowrap z-40">
                        <p className="text-xs font-bold text-gray-900">{district.name}</p>
                        <p className="text-[10px] text-magenta-500 font-semibold">{district.count.toLocaleString()} analyses</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-r border-b border-gray-100 rotate-45 -mt-1" />
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 mb-1.5">Density</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-magenta-300" /><span className="text-[9px] text-gray-400">Low</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-magenta-400" /><span className="text-[9px] text-gray-400">Med</span></div>
                  <div className="flex items-center gap-1"><div className="w-4 h-4 rounded-full bg-magenta-600" /><span className="text-[9px] text-gray-400">High</span></div>
                </div>
              </div>

              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 border border-gray-100 text-center">
                <p className="text-lg font-display font-bold text-magenta-600">
                  {cebuDistricts.reduce((a, b) => a + b.count, 0).toLocaleString()}
                </p>
                <p className="text-[9px] text-gray-400">Total in Cebu</p>
              </div>
            </div>
          </div>

          {/* Top districts list */}
          <div className="px-6 pb-5 space-y-2">
            {cebuDistricts.slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-300 w-4">{i + 1}</span>
                <span className="text-xs font-medium text-gray-700 flex-1">{d.name}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-magenta-500 rounded-full transition-all"
                    style={{ width: `${(d.count / cebuDistricts[0].count) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-gray-500 w-12 text-right">
                  {d.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="px-6 pt-5 pb-4 flex items-center justify-between">
            <h3 className="font-display font-bold text-gray-900">
              Recent Activity
            </h3>
            <a href="#" className="text-xs text-magenta-500 font-semibold hover:text-magenta-600 transition-colors">
              View all
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-50">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Action</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">User</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.map((log, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg ${activityColors[log.type]} flex items-center justify-center`}>
                          <span className="text-[10px]">
                            {log.type === "user" ? "👤" : log.type === "clinic" ? "🏥" : log.type === "scan" ? "🔬" : "⚠️"}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500 font-medium">{log.user}</td>
                    <td className="px-6 py-3.5 text-xs text-gray-400">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Alert Cards */}
          <div className="px-6 py-5 border-t border-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-display font-bold text-amber-800">23</p>
                  <p className="text-xs text-amber-600">Out-of-Scope Alerts</p>
                </div>
              </div>
              {/* DOH Referrals card removed */}
            </div>
          </div>
        </motion.div>
      </div>
      )}

      {selectedFeature === "skin-map" && (
        <div>
          <CebuSkinConditionMap />
        </div>
      )}
    </div>
  );
}
