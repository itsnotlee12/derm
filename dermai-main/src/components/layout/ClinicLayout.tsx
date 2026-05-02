import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  LogOut,
  Menu,
  ChevronRight,
  CheckCircle2,
  Lock,
  XCircle,
  Settings,
  Stethoscope,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, useMemo } from "react";
import { useClinicVerification } from "@/hooks/useClinicVerification";

type NotifAppointment = {
  id: string;
  clinicName: string;
  patientName?: string;
  conditionId?: string;
  conditionName?: string;
  consultationType: "face-to-face";
  status: string;
  createdAt: string;
};

type DoctorReviewNotif = {
  id: string;
  type: "doctor-review";
  appointmentId: string;
  patientName?: string;
  doctorName: string;
  decision: "approved" | "rejected";
  note?: string;
  clinicName: string;
  timestamp: string;
  read: boolean;
};

interface ClinicLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  { label: "Dashboard", path: "/clinic", icon: LayoutDashboard, requiresVerified: false },
  { label: "Appointments", path: "/clinic/appointments", icon: Calendar, requiresVerified: true },
  { label: "Patients", path: "/clinic/patients", icon: Users, requiresVerified: true },
  { label: "Doctors", path: "/clinic/doctors", icon: Stethoscope, requiresVerified: true },
  { label: "Clinic Settings", path: "/clinic/settings", icon: Settings, requiresVerified: false },
];

const normalizeText = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

export default function ClinicLayout({ children }: ClinicLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { status: verificationStatus, clinicName } = useClinicVerification();

  const [seenIds, setSeenIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("dermai_clinic_notifications_seen");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  const clinicKey = normalizeText(clinicName);

  const pendingAppointments = useMemo(() => {
    try {
      const raw = localStorage.getItem("dermai_appointments");
      const all = raw ? (JSON.parse(raw) as NotifAppointment[]) : [];
      return all.filter((a) => {
        const n = normalizeText(a.clinicName);
        return (
          (n === clinicKey || n.includes(clinicKey) || clinicKey.includes(n)) &&
          a.status === "pending"
        );
      });
    } catch {
      return [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicKey, notifOpen]);

  const doctorReviewNotifs = useMemo(() => {
    try {
      const raw = localStorage.getItem("dermai_clinic_review_notifications");
      const all = raw ? (JSON.parse(raw) as DoctorReviewNotif[]) : [];
      return all.filter((n) => {
        const nk = normalizeText(n.clinicName);
        return nk === clinicKey || nk.includes(clinicKey) || clinicKey.includes(nk);
      });
    } catch {
      return [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicKey, notifOpen]);

  const markDoctorReviewsRead = () => {
    try {
      const raw = localStorage.getItem("dermai_clinic_review_notifications");
      const all = raw ? (JSON.parse(raw) as DoctorReviewNotif[]) : [];
      const updated = all.map((n) => {
        const nk = normalizeText(n.clinicName);
        return (nk === clinicKey || nk.includes(clinicKey) || clinicKey.includes(nk))
          ? { ...n, read: true }
          : n;
      });
      localStorage.setItem("dermai_clinic_review_notifications", JSON.stringify(updated));
    } catch { /* silent */ }
  };

  const dismissDoctorReview = (id: string) => {
    try {
      const raw = localStorage.getItem("dermai_clinic_review_notifications");
      const all = raw ? (JSON.parse(raw) as DoctorReviewNotif[]) : [];
      const updated = all.map((n) => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem("dermai_clinic_review_notifications", JSON.stringify(updated));
    } catch { /* silent */ }
  };

  const unreadDoctorCount = doctorReviewNotifs.filter((n) => !n.read).length;
  const unreadCount = pendingAppointments.filter((a) => !seenIds.includes(a.id)).length + unreadDoctorCount;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => {
    const updated = Array.from(new Set([...seenIds, ...pendingAppointments.map((a) => a.id)]));
    setSeenIds(updated);
    localStorage.setItem("dermai_clinic_notifications_seen", JSON.stringify(updated));
    markDoctorReviewsRead();
  };

  const dismissOne = (id: string) => {
    const updated = Array.from(new Set([...seenIds, id]));
    setSeenIds(updated);
    localStorage.setItem("dermai_clinic_notifications_seen", JSON.stringify(updated));
  };

  const currentPage =
    sidebarLinks.find((l) => l.path === location.pathname)?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-gray-50/80 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "flex flex-col w-[260px] bg-white border-r border-gray-100 min-h-screen fixed left-0 top-0 z-50 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-gray-100 shrink-0">
          <img src="/images/logo.png" alt="DERMAI logo" className="h-9 w-auto object-contain" />
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold ml-0.5">
            Clinic
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mt-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
            Clinic Menu
          </p>
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            const isLocked = link.requiresVerified && verificationStatus !== "verified";
            return isLocked ? (
              <div
                key={link.path}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 cursor-not-allowed select-none"
                title="Available for Verified clinics only"
              >
                <Icon className="w-[18px] h-[18px] text-gray-300" />
                <span className="flex-1">{link.label}</span>
                <Lock className="w-3.5 h-3.5 text-gray-300" />
              </div>
            ) : (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-magenta-50 text-magenta-600"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-magenta-500" : "text-gray-400")} />
                <span className="flex-1">{link.label}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-magenta-500" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-2">
          <div className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{clinicName}</p>
            <div className="mt-1">
              {verificationStatus === "verified" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : verificationStatus === "rejected" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">
                  <XCircle className="w-3 h-3" /> Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
                  Pending Verification
                </span>
              )}
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </Link>
        </div>
      </aside>

      <main className="flex-1 lg:ml-[260px] min-h-screen">
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-gray-50 text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-gray-400">Clinic</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <span className="font-semibold text-gray-900">{currentPage}</span>
            </div>
          </div>
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Bell className={cn("w-5 h-5", notifOpen ? "text-magenta-500" : "text-gray-500")} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-magenta-500 rounded-full text-white text-[10px] font-bold leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-[0_8px_32px_rgba(160,25,90,0.15)] border border-gray-100 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-magenta-500" />
                    <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-magenta-100 text-magenta-600 text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] text-magenta-500 hover:text-magenta-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Items */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {pendingAppointments.length === 0 && doctorReviewNotifs.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No new notifications</p>
                    </div>
                  ) : (
                    <>
                      {/* Doctor review notifications */}
                      {doctorReviewNotifs.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                            !notif.read && "bg-blue-50/40"
                          )}
                        >
                          <div className={cn(
                            "mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            notif.decision === "approved" ? "bg-green-100" : "bg-red-100"
                          )}>
                            {notif.decision === "approved"
                              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                              : <XCircle className="w-4 h-4 text-red-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              Doctor {notif.decision === "approved" ? "approved" : "rejected"} appointment
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {notif.patientName || "Patient"} · {notif.doctorName}
                            </p>
                            {notif.note && (
                              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1 italic">"{notif.note}"</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                notif.decision === "approved"
                                  ? "bg-green-50 text-green-600"
                                  : "bg-red-50 text-red-600"
                              )}>
                                {notif.decision === "approved" ? "Approved" : "Rejected"}
                              </span>
                              {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />}
                            </div>
                          </div>
                          <button
                            onClick={() => { dismissDoctorReview(notif.id); setNotifOpen(false); setNotifOpen(true); }}
                            className="mt-0.5 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0"
                            title="Dismiss"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* New appointment notifications */}
                      {pendingAppointments.map((appt) => {
                      const isNew = !seenIds.includes(appt.id);
                      return (
                        <div
                          key={appt.id}
                          className={cn(
                            "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                            isNew && "bg-magenta-50/40"
                          )}
                        >
                          <div className="mt-0.5 w-8 h-8 rounded-full bg-magenta-100 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-magenta-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">New appointment request</p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {appt.patientName || "A patient"}
                              {(appt.conditionName || appt.conditionId) && (
                                <> · {appt.conditionName || appt.conditionId}</>
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-50 text-green-600">
                                Face-to-face
                              </span>
                              {isNew && <span className="w-1.5 h-1.5 rounded-full bg-magenta-500 inline-block" />}
                            </div>
                          </div>
                          <button
                            onClick={() => dismissOne(appt.id)}
                            className="mt-0.5 p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0"
                            title="Dismiss"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    </>
                  )}
                </div>

                {/* Footer */}
                {pendingAppointments.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                    <Link
                      to="/clinic/appointments"
                      onClick={() => { setNotifOpen(false); markAllRead(); }}
                      className="block text-center text-sm font-semibold text-magenta-500 hover:text-magenta-700 transition-colors"
                    >
                      View all appointments →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
