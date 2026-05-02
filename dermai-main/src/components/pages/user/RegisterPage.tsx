import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, User, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { upsertPlatformUser } from "@/lib/store";
import { useGoogleLogin } from "@react-oauth/google";
import { useIsMobile } from "@/hooks/use-mobile";

const GOOGLE_CONFIGURED = import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== "not-configured";

const cebuDistricts = [
  "Cebu City",
  "Mandaue City",
  "Lapu-Lapu City",
  "Talisay City",
  "Consolacion",
  "Liloan",
  "Minglanilla",
  "Naga City",
  "Carcar City",
  "Danao City",
  "Toledo City",
  "Other",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  // On mobile start directly as patient; on desktop show the type selector
  const [accountType, setAccountType] = useState<"patient" | "clinic" | null>(null);
  const effectiveAccountType = isMobile ? "patient" : accountType;
  const [emailStep, setEmailStep] = useState<"enter" | "form">("enter");
  const [emailInput, setEmailInput] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setRegisterError("");
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        const userEmail = (profile.email as string).toLowerCase();
        const fullName = profile.name as string;

        type PatientAccount = { fullName: string; email: string; password: string; role: "user"; createdAt: string; googleId?: string };
        let accounts: PatientAccount[] = [];
        try {
          const raw = localStorage.getItem("dermai_patient_accounts");
          accounts = raw ? (JSON.parse(raw) as PatientAccount[]) : [];
        } catch { accounts = []; }

        if (accounts.some((a) => a.email === userEmail)) {
          // Already registered — just log them in
          localStorage.setItem("dermai_auth", "true");
          localStorage.setItem("dermai_role", "user");
          localStorage.setItem("dermai_current_user_email", userEmail);
          localStorage.removeItem("dermai_clinic_name");
          navigate("/dashboard", { replace: true });
          return;
        }

        const newAcc: PatientAccount = { fullName, email: userEmail, password: "", role: "user", createdAt: new Date().toISOString(), googleId: profile.sub };
        localStorage.setItem("dermai_patient_accounts", JSON.stringify([newAcc, ...accounts]));
        upsertPlatformUser({ id: `user-${Date.now()}`, fullName, email: userEmail, joinedAt: new Date().toISOString(), role: "user", status: "active", plan: "Free", scansUsed: 0 });

        localStorage.setItem("dermai_auth", "true");
        localStorage.setItem("dermai_role", "user");
        localStorage.setItem("dermai_current_user_email", userEmail);
        localStorage.removeItem("dermai_clinic_name");
        localStorage.setItem("dermai_pending_subscription_email", userEmail);
        navigate("/register/subscription", { replace: true });
      } catch {
        setRegisterError("Google sign-up failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => setRegisterError("Google sign-up was cancelled or failed."),
  });

  const handlePatientRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError("");

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get("fullName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    type PatientAccount = {
      fullName: string;
      email: string;
      password: string;
      role: "user";
      createdAt: string;
    };

    let existingAccounts: PatientAccount[] = [];
    try {
      const raw = localStorage.getItem("dermai_patient_accounts");
      existingAccounts = raw ? (JSON.parse(raw) as PatientAccount[]) : [];
    } catch {
      existingAccounts = [];
    }

    const alreadyExists = existingAccounts.some((acc) => acc.email === email);
    if (alreadyExists) {
      setRegisterError("This email is already registered. Please login instead.");
      return;
    }

    const newAccount: PatientAccount = {
      fullName,
      email,
      password,
      role: "user",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "dermai_patient_accounts",
      JSON.stringify([newAccount, ...existingAccounts])
    );

    // Write to shared platform store so admin can monitor this user
    upsertPlatformUser({
      id: `user-${Date.now()}`,
      fullName,
      email,
      joinedAt: new Date().toISOString(),
      role: "user",
      status: "active",
      plan: "Free",
      scansUsed: 0,
    });

    localStorage.setItem("dermai_pending_subscription_email", email);
    navigate("/register/subscription");
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
          Create Your Account
        </h1>

        {/* Account type selector — desktop only */}
        {effectiveAccountType === null && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate("/for-clinics/register")}
              className="w-full text-left rounded-2xl border border-magenta-200 p-4 sm:p-5 hover:border-magenta-400 hover:bg-magenta-50/60 active:bg-magenta-50 transition-all"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-10 h-10 rounded-xl bg-magenta-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-magenta-600" />
                </div>
                <p className="text-base font-bold text-magenta-900">Register as Clinic</p>
              </div>
              <p className="text-sm text-magenta-500 pl-[52px]">
                For dermatology clinics that want to be listed and verified on DERMAI.
              </p>
            </button>
          </div>
        )}

        {effectiveAccountType === "patient" && (
          <AnimatePresence mode="wait">

            {/* ── Step 2: Figma-style Google + Email entry ── */}
            {emailStep === "enter" && (
              <motion.div
                key="enter"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <button
                  type="button"
                  onClick={() => { setAccountType(null); setRegisterError(""); setEmailInput(""); }}
                  className="inline-flex items-center gap-1 text-sm text-magenta-500 font-medium mb-5 hover:text-magenta-600 sm:flex hidden"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to account type
                </button>

                <h2 className="text-xl font-display font-bold text-magenta-900 text-center mb-6">
                  Patient Registration
                </h2>

                {/* Continue with Google */}
                <button
                  type="button"
                  onClick={() => GOOGLE_CONFIGURED ? handleGoogleRegister() : setRegisterError("Google sign-up is not configured yet.")}
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
                  {googleLoading ? "Continuing..." : "Continue with Google"}
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
                    value={emailInput}
                    onChange={(e) => { setEmailInput(e.target.value); setRegisterError(""); }}
                    className="w-full px-4 py-3.5 rounded-xl border border-magenta-100 bg-magenta-50 text-base sm:text-sm text-magenta-900 outline-none focus:border-magenta-400 focus:ring-2 focus:ring-magenta-500/10 focus:bg-white transition-all"
                  />
                </div>

                {registerError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
                    {registerError}
                  </p>
                )}

                {/* Continue with email */}
                <button
                  type="button"
                  onClick={() => {
                    setRegisterError("");
                    if (!emailInput.trim() || !/\S+@\S+\.\S+/.test(emailInput)) {
                      setRegisterError("Please enter a valid email address.");
                      return;
                    }
                    setEmailStep("form");
                  }}
                  className="w-full py-4 sm:py-3.5 rounded-full bg-magenta-500 text-white font-semibold text-sm hover:bg-magenta-600 transition-colors shadow-lg shadow-magenta-500/20 active:scale-[0.97]"
                >
                  Continue with email
                </button>
              </motion.div>
            )}

            {/* ── Step 3: Full patient form ── */}
            {emailStep === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <button
                  type="button"
                  onClick={() => { setEmailStep("enter"); setRegisterError(""); }}
                  className="inline-flex items-center gap-1 text-sm text-magenta-500 font-medium mb-4 hover:text-magenta-600"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

            <form
              onSubmit={handlePatientRegister}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-magenta-900 mb-1.5">Full Name</label>
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder="Juan Dela Cruz"
                  className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-magenta-200 text-base sm:text-sm text-magenta-900 placeholder:text-magenta-300 outline-none focus:border-magenta-500 focus:ring-2 focus:ring-magenta-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-magenta-900 mb-1.5">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={emailInput}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-magenta-200 text-base sm:text-sm text-magenta-900 placeholder:text-magenta-300 outline-none focus:border-magenta-500 focus:ring-2 focus:ring-magenta-500/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-magenta-900 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create a password"
                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-magenta-200 text-base sm:text-sm text-magenta-900 placeholder:text-magenta-300 outline-none focus:border-magenta-500 focus:ring-2 focus:ring-magenta-500/10 transition-all pr-12"
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

              <div>
                <label className="block text-sm font-semibold text-magenta-900 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="Confirm your password"
                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-magenta-200 text-base sm:text-sm text-magenta-900 placeholder:text-magenta-300 outline-none focus:border-magenta-500 focus:ring-2 focus:ring-magenta-500/10 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-magenta-400 hover:text-magenta-600 p-1"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-magenta-900 mb-1.5">Age</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    placeholder="Age"
                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-magenta-200 text-base sm:text-sm text-magenta-900 placeholder:text-magenta-300 outline-none focus:border-magenta-500 focus:ring-2 focus:ring-magenta-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-magenta-900 mb-1.5">Gender</label>
                  <select
                    required
                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-magenta-200 text-base sm:text-sm text-magenta-900 outline-none focus:border-magenta-500 focus:ring-2 focus:ring-magenta-500/10 transition-all appearance-none bg-white"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-magenta-900 mb-1.5">Location in Cebu</label>
                <select
                  required
                  className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-magenta-200 text-base sm:text-sm text-magenta-900 outline-none focus:border-magenta-500 focus:ring-2 focus:ring-magenta-500/10 transition-all appearance-none bg-white"
                >
                  <option value="">Select district</option>
                  {cebuDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 w-5 h-5 sm:w-4 sm:h-4 rounded border-magenta-300 text-magenta-500 focus:ring-magenta-500 shrink-0"
                />
                <span className="text-xs text-magenta-600 leading-relaxed">
                  I agree to the <a href="#" className="text-magenta-500 font-semibold hover:underline">Terms and Conditions</a> and <a href="#" className="text-magenta-500 font-semibold hover:underline">Privacy Policy</a>
                </span>
              </label>

              {registerError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  {registerError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-4 sm:py-3.5 rounded-full bg-magenta-500 text-white font-semibold text-sm hover:bg-magenta-600 transition-colors shadow-lg shadow-magenta-500/20 active:scale-[0.97]"
              >
                Create Patient Account
              </button>
            </form>
              </motion.div>
            )}

          </AnimatePresence>
        )}

        <p className="text-center text-sm text-magenta-600 mt-8 pb-4">
          Already have an account? <Link to="/login" className="text-magenta-500 font-bold hover:text-magenta-600">Login</Link>
        </p>
      </motion.div>
    </div>
  );
}
