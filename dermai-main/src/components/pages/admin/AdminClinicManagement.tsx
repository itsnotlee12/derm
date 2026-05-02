import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, XCircle, Eye } from "lucide-react";

type ClinicStatus = "pending" | "verified" | "rejected";

interface ClinicApplication {
  id: number | string;
  logo?: string;
  name: string;
  location: string;
  address?: string;
  email?: string;
  phone?: string;
  operatingDays?: string;
  openTime?: string;
  closeTime?: string;
  doctor?: string;
  specialization?: string;
  servicesOffered?: string;
  description?: string;
  prcLicense?: string;
  dateApplied: string;
  status: ClinicStatus;
  rejectionReason?: string;
}

type AdminNotification = {
  id: string;
  type: "clinic-approved" | "clinic-rejected";
  clinicName: string;
  message: string;
  timestamp: string;
};

const initialClinicApplications: ClinicApplication[] = [
  {
    id: 1,
    name: "Cebu Skin Institute",
    location: "Mango Ave, Cebu City",
    dateApplied: "Jan 10, 2025",
    status: "verified",
    doctor: "Dr. Ana Reyes",
    prcLicense: "0012345",
    phone: "(032) 234-5678",
  },
  {
    id: 2,
    name: "SkinMD Dermatology Center",
    location: "AS Fortuna, Mandaue City",
    dateApplied: "Jan 12, 2025",
    status: "pending",
    doctor: "Dr. Jose Garcia",
    prcLicense: "0054321",
    phone: "(032) 345-6789",
  },
  {
    id: 3,
    name: "DermaPlus Clinic",
    location: "Osmeña Blvd, Cebu City",
    dateApplied: "Jan 13, 2025",
    status: "pending",
    doctor: "Dr. Maria Santos",
    prcLicense: "0098765",
    phone: "(032) 456-7890",
  },
  {
    id: 4,
    name: "Island Skin Care",
    location: "Lapu-Lapu City",
    address: "123 Pusok Road, Lapu-Lapu City, Cebu",
    email: "islandskincare@example.com",
    phone: "(032) 678-9012",
    doctor: "Dr. Pedro Cruz",
    specialization: "General Dermatology",
    servicesOffered: "Acne Treatment, Whitening, Consultation",
    description: "A community-based skin clinic serving the Lapu-Lapu area.",
    prcLicense: "0011111",
    operatingDays: "Mon-Fri",
    openTime: "09:00",
    closeTime: "17:00",
    dateApplied: "Jan 8, 2025",
    status: "rejected",
    rejectionReason: "Submitted PRC license number could not be verified with the PRC online registry. Please resubmit with a valid and current license.",
  },
  {
    id: 5,
    name: "SkinVita Derma Clinic",
    location: "Talisay City",
    dateApplied: "Jan 14, 2025",
    status: "verified",
    doctor: "Dr. Liza Tan",
    prcLicense: "0022222",
    phone: "(032) 789-0123",
  },
];

type StatusType = "all" | "pending" | "verified" | "rejected";

const statusBadge: Record<string, string> = {
  verified: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminClinicManagement() {
  const [applications, setApplications] = useState<ClinicApplication[]>(() => {
    try {
      const saved = localStorage.getItem("dermai_clinic_applications");
      if (!saved) return initialClinicApplications;
      const parsed = JSON.parse(saved) as ClinicApplication[];
      // Merge: add any seed entries missing from storage (by id), and patch stale id-4
      const savedIds = new Set(parsed.map((a) => a.id));
      const missing = initialClinicApplications.filter((s) => !savedIds.has(s.id));
      const patched = parsed.map((app) =>
        app.id === 4 && app.status === "rejected" && !app.rejectionReason
          ? { ...app, ...initialClinicApplications.find((s) => s.id === 4) }
          : app
      );
      return [...patched, ...missing];
    } catch {
      return initialClinicApplications;
    }
  });
  const [activeTab, setActiveTab] = useState<StatusType>("all");
  const [reviewModal, setReviewModal] = useState<number | string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const persistApplications = (next: ClinicApplication[]) => {
    setApplications(next);
    localStorage.setItem("dermai_clinic_applications", JSON.stringify(next));
  };

  const pushNotification = (n: Omit<AdminNotification, "id" | "timestamp">) => {
    const notification: AdminNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...n,
    };

    try {
      const existing = localStorage.getItem("dermai_admin_notifications");
      const parsed = existing ? (JSON.parse(existing) as AdminNotification[]) : [];
      localStorage.setItem("dermai_admin_notifications", JSON.stringify([notification, ...parsed]));
    } catch {
      localStorage.setItem("dermai_admin_notifications", JSON.stringify([notification]));
    }
  };

  const approveClinic = (id: number | string) => {
    const target = applications.find((a) => a.id === id);
    if (!target) return;

    const next = applications.map((app) =>
      app.id === id
        ? {
            ...app,
            status: "verified" as ClinicStatus,
            rejectionReason: "",
          }
        : app
    );

    persistApplications(next);
    pushNotification({
      type: "clinic-approved",
      clinicName: target.name,
      message: `${target.name} has been approved and marked as verified.`,
    });
  };

  const rejectClinic = (id: number | string) => {
    const target = applications.find((a) => a.id === id);
    if (!target) return;

    const reason = rejectReason.trim();
    const next = applications.map((app) =>
      app.id === id
        ? {
            ...app,
            status: "rejected" as ClinicStatus,
            rejectionReason: reason || "Incomplete or invalid requirements.",
          }
        : app
    );

    persistApplications(next);
    pushNotification({
      type: "clinic-rejected",
      clinicName: target.name,
      message: `${target.name} has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
    });
  };

  const filtered = applications.filter(
    (c) => activeTab === "all" || c.status === activeTab
  );

  const modalClinic = applications.find((c) => c.id === reviewModal);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Clinic Management
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Review and manage clinic applications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "verified", "rejected"] as StatusType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all active:scale-[0.96]",
              activeTab === tab
                ? "bg-magenta-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Clinic Name</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Location</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date Applied</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((clinic) => (
                <tr key={clinic.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{clinic.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{clinic.location}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">{clinic.dateApplied}</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize", statusBadge[clinic.status])}>
                      {clinic.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setReviewModal(clinic.id);
                          setRejectReason(clinic.rejectionReason || "");
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-magenta-50 text-magenta-600 text-xs font-medium hover:bg-magenta-100 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Review
                      </button>
                      {clinic.status === "pending" && (
                        <>
                          <button
                            onClick={() => approveClinic(clinic.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setReviewModal(clinic.id);
                              setRejectReason("");
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </>
                      )}
                      {clinic.status === "rejected" && (
                        <button
                          onClick={() => approveClinic(clinic.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Set to Verified
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-400 text-sm">
            No clinics found in this category
          </div>
        )}
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModal && modalClinic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setReviewModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[24px] p-6 sm:p-8 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-gray-900">
                  Clinic Review
                </h2>
                <button
                  onClick={() => setReviewModal(null)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex flex-col items-center mb-6">
                  {modalClinic.logo ? (
                    <img src={modalClinic.logo} alt="Clinic Logo" className="w-24 h-24 object-cover rounded-full border shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs text-center border shadow-sm">
                      No Logo
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status</span>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-semibold capitalize", statusBadge[modalClinic.status])}>
                    {modalClinic.status}
                  </span>
                </div>
                {[
                  { label: "Clinic Name", value: modalClinic.name },
                  { label: "Location", value: modalClinic.location },
                  { label: "Address", value: modalClinic.address || "123 Verified St, Manila" },
                  { label: "Email", value: modalClinic.email || "verified@dermai.ph" },
                  { label: "Contact / Telephone", value: modalClinic.phone || "(02) 8123-4567" },
                  { label: "Operating Days", value: modalClinic.operatingDays || "Monday - Saturday" },
                  { label: "Opening Time", value: modalClinic.openTime || "09:00 AM" },
                  { label: "Closing Time", value: modalClinic.closeTime || "06:00 PM" },
                  { label: "Doctor in Charge", value: modalClinic.doctor || "Dr. Maria Cruz" },
                  { label: "Specialization", value: modalClinic.specialization || "Dermatology, Aesthetics" },
                  { label: "Services Offered", value: modalClinic.servicesOffered || "Consultation, Skin Treatment, Laser Therapy" },
                  { label: "Description", value: modalClinic.description || "A modern clinic specializing in skin health and beauty." },
                  { label: "PRC License #", value: modalClinic.prcLicense || "1234567" },
                  { label: "Date Applied", value: modalClinic.dateApplied },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Document Previews */}
              <div className="mb-6">
                <p className="text-xs text-gray-400 mb-2">Uploaded Documents</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Business Permit", "PRC License"].map((doc) => (
                    <div key={doc} className="bg-gray-50 rounded-xl p-4 text-center">
                      <span className="text-2xl mb-1 block">📄</span>
                      <p className="text-xs text-gray-600 font-medium">{doc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Reason */}
              {modalClinic.status === "pending" && (
                <div className="mb-6">
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Rejection Reason (optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason if rejecting..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-magenta-500 resize-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              {modalClinic.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      approveClinic(modalClinic.id);
                      setReviewModal(null);
                    }}
                    className="flex-1 py-3 rounded-full bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors active:scale-[0.96]"
                  >
                    Approve Clinic
                  </button>
                  <button
                    onClick={() => {
                      rejectClinic(modalClinic.id);
                      setReviewModal(null);
                    }}
                    className="flex-1 py-3 rounded-full bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors active:scale-[0.96]"
                  >
                    Reject Clinic
                  </button>
                </div>
              )}

              {modalClinic.status !== "pending" && (
                <div className="space-y-3">
                  {modalClinic.status === "rejected" && (
                    <>
                      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-700">
                        <strong>Reason:</strong> {modalClinic.rejectionReason || "No reason provided."}
                      </div>
                      <button
                        onClick={() => {
                          approveClinic(modalClinic.id);
                          setReviewModal(null);
                        }}
                        className="w-full py-3 rounded-full bg-green-500 text-white font-semibold text-sm hover:bg-green-600 transition-colors"
                      >
                        Set to Verified
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setReviewModal(null)}
                    className="w-full py-3 rounded-full bg-magenta-500 text-white font-semibold text-sm hover:bg-magenta-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
