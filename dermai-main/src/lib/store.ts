// ─── Shared Platform Data Store ──────────────────────────────────────────────
// All three roles (admin, user, clinic) communicate through these localStorage
// keys. Use the typed helpers below for all reads and writes.

export type PlatformUser = {
  id: string;          // generated on register
  fullName: string;
  email: string;
  phone?: string;
  joinedAt: string;    // ISO string
  role: "user";
  status: "active" | "suspended" | "inactive";
  plan: "Free" | "Premium Monthly" | "Premium Annual";
  scansUsed: number;
  subscriptionStartedAt?: string;
  subscriptionRenewsAt?: string;
};

export type PlatformTransaction = {
  id: string;
  userEmail: string;
  userName: string;
  plan: "Premium Monthly" | "Premium Annual";
  amount: number;      // PHP
  date: string;        // YYYY-MM-DD
  method: "GCash" | "Card" | "Bank Transfer";
  billingCycle: "monthly" | "yearly";
  status: "paid" | "refunded";
};

export type PlatformScan = {
  id: string;
  userEmail: string;
  userName: string;
  condition: string;
  category: string;
  confidence: number;
  severity: "Mild" | "Moderate" | "Severe";
  bodyPart: string;
  scannedAt: string;   // ISO string
  status: "valid" | "flagged" | "invalid";
  reason?: string;
};

// ─── Keys ──────────────────────────────────────────────────────────────────

// ─── Subscription Plans ────────────────────────────────────────────────────

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;              // PHP
  billingType: "monthly" | "yearly" | "one-time";
  description: string;
  features: string[];         // display bullet points
  scanLimit: number | null;   // null = unlimited
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

const PLANS_KEY = "dermai_subscription_plans";

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-free",
    name: "Free",
    price: 0,
    billingType: "one-time",
    description: "Basic access for users who want to try DermAI.",
    features: ["1 AI skin scan per account", "Access to skin library", "Clinic finder and booking"],
    scanLimit: 1,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "plan-premium-monthly",
    name: "Premium Monthly",
    price: 199,
    billingType: "monthly",
    description: "Unlimited access billed every month.",
    features: ["Unlimited AI skin scans", "Priority analysis queue", "Full scan history", "Premium support access", "Cancel anytime"],
    scanLimit: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "plan-premium-yearly",
    name: "Premium Annual",
    price: 1999,
    billingType: "yearly",
    description: "Best value — unlimited access billed once a year.",
    features: ["Unlimited AI skin scans", "Priority analysis queue", "Full scan history", "Premium support access", "Save ~16% vs monthly"],
    scanLimit: null,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export function getSubscriptionPlans(): SubscriptionPlan[] {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (raw) return JSON.parse(raw) as SubscriptionPlan[];
    // Seed defaults on first load
    localStorage.setItem(PLANS_KEY, JSON.stringify(DEFAULT_PLANS));
    return DEFAULT_PLANS;
  } catch {
    return DEFAULT_PLANS;
  }
}

export function setSubscriptionPlans(plans: SubscriptionPlan[]): void {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function upsertSubscriptionPlan(plan: SubscriptionPlan): void {
  const plans = getSubscriptionPlans();
  const idx = plans.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    plans[idx] = { ...plan, updatedAt: new Date().toISOString() };
  } else {
    plans.push({ ...plan, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setSubscriptionPlans(plans);
}

export function deleteSubscriptionPlan(id: string): void {
  const plans = getSubscriptionPlans().filter((p) => p.id !== id);
  setSubscriptionPlans(plans);
}

// ─── Keys ──────────────────────────────────────────────────────────────────

const KEYS = {
  users: "dermai_platform_users",
  transactions: "dermai_platform_transactions",
  scans: "dermai_platform_scans",
} as const;

// ─── Users ─────────────────────────────────────────────────────────────────

export function getPlatformUsers(): PlatformUser[] {
  try {
    const raw = localStorage.getItem(KEYS.users);
    return raw ? (JSON.parse(raw) as PlatformUser[]) : [];
  } catch {
    return [];
  }
}

export function setPlatformUsers(users: PlatformUser[]): void {
  localStorage.setItem(KEYS.users, JSON.stringify(users));
}

export function upsertPlatformUser(user: PlatformUser): void {
  const users = getPlatformUsers();
  const idx = users.findIndex((u) => u.email === user.email);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.unshift(user);
  }
  setPlatformUsers(users);
}

export function getPlatformUserByEmail(email: string): PlatformUser | undefined {
  return getPlatformUsers().find((u) => u.email === email);
}

export function updatePlatformUserStatus(
  email: string,
  status: PlatformUser["status"]
): void {
  const users = getPlatformUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx >= 0) {
    users[idx].status = status;
    setPlatformUsers(users);
  }
}

export function updatePlatformUserPlan(
  email: string,
  plan: PlatformUser["plan"]
): void {
  const users = getPlatformUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx >= 0) {
    users[idx].plan = plan;
    if (plan === "Free") {
      users[idx].subscriptionRenewsAt = undefined;
    }
    setPlatformUsers(users);
    // Also update the user's own subscription key if they're currently logged in
    try {
      const subStr = localStorage.getItem("dermai_user_subscription");
      const current = localStorage.getItem("dermai_current_user_email");
      if (current === email && subStr) {
        const sub = JSON.parse(subStr);
        sub.isPro = plan !== "Free";
        sub.billingCycle = plan === "Premium Annual" ? "yearly" : plan === "Premium Monthly" ? "monthly" : undefined;
        localStorage.setItem("dermai_user_subscription", JSON.stringify(sub));
      }
    } catch {
      // ignore
    }
  }
}

export function updatePlatformUserSubscription(
  email: string,
  plan: PlatformUser["plan"],
  startedAt: string,
  renewsAt: string
): void {
  const users = getPlatformUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx >= 0) {
    users[idx].plan = plan;
    users[idx].subscriptionStartedAt = startedAt;
    users[idx].subscriptionRenewsAt = renewsAt;
    setPlatformUsers(users);
  }
}

export function cancelPlatformUserSubscription(email: string): void {
  const users = getPlatformUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx >= 0) {
    users[idx].plan = "Free";
    users[idx].status = "inactive";
    users[idx].subscriptionRenewsAt = undefined;
    setPlatformUsers(users);
  }
}

// ─── Transactions ──────────────────────────────────────────────────────────

export function getPlatformTransactions(): PlatformTransaction[] {
  try {
    const raw = localStorage.getItem(KEYS.transactions);
    return raw ? (JSON.parse(raw) as PlatformTransaction[]) : [];
  } catch {
    return [];
  }
}

export function addPlatformTransaction(txn: PlatformTransaction): void {
  const existing = getPlatformTransactions();
  existing.unshift(txn);
  localStorage.setItem(KEYS.transactions, JSON.stringify(existing));
}

export function refundPlatformTransaction(txnId: string): void {
  const existing = getPlatformTransactions();
  const idx = existing.findIndex((t) => t.id === txnId);
  if (idx >= 0) {
    existing[idx].status = "refunded";
    localStorage.setItem(KEYS.transactions, JSON.stringify(existing));
  }
}

// ─── Scans ─────────────────────────────────────────────────────────────────

export function getPlatformScans(): PlatformScan[] {
  try {
    const raw = localStorage.getItem(KEYS.scans);
    return raw ? (JSON.parse(raw) as PlatformScan[]) : [];
  } catch {
    return [];
  }
}

export function addPlatformScan(scan: PlatformScan): void {
  const existing = getPlatformScans();
  existing.unshift(scan);
  localStorage.setItem(KEYS.scans, JSON.stringify(existing.slice(0, 500)));
}

export function updatePlatformScanStatus(
  id: string,
  status: PlatformScan["status"],
  reason?: string
): void {
  const existing = getPlatformScans();
  const idx = existing.findIndex((s) => s.id === id);
  if (idx >= 0) {
    existing[idx].status = status;
    if (reason !== undefined) existing[idx].reason = reason;
    localStorage.setItem(KEYS.scans, JSON.stringify(existing));
  }
}

// ─── Admin Notifications ───────────────────────────────────────────────────

export type AdminNotificationEntry = {
  id: string;
  type: "clinic-approved" | "clinic-rejected" | "new-subscription" | "new-ticket";
  title: string;
  message: string;
  timestamp: string;
};

export function pushAdminNotification(entry: Omit<AdminNotificationEntry, "id">): void {
  try {
    const raw = localStorage.getItem("dermai_admin_notifications");
    const existing: AdminNotificationEntry[] = raw ? JSON.parse(raw) : [];
    existing.unshift({ ...entry, id: `notif-${Date.now()}` });
    localStorage.setItem("dermai_admin_notifications", JSON.stringify(existing.slice(0, 200)));
  } catch {
    // ignore
  }
}

// ─── Helpdesk Tickets ──────────────────────────────────────────────────────

export type HelpdeskTicket = {
  id: string;
  user: string;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved";
  createdAt: string; // YYYY-MM-DD
};

export function getHelpdeskTickets(): HelpdeskTicket[] {
  try {
    const raw = localStorage.getItem("dermai_helpdesk_tickets");
    return raw ? (JSON.parse(raw) as HelpdeskTicket[]) : [];
  } catch {
    return [];
  }
}

export function addHelpdeskTicket(ticket: HelpdeskTicket): void {
  const existing = getHelpdeskTickets();
  existing.unshift(ticket);
  localStorage.setItem("dermai_helpdesk_tickets", JSON.stringify(existing));
}

export function updateHelpdeskTicketStatus(
  id: string,
  status: HelpdeskTicket["status"]
): void {
  const existing = getHelpdeskTickets();
  const idx = existing.findIndex((t) => t.id === id);
  if (idx >= 0) {
    existing[idx].status = status;
    localStorage.setItem("dermai_helpdesk_tickets", JSON.stringify(existing));
  }
}

// ─── Saved Clinics ─────────────────────────────────────────────────────────

const SAVED_CLINICS_KEY = "dermai_saved_clinics";

export function getSavedClinics(email: string): number[] {
  try {
    const raw = localStorage.getItem(SAVED_CLINICS_KEY);
    const all: Record<string, number[]> = raw ? JSON.parse(raw) : {};
    return all[email] ?? [];
  } catch {
    return [];
  }
}

export function saveClinic(email: string, clinicId: number): void {
  try {
    const raw = localStorage.getItem(SAVED_CLINICS_KEY);
    const all: Record<string, number[]> = raw ? JSON.parse(raw) : {};
    const saved = all[email] ?? [];
    if (!saved.includes(clinicId)) {
      all[email] = [...saved, clinicId];
      localStorage.setItem(SAVED_CLINICS_KEY, JSON.stringify(all));
    }
  } catch {
    // ignore
  }
}

export function unsaveClinic(email: string, clinicId: number): void {
  try {
    const raw = localStorage.getItem(SAVED_CLINICS_KEY);
    const all: Record<string, number[]> = raw ? JSON.parse(raw) : {};
    const saved = all[email] ?? [];
    all[email] = saved.filter((id) => id !== clinicId);
    localStorage.setItem(SAVED_CLINICS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
