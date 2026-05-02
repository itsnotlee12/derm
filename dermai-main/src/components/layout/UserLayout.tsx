import { useLocation, Link, Navigate } from "react-router-dom";
import {
  UserCircle,
  CalendarDays,
  CreditCard,
  ActivitySquare,
  Menu,
  ChevronRight,
  LogOut,
  Search,
  User as UserIcon,
  LayoutGrid,
  Settings,
  ScanLine,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";

interface UserLayoutProps {
  children: React.ReactNode;
}

const sidebarSections = [
  {
    title: "Skin Scan",
    icon: ScanLine,
    links: [
      { label: "Scan Skin", path: "/dashboard/scan" },
    ],
  },
  {
    title: "Profile Management",
    icon: UserCircle,
    links: [
      { label: "Personal Information", path: "/dashboard/profile" },
    ],
  },
  {
    title: "Appointment Booking",
    icon: CalendarDays,
    links: [
      { label: "Search Clinic", path: "/dashboard/clinics" },
    ],
  },
  {
    title: "Monitor",
    icon: ActivitySquare,
    links: [
      { label: "Skin History", path: "/dashboard/history" },
      { label: "Appointment Status", path: "/dashboard/appointment-status" },
      { label: "Subscription Status", path: "/dashboard/subscription-status" },
    ],
  },
  {
    title: "Subscription",
    icon: CreditCard,
    links: [
      { label: "Upgrade Plan", path: "/dashboard/upgrade" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    links: [
      { label: "Account", path: "/dashboard/settings/account" },
      { label: "Help", path: "/dashboard/settings/help" },
      { label: "Billing", path: "/dashboard/settings/billing" },
    ],
  },
];

export default function UserLayout({ children }: UserLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ fullName: string; profilePicture?: string }>({
    fullName: "Maria Santos"
  });

  useEffect(() => {
    const loadProfile = () => {
      const savedProfile = localStorage.getItem("dermai_user_profile");
      if (savedProfile) {
        try {
          setProfile(JSON.parse(savedProfile));
        } catch (e) {}
      }
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/80 flex flex-col lg:flex-row">
      {/* Backdrop Overlay — always rendered, smooth fade */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300 ease-in-out",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col w-[280px] bg-white border-r border-gray-100 h-screen fixed left-0 top-0 z-50 overflow-hidden",
          "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "shadow-[4px_0_32px_rgba(0,0,0,0.08)] lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/images/Derma Logo (1).png" alt="DERMAI logo" className="h-9 w-auto object-contain" />
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-magenta-50 text-magenta-600 font-semibold ml-0.5">
              Patient
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Account Info in Sidebar */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full ring-2 ring-magenta-100 bg-magenta-500 overflow-hidden flex items-center justify-center text-white text-lg font-bold">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.fullName.charAt(0)
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900 leading-tight">{profile.fullName}</p>
              <p className="text-xs text-gray-500">Premium Member</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">Cebu City, Philippines</p>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 space-y-6">
          {/* Standalone Dashboard Link */}
          <div className="space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                location.pathname === "/dashboard"
                  ? "bg-magenta-50 text-magenta-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <LayoutGrid className="w-5 h-5" />
              Dashboard
            </Link>
          </div>

          {sidebarSections.map((section, idx) => {
            const SectionIcon = section.icon;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2 px-3 mb-2 text-gray-400">
                  <SectionIcon className="w-4 h-4" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider">
                    {section.title}
                  </p>
                </div>
                <div className="space-y-0.5">
                  {section.links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "block px-3 py-2 rounded-xl text-sm font-medium pl-9 transition-colors",
                          isActive
                            ? "bg-magenta-50 text-magenta-600"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors bg-white border border-gray-200"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-[280px] min-h-screen flex flex-col relative w-full">
        {/* Render a specific Top Navbar or just use the global Navbar and adapt it */}
        <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} isDashboard={true} />
        <div className="flex-1 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
