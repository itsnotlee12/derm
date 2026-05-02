import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Appointment {
  clinicName: string;
  doctor: string;
  date: string;
  time: string;
  consultationType: "Physical";
  status: "Pending" | "Scheduled" | "Rejected" | "Completed" | "Cancelled";
}

const STEPS = ["Request Sent", "Clinic Review", "Scheduled", "Completed"];

function getStepIndex(status: Appointment["status"]): number {
  if (status === "Completed") return 3;
  if (status === "Scheduled") return 2;
  if (status === "Pending") return 1;
  return 0;
}

function StatusTracker({ app }: { app: Appointment }) {
  const isCancelled = app.status === "Cancelled" || app.status === "Rejected";
  const activeStep = isCancelled ? -1 : getStepIndex(app.status);

  return (
    <div className="mt-4 rounded-2xl border border-magenta-100 bg-gradient-to-r from-magenta-50 via-white to-rose-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-magenta-700 uppercase tracking-wider">Appointment Progress</p>
        <span
          className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${
            isCancelled
              ? "bg-red-100 text-red-700"
              : app.status === "Completed"
              ? "bg-green-100 text-green-700"
              : app.status === "Scheduled"
              ? "bg-blue-100 text-blue-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {app.status}
        </span>
      </div>
      {isCancelled ? (
        <p className="text-xs text-red-600 font-medium">
          This appointment was {app.status.toLowerCase()}.
          {app.status === "Rejected" ? " You may book with another clinic anytime." : ""}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {STEPS.map((step, i) => (
              <div
                key={step}
                className={`rounded-xl border px-2 py-2 text-center text-[11px] font-semibold transition-all ${
                  i <= activeStep
                    ? "border-magenta-300 bg-white text-magenta-700 shadow-sm"
                    : "border-gray-200 bg-gray-50 text-gray-400"
                }`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 mb-0.5 align-middle ${
                  i <= activeStep ? "bg-magenta-400" : "bg-gray-300"
                }`} />
                {step}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            {app.status === "Completed"
              ? `Your appointment with ${app.clinicName} has been completed.`
              : app.status === "Scheduled"
              ? `Your appointment with ${app.clinicName} is scheduled on ${app.date} at ${app.time}.`
              : `Your request to ${app.clinicName} is pending clinic review.`}
          </p>
        </>
      )}
    </div>
  );
}

const SEED_APPOINTMENTS: Appointment[] = [
  {
    clinicName: "Cebu Skin Institute",
    doctor: "Dr. Ana Reyes",
    date: "2026-04-10",
    time: "10:00 AM",
    consultationType: "Physical",
    status: "Scheduled",
  },
  {
    clinicName: "SkinMD Dermatology Center",
    doctor: "Dr. Jose Garcia",
    date: "2026-04-15",
    time: "02:30 PM",
    consultationType: "Physical",
    status: "Pending",
  },
  {
    clinicName: "Cebu Skin Institute",
    doctor: "Dr. Ana Reyes",
    date: "2026-03-20",
    time: "09:00 AM",
    consultationType: "Physical",
    status: "Completed",
  },
  {
    clinicName: "Island Skin Care",
    doctor: "Dr. Liza Marcos",
    date: "2026-03-05",
    time: "11:00 AM",
    consultationType: "Physical",
    status: "Rejected",
  },
];

const AppointmentStatusPage = () => {
  const currentEmail = localStorage.getItem("dermai_current_user_email") || "";

  const allAppointments = useMemo<Appointment[]>(() => {
    try {
      const raw = localStorage.getItem("dermai_appointments");
      if (raw) {
        const records = JSON.parse(raw) as Array<{
          clinicName: string;
          patientEmail?: string;
          consultationType: "Physical";
          date: string;
          time: string;
          status: "pending" | "scheduled" | "rejected" | "accepted";
          doctor?: string;
        }>;
        const userRecords = records.filter(
          (r) => !currentEmail || r.patientEmail === currentEmail
        );
        if (userRecords.length > 0) {
          return userRecords.map((r) => ({
            clinicName: r.clinicName,
            doctor: r.doctor || "Assigned Doctor",
            date: r.date,
            time: r.time,
            consultationType: r.consultationType,
            status: (
              r.status === "scheduled" || r.status === "accepted" ? "Scheduled"
              : r.status === "rejected" ? "Rejected"
              : "Pending"
            ) as Appointment["status"],
          }));
        }
      }
    } catch {
      // fall through to seed
    }
    return SEED_APPOINTMENTS;
  }, [currentEmail]);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingAppointments = allAppointments.filter(
    (a) => a.status !== "Rejected" && a.date >= today
  );
  const pastAppointments = allAppointments.filter(
    (a) => a.status === "Rejected" || a.date < today
  );

  const renderAppointmentCards = (apps: Appointment[]) => {
    if (apps.length === 0) {
      return <p className="text-center text-gray-500 py-6">No appointments to display.</p>;
    }

    return (
      <div className="space-y-4">
        {apps.map((app, index) => (
          <div key={index} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Clinic Name</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Consultation Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>{app.clinicName}</TableCell>
                    <TableCell>{app.doctor}</TableCell>
                    <TableCell>{app.date}</TableCell>
                    <TableCell>{app.time}</TableCell>
                    <TableCell>{app.consultationType}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <StatusTracker app={app} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">Appointment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-magenta-500 data-[state=active]:text-white">Upcoming</TabsTrigger>
              <TabsTrigger value="past" className="data-[state=active]:bg-magenta-500 data-[state=active]:text-white">Past</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
              {renderAppointmentCards(upcomingAppointments)}
            </TabsContent>
            <TabsContent value="past" className="mt-4">
              {renderAppointmentCards(pastAppointments)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentStatusPage;
