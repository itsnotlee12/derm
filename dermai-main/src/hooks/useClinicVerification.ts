import { useMemo } from "react";

type VerificationStatus = "pending" | "verified" | "rejected";

type ClinicApp = {
  id: string | number;
  name?: string;
  email?: string;
  status: VerificationStatus;
};

export function useClinicVerification(): { status: VerificationStatus; clinicName: string } {
  const clinicName = localStorage.getItem("dermai_clinic_name") || "";
  const currentEmail = localStorage.getItem("dermai_current_user_email") || "";

  const status = useMemo<VerificationStatus>(() => {
    try {
      const raw = localStorage.getItem("dermai_clinic_applications");
      const parsed: ClinicApp[] = raw ? JSON.parse(raw) : [];

      // Match by email first (most reliable), then by name
      const match =
        parsed.find((a) => a.email?.toLowerCase() === currentEmail.toLowerCase()) ||
        parsed.find((a) => a.name?.toLowerCase().trim() === clinicName.toLowerCase().trim());

      return match?.status ?? "pending";
    } catch {
      return "pending";
    }
  }, [clinicName, currentEmail]);

  return { status, clinicName };
}
