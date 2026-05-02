import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Users,
  Stethoscope,
  Camera,
} from "lucide-react";
import { skinConditions } from "./SkinLibraryPage";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const categoryColors: Record<string, string> = {
  Fungal: "bg-purple-100 text-purple-700",
  Acne: "bg-rose-100 text-rose-700",
  Inflammatory: "bg-orange-100 text-orange-700",
  Pigmentation: "bg-amber-100 text-amber-700",
  Parasitic: "bg-red-100 text-red-700",
  Bacterial: "bg-blue-100 text-blue-700",
};

export default function ConditionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const condition = skinConditions.find((c) => c.id === id);

  const conditionExampleImages: Record<string, string[]> = {
    "tinea-versicolor": [
      "https://source.unsplash.com/1200x800/?skin,patches,back",
      "https://source.unsplash.com/1200x800/?skin,discoloration",
      "https://source.unsplash.com/1200x800/?dermatology,skin,spots",
    ],
    "acne-rosacea": [
      "https://source.unsplash.com/1200x800/?rosacea,face,skin",
      "https://source.unsplash.com/1200x800/?facial,redness,skin",
      "https://source.unsplash.com/1200x800/?dermatology,redness,face",
    ],
    eczema: [
      "https://source.unsplash.com/1200x800/?eczema,skin,hand",
      "https://source.unsplash.com/1200x800/?dry,skin,rash",
      "https://source.unsplash.com/1200x800/?inflamed,skin",
    ],
    melasma: [
      "https://source.unsplash.com/1200x800/?melasma,face,skin",
      "https://source.unsplash.com/1200x800/?pigmentation,face,skin",
      "https://source.unsplash.com/1200x800/?brown,spots,skin",
    ],
    scabies: [
      "https://source.unsplash.com/1200x800/?itchy,skin,rash",
      "https://source.unsplash.com/1200x800/?skin,irritation,arm",
      "https://source.unsplash.com/1200x800/?rash,closeup,skin",
    ],
    impetigo: [
      "https://source.unsplash.com/1200x800/?skin,infection,face",
      "https://source.unsplash.com/1200x800/?dermatology,skin,lesion",
      "https://source.unsplash.com/1200x800/?skin,crust,rash",
    ],
  };

  const exampleImages = condition
    ? conditionExampleImages[condition.id] || [condition.image, condition.image, condition.image]
    : [];

  if (!condition) {
    return (
      <div className="min-h-screen bg-magenta-50 pt-8 pb-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-magenta-900 mb-2">
            Condition Not Found
          </h1>
          <Link to="/library" className="text-magenta-500 font-semibold text-sm">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-magenta-50 pt-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <Link
          to="/library"
          className="inline-flex items-center gap-1 text-sm text-magenta-500 font-medium mb-6 hover:text-magenta-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(160,25,90,0.08)] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-magenta-100">
            <span
              className={cn(
                "inline-block px-3 py-1 rounded-full text-xs font-bold mb-3",
                categoryColors[condition.category] || "bg-gray-100 text-gray-600"
              )}
            >
              {condition.category}
            </span>
            <h1 className="text-3xl font-display font-bold text-magenta-900 mb-1">
              {condition.name}
            </h1>
            <p className="text-magenta-400 text-sm">{condition.filipinoName}</p>
          </div>

          {/* Hero Image */}
          <div className="p-6 sm:p-8 border-b border-magenta-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-magenta-900 text-lg">
                Example Skin Photo
              </h2>
              <span className="text-xs font-semibold text-magenta-500 bg-magenta-50 px-3 py-1 rounded-full">
                Reference only
              </span>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-magenta-100 bg-magenta-50">
              <img
                src={exampleImages[0] || condition.image}
                alt={`${condition.name} reference photo`}
                className="w-full h-64 sm:h-80 object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <p className="text-white text-sm font-semibold">
                  Visual example of how this condition may appear on skin.
                </p>
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="p-6 sm:p-8 border-b border-magenta-100">
            <h2 className="font-display font-bold text-magenta-900 text-lg mb-4">
              Reference Images
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Mild", color: "bg-green-500" },
                { label: "Moderate", color: "bg-amber-500" },
                { label: "Severe", color: "bg-red-500" },
              ].map((item, index) => (
                <div key={item.label} className="relative rounded-xl overflow-hidden">
                  <img
                    src={exampleImages[index] || condition.image}
                    alt={`${condition.name} - ${item.label}`}
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                  <span
                    className={`absolute bottom-2 left-2 ${item.color} text-white text-xs font-bold px-3 py-1 rounded-full`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Content Sections */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* What is it */}
            <div>
              <h2 className="font-display font-bold text-magenta-900 text-lg mb-3">
                What is it?
              </h2>
              <p className="text-sm text-magenta-700 leading-relaxed">
                {condition.description}
              </p>
            </div>

            {/* Symptoms */}
            <div>
              <h2 className="font-display font-bold text-magenta-900 text-lg mb-3">
                Common Symptoms
              </h2>
              <ul className="space-y-2">
                {condition.symptoms.map((symptom, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-magenta-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-magenta-400 mt-1.5 flex-shrink-0" />
                    {symptom}
                  </li>
                ))}
              </ul>
            </div>

            {/* Who */}
            <div className="bg-magenta-50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-magenta-500" />
                <h2 className="font-display font-bold text-magenta-900 text-lg">
                  Who does it affect?
                </h2>
              </div>
              <p className="text-sm text-magenta-700 leading-relaxed">
                {condition.whoAffected}
              </p>
            </div>

            {/* Care Tips */}
            <div>
              <h2 className="font-display font-bold text-magenta-900 text-lg mb-3">
                Basic Care Tips
              </h2>
              <ul className="space-y-2">
                {condition.careTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-magenta-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* When to see doctor */}
            <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-5 h-5 text-amber-600" />
                <h2 className="font-display font-bold text-amber-900 text-lg">
                  When to See a Doctor
                </h2>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">
                {condition.whenToSeeDoctor}
              </p>
            </div>

            {/* Disclaimer */}
            <div className="bg-rose-soft/50 rounded-xl p-5 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-magenta-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-magenta-900 mb-1">
                  Medical Disclaimer
                </p>
                <p className="text-xs text-magenta-700 leading-relaxed">
                  This information is for educational purposes only and is NOT a medical diagnosis.
                  Always consult a licensed dermatologist for proper evaluation and treatment.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center pt-4">
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-magenta-500 text-white rounded-full font-semibold text-sm hover:bg-magenta-600 transition-colors shadow-lg shadow-magenta-500/20 active:scale-[0.96]"
              >
                <Camera className="w-4 h-4" />
                Scan Your Skin Now
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
