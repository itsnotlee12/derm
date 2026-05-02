import {
  ChevronDown,
  ChevronRight,
  FileText,
  Heart,
  Plus,
  Search,
  Users,
  GripVertical,
  Filter,
  Bell,
  Eye,
  Edit,
  ClipboardList,
  UserPlus,
  UserCheck,
  HeartPulse,
  X,
  AlertCircle,
  Lock,
  Upload,
  Download,
  Trash2,
  Paperclip,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

type MedicalRecord = {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string;
  uploadedAt: string;
};

type Patient = {
  id: number;
  name: string;
  age: number;
  gender: string;
  condition: string;
  lastVisit: string;
  status: string;
  avatar: string;
  details: string;
  medicalRecords?: MedicalRecord[];
};
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useClinicVerification } from "@/hooks/useClinicVerification";

const initialPatients = [
  {
    id: 1,
    name: "Maria Santos",
    age: 27,
    gender: "Female",
    condition: "Skin Rash",
    lastVisit: "Mar 30, 2026",
    status: "Scheduled",
    avatar: "/images/avatars/a1.jpg",
    details: "07 Lrt old",
  },
  {
    id: 2,
    name: "Juan Cruz",
    age: 31,
    gender: "Male",
    condition: "Acne",
    lastVisit: "Mar 28, 2026",
    status: "Done",
    avatar: "/images/avatars/a2.jpg",
    details: "31 Iane",
  },
  {
    id: 3,
    name: "Ana Reyes",
    age: 24,
    gender: "Female",
    condition: "Pigmentation",
    lastVisit: "Mar 27, 2026",
    status: "Scheduled",
    avatar: "/images/avatars/a3.jpg",
    details: "32 Pesaces",
  },
  {
    id: 4,
    name: "Carlos Bautista",
    age: 40,
    gender: "Male",
    condition: "Eczema",
    lastVisit: "Mar 28, 2026",
    status: "Done",
    avatar: "/images/avatars/a4.jpg",
    details: "61 Jam",
  },
  {
    id: 5,
    name: "Diana Lim",
    age: 29,
    gender: "Female",
    condition: "Psoriasis",
    lastVisit: "Mar 25, 2026",
    status: "Scheduled",
    avatar: "/images/avatars/a5.jpg",
    details: "33 Feoodd",
  },
  {
    id: 6,
    name: "Jason Wilson",
    age: 37,
    gender: "Male",
    condition: "Rosacea",
    lastVisit: "Mar 23, 2026",
    status: "Scheduled",
    avatar: "/images/avatars/a6.jpg",
    details: "57 Nane",
  },
  {
    id: 7,
    name: "Natalie Carter",
    age: 33,
    gender: "Female",
    condition: "Melasma",
    lastVisit: "Mar 22, 2026",
    status: "Done",
    avatar: "/images/avatars/a7.jpg",
    details: "38 Fasaes",
  },
  {
    id: 8,
    name: "Thomas Perez",
    age: 48,
    gender: "Male",
    condition: "Atopic Dermatitis",
    lastVisit: "Mar 21, 2026",
    status: "Scheduled",
    avatar: "/images/avatars/a8.jpg",
    details: "49 Tane",
  },
  {
    id: 9,
    name: "Rachel Evans",
    age: 38,
    gender: "Female",
    condition: "Hair Loss",
    lastVisit: "Mar 18, 2026",
    status: "Done",
    avatar: "/images/avatars/a9.jpg",
    details: "38 Eenaes",
  },
  {
    id: 10,
    name: "Michael Adams",
    age: 35,
    gender: "Male",
    condition: "Urticaria",
    lastVisit: "Mar 17, 2026",
    status: "Scheduled",
    avatar: "/images/avatars/a10.jpg",
    details: "32 Mole",
  },
];

const statusColors = {
  Active: "bg-green-100 text-green-800",
  "Follow-up": "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
  Monitoring: "bg-yellow-100 text-yellow-800",
  Scheduled: "bg-blue-100 text-blue-800",
  Done: "bg-green-100 text-green-800",
};

const StatCard = ({ icon, title, value, change, changeType, iconBgColor }) => (
  <div className="bg-white p-4 rounded-2xl border border-magenta-100 flex-1 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBgColor)}>
        {icon}
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{title}</p>
    </div>
    <p className={cn("text-xs mt-1", changeType === "increase" ? "text-green-600" : "text-red-600")}>
      {change}
    </p>
  </div>
);

export default function ClinicPatientsPage() {
  const { status: verificationStatus } = useClinicVerification();
  const [patients, setPatients] = useState(() => {
    try {
      const saved = localStorage.getItem("dermai_patients");
      const data: any[] = saved ? JSON.parse(saved) : initialPatients;
      // Migrate old status values to new ones
      const statusMap: Record<string, string> = {
        Active: "Scheduled",
        "Follow-up": "Done",
        Critical: "Done",
        Monitoring: "Scheduled",
      };
      return data.map((p: any) =>
        statusMap[p.status] ? { ...p, status: statusMap[p.status] } : p
      );
    } catch {
      return initialPatients;
    }
  });

  const clinicName = localStorage.getItem("dermai_clinic_name") || "SkinMD Dermatology Center";

  const isPending = verificationStatus !== "verified";

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const patientsPerPage = 10;

  // Add/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Female",
    condition: "",
    lastVisit: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status: "Active",
    details: "",
    avatar: "/images/avatars/a1.jpg"
  });

  useEffect(() => {
    localStorage.setItem("dermai_patients", JSON.stringify(patients));
  }, [patients]);

  // Derived metrics
  const totalPatients = patients.length;
  const newPatients = patients.filter((p: any) => p.status === "Scheduled").length;
  const followUpCases = patients.filter((p: any) => p.status === "Done").length;
  const criticalCases = 0;

  const handleOpenAdd = () => {
    setEditingPatient(null);
    setFormData({
      name: "",
      age: "",
      gender: "Female",
      condition: "",
      lastVisit: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "Scheduled",
      details: "",
      avatar: `/images/avatars/a${Math.floor(Math.random() * 10) + 1}.jpg`
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (patient: any) => {
    setViewingPatient(patient);
  };

  const handleOpenEdit = (patient: any) => {
    setEditingPatient(patient.id);
    setFormData({ ...patient });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPatient) {
      setPatients(patients.map((p: any) => (p.id === editingPatient ? { ...p, ...formData } : p)));
    } else {
      const newId = patients.length > 0 ? Math.max(...patients.map((p: any) => p.id)) + 1 : 1;
      setPatients([{ id: newId, ...formData }, ...patients]);
    }
    setIsModalOpen(false);
  };

  const handleUploadRecord = (patientId: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum allowed size is 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const record: MedicalRecord = {
        id: `rec-${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result as string,
        uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
      setPatients((prev: any[]) =>
        prev.map((p: any) =>
          p.id === patientId
            ? { ...p, medicalRecords: [...(p.medicalRecords || []), record] }
            : p
        )
      );
      setViewingPatient((prev: any) =>
        prev ? { ...prev, medicalRecords: [...(prev.medicalRecords || []), record] } : prev
      );
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteRecord = (patientId: number, recordId: string) => {
    setPatients((prev: any[]) =>
      prev.map((p: any) =>
        p.id === patientId
          ? { ...p, medicalRecords: (p.medicalRecords || []).filter((r: MedicalRecord) => r.id !== recordId) }
          : p
      )
    );
    setViewingPatient((prev: any) =>
      prev
        ? { ...prev, medicalRecords: (prev.medicalRecords || []).filter((r: MedicalRecord) => r.id !== recordId) }
        : prev
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openOrDownload = (record: MedicalRecord) => {
    const link = document.createElement("a");
    link.href = record.data;
    link.download = record.name;
    link.click();
  };

  // Add search filtering functionality
  const filteredPatients = patients.filter((patient) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (patient.name && patient.name.toLowerCase().includes(query)) ||
      (patient.condition && patient.condition.toLowerCase().includes(query)) ||
      (patient.status && patient.status.toLowerCase().includes(query))
    );
  });

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  if (verificationStatus !== "verified") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Required</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          {verificationStatus === "rejected"
            ? "Your clinic registration was rejected. Please update your profile and contact admin."
            : "Your clinic is pending admin verification. Patient management will be available once approved."}
        </p>
        <Link
          to="/clinic/settings"
          className="px-5 py-2 rounded-xl bg-[#c0166a] text-white text-sm font-semibold hover:bg-[#a01259] transition-colors"
        >
          {verificationStatus === "rejected" ? "Update Profile" : "View Profile"}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#FCFAFB] min-h-screen font-sans">


      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Clinic Patients</h1>
        <p className="text-sm text-gray-500">Manage and review all clinic patients</p>
      </div>

      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-700 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Account Pending Verification</p>
            <p>Your clinic application is currently being reviewed. You cannot add or manage patients until verified.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-magenta-600" />}
          title="Total Patients"
          value={totalPatients}
          change="+2% vs this month"
          changeType="increase"
          iconBgColor="bg-magenta-100"
        />
        <StatCard
          icon={<UserPlus className="w-5 h-5 text-magenta-600" />}
          title="Scheduled"
          value={newPatients}
          change="+12 vs last month"
          changeType="increase"
          iconBgColor="bg-magenta-100"
        />
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-magenta-600" />}
          title="Done"
          value={followUpCases}
          change="+8% vs last month"
          changeType="increase"
          iconBgColor="bg-magenta-100"
        />
        <StatCard
          icon={<HeartPulse className="w-5 h-5 text-magenta-600" />}
          title="Critical Cases"
          value={criticalCases}
          change="+33% vs last month"
          changeType="increase"
          iconBgColor="bg-magenta-100"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Clinic Patients</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search patients..."
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-magenta-500"
              />
            </div>
            <button disabled={isPending} onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-magenta-50 text-magenta-700 border border-magenta-200 hover:bg-magenta-100 disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="w-5 h-5" />
              Add Patient
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
              <tr>
                <th scope="col" className="p-4">
                  <div className="flex items-center">
                    <input id="checkbox-all" type="checkbox" className="w-4 h-4 text-magenta-600 bg-gray-100 border-gray-300 rounded focus:ring-magenta-500" />
                    <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  Patient
                </th>
                <th scope="col" className="px-6 py-3">Age</th>
                <th scope="col" className="px-6 py-3">Gender</th>
                <th scope="col" className="px-6 py-3">Condition</th>
                <th scope="col" className="px-6 py-3">Last Visit</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentPatients.map((patient) => (
                <tr key={patient.id} className="bg-white border-b hover:bg-gray-50/50">
                  <td className="w-4 p-4">
                    <div className="flex items-center">
                      <input id={`checkbox-table-${patient.id}`} type="checkbox" className="w-4 h-4 text-magenta-600 bg-gray-100 border-gray-300 rounded focus:ring-magenta-500" />
                      <label htmlFor={`checkbox-table-${patient.id}`} className="sr-only">checkbox</label>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img className="w-10 h-10 rounded-full" src={patient.avatar} alt={`${patient.name} avatar`} />
                      <div>
                        <div className="font-semibold text-gray-900">{patient.name}</div>
                        <div className="text-xs text-gray-500">{patient.details}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{patient.age}</td>
                  <td className="px-6 py-4">{patient.gender}</td>
                  <td className="px-6 py-4">{patient.condition}</td>
                  <td className="px-6 py-4">{patient.lastVisit}</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center", statusColors[patient.status])}>
                      <span className="w-2 h-2 mr-2 rounded-full bg-current"></span>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenView(patient)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold">
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button disabled={isPending} onClick={() => handleOpenEdit(patient)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <nav className="flex items-center justify-between p-4" aria-label="Table navigation">
          <span className="text-sm font-normal text-gray-500">
            Showing <span className="font-semibold text-gray-900">{filteredPatients.length === 0 ? 0 : indexOfFirstPatient + 1}-{Math.min(indexOfLastPatient, filteredPatients.length)}</span> of <span className="font-semibold text-gray-900">{filteredPatients.length}</span>
          </span>
          <ul className="inline-flex items-center -space-x-px text-sm h-8">
            <li>
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="flex items-center justify-center px-3 h-8 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50">
                Previous
              </button>
            </li>
            {[...Array(totalPages).keys()].map(number => (
              <li key={number + 1}>
                <button onClick={() => paginate(number + 1)} className={cn("flex items-center justify-center px-3 h-8 leading-tight border border-gray-300", currentPage === number + 1 ? "text-white bg-magenta-600 border-magenta-600" : "text-gray-500 bg-white hover:bg-gray-100")}>
                  {number + 1}
                </button>
              </li>
            ))}
            <li>
              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center justify-center px-3 h-8 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50">
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Full Name</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500" placeholder="e.g. Maria Santos" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Age</label>
                  <input required type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500" placeholder="Age" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Gender</label>
                  <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500 appearance-none bg-white">
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Condition</label>
                  <input required type="text" value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500" placeholder="e.g. Skin Rash" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500 appearance-none bg-white">
                    <option value="Scheduled">Scheduled</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Details (Optional)</label>
                  <input type="text" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500" placeholder="e.g. 07 Lrt old" />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-1">Last Visit</label>
                  <input 
                    required 
                    type="date" 
                    value={(() => {
                      try {
                        const d = new Date(formData.lastVisit);
                        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
                      } catch { return ''; }
                    })()} 
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const [year, month, day] = e.target.value.split('-');
                      const d = new Date(Number(year), Number(month) - 1, Number(day));
                      setFormData({
                        ...formData, 
                        lastVisit: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      });
                    }} 
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-magenta-500" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end items-center mt-6">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-magenta-600 hover:bg-magenta-700 rounded-lg">
                    {editingPatient ? 'Save Changes' : 'Add Patient'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {viewingPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Patient Details</h2>
              <button onClick={() => setViewingPatient(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Avatar + name */}
              <div className="flex items-center gap-4">
                <img
                  className="w-16 h-16 rounded-full border-2 border-magenta-100 object-cover"
                  src={viewingPatient.avatar}
                  alt={viewingPatient.name}
                />
                <div>
                  <p className="text-lg font-bold text-gray-900">{viewingPatient.name}</p>
                  <p className="text-sm text-gray-500">{viewingPatient.details}</p>
                  <span className={cn("mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold", statusColors[viewingPatient.status])}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {viewingPatient.status}
                  </span>
                </div>
              </div>
              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Age", value: viewingPatient.age },
                  { label: "Gender", value: viewingPatient.gender },
                  { label: "Condition", value: viewingPatient.condition },
                  { label: "Last Visit", value: viewingPatient.lastVisit },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="text-sm font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Medical Records */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-magenta-500" />
                    <h3 className="text-sm font-bold text-gray-900">Medical Records</h3>
                    {(viewingPatient.medicalRecords?.length ?? 0) > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-magenta-100 text-magenta-600 text-[10px] font-bold">
                        {viewingPatient.medicalRecords.length}
                      </span>
                    )}
                  </div>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-magenta-50 border border-magenta-200 text-magenta-700 text-xs font-semibold cursor-pointer hover:bg-magenta-100 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadRecord(viewingPatient.id, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>

                {(!viewingPatient.medicalRecords || viewingPatient.medicalRecords.length === 0) ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No medical records uploaded yet</p>
                    <p className="text-xs text-gray-300 mt-0.5">PDF, Word, images up to 5 MB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {viewingPatient.medicalRecords.map((record: MedicalRecord) => {
                      const isImage = record.type.startsWith("image/");
                      const isPdf = record.type === "application/pdf";
                      return (
                        <div key={record.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                          <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                            {isImage ? (
                              <img src={record.data} className="w-9 h-9 rounded-lg object-cover" alt="" />
                            ) : (
                              <FileText className={cn("w-4 h-4", isPdf ? "text-red-500" : "text-blue-500")} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{record.name}</p>
                            <p className="text-[10px] text-gray-400">{formatFileSize(record.size)} · {record.uploadedAt}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openOrDownload(record)}
                              title="Download"
                              className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-magenta-600 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(viewingPatient.id, record.id)}
                              title="Remove"
                              className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 pt-2 flex justify-end gap-2 shrink-0 border-t border-gray-100">
              <button
                onClick={() => { setViewingPatient(null); handleOpenEdit(viewingPatient); }}
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-magenta-50 border border-magenta-200 text-magenta-700 text-sm font-semibold hover:bg-magenta-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit className="w-4 h-4" /> Edit Patient
              </button>
              <button
                onClick={() => setViewingPatient(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
