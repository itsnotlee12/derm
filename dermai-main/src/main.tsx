import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Seed demo clinic accounts if they don't exist
const initializeDemoDB = () => {
  const existingApps = localStorage.getItem("dermai_clinic_applications");
  if (!existingApps) {
    const demoClinics = [
      {
        id: "demo-verified",
        name: "Verified Clinic",
        licenseNumber: "VER-12345",
        ownerName: "Dr. Verified",
        email: "verified@dermai.ph",
        contactNumber: "09123456789",
        address: "123 Verified St, Manila",
        status: "verified",
        createdAt: new Date().toISOString(),
      },
      {
        id: "demo-pending",
        name: "Non-Verified Clinic",
        licenseNumber: "PEN-98765",
        ownerName: "Dr. Pending",
        email: "pending@dermai.ph",
        contactNumber: "09987654321",
        address: "456 Pending Ave, Quezon City",
        status: "pending",
        createdAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem("dermai_clinic_applications", JSON.stringify(demoClinics));
  }

  // Seed demo doctor account if not present
  try {
    const raw = localStorage.getItem("dermai_doctor_accounts");
    const all: { id: string; email: string; [key: string]: unknown }[] = raw ? JSON.parse(raw) : [];
    if (!all.some((d) => d.email === "doctor@dermai.ph")) {
      all.unshift({
        id: "doctor-demo-001",
        name: "Dr. Maria Santos",
        email: "doctor@dermai.ph",
        password: "doctor1234",
        specialization: "General Dermatology",
        clinicName: "SkinMD Dermatology Center",
      });
      localStorage.setItem("dermai_doctor_accounts", JSON.stringify(all));
    }
  } catch { /* silent */ }
};

initializeDemoDB();

const basename = import.meta.env.BASE_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "not-configured";

const AppTree = (
  <BrowserRouter basename={basename}>
    <App />
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {AppTree}
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
