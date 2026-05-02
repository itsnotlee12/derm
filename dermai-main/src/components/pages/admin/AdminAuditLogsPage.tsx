import { useMemo, useState } from "react";
import { User, CreditCard, Building2, Settings, Search, Scan, CalendarDays, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuditEntry } from "@/lib/auditLog";

type ActorFilter = "all" | "admin" | "patient" | "clinic" | "system";

const seedLogs: AuditEntry[] = [
  // ── Admin actions ──────────────────────────────────────────────
  {
    id: "log-1",
    action: "Clinic Approved",
    target: "Cebu Skin Institute",
    details: "Clinic verified and approved for platform listing.",
    performedBy: "Admin User",
    actorType: "admin",
    timestamp: "2026-04-05T08:30:00.000Z",
    type: "clinic",
  },
  {
    id: "log-3",
    action: "User Suspended",
    target: "Aira Lim",
    details: "Account suspended due to repeated policy violations.",
    performedBy: "Admin User",
    actorType: "admin",
    timestamp: "2026-04-04T14:20:00.000Z",
    type: "user",
  },
  {
    id: "log-4",
    action: "Clinic Rejected",
    target: "Island Skin Care",
    details: "Application rejected: submitted PRC license could not be verified.",
    performedBy: "Admin User",
    actorType: "admin",
    timestamp: "2026-04-03T11:10:00.000Z",
    type: "clinic",
  },
  {
    id: "log-6",
    action: "Transaction Refunded",
    target: "Aira Lim — TXN-24014",
    details: "₱1,999 refunded via Bank Transfer.",
    performedBy: "Admin User",
    actorType: "admin",
    timestamp: "2026-04-04T14:25:00.000Z",
    type: "subscription",
  },
  {
    id: "log-9",
    action: "Broadcast Sent",
    target: "All Users",
    details: "System announcement: scheduled maintenance on April 6, 2026.",
    performedBy: "Admin User",
    actorType: "admin",
    timestamp: "2026-03-30T08:00:00.000Z",
    type: "system",
  },
  // ── Patient activities ─────────────────────────────────────────
  {
    id: "log-p1",
    action: "Account Registered",
    target: "maria.santos@example.com",
    details: "Patient created a new account on the DermAI platform.",
    performedBy: "Maria Santos",
    actorType: "patient",
    timestamp: "2026-04-05T07:12:00.000Z",
    type: "user",
  },
  {
    id: "log-p2",
    action: "Skin Scan Completed",
    target: "Maria Santos",
    details: "AI scan completed. Condition: Acne Vulgaris (Tagihawat). Confidence: 82%. Severity: Moderate.",
    performedBy: "Maria Santos",
    actorType: "patient",
    timestamp: "2026-04-05T09:45:00.000Z",
    type: "scan",
  },
  {
    id: "log-p3",
    action: "Appointment Booked",
    target: "Cebu Skin Institute",
    details: "Patient booked a face-to-face consultation for Acne Vulgaris.",
    performedBy: "Maria Santos",
    actorType: "patient",
    timestamp: "2026-04-05T10:02:00.000Z",
    type: "appointment",
  },
  {
    id: "log-p4",
    action: "Subscription Upgraded",
    target: "Maria Santos",
    details: "Patient upgraded to Premium Monthly (₱199). Payment via GCash. TXN-24031.",
    performedBy: "Maria Santos",
    actorType: "patient",
    timestamp: "2026-04-01T11:30:00.000Z",
    type: "subscription",
  },
  {
    id: "log-p5",
    action: "Skin Scan Completed",
    target: "Juan Dela Cruz",
    details: "AI scan completed. Condition: Contact Dermatitis (Pantal). Confidence: 74%. Severity: Mild.",
    performedBy: "Juan Dela Cruz",
    actorType: "patient",
    timestamp: "2026-04-04T13:20:00.000Z",
    type: "scan",
  },
  {
    id: "log-p6",
    action: "Subscription Cancelled",
    target: "Aira Lim",
    details: "Patient cancelled their Premium Annual subscription from Billing Settings.",
    performedBy: "Aira Lim",
    actorType: "patient",
    timestamp: "2026-04-04T14:00:00.000Z",
    type: "subscription",
  },
  {
    id: "log-p7",
    action: "Appointment Booked",
    target: "SkinMD Dermatology Center",
    details: "Patient booked an online consultation for Contact Dermatitis.",
    performedBy: "Juan Dela Cruz",
    actorType: "patient",
    timestamp: "2026-04-04T13:35:00.000Z",
    type: "appointment",
  },
  {
    id: "log-p8",
    action: "Skin Scan Completed",
    target: "Sofia Mendoza",
    details: "AI scan completed. Condition: Melasma (Pekas). Confidence: 78%. Severity: Moderate.",
    performedBy: "Sofia Mendoza",
    actorType: "patient",
    timestamp: "2026-04-03T15:50:00.000Z",
    type: "scan",
  },
  // ── Clinic activities ──────────────────────────────────────────
  {
    id: "log-c1",
    action: "Clinic Registered",
    target: "SkinMD Dermatology Center",
    details: "Clinic submitted registration application for admin review.",
    performedBy: "SkinMD Dermatology Center",
    actorType: "clinic",
    timestamp: "2026-01-12T09:00:00.000Z",
    type: "clinic",
  },
  {
    id: "log-c2",
    action: "Appointment Accepted",
    target: "Juan Dela Cruz",
    details: "Clinic scheduled appointment on Apr 10, 2026 at 10:00 AM (online).",
    performedBy: "SkinMD Dermatology Center",
    actorType: "clinic",
    timestamp: "2026-04-04T14:00:00.000Z",
    type: "appointment",
  },
  {
    id: "log-c3",
    action: "Appointment Rejected",
    target: "Rico Villanueva",
    details: "Clinic declined appointment request. Reason: No available slots for requested date.",
    performedBy: "Cebu Skin Institute",
    actorType: "clinic",
    timestamp: "2026-04-03T10:30:00.000Z",
    type: "appointment",
  },
  {
    id: "log-c4",
    action: "Clinic Profile Updated",
    target: "Cebu Skin Institute",
    details: "Clinic updated operating hours and available services.",
    performedBy: "Cebu Skin Institute",
    actorType: "clinic",
    timestamp: "2026-04-02T08:15:00.000Z",
    type: "clinic",
  },
  {
    id: "log-c5",
    action: "Appointment Accepted",
    target: "Maria Santos",
    details: "Clinic scheduled appointment on Apr 8, 2026 at 02:00 PM (face-to-face).",
    performedBy: "Cebu Skin Institute",
    actorType: "clinic",
    timestamp: "2026-04-05T11:00:00.000Z",
    type: "appointment",
  },
];

const typeIcon: Record<string, React.ElementType> = {
  user: User,
  subscription: CreditCard,
  clinic: Building2,
  system: Settings,
  scan: Scan,
  appointment: CalendarDays,
};

const typeBadge: Record<string, string> = {
  user: "bg-blue-50 text-blue-700",
  subscription: "bg-magenta-50 text-magenta-700",
  clinic: "bg-emerald-50 text-emerald-700",
  system: "bg-gray-100 text-gray-700",
  scan: "bg-purple-50 text-purple-700",
  appointment: "bg-orange-50 text-orange-700",
};

const actorBadge: Record<ActorFilter, string> = {
  all: "",
  admin: "bg-red-50 text-red-700",
  patient: "bg-sky-50 text-sky-700",
  clinic: "bg-teal-50 text-teal-700",
  system: "bg-gray-100 text-gray-700",
};

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAuditLogsPage() {
  const [actorFilter, setActorFilter] = useState<ActorFilter>("all");
  const [search, setSearch] = useState("");

  const liveLogs = useMemo<AuditEntry[]>(() => {
    try {
      const raw = localStorage.getItem("dermai_audit_logs");
      if (!raw) return [];
      // Migrate old entries that used `admin` field instead of `performedBy`
      const parsed = JSON.parse(raw) as Array<AuditEntry & { admin?: string }>;
      return parsed.map((l) => ({
        ...l,
        performedBy: l.performedBy ?? (l as { admin?: string }).admin ?? "Unknown",
        actorType: l.actorType ?? "admin",
      }));
    } catch {
      return [];
    }
  }, []);

  const allLogs = useMemo(() => {
    const liveIds = new Set(liveLogs.map((l) => l.id));
    const merged = [...liveLogs, ...seedLogs.filter((l) => !liveIds.has(l.id))];
    return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [liveLogs]);

  const filtered = allLogs.filter((log) => {
    const matchActor =
      actorFilter === "all" ||
      (actorFilter === "system" ? log.type === "system" : log.actorType === actorFilter);
    const matchSearch =
      search === "" ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(search.toLowerCase());
    return matchActor && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Monitor all activities by admins, patients, and clinics
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(["user", "subscription", "clinic", "system", "scan", "appointment"] as const).map((type) => {
          const Icon = typeIcon[type];
          const count = allLogs.filter((l) => l.type === type).length;
          return (
            <div key={type} className="bg-white rounded-2xl p-4 border border-gray-100">
              <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center mb-2", typeBadge[type])}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xl font-display font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400 capitalize">{type}</p>
            </div>
          );
        })}
      </div>

      {/* Actor Filter + Type Filter + Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        {/* Performed by filter + search row */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Performed by:</span>
          {(["all", "admin", "patient", "clinic", "system"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setActorFilter(a)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize",
                actorFilter === a
                  ? "bg-magenta-500 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
            >
              {a === "patient" && <UserCircle2 className="w-3 h-3" />}
              {a === "clinic" && <Building2 className="w-3 h-3" />}
              {a === "system" && <Settings className="w-3 h-3" />}
              {a}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-700 placeholder:text-gray-400 outline-none focus:border-magenta-400 w-52"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-display font-bold text-gray-900">
            Activity Log{" "}
            <span className="text-sm font-normal text-gray-400 ml-1">
              ({filtered.length} entries)
            </span>
          </h3>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No log entries match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Timestamp</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Category</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Action</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Target</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Details</th>
                  <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Performed By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const Icon = typeIcon[log.type] ?? Settings;
                  return (
                    <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize", typeBadge[log.type] ?? "bg-gray-100 text-gray-600")}>
                          <Icon className="w-3 h-3" />
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{log.action}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{log.target}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">{log.details}</td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize", actorBadge[log.actorType ?? "admin"])}>
                          {log.actorType === "patient" && <UserCircle2 className="w-3 h-3" />}
                          {log.actorType === "clinic" && <Building2 className="w-3 h-3" />}
                          {log.performedBy}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
