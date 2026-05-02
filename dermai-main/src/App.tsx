import { Suspense } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdminLayout from "@/components/layout/AdminLayout";
import ClinicLayout from "@/components/layout/ClinicLayout";
import UserLayout from "@/components/layout/UserLayout";
import HomePage from "@/components/pages/user/HomePage";
import ScanSkinPage from "@/components/pages/user/ScanSkinPage";
import FindClinicsPage from "@/components/pages/user/FindClinicsPage";
import ForClinicsPage from "@/components/pages/clinic/ForClinicsPage";
import ClinicRegisterPage from "@/components/pages/clinic/ClinicRegisterPage";
import LoginPage from "@/components/pages/user/LoginPage";
import RegisterPage from "@/components/pages/user/RegisterPage";
import SubscriptionChoicePage from "@/components/pages/user/SubscriptionChoicePage";
import SubscriptionUpgradePage from "@/components/pages/user/SubscriptionUpgradePage";
import UserDashboard from "@/components/pages/user/UserDashboard";
import PersonalInformationPage from "@/components/pages/user/PersonalInformationPage";
import SkinHistoryPage from "@/components/pages/user/SkinHistoryPage";
import AppointmentPage from "@/components/pages/user/AppointmentPage";
import SubscriptionStatusPage from "@/components/pages/user/SubscriptionStatusPage";
import AppointmentStatusPage from "@/components/pages/user/AppointmentStatusPage";
import ClinicDashboardPage from "@/components/pages/clinic/ClinicDashboardPage";
import ClinicAppointmentsPage from "@/components/pages/clinic/ClinicAppointmentsPage";
import ClinicPatientsPage from "@/components/pages/clinic/ClinicPatientsPage";
import ClinicSettingsPage from "@/components/pages/clinic/ClinicSettingsPage";
import AdminDashboardPage from "@/components/pages/admin/AdminDashboardPage";
import AdminClinicManagement from "@/components/pages/admin/AdminClinicManagement";
import AdminReportsPage from "@/components/pages/admin/AdminReportsPage";
import AdminNotificationsPage from "@/components/pages/admin/AdminNotificationsPage";
import AdminSubscriptionManagement from "@/components/pages/admin/AdminSubscriptionManagement";
import AdminPlanManagement from "@/components/pages/admin/AdminPlanManagement";
import AdminAiAnalysisManagement from "@/components/pages/admin/AdminAiAnalysisManagement";
import AdminUserManagement from "@/components/pages/admin/AdminUserManagement";
import AccountSettingsPage from "@/components/pages/user/settings/AccountSettingsPage";
import AdminAuditLogsPage from "@/components/pages/admin/AdminAuditLogsPage";
import AdminSystemSettingsPage from "@/components/pages/admin/AdminSystemSettingsPage";
import AdminHelpdeskPage from "@/components/pages/admin/AdminHelpdeskPage";
import HelpPage from "@/components/pages/user/settings/HelpPage";
import BillingSettingsPage from "@/components/pages/user/settings/BillingSettingsPage";
import DoctorLayout from "@/components/layout/DoctorLayout";
import DoctorDashboardPage from "@/components/pages/doctor/DoctorDashboardPage";
import DoctorAppointmentsPage from "@/components/pages/doctor/DoctorAppointmentsPage";
import DoctorScheduledAppointmentsPage from "@/components/pages/doctor/DoctorScheduledAppointmentsPage";
import DoctorPatientHistoryPage from "@/components/pages/doctor/DoctorPatientHistoryPage";
import ClinicDoctorsPage from "@/components/pages/clinic/ClinicDoctorsPage";

function App() {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith("/admin");
  const isDashboardPage =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/appointment") ||
    location.pathname.startsWith("/user/upgrade");
  const isClinicPage =
    location.pathname === "/clinic" || location.pathname.startsWith("/clinic/");
  const isDoctorPage =
    location.pathname === "/doctor" || location.pathname.startsWith("/doctor/");

  return (
    <Suspense fallback={<p>Loading...</p>}>
      {isDoctorPage ? (
        <DoctorLayout>
          <Routes>
            <Route path="/doctor" element={<DoctorDashboardPage />} />
            <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
            <Route path="/doctor/scheduled" element={<DoctorScheduledAppointmentsPage />} />
            <Route path="/doctor/history" element={<DoctorPatientHistoryPage />} />
            <Route path="*" element={<Navigate to="/doctor" replace />} />
          </Routes>
        </DoctorLayout>
      ) : isAdminPage ? (
        <AdminLayout>          <Routes>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/clinics" element={<AdminClinicManagement />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptionManagement />} />
            <Route path="/admin/plans" element={<AdminPlanManagement />} />
            <Route path="/admin/ai-analyses" element={<AdminAiAnalysisManagement />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="/admin/helpdesk" element={<AdminHelpdeskPage />} />
            <Route path="/admin/settings" element={<AdminSystemSettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </AdminLayout>
      ) : isClinicPage ? (
        <ClinicLayout>
          <Routes>
            <Route path="/clinic" element={<ClinicDashboardPage />} />
            <Route path="/clinic/appointments" element={<ClinicAppointmentsPage />} />
            <Route path="/clinic/patients" element={<ClinicPatientsPage />} />
            <Route path="/clinic/settings" element={<ClinicSettingsPage />} />
            <Route path="/clinic/doctors" element={<ClinicDoctorsPage />} />
            <Route path="*" element={<Navigate to="/clinic" replace />} />
          </Routes>
          </ClinicLayout>
          ) : isDashboardPage ? (
            <UserLayout>
              <Routes>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/dashboard/profile" element={<PersonalInformationPage />} />
                <Route path="/dashboard/clinics" element={<FindClinicsPage />} />
                <Route path="/dashboard/appointment/physical" element={<AppointmentPage defaultType="face-to-face" />} />
                <Route path="/dashboard/upgrade" element={<SubscriptionUpgradePage />} />
                <Route path="/dashboard/subscription-status" element={<SubscriptionStatusPage />} />
                <Route path="/dashboard/history" element={<SkinHistoryPage />} />
                <Route path="/dashboard/appointment-status" element={<AppointmentStatusPage />} />
                <Route path="/dashboard/settings/account" element={<AccountSettingsPage />} />
                <Route path="/dashboard/settings/help" element={<HelpPage />} />
                <Route path="/dashboard/settings/billing" element={<BillingSettingsPage />} />
                <Route path="/dashboard/scan" element={<ScanSkinPage />} />
                <Route path="/appointment" element={<AppointmentPage />} />
                <Route path="/user/upgrade" element={<SubscriptionUpgradePage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </UserLayout>
          ) : (
        <>
          {!isAuthPage && !isDashboardPage && !isClinicPage && <Navbar />}
          <Routes>
            <Route
              path="/"
              element={<HomePage />}
            />
            <Route path="/clinics" element={<FindClinicsPage />} />
            <Route path="/for-clinics" element={<ForClinicsPage />} />
            <Route
              path="/for-clinics/register"
              element={<ClinicRegisterPage />}
            />
            <Route path="/scan" element={<ScanSkinPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/subscription" element={<SubscriptionChoicePage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {!isAuthPage && !isDashboardPage && !isClinicPage && <Footer />}
        </>
      )}
    </Suspense>
  );
}

export default App;





