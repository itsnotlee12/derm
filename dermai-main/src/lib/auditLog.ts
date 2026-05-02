export type AuditEntry = {
  id: string;
  action: string;
  target: string;
  details: string;
  performedBy: string;
  actorType: "admin" | "patient" | "clinic";
  timestamp: string;
  type: "user" | "subscription" | "clinic" | "system" | "scan" | "appointment";
};

export function logAdminAction(
  action: string,
  target: string,
  details: string,
  type: AuditEntry["type"] = "system"
) {
  _writeLog({ action, target, details, performedBy: "Admin User", actorType: "admin", type });
}

export function logActivity(
  actorType: "patient" | "clinic",
  performedBy: string,
  action: string,
  target: string,
  details: string,
  type: AuditEntry["type"]
) {
  _writeLog({ action, target, details, performedBy, actorType, type });
}

function _writeLog(entry: Omit<AuditEntry, "id" | "timestamp">) {
  try {
    const existing: AuditEntry[] = JSON.parse(
      localStorage.getItem("dermai_audit_logs") || "[]"
    );
    existing.unshift({
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(
      "dermai_audit_logs",
      JSON.stringify(existing.slice(0, 500))
    );
  } catch {
    // silently fail
  }
}
