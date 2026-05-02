import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Bell, User as UserIcon, CheckCheck, Calendar, Activity, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "appointment" | "scan" | "subscription" | "system";
}

function buildNotifications(): Notification[] {
  const list: Notification[] = [];

  // Appointment notifications
  try {
    const appts = JSON.parse(localStorage.getItem("dermai_appointments") || "[]");
    appts.slice(0, 2).forEach((a: { clinicName?: string; status?: string; date?: string }, i: number) => {
      list.push({
        id: `appt-${i}`,
        title: "Appointment Update",
        message: `Your appointment at ${a.clinicName || "a clinic"} is ${a.status || "pending"}.`,
        time: a.date || "Recently",
        read: false,
        type: "appointment",
      });
    });
  } catch {}

  // Skin scan notifications
  try {
    const history = JSON.parse(localStorage.getItem("dermai_skin_history") || "[]");
    if (history.length > 0) {
      const latest = history[0];
      list.push({
        id: "scan-latest",
        title: "Scan Result Ready",
        message: `Your latest scan detected ${latest.condition} (${latest.confidence}% confidence).`,
        time: latest.date || "Recently",
        read: false,
        type: "scan",
      });
    }
  } catch {}

  // Subscription notification
  try {
    const sub = JSON.parse(localStorage.getItem("dermai_user_subscription") || "{}");
    if (sub.isPro) {
      list.push({
        id: "sub-pro",
        title: "Pro Plan Active",
        message: "Your Pro subscription is active. Enjoy unlimited scans!",
        time: "Today",
        read: true,
        type: "subscription",
      });
    } else {
      list.push({
        id: "sub-free",
        title: "Upgrade Available",
        message: "Upgrade to Pro for unlimited AI skin scans starting at ₱199/month.",
        time: "Today",
        read: true,
        type: "subscription",
      });
    }
  } catch {}

  // System welcome
  list.push({
    id: "sys-welcome",
    title: "Welcome to DermAI",
    message: "Your account is set up. Start your first skin scan today!",
    time: "Apr 4, 2026",
    read: true,
    type: "system",
  });

  return list;
}

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Scan Skin", path: "/scan" },
  { label: "Find Clinics", path: "/clinics" },
];

export interface NavbarProps {
  isDashboard?: boolean;
  onMenuClick?: () => void;
}

export default function Navbar({ isDashboard, onMenuClick }: NavbarProps = {}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clinicDropdown, setClinicDropdown] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build notifications from localStorage on open
  useEffect(() => {
    if (notifOpen) {
      setNotifications(buildNotifications());
    }
  }, [notifOpen]);

  useEffect(() => {
    const loadProfile = () => {
      const savedProfile = localStorage.getItem("dermai_user_profile");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setProfilePic(parsed.profilePicture || null);
        } catch (e) {}
      }
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, []);

  const isHome = location.pathname === "/";

  return (
    <nav
      className={cn(
        "relative w-full z-50",
        isHome
          ? "bg-[#A0195A]"
          : "bg-white border-b border-magenta-100/50 shadow-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center overflow-hidden",
                isHome ? "bg-white/20" : "bg-magenta-500"
              )}
            >
              <img
                src="/images/Derma Logo (1).png"
                alt="DERMAI logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className={cn(
                "text-xl font-display font-bold",
                isHome ? "text-white" : "text-magenta-900"
              )}
            >
              Derm<span className={isHome ? "text-pink-200" : "text-magenta-500"}>AI</span>
            </span>
          </Link>

          {/* Desktop Nav — hidden when inside dashboard (patient has sidebar) */}
          {!isDashboard && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  isHome
                    ? location.pathname === link.path
                      ? "text-white font-bold underline underline-offset-4"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                    : location.pathname === link.path
                    ? "text-magenta-500 bg-magenta-50"
                    : "text-magenta-900 hover:text-magenta-500 hover:bg-magenta-50"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* For Clinics Dropdown */}
            <div className="relative">
              <button
                onClick={() => setClinicDropdown(!clinicDropdown)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1",
                  isHome
                    ? location.pathname.startsWith("/for-clinics")
                      ? "text-white font-bold"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                    : location.pathname.startsWith("/for-clinics")
                    ? "text-magenta-500 bg-magenta-50"
                    : "text-magenta-900 hover:text-magenta-500 hover:bg-magenta-50"
                )}
              >
                For Clinics
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {clinicDropdown && (
                <div className="absolute top-full mt-1 right-0 z-[60] bg-white rounded-2xl shadow-lg border border-magenta-100 py-2 min-w-[180px]">
                  <Link
                    to="/for-clinics"
                    onClick={() => setClinicDropdown(false)}
                    className="block px-4 py-2 text-sm text-magenta-900 hover:bg-magenta-50 hover:text-magenta-500"
                  >
                    Partner With Us
                  </Link>
                  <Link
                    to="/for-clinics/register"
                    onClick={() => setClinicDropdown(false)}
                    className="block px-4 py-2 text-sm text-magenta-900 hover:bg-magenta-50 hover:text-magenta-500"
                  >
                    Register Clinic
                  </Link>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isDashboard ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen((prev) => !prev)}
                    className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 border-2 border-white rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Panel */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-[100] overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-900">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="flex items-center gap-1 text-xs text-magenta-500 font-semibold hover:text-magenta-700 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-80 overflow-y-auto scrollbar-hide divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <p className="text-center text-sm text-gray-400 py-8">No notifications yet.</p>
                        ) : (
                          notifications.map((n) => {
                            const Icon = n.type === "appointment" ? Calendar : n.type === "scan" ? Activity : n.type === "subscription" ? Crown : Bell;
                            const iconBg = n.type === "appointment" ? "bg-blue-100 text-blue-500" : n.type === "scan" ? "bg-magenta-100 text-magenta-500" : n.type === "subscription" ? "bg-amber-100 text-amber-500" : "bg-gray-100 text-gray-400";
                            return (
                              <button
                                key={n.id}
                                onClick={() => markRead(n.id)}
                                className={cn(
                                  "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                                  !n.read && "bg-magenta-50/40"
                                )}
                              >
                                <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", iconBg)}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-bold text-gray-900 truncate">{n.title}</p>
                                    {!n.read && <span className="w-2 h-2 bg-magenta-500 rounded-full shrink-0" />}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                                  <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-[11px] text-center text-gray-400">
                          {unreadCount === 0 ? "You're all caught up!" : `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/dashboard/profile" className="w-9 h-9 rounded-full bg-magenta-500 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-magenta-100 cursor-pointer">
                  {profilePic ? (
                    <img
                      src={profilePic}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-white" />
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-semibold border-2 transition-colors",
                    isHome
                      ? "border-white text-white hover:bg-white/10"
                      : "border-magenta-500 text-magenta-500 hover:bg-magenta-50"   
                  )}
                >
                  Login
                </Link>                <Link
                  to="/register"
                  className={cn(
                    "px-5 py-2 rounded-full text-sm font-semibold transition-colors shadow-md",
                    isHome
                      ? "bg-white text-magenta-600 hover:bg-magenta-50 shadow-white/20"
                      : "bg-magenta-500 text-white hover:bg-magenta-600 shadow-magenta-500/20"
                  )}
                >
                  Register
                </Link>              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              isHome ? "text-white hover:bg-white/10" : "text-magenta-900 hover:bg-gray-100"
            )}
            onClick={isDashboard && onMenuClick ? onMenuClick : () => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav — hidden when inside dashboard (patient has sidebar) */}
      {mobileOpen && !isDashboard && (
        <div
          className={cn(
            "md:hidden border-t px-4 py-4 space-y-2",
            isHome ? "bg-[#A0195A] border-white/20" : "bg-white border-magenta-100"
          )}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isHome
                  ? "text-white hover:bg-white/10"
                  : location.pathname === link.path
                  ? "text-magenta-500 bg-magenta-50"
                  : "text-magenta-900 hover:bg-magenta-50"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/for-clinics"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "block px-4 py-2.5 rounded-xl text-sm font-medium",
              isHome ? "text-white hover:bg-white/10" : "text-magenta-900 hover:bg-magenta-50"
            )}
          >
            For Clinics
          </Link>
          <div
            className={cn(
              "flex gap-3 pt-3 border-t",
              isHome ? "border-white/20" : "border-magenta-100"
            )}
          >
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold border-2",
                isHome ? "border-white text-white" : "border-magenta-500 text-magenta-500"
              )}
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex-1 text-center px-4 py-2.5 rounded-full text-sm font-semibold",
                isHome
                  ? "bg-white text-magenta-600"
                  : "bg-magenta-500 text-white"
              )}
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
