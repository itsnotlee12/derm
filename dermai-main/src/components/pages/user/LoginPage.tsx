import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, User, ShieldCheck, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { upsertPlatformUser } from "@/lib/store";

const GOOGLE_CONFIGURED = import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== "not-configured";

const DEMO_CREDENTIALS = [
  {
    role: "User",
    email: "user@dermai.ph",
    password: "user1234",
    route: "/dashboard",
    icon: User,
    color: "bg-rose-50 border-rose-200 text-rose-700",
    btnColor: "bg-rose-100 hover:bg-rose-200 text-rose-700",
  },
  {
    role: "Clinic",
    email: "clinic@dermai.ph",
    password: "clinic1234",
    route: "/clinic",
    clinicName: "SkinMD Dermatology Center",
    icon: ShieldCheck,
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    btnColor: "bg-emerald-100 hover:bg-emerald-200 text-emerald-700",
  },
  {
    role: "Admin",
    email: "admin@dermai.ph",
    password: "admin1234",
    route: "/admin",
    icon: ShieldCheck,
    color: "bg-magenta-50 border-magenta-200 text-magenta-700",
    btnColor: "bg-magenta-100 hover:bg-magenta-200 text-magenta-700",
  },
  {
    role: "Clinic",
    email: "verified@dermai.ph",
    password: "clinic1234",
    route: "/clinic",
    clinicName: "Verified Clinic",
    icon: ShieldCheck,
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    btnColor: "bg-emerald-100 hover:bg-emerald-200 text-emerald-700",
  },
  {
    role: "Clinic",
    email: "pending@dermai.ph",
    password: "clinic1234",
    route: "/clinic",
    clinicName: "Non-Verified Clinic",
    icon: ShieldCheck,
    color: "bg-amber-50 border-amber-200 text-amber-700",
    btnColor: "bg-amber-100 hover:bg-amber-200 text-amber-700",
  },
  {
    role: "Doctor",
    email: "doctor@dermai.ph",
    password: "doctor1234",
    route: "/doctor",
    clinicName: "SkinMD Dermatology Center",
    doctorName: "Dr. Maria Santos",
    icon: Stethoscope,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    btnColor: "bg-blue-100 hover:bg-blue-200 text-blue-700",
  },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep] = useState<"enter" | "password">("enter");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = (location.state as { from?: string } | null)?.from || "/dashboard";

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        const userEmail = (profile.email as string).toLowerCase();
        const fullName = profile.name as string;

        // Auto-register Google user if not yet in local accounts
        type PatientAccount = { fullName: string; email: string; password: string; role: "user"; createdAt: string; googleId?: string };
        let accounts: PatientAccount[] = [];
        try {
          const raw = localStorage.getItem("dermai_patient_accounts");
          accounts = raw ? (JSON.parse(raw) as PatientAccount[]) : [];
        } catch { accounts = []; }

        const isNew = !accounts.some((a) => a.email === userEmail);
        if (isNew) {
          const newAcc: PatientAccount = { fullName, email: userEmail, password: "", role: "user", createdAt: new Date().toISOString(), googleId: profile.sub };
          localStorage.setItem("dermai_patient_accounts", JSON.stringify([newAcc, ...accounts]));
          upsertPlatformUser({ id: `user-${Date.now()}`, fullName, email: userEmail, joinedAt: new Date().toISOString(), role: "user", status: "active", plan: "Free", scansUsed: 0 });
          localStorage.setItem("dermai_pending_subscription_email", userEmail);
        }

        localStorage.setItem("dermai_auth", "true");
        localStorage.setItem("dermai_role", "user");
        localStorage.setItem("dermai_current_user_email", userEmail);
        localStorage.removeItem("dermai_clinic_name");

        navigate(isNew ? "/register/subscription" : redirectTo, { replace: true });
      } catch {
        setError("Google sign-in failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  // Returns true if this email belongs to an admin, clinic, or doctor (no password needed)
  const loginByEmailOnly = (normalizedEmail: string): boolean => {
    // Check doctor accounts
    type DoctorAccount = { id: string; name: string; email: string; specialization: string; clinicName: string };
    try {
      const raw = localStorage.getItem("dermai_doctor_accounts");
      const doctorAccounts = raw ? (JSON.parse(raw) as DoctorAccount[]) : [];
      const doctorMatch = doctorAccounts.find((a) => a.email === normalizedEmail);
      if (doctorMatch) {
        localStorage.setItem("dermai_auth", "true");
        localStorage.setItem("dermai_role", "doctor");
        localStorage.setItem("dermai_current_user_email", doctorMatch.email);
        localStorage.setItem("dermai_doctor_name", doctorMatch.name);
        localStorage.setItem("dermai_doctor_clinic", doctorMatch.clinicName);
        localStorage.removeItem("dermai_clinic_name");
        navigate("/doctor", { replace: true });
        return true;
      }
    } catch { /* silent */ }

    // Check admin/clinic demo credentials (match by email only)
    const match = DEMO_CREDENTIALS.find(
      (c) => c.email === normalizedEmail && c.role !== "User"
    );
    if (match) {
      localStorage.setItem("dermai_auth", "true");
      localStorage.setItem("dermai_role", match.role.toLowerCase());
      localStorage.setItem("dermai_current_user_email", match.email);
      if (match.role === "Clinic" && match.clinicName) {
        localStorage.setItem("dermai_clinic_name", match.clinicName);
        if (match.email === "verified@dermai.ph" || match.email === "pending@dermai.ph") {
          const status = match.email === "verified@dermai.ph" ? "verified" : "pending";
          const currentSettingsRaw = localStorage.getItem("dermai_clinic_settings");
          const currentSettings = currentSettingsRaw ? JSON.parse(currentSettingsRaw) : {};
          localStorage.setItem("dermai_clinic_settings", JSON.stringify({ ...currentSettings, name: match.clinicName, status }));
        }
      } else if (match.role === "Doctor") {
        const m = match as typeof match & { doctorName?: string };
        localStorage.setItem("dermai_doctor_name", m.doctorName || "Doctor");
        localStorage.setItem("dermai_doctor_clinic", match.clinicName || "");
        localStorage.removeItem("dermai_clinic_name");
      } else {
        localStorage.removeItem("dermai_clinic_name");
      }
      const redirectTo2 = (location.state as { from?: string } | null)?.from;
      navigate(redirectTo2 || match.route, { replace: true });
      return true;
    }

    // Check clinic accounts stored in localStorage (non-demo clinics)
    try {
      const raw = localStorage.getItem("dermai_clinic_applications");
      const clinics = raw ? (JSON.parse(raw) as { email: string; name: string; status: string }[]) : [];
      const clinicMatch = clinics.find((c) => c.email === normalizedEmail);
      if (clinicMatch) {
        localStorage.setItem("dermai_auth", "true");
        localStorage.setItem("dermai_role", "clinic");
        localStorage.setItem("dermai_current_user_email", clinicMatch.email);
        localStorage.setItem("dermai_clinic_name", clinicMatch.name);
        navigate("/clinic", { replace: true });
        return true;
      }
    } catch { /* silent */ }

    return false;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    type PatientAccount = {
      fullName: string;
      email: string;
      password: string;
      role: "user";
      createdAt: string;
    };

    let patientAccounts: PatientAccount[] = [];
    try {
      const raw = localStorage.getItem("dermai_patient_accounts");
      patientAccounts = raw ? (JSON.parse(raw) as PatientAccount[]) : [];
    } catch {
      patientAccounts = [];
    }

    // Patients must use email + password
    const patientMatch = patientAccounts.find(
      (acc) => acc.email === normalizedEmail && acc.password === password
    );

    if (patientMatch) {
      localStorage.setItem("dermai_auth", "true");
      localStorage.setItem("dermai_role", "user");
      localStorage.setItem("dermai_current_user_email", patientMatch.email);
      localStorage.removeItem("dermai_clinic_name");
      navigate(redirectTo, { replace: true });
      return;
    }

    // Also check demo User credentials
    const demoUser = DEMO_CREDENTIALS.find(
      (c) => c.role === "User" && c.email === normalizedEmail && c.password === password
    );
    if (demoUser) {
      localStorage.setItem("dermai_auth", "true");
      localStorage.setItem("dermai_role", "user");
      localStorage.setItem("dermai_current_user_email", demoUser.email);
      localStorage.removeItem("dermai_clinic_name");
      navigate(redirectTo, { replace: true });
      return;
    }

    setError("Invalid email or password.");
  };

  const fillCredentials = (cred: (typeof DEMO_CREDENTIALS)[0]) => {
    setError("");
    if (cred.role !== "User") {
      // Admin, Clinic, Doctor — login immediately by email only
      setEmail(cred.email);
      loginByEmailOnly(cred.email);
    } else {
      setEmail(cred.email);
      setPassword(cred.password);
      setLoginStep("password");
    }
  };

  const handleContinueWithEmail = () => {
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    // If this email belongs to admin/clinic/doctor, skip password
    if (loginByEmailOnly(normalizedEmail)) return;
    // Otherwise go to password step for patients
    setLoginStep("password");
  };

  return (
    <div className="min-h-screen bg-white sm:bg-magenta-50 flex flex-col sm:items-center sm:justify-center px-5 sm:px-4 py-8 sm:py-16 relative overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none hidden sm:block">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-magenta-100/60 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-magenta-200/50 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full sm:max-w-sm sm:bg-white sm:rounded-[24px] sm:shadow-[0_12px_48px_rgba(160,25,90,0.12)] sm:p-8 sm:border sm:border-magenta-100"
      >
        <div className="flex items-center justify-center mb-4">
          <img src="/images/logo.png" alt="DERMAI logo" className="h-10 sm:h-12 w-auto object-contain" />
        </div>

        <h1 className="text-2xl font-display font-bold text-magenta-900 text-center mb-6">
          Welcome Back
        </h1>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Google + Email entry ── */}
          {loginStep === "enter" && (
            <motion.div
              key="enter"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="space-y-0"
            >
              {/* Demo Credentials */}
              <div className="mb-5 space-y-2">
                <p className="text-xs font-bold text-magenta-400 uppercase tracking-widest mb-2">
                  Demo Accounts — click to fill
                </p>
                {DEMO_CREDENTIALS.map((cred) => {
                  const Icon = cred.icon;
                  return (
                    <button
                      key={cred.email}
                      type="button"
                      onClick={() => fillCredentials(cred)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${cred.color} hover:shadow-sm active:scale-[0.98]`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="font-semibold">{cred.role}</span>
                      </div>
                      <div className="text-right font-mono text-xs opacity-80">
                        <div>{cred.email}</div>
                        <div>{cred.password}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                onClick={() => GOOGLE_CONFIGURED ? handleGoogleLogin() : setError("Google sign-in is not configured yet.")}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-full border border-magenta-200 bg-white text-magenta-900 text-sm font-semibold hover:bg-magenta-50 hover:border-magenta-300 transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-wait"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                {googleLoading ? "Signing in..." : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-magenta-100" />
                <span className="text-xs text-magenta-400">or</span>
                <div className="flex-1 h-px bg-magenta-100" />
              </div>

              {/* Email input */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-magenta-400 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-magenta-100 bg-magenta-50 text-base sm:text-sm text-magenta-900 outline-none focus:border-magenta-400 focus:ring-2 focus:ring-magenta-500/10 focus:bg-white transition-all"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleContinueWithEmail}
                className="w-full py-4 sm:py-3.5 rounded-full bg-magenta-500 text-white font-semibold text-sm hover:bg-magenta-600 transition-colors shadow-lg shadow-magenta-500/20 active:scale-[0.97]"
              >
                Continue with email
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Password entry ── */}
          {loginStep === "password" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              <button
                type="button"
                onClick={() => { setLoginStep("enter"); setError(""); }}
                className="inline-flex items-center gap-1 text-sm text-magenta-500 font-medium mb-5 hover:text-magenta-600"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {/* Email display */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-magenta-50 border border-magenta-100 mb-5">
                <span className="flex-1 text-sm text-magenta-700 font-medium truncate">{email}</span>
                <button
                  type="button"
                  onClick={() => { setLoginStep("enter"); setError(""); }}
                  className="text-xs text-magenta-400 hover:text-magenta-600 font-medium shrink-0"
                >
                  Change
                </button>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-magenta-400 uppercase tracking-widest mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Enter your password"
                      autoFocus
                      className="w-full px-4 py-3.5 rounded-xl border border-magenta-100 bg-magenta-50 text-base sm:text-sm text-magenta-900 outline-none focus:border-magenta-400 focus:ring-2 focus:ring-magenta-500/10 focus:bg-white transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-magenta-400 hover:text-magenta-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-4 sm:py-3.5 rounded-full bg-magenta-500 text-white font-semibold text-sm hover:bg-magenta-600 transition-colors shadow-lg shadow-magenta-500/20 active:scale-[0.97]"
                >
                  Sign In
                </button>
              </form>

              <p className="text-center mt-4">
                <a href="#" className="text-xs text-magenta-500 font-medium hover:text-magenta-600">
                  Forgot Password?
                </a>
              </p>
            </motion.div>
          )}

        </AnimatePresence>

        <p className="text-center text-sm text-magenta-600 mt-8 pb-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-magenta-500 font-bold hover:text-magenta-600">
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
