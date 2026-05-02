import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Image,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Phone,
  Sun,
  ZoomIn,
  Sparkles,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Lock,
  Users,
  Stethoscope,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { addPlatformScan, getPlatformUserByEmail } from "@/lib/store";
import { logActivity } from "@/lib/auditLog";

const steps = [
  { label: "Answer Questions", number: 1 },
  { label: "Upload Photo", number: 2 },
  { label: "View Result", number: 3 },
];

const bodyLocations = ["Face", "Neck/Chest", "Back", "Arms/Legs", "Feet", "Scalp", "Groin/Armpits"];
const symptomPatterns = [
  "Itchy/scaly/cracked feet or toes",
  "Ring-shaped or circular scaly patch",
  "Facial redness with bumps or flushing",
  "Chronic dry itchy patches or eczema",
  "Rough raised bumps on skin",
  "Widespread blisters with fever",
  "Sores with yellow crust or pus",
  "Numb patch/wound not healing",
];
const impactLevels = [
  "Not painful and not spreading",
  "Painful or spreading",
  "With fever, open wound, or numbness",
];
const durations = ["Less than 1 week", "1-4 weeks", "1+ month"];
const householdOptions = ["Yes", "No", "Not Sure"];

interface ConditionData {
  condition: string;
  localName: string;
  category: string;
  baseConfidence: number;
  description: string;
  symptoms: string[];
  whoAffected: string;
  careTips: string[];
  whenToSeeDoctor: string;
  images: [string, string, string];
}

interface ScanResultData {
  id: string;
  condition: string;
  localName: string;
  category: string;
  confidence: number;
  bodyPart: string;
  date: string;
  severity: "Mild" | "Moderate" | "Severe";
  description: string;
  symptoms: string[];
  whoAffected: string;
  careTips: string[];
  whenToSeeDoctor: string;
  images: [string, string, string];
  imageUrl?: string;
}

const CONDITION_MAP: Record<string, ConditionData> = {
  "Itchy/scaly/cracked feet or toes": {
    condition: "Tinea Pedis",
    localName: "Alipunga",
    category: "Fungal Infection",
    baseConfidence: 85,
    description: "Tinea Pedis (Alipunga / Athlete's Foot) is a common fungal infection affecting the skin of the feet, particularly between the toes. It thrives in warm, moist environments and is common among wet market workers, fishermen, and those who wear closed shoes for extended periods.",
    symptoms: ["Itching, burning, or stinging between the toes", "Scaly, peeling, or cracked skin on the feet", "Blisters on the sole or sides of feet", "Dry, flaky skin on the sole"],
    whoAffected: "Common in anyone who walks barefoot in public areas or wears tight footwear. Prevalent among wet market workers and fishermen in Cebu.",
    careTips: ["Keep feet clean and dry, especially between the toes", "Apply OTC antifungal powder or cream daily", "Wear moisture-wicking socks and breathable footwear", "Avoid walking barefoot in public showers or pools", "Change socks daily or when wet"],
    whenToSeeDoctor: "If infection spreads to nails, does not improve after 4 weeks, or develops open sores.",
    images: [
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80",
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=70",
      "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=300&q=70",
    ],
  },
  "Ring-shaped or circular scaly patch": {
    condition: "Tinea Corporis",
    localName: "Buni",
    category: "Fungal Infection",
    baseConfidence: 84,
    description: "Tinea Corporis (Buni) is a fungal skin infection causing ring-shaped, scaly patches on the body. Also called Ringworm, it is caused by dermatophyte fungi and spreads through contact with infected persons or animals. Common among children and workers in humid environments.",
    symptoms: ["Red, ring-shaped rash with a clear center", "Slightly raised, scaly border", "Itching or stinging sensation", "Rash that slowly expands outward"],
    whoAffected: "Common in children and adults who have close contact with infected people or animals. Prevalent in humid environments in Cebu.",
    careTips: ["Apply OTC antifungal cream (e.g., clotrimazole)", "Keep the area clean and dry", "Avoid sharing towels, clothing, or bedding", "Wash hands after touching the infected area", "Continue treatment for 2 weeks even if rash clears"],
    whenToSeeDoctor: "If the rash does not improve after 2 weeks of OTC treatment, spreads rapidly, or appears on the scalp or nails.",
    images: [
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80",
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=70",
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=70",
    ],
  },
  "Facial redness with bumps or flushing": {
    condition: "Acne Rosacea",
    localName: "Taghiyawat",
    category: "Acne",
    baseConfidence: 82,
    description: "Acne Rosacea (Taghiyawat) is a chronic inflammatory skin condition that primarily affects the face, causing persistent redness, visible blood vessels, and acne-like bumps. It is often mistaken for regular acne or sunburn. Common triggers include sun exposure, hot drinks, spicy food, and stress.",
    symptoms: ["Persistent facial redness, especially on nose and cheeks", "Small red bumps or pimples (without blackheads or whiteheads)", "Visible small blood vessels on the skin", "Burning or stinging sensation on the face", "Skin that feels hot and sensitive"],
    whoAffected: "More common in adults aged 30–50, especially those with fair skin. Women are more frequently diagnosed, but men tend to have more severe symptoms.",
    careTips: ["Avoid sun exposure and use SPF 30+ sunscreen daily", "Identify and avoid personal triggers (spicy food, alcohol, hot drinks)", "Use gentle, non-irritating and fragrance-free skincare products", "Avoid rubbing, scrubbing, or touching the face", "Consult a dermatologist for prescription topical therapy (e.g., metronidazole)"],
    whenToSeeDoctor: "Rosacea usually requires prescription treatment. Consult a dermatologist for proper diagnosis and management to prevent worsening.",
    images: [
      "/images/acne Rosacea.png",
      "/images/acne Rosacea.png",
      "/images/acne Rosacea.png",
    ],
  },
  "Chronic dry itchy patches or eczema": {
    condition: "Atopic Dermatitis",
    localName: "Eczema",
    category: "Inflammatory Condition",
    baseConfidence: 80,
    description: "Atopic Dermatitis (Eczema) is a chronic inflammatory skin condition that causes dry, itchy, and inflamed skin. It tends to flare periodically and is associated with asthma and hay fever. Common across all age groups in the Philippines.",
    symptoms: ["Dry, sensitive skin", "Intense itching, especially at night", "Red to brownish-gray patches", "Small, raised bumps that may weep fluid when scratched", "Thickened, cracked, or scaly skin"],
    whoAffected: "Affects all age groups. Often begins in childhood. Those with family history of allergies, asthma, or hay fever are at higher risk.",
    careTips: ["Moisturize skin at least twice daily with fragrance-free lotion", "Use mild, unscented soap and detergent", "Avoid scratching — trim nails short", "Wear soft, breathable cotton garments", "Identify and avoid triggers (sweat, stress, certain fabrics)"],
    whenToSeeDoctor: "If itching is severe and disrupts sleep, if skin becomes infected, or if OTC treatments are not controlling flare-ups.",
    images: [
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80",
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=70",
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=70",
    ],
  },
  "Rough raised bumps on skin": {
    condition: "Warts",
    localName: "Kulubot",
    category: "Viral Infection",
    baseConfidence: 78,
    description: "Warts (Verruca vulgaris / Kulubot) are small rough growths caused by the human papillomavirus (HPV). They commonly appear on fingers, hands, and feet. Contagious through direct contact or shared surfaces but are not dangerous.",
    symptoms: ["Rough, fleshy, grainy bumps on skin", "Flesh-colored, white, pink, or tan lesions", "Tiny black dots within the bump (clotted blood vessels)", "Flat or raised surface depending on location"],
    whoAffected: "Common in children and young adults. Can affect anyone who comes in contact with HPV. Common in schools and public swimming areas.",
    careTips: ["Apply OTC salicylic acid treatment consistently", "Keep the area clean and dry", "Avoid picking, cutting, or touching the wart", "Cover with a bandage to prevent spreading", "Consult a dermatologist if warts are persistent or spreading"],
    whenToSeeDoctor: "If warts spread, appear on face or genitals, are painful, or don't respond to OTC treatment after several weeks.",
    images: [
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80",
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=70",
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=70",
    ],
  },
  "Widespread blisters with fever": {
    condition: "Chickenpox",
    localName: "Bulutong-tubig",
    category: "Viral Infection",
    baseConfidence: 83,
    description: "Chickenpox (Bulutong-tubig / Varicella) is a highly contagious viral disease caused by the Varicella-zoster virus. It causes an itchy blister-like rash, fever, and fatigue. Progresses from red spots to fluid-filled blisters that crust over.",
    symptoms: ["Itchy, blister-like rash that appears in waves", "Fever and fatigue before rash appears", "Fluid-filled blisters that break open and crust", "Rash starts on chest, back, and face then spreads"],
    whoAffected: "More common in children under 12. Adults, pregnant women, and immunocompromised individuals are at higher risk of severe complications.",
    careTips: ["Rest at home and stay isolated to prevent spreading", "Take OTC fever reducers (avoid aspirin for children)", "Apply calamine lotion or cool baths to relieve itching", "Trim nails short and avoid scratching to prevent scarring", "Seek antiviral medication if caught within 24 hours of rash onset"],
    whenToSeeDoctor: "If rash appears near the eyes, fever is very high, severe headache occurs, or patient is an adult, pregnant, or immunocompromised.",
    images: [
      "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=600&q=80",
      "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=300&q=70",
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=70",
    ],
  },
  "Sores with yellow crust or pus": {
    condition: "Impetigo",
    localName: "Nana sa Balat",
    category: "Bacterial Infection",
    baseConfidence: 76,
    description: "Impetigo (Nana sa Balat) is a highly contagious bacterial skin infection caused by Staphylococcus or Streptococcus bacteria. It causes red sores that ooze fluid and form a yellowish-brown crust. Most common in children but can affect anyone.",
    symptoms: ["Red sores that quickly rupture and ooze", "Honey-colored crusty patches", "Itchy blisters around nose and mouth", "Painless fluid-filled blisters"],
    whoAffected: "Most common in children ages 2–6. Can spread through direct contact or shared items like towels and clothing.",
    careTips: ["Keep the affected area clean with mild soap and water", "Apply prescribed antibiotic ointment consistently", "Cover sores with a clean bandage to prevent spreading", "Wash hands frequently and avoid touching the sores", "Avoid sharing towels, clothing, or bedding"],
    whenToSeeDoctor: "Immediately — impetigo usually requires prescription antibiotic treatment to prevent spreading.",
    images: [
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80",
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=70",
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=70",
    ],
  },
  "Numb patch/wound not healing": {
    condition: "Possible Leprosy",
    localName: "Ketong",
    category: "Bacterial/Mycobacterial Infection",
    baseConfidence: 68,
    description: "Leprosy (Ketong) is a chronic infection by Mycobacterium leprae affecting skin, nerves, and mucous membranes. Early signs include numb skin patches, discoloration, or non-healing wounds. Treatable with Multi-Drug Therapy (MDT) — free at government health centers.",
    symptoms: ["Pale or reddish patches on the skin with loss of sensation", "Numb skin areas (no feeling of pain, heat, or touch)", "Wounds or sores that don't heal", "Weakness in hands, feet, or eyelids"],
    whoAffected: "Can affect anyone but is more common in areas with limited healthcare access. Early detection and treatment is key to preventing disability.",
    careTips: ["Seek medical attention immediately — this is urgent", "Do not delay — early treatment prevents permanent disability", "Avoid self-medication; consult a doctor as soon as possible", "Complete the full Multi-Drug Therapy (MDT) course as prescribed", "Visit your nearest government health center (treatment is free)"],
    whenToSeeDoctor: "Immediately. Do not wait — early Multi-Drug Therapy (MDT) is free and prevents permanent nerve damage.",
    images: [
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80",
      "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=70",
      "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=300&q=70",
    ],
  },
};

export default function ScanSkinPage() {
  const navigate = useNavigate();
  const isAuthenticated =
    typeof window !== "undefined" && localStorage.getItem("dermai_auth") === "true";

  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    bodyLocation: "",
    symptomPattern: "",
    impactLevel: "",
    duration: "",
    household: "",
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);

  // Build verified recommended clinics filtered by admin applications
  const recommendedClinics = useMemo(() => {
    const allClinics = [
      { name: "Cebu Skin Institute", addr: "Mango Ave, Cebu City" },
      { name: "SkinMD Dermatology", addr: "AS Fortuna, Mandaue City" },
      { name: "DermaPlus Clinic", addr: "Osmeña Blvd, Cebu City" },
      { name: "SkinVita Derma Clinic", addr: "Talisay City, Cebu" },
    ];
    try {
      const raw = localStorage.getItem("dermai_clinic_applications");
      const apps: { name: string; status: string }[] = raw ? JSON.parse(raw) : [];
      const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
      return allClinics.filter((c) => {
        const match = apps.find((a) => {
          const na = normalize(a.name);
          const nc = normalize(c.name);
          return na === nc || na.includes(nc) || nc.includes(na);
        });
        // Show if no admin entry (default verified) OR if admin says verified
        return !match || match.status === "verified";
      }).slice(0, 2); // show only 2 suggestions
    } catch {
      return allClinics.slice(0, 2);
    }
  }, []);

  // Free Usage Logic and Subscription Plan
  const [subData, setSubData] = useState({ scansUsed: 0, isPro: false, isDemoAccount: false });

  useEffect(() => {
    // Check if the current user is a demo account
    const currentUserEmail = localStorage.getItem("dermai_current_user_email") || "";
    const isDemoAccount = currentUserEmail.toLowerCase().endsWith("@dermai.ph");

    // Load or initialize subscription data
    let subscriptionData = { scansUsed: 0, isPro: false, isDemoAccount: false };
    const data = localStorage.getItem("dermai_user_subscription");
    if (data) {
      try {
        subscriptionData = JSON.parse(data);
      } catch (e) {
        subscriptionData = { scansUsed: 0, isPro: false, isDemoAccount: false };
      }
    }

    // If user is a demo account, mark flag but don't set isPro
    // This allows showing the warning while bypassing the limit
    if (isDemoAccount) {
      subscriptionData.isDemoAccount = true;
      localStorage.setItem("dermai_user_subscription", JSON.stringify(subscriptionData));
    }

    setSubData(subscriptionData);

    // Auto-redirect if they've hit the limit and aren't pro AND aren't a demo account
    if (!subscriptionData.isPro && !subscriptionData.isDemoAccount && subscriptionData.scansUsed >= MAX_FREE_SCANS && !showResult) {
      navigate("/user/upgrade");
    }
  }, [navigate, showResult]);

  const MAX_FREE_SCANS = 3;
  const scansLeft = subData.isPro ? "Unlimited" : Math.max(0, MAX_FREE_SCANS - subData.scansUsed);
  // Demo accounts can scan unlimited even if limit is reached, but others cannot
  const canScan = subData.isPro || subData.isDemoAccount || subData.scansUsed < MAX_FREE_SCANS;

  const canProceedStep1 =
    answers.bodyLocation &&
    answers.symptomPattern &&
    answers.impactLevel &&
    answers.duration &&
    answers.household;

  const guardAction = (action: () => void) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    action();
  };

  const setAnswerWithGuard = (key: keyof typeof answers, value: string) => {
    guardAction(() => setAnswers((a) => ({ ...a, [key]: value })));
  };

  const handleAnalyze = () => {
    if (!subData.isDemoAccount && !subData.isPro && !canScan) {
      navigate("/user/upgrade");
      return;
    }

    if (!subData.isPro && !subData.isDemoAccount) {
      const newSubData = { ...subData, scansUsed: subData.scansUsed + 1 };
      setSubData(newSubData);
      localStorage.setItem("dermai_user_subscription", JSON.stringify(newSubData));
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      const conditionData = CONDITION_MAP[answers.symptomPattern] || CONDITION_MAP["Itchy/scaly/cracked feet or toes"];

      const severityFromImpact: "Mild" | "Moderate" | "Severe" =
        answers.impactLevel === "With fever, open wound, or numbness"
          ? "Severe"
          : answers.impactLevel === "Painful or spreading"
          ? "Moderate"
          : "Mild";

      const result: ScanResultData = {
        id: Math.random().toString(36).substr(2, 9),
        condition: conditionData.condition,
        localName: conditionData.localName,
        category: conditionData.category,
        confidence: conditionData.baseConfidence,
        bodyPart: answers.bodyLocation || "Back",
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        severity: severityFromImpact,
        description: conditionData.description,
        symptoms: conditionData.symptoms,
        whoAffected: conditionData.whoAffected,
        careTips: conditionData.careTips,
        whenToSeeDoctor: conditionData.whenToSeeDoctor,
        images: conditionData.images,
        imageUrl: uploadedImage || conditionData.images[0],
      };

      setScanResult(result);

      try {
        const savedHistory = localStorage.getItem("dermai_skin_history");
        const history = savedHistory ? JSON.parse(savedHistory) : [];
        const updatedHistory = [result, ...history];
        localStorage.setItem("dermai_skin_history", JSON.stringify(updatedHistory));

        // Write to shared store for admin AI analysis monitoring
        const email = localStorage.getItem("dermai_current_user_email") || "";
        const platformUser = email ? getPlatformUserByEmail(email) : undefined;
        const actorName = platformUser?.fullName || email || "Guest";
        addPlatformScan({
          id: result.id,
          userEmail: email,
          userName: actorName,
          condition: result.condition,
          category: result.category,
          confidence: result.confidence,
          severity: severityFromImpact,
          bodyPart: result.bodyPart,
          scannedAt: new Date().toISOString(),
          status: result.confidence < 60 ? "flagged" : "valid",
        });
        logActivity(
          "patient",
          actorName,
          "Skin Scan Completed",
          actorName,
          `AI scan completed. Condition: ${result.condition} (${result.localName}). Confidence: ${result.confidence}%. Severity: ${severityFromImpact}.`,
          "scan"
        );
      } catch (e) {
        console.error("Failed to save skin history", e);
      }

      setIsAnalyzing(false);
      setShowResult(true);
      setCurrentStep(3);
    }, 2500);
  };

  const handleFileUpload = () => {
    // Simulate upload
    setUploadedImage("https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80");
  };

  return (
    <div className="min-h-screen bg-magenta-50 pt-8 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Page Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-magenta-900 mb-2">
            Scan Your Skin
          </h1>
          <p className="text-magenta-700/60 text-sm">
            Get an AI-powered preliminary assessment of your skin condition
          </p>
          {!isAuthenticated && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mt-3 inline-block">
              Login required before answering questions, uploading photos, or analyzing.
            </p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    currentStep >= step.number
                      ? "bg-magenta-500 text-white shadow-lg shadow-magenta-500/30"
                      : "bg-magenta-100 text-magenta-400"
                  )}
                >
                  {currentStep > step.number ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 font-medium",
                    currentStep >= step.number
                      ? "text-magenta-500"
                      : "text-magenta-300"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-16 sm:w-24 h-0.5 mx-2 transition-colors",
                    currentStep > step.number ? "bg-magenta-500" : "bg-magenta-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Questionnaire */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(160,25,90,0.08)] p-6 sm:p-8"
            >
              <h2 className="text-xl font-display font-bold text-magenta-900 mb-6">
                Pre-Analysis Questionnaire
              </h2>

              <div className="mb-6 bg-magenta-50 rounded-xl p-4 border border-magenta-100">
                <p className="text-xs font-semibold text-magenta-900 mb-2">
                  AI Target Conditions Covered
                </p>
                <p className="text-xs text-magenta-700 leading-relaxed">
                  Covers common fungal, inflammatory, viral, and bacterial skin conditions. Certain
                  findings may trigger a confidential DOH/CHO referral for follow-up care.
                </p>
              </div>

              {/* Q1 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-magenta-900 mb-3">
                  Where on your body is the concern?
                </label>
                <div className="flex flex-wrap gap-2">
                  {bodyLocations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => setAnswerWithGuard("bodyLocation", loc)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.96]",
                        answers.bodyLocation === loc
                          ? "bg-magenta-500 text-white shadow-md shadow-magenta-500/20"
                          : "bg-magenta-50 text-magenta-700 hover:bg-magenta-100"
                      )}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-magenta-900 mb-3">
                  Which symptom pattern is closest?
                </label>
                <div className="flex flex-wrap gap-2">
                  {symptomPatterns.map((pattern) => (
                    <button
                      key={pattern}
                      onClick={() => setAnswerWithGuard("symptomPattern", pattern)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.96]",
                        answers.symptomPattern === pattern
                          ? "bg-magenta-500 text-white shadow-md shadow-magenta-500/20"
                          : "bg-magenta-50 text-magenta-700 hover:bg-magenta-100"
                      )}
                    >
                      {pattern}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-magenta-900 mb-3">
                  Which best describes your condition right now?
                </label>
                <div className="flex flex-wrap gap-2">
                  {impactLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setAnswerWithGuard("impactLevel", level)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.96]",
                        answers.impactLevel === level
                          ? "bg-magenta-500 text-white shadow-md shadow-magenta-500/20"
                          : "bg-magenta-50 text-magenta-700 hover:bg-magenta-100"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q4 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-magenta-900 mb-3">
                  How long have you had it?
                </label>
                <div className="flex flex-wrap gap-2">
                  {durations.map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setAnswerWithGuard("duration", dur)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.96]",
                        answers.duration === dur
                          ? "bg-magenta-500 text-white shadow-md shadow-magenta-500/20"
                          : "bg-magenta-50 text-magenta-700 hover:bg-magenta-100"
                      )}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q5 */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-magenta-900 mb-3">
                  Does anyone at home have it?
                </label>
                <div className="flex flex-wrap gap-2">
                  {householdOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswerWithGuard("household", opt)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.96]",
                        answers.household === opt
                          ? "bg-magenta-500 text-white shadow-md shadow-magenta-500/20"
                          : "bg-magenta-50 text-magenta-700 hover:bg-magenta-100"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={isAuthenticated ? !canProceedStep1 : false}
                onClick={() => guardAction(() => setCurrentStep(2))}
                className={cn(
                  "w-full py-3.5 rounded-full font-semibold text-sm transition-all active:scale-[0.96]",
                  isAuthenticated && canProceedStep1
                    ? "bg-magenta-500 text-white hover:bg-magenta-600 shadow-lg shadow-magenta-500/20"
                    : "bg-magenta-100 text-magenta-300 cursor-not-allowed"
                )}
              >
                {isAuthenticated ? "Next: Upload Photo" : "Login to Continue"}
              </button>
            </motion.div>
          )}

          {/* Step 2: Upload */}
          {currentStep === 2 && !isAnalyzing && !showResult && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(160,25,90,0.08)] p-6 sm:p-8"
            >
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1 text-sm text-magenta-500 mb-4 hover:text-magenta-600"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <h2 className="text-xl font-display font-bold text-magenta-900 mb-4">
                Upload a Photo
              </h2>

              {/* Free Scan Warning Banner - Always visible (Prototype) */}

              {/* Upload Zone */}
              {!uploadedImage ? (
                <div
                  onClick={() => guardAction(handleFileUpload)}
                  className="border-2 border-dashed border-magenta-200 rounded-2xl p-12 text-center cursor-pointer hover:border-magenta-400 hover:bg-magenta-50/50 transition-colors mb-6"
                >
                  <Camera className="w-12 h-12 text-magenta-300 mx-auto mb-4" />
                  <p className="text-magenta-900 font-semibold mb-1">
                    Tap to upload a photo
                  </p>
                  <p className="text-magenta-400 text-sm">
                    JPG, PNG, or HEIC up to 10MB
                  </p>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden mb-6">
                  <img
                    src={uploadedImage}
                    alt="Uploaded skin photo"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 text-magenta-500 hover:bg-white"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => guardAction(handleFileUpload)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-magenta-200 text-magenta-700 text-sm font-medium hover:bg-magenta-50 transition-colors"
                >
                  <Image className="w-4 h-4" />
                  Upload from Gallery
                </button>
                <button
                  onClick={() => guardAction(handleFileUpload)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-magenta-200 text-magenta-700 text-sm font-medium hover:bg-magenta-50 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Take a Photo
                </button>
              </div>

              {/* Guidelines */}
              <div className="bg-magenta-50 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-magenta-900 mb-2">
                  📸 Photo Guidelines
                </p>
                <ul className="space-y-1.5">
                  {[
                    { icon: Sun, text: "Good lighting — use natural light" },
                    { icon: ZoomIn, text: "Close-up of the affected area" },
                    { icon: Sparkles, text: "No filters or editing" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-magenta-700">
                      <item.icon className="w-3.5 h-3.5 text-magenta-400 flex-shrink-0" />
                      {item.text}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-magenta-600 mt-3 leading-relaxed">
                  Before AI analysis, the system automatically checks photo quality and confirms if human skin is detected. If validation fails, you will be asked to retake the photo.
                </p>
              </div>

              <div className="mb-6 rounded-xl border border-magenta-200 bg-magenta-50 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Lock className="w-4 h-4 text-magenta-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-magenta-900">
                      Free Plan: {MAX_FREE_SCANS} Scans
                    </p>
                    <p className="text-xs text-magenta-600 mt-0.5">
                      You have <span className="font-semibold">{typeof scansLeft === 'number' ? scansLeft : MAX_FREE_SCANS} free skin scan{typeof scansLeft === 'number' && scansLeft !== 1 ? 's' : ''}</span>. Upgrade for unlimited access.
                    </p>
                  </div>
                </div>
                <Link
                  to="/user/upgrade"
                  className="shrink-0 px-4 py-2 rounded-full bg-magenta-500 text-white text-xs font-bold hover:bg-magenta-600 transition-colors shadow-sm"
                >
                  Upgrade
                </Link>
              </div>

              <button
                disabled={isAuthenticated ? (!uploadedImage || !canScan) : false}
                onClick={() => guardAction(handleAnalyze)}
                className={cn(
                  "w-full py-3.5 rounded-full font-semibold text-sm transition-all active:scale-[0.96]",
                  isAuthenticated && uploadedImage && canScan
                    ? "bg-magenta-500 text-white hover:bg-magenta-600 shadow-lg shadow-magenta-500/20"
                    : "bg-magenta-100 text-magenta-300 cursor-not-allowed"
                )}
              >
                {isAuthenticated ? (canScan ? "Analyze Skin Condition" : "Out of Free Scans") : "Login to Analyze"}
              </button>
            </motion.div>
          )}

          {/* Analyzing State */}
          {isAnalyzing && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(160,25,90,0.08)] p-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-magenta-100 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Sparkles className="w-8 h-8 text-magenta-500" />
              </div>
              <h2 className="text-xl font-display font-bold text-magenta-900 mb-2">
                Analyzing your photo...
              </h2>
              <p className="text-magenta-400 text-sm">
                Our AI is examining your skin condition
              </p>
              <div className="w-48 h-2 bg-magenta-100 rounded-full mx-auto mt-6 overflow-hidden">
                <motion.div
                  className="h-full bg-magenta-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Result */}
          {currentStep === 3 && showResult && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Header card */}
              <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(160,25,90,0.08)] overflow-hidden">

                {/* Title */}
                <div className="p-6 sm:p-8 border-b border-magenta-100">
                  <span className="inline-block px-3 py-1 rounded-full bg-magenta-100 text-magenta-600 text-xs font-bold mb-3">
                    {scanResult?.category}
                  </span>
                  <h2 className="text-3xl font-display font-bold text-magenta-900 mb-1">
                    Possible {scanResult?.condition}
                  </h2>
                  <p className="text-magenta-400 text-sm">{scanResult?.localName} (Filipino name)</p>
                </div>

                {/* Confidence + scanned area */}
                <div className="px-6 sm:px-8 py-5 border-b border-magenta-100 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-magenta-700">AI Confidence Score</span>
                      <span className="text-lg font-bold text-magenta-500">{scanResult?.confidence}%</span>
                    </div>
                    <div className="w-full h-3 bg-magenta-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-magenta-400 to-magenta-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${scanResult?.confidence ?? 0}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-magenta-50 rounded-xl px-4 py-3 border border-magenta-100">
                    <MapPin className="w-4 h-4 text-magenta-400" />
                    <span className="text-sm text-magenta-700 font-medium">{scanResult?.bodyPart}</span>
                    <span className="ml-auto text-xs text-magenta-400">{scanResult?.date}</span>
                  </div>
                </div>

                {/* Hero Image */}
                <div className="p-6 sm:p-8 border-b border-magenta-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-magenta-900 text-lg">Example Skin Photo</h3>
                    <span className="text-xs font-semibold text-magenta-500 bg-magenta-50 px-3 py-1 rounded-full">Reference only</span>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border border-magenta-100 bg-magenta-50">
                    <img
                      src={scanResult?.images[0]}
                      alt={`${scanResult?.condition} reference`}
                      className="w-full h-64 sm:h-80 object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                      <p className="text-white text-sm font-semibold">Visual example of how this condition may appear on skin.</p>
                    </div>
                  </div>
                </div>

                {/* Content sections */}
                <div className="p-6 sm:p-8 space-y-8">

                  {/* What is it */}
                  <div>
                    <h3 className="font-display font-bold text-magenta-900 text-lg mb-3">What is it?</h3>
                    <p className="text-sm text-magenta-700 leading-relaxed">{scanResult?.description}</p>
                  </div>

                  {/* Common Symptoms */}
                  <div>
                    <h3 className="font-display font-bold text-magenta-900 text-lg mb-3">Common Symptoms</h3>
                    <ul className="space-y-2">
                      {(scanResult?.symptoms ?? []).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-magenta-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-magenta-400 mt-1.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Who does it affect */}
                  <div className="bg-magenta-50 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-magenta-500" />
                      <h3 className="font-display font-bold text-magenta-900 text-lg">Who does it affect?</h3>
                    </div>
                    <p className="text-sm text-magenta-700 leading-relaxed">{scanResult?.whoAffected}</p>
                  </div>

                  {/* Basic Care Tips */}
                  <div>
                    <h3 className="font-display font-bold text-magenta-900 text-lg mb-3">Basic Care Tips</h3>
                    <ul className="space-y-2">
                      {(scanResult?.careTips ?? []).map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-magenta-700">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* When to See a Doctor */}
                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="w-5 h-5 text-amber-600" />
                      <h3 className="font-display font-bold text-amber-900 text-lg">When to See a Doctor</h3>
                    </div>
                    <p className="text-sm text-amber-800 leading-relaxed">{scanResult?.whenToSeeDoctor}</p>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-rose-soft/50 rounded-xl p-5 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-magenta-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-magenta-900 mb-1">Medical Disclaimer</p>
                      <p className="text-xs text-magenta-700 leading-relaxed">
                        This information is for educational purposes only and is NOT a medical diagnosis.
                        Always consult a licensed dermatologist for proper evaluation and treatment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended Clinics */}
              <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(160,25,90,0.08)] p-6 sm:p-8">
                <h3 className="text-lg font-display font-bold text-magenta-900 mb-4">Recommended Clinics Near You</h3>
                <div className="space-y-3">
                  {recommendedClinics.map((clinic, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-magenta-100 hover:border-magenta-200 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-magenta-900 text-sm">{clinic.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">✓ Verified</span>
                        </div>
                        <p className="text-xs text-magenta-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {clinic.addr}
                        </p>
                      </div>
                      <Link to="/clinics" className="px-4 py-2 rounded-full bg-magenta-500 text-white text-xs font-semibold hover:bg-magenta-600 transition-colors">View</Link>
                    </div>
                  ))}
                </div>
                <Link to="/clinics" className="flex items-center justify-center gap-1 mt-4 text-sm text-magenta-500 font-semibold hover:text-magenta-600">
                  View all clinics <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setShowResult(false);
                    setUploadedImage(null);
                    setAnswers({ bodyLocation: "", symptomPattern: "", impactLevel: "", duration: "", household: "" });
                  }}
                  className="flex-1 py-3.5 rounded-full font-semibold text-sm border-2 border-magenta-500 text-magenta-500 hover:bg-magenta-50 transition-colors active:scale-[0.96]"
                >
                  Scan Again
                </button>
                <Link
                  to="/clinics"
                  className="flex-1 py-3.5 rounded-full font-semibold text-sm bg-magenta-500 text-white text-center hover:bg-magenta-600 transition-colors shadow-lg shadow-magenta-500/20 active:scale-[0.96]"
                >
                  Find a Clinic
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Out-of-Scope Alert (hidden by default, shown by state) */}
        {false && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-[20px] p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-display font-bold text-magenta-900 mb-2">
              Beyond Current Scope
            </h3>
            <p className="text-sm text-magenta-700 mb-4">
              This condition may be beyond our current analysis capabilities. Please visit a dermatologist near you for professional evaluation.
            </p>
            <Link
              to="/clinics"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors"
            >
              Find Clinic Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* DOH Referral Alert (hidden by default) */}
        {false && (
          <div className="bg-red-50 border-2 border-red-200 rounded-[20px] p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-display font-bold text-red-900 mb-2">
              Immediate Attention Needed
            </h3>
            <p className="text-sm text-red-700 mb-4">
              We detected signs that may need immediate government health attention.
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-red-500" />
              <span className="text-lg font-mono-accent font-bold text-red-600">
                DOH Hotline: 1555
              </span>
            </div>
            <p className="text-xs text-red-500 mb-4">
              Treatment is FREE under DOH program
            </p>
            <div className="flex gap-3 justify-center">
              <button className="px-6 py-3 rounded-full bg-red-500 text-white font-semibold text-sm">
                Find CHO
              </button>
              <Link
                to="/clinics"
                className="px-6 py-3 rounded-full border-2 border-red-400 text-red-600 font-semibold text-sm"
              >
                Find Clinic
              </Link>
            </div>
          </div>
        )}

        <AnimatePresence>
          {showLoginModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50 flex items-center justify-center px-4"
            >
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 12, opacity: 0, scale: 0.98 }}
                className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
              >
                <h3 className="text-lg font-display font-bold text-magenta-900 mb-2">
                  Login Required
                </h3>
                <p className="text-sm text-magenta-700 mb-5">
                  You can view this page, but login is required to answer the questionnaire,
                  upload a photo, and run AI analysis.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="flex-1 py-2.5 rounded-full border border-magenta-200 text-magenta-700 text-sm font-semibold hover:bg-magenta-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => navigate("/login", { state: { from: "/scan" } })}
                    className="flex-1 py-2.5 rounded-full bg-magenta-500 text-white text-sm font-semibold hover:bg-magenta-600"
                  >
                    Go to Login
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upgrade Prompt Modal - Removed: User is auto-redirected to upgrade page when limit reached */}

    </div>
  );
}
