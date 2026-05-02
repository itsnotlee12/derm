import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const skinConditions = [
  {
    id: "tinea-pedis",
    name: "Tinea Pedis",
    filipinoName: "Alipunga",
    category: "Fungal",
    description: "A common fungal infection affecting the feet, especially between the toes. Known as Athlete's Foot.",
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=70",
    symptoms: [
      "Itching, burning, or stinging between the toes",
      "Scaly, peeling, or cracked skin on the feet",
      "Blisters on the sole or sides of feet",
      "Dry, flaky skin on the sole",
    ],
    whoAffected: "Common in anyone who walks barefoot in public areas or wears tight footwear. Prevalent among wet market workers and fishermen in Cebu.",
    careTips: [
      "Keep feet clean and dry, especially between the toes",
      "Apply OTC antifungal powder or cream daily",
      "Wear moisture-wicking socks and breathable footwear",
      "Avoid walking barefoot in public showers or pools",
      "Change socks daily or when wet",
    ],
    whenToSeeDoctor: "If infection spreads to nails, does not improve after 4 weeks, or develops open sores.",
  },
  {
    id: "tinea-corporis",
    name: "Tinea Corporis",
    filipinoName: "Buni",
    category: "Fungal",
    description: "A fungal skin infection causing ring-shaped, scaly patches on the body. Also known as Ringworm.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=70",
    symptoms: [
      "Red, ring-shaped rash with a clear center",
      "Slightly raised, scaly border",
      "Itching or stinging sensation",
      "Rash that slowly expands outward",
    ],
    whoAffected: "Common in children and adults with close contact with infected people or animals. Prevalent in humid environments.",
    careTips: [
      "Apply OTC antifungal cream (e.g., clotrimazole)",
      "Keep the area clean and dry",
      "Avoid sharing towels, clothing, or bedding",
      "Wash hands after touching the infected area",
      "Continue treatment for 2 weeks even if rash clears",
    ],
    whenToSeeDoctor: "If the rash does not improve after 2 weeks of OTC treatment, spreads rapidly, or appears on the scalp or nails.",
  },
  {
    id: "acne-rosacea",
    name: "Acne Rosacea",
    filipinoName: "Taghiyawat",
    category: "Acne",
    description: "A chronic inflammatory skin condition causing persistent facial redness, visible blood vessels, and acne-like bumps. Often mistaken for regular acne or sunburn.",
    image: "/images/acne Rosacea.png",
    symptoms: [
      "Persistent facial redness, especially on nose and cheeks",
      "Small red bumps or pimples (without blackheads or whiteheads)",
      "Visible small blood vessels on the skin",
      "Burning or stinging sensation on the face",
      "Skin that feels hot and sensitive",
    ],
    whoAffected: "More common in adults aged 30–50, especially those with fair skin. Women are more frequently diagnosed, but men tend to have more severe symptoms.",
    careTips: [
      "Avoid sun exposure and use SPF 30+ sunscreen daily",
      "Identify and avoid personal triggers (spicy food, alcohol, hot drinks)",
      "Use gentle, non-irritating and fragrance-free skincare products",
      "Avoid rubbing, scrubbing, or touching the face",
      "Consult a dermatologist for prescription topical therapy",
    ],
    whenToSeeDoctor: "Rosacea usually requires prescription treatment. Consult a dermatologist for proper diagnosis and management to prevent worsening.",
  },
  {
    id: "atopic-dermatitis",
    name: "Atopic Dermatitis",
    filipinoName: "Eksema",
    category: "Inflammatory",
    description: "A chronic condition that makes the skin dry, itchy, and inflamed. Common in children but can occur at any age.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=70",
    symptoms: [
      "Dry, cracked, scaly skin",
      "Intense itching, especially at night",
      "Red to brownish-gray patches",
      "Thickened skin from repeated scratching",
    ],
    whoAffected: "Often begins in childhood. People with family history of allergies, asthma, or hay fever are more prone.",
    careTips: [
      "Moisturize regularly with fragrance-free lotion",
      "Avoid harsh soaps and detergents",
      "Wear soft, breathable fabrics",
      "Identify and avoid personal triggers",
    ],
    whenToSeeDoctor: "If itching is severe enough to affect sleep, or if skin appears infected.",
  },
  {
    id: "warts",
    name: "Warts",
    filipinoName: "Kulubot",
    category: "Viral",
    description: "Small rough growths on the skin caused by the human papillomavirus (HPV). Contagious through direct contact.",
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=70",
    symptoms: [
      "Rough, fleshy, grainy bumps on skin",
      "Flesh-colored, white, pink, or tan lesions",
      "Tiny black dots within the bump (clotted blood vessels)",
      "Flat or raised surface depending on location",
    ],
    whoAffected: "Common in children and young adults. Can affect anyone in contact with HPV. Common in schools and public swimming areas.",
    careTips: [
      "Apply OTC salicylic acid treatment consistently",
      "Keep the area clean and dry",
      "Avoid picking or touching the wart",
      "Cover with a bandage to prevent spreading",
    ],
    whenToSeeDoctor: "If warts spread, appear on face or genitals, are painful, or don't respond to OTC treatment.",
  },
  {
    id: "chickenpox",
    name: "Chickenpox",
    filipinoName: "Bulutong-tubig",
    category: "Viral",
    description: "A highly contagious viral disease caused by the Varicella-zoster virus, producing an itchy blister-like rash.",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=300&q=70",
    symptoms: [
      "Itchy, blister-like rash that appears in waves",
      "Fever and fatigue before rash appears",
      "Fluid-filled blisters that break open and crust",
      "Rash starts on chest, back, and face then spreads",
    ],
    whoAffected: "More common in children under 12. Adults, pregnant women, and immunocompromised individuals are at higher risk of severe complications.",
    careTips: [
      "Rest at home and stay isolated to prevent spreading",
      "Take OTC fever reducers (avoid aspirin for children)",
      "Apply calamine lotion to relieve itching",
      "Trim nails short and avoid scratching",
    ],
    whenToSeeDoctor: "If rash appears near the eyes, fever is very high, or patient is an adult, pregnant, or immunocompromised.",
  },
  {
    id: "impetigo",
    name: "Impetigo",
    filipinoName: "Nana sa Balat",
    category: "Bacterial",
    description: "A highly contagious bacterial skin infection forming crusty sores, most common in children.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=70",
    symptoms: [
      "Red sores that quickly rupture and ooze",
      "Honey-colored crusty patches",
      "Itchy blisters around nose and mouth",
      "Painless fluid-filled blisters",
    ],
    whoAffected: "Most common in children ages 2–6. Can spread through direct contact or shared items like towels and clothing.",
    careTips: [
      "Keep affected area clean with mild soap and water",
      "Don't scratch or touch sores",
      "Wash hands frequently",
      "Use separate towels and linens",
    ],
    whenToSeeDoctor: "Immediately — impetigo usually requires prescription antibiotic treatment.",
  },
  {
    id: "leprosy",
    name: "Leprosy",
    filipinoName: "Ketong",
    category: "Bacterial",
    description: "A chronic bacterial infection caused by Mycobacterium leprae affecting skin and nerves. Fully treatable with free MDT at government health centers.",
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=300&q=70",
    symptoms: [
      "Pale or reddish patches with loss of sensation",
      "Numb skin areas (no feeling of pain, heat, or touch)",
      "Wounds or sores that don't heal normally",
      "Weakness in hands, feet, or eyelids",
    ],
    whoAffected: "Can affect anyone. Early detection is critical to prevent permanent disability. Free treatment available at government health centers.",
    careTips: [
      "Seek medical attention immediately",
      "Do not delay — early treatment prevents permanent disability",
      "Complete the full Multi-Drug Therapy (MDT) course",
      "Visit your nearest government health center (treatment is free)",
    ],
    whenToSeeDoctor: "Immediately. Do not wait — early MDT is free and prevents permanent nerve damage.",
  },
];

const categories = ["All", "Fungal", "Acne", "Inflammatory", "Viral", "Bacterial"];

const categoryColors: Record<string, string> = {
  Fungal: "bg-purple-100 text-purple-700",
  Acne: "bg-rose-100 text-rose-700",
  Inflammatory: "bg-orange-100 text-orange-700",
  Viral: "bg-sky-100 text-sky-700",
  Bacterial: "bg-blue-100 text-blue-700",
};

export default function SkinLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filtered = skinConditions.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.filipinoName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-magenta-50 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-magenta-900 mb-2">
            Skin Condition Library
          </h1>
          <p className="text-magenta-700/60 text-sm max-w-md mx-auto">
            Learn about common skin conditions in the Philippines
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-[20px] shadow-[0_4px_24px_rgba(160,25,90,0.08)] p-4 sm:p-6 mb-8">
          <div className="flex items-center gap-2 bg-magenta-50 rounded-full px-4 py-2.5 mb-4">
            <Search className="w-4 h-4 text-magenta-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search conditions..."
              className="flex-1 bg-transparent outline-none text-sm text-magenta-900 placeholder:text-magenta-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-[0.96]",
                  selectedCategory === cat
                    ? "bg-magenta-500 text-white"
                    : "bg-magenta-50 text-magenta-600 hover:bg-magenta-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((condition, i) => (
            <motion.div
              key={condition.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/library/${condition.id}`}
                className="group block bg-white rounded-[20px] shadow-[0_4px_24px_rgba(160,25,90,0.06)] hover:shadow-[0_8px_40px_rgba(160,25,90,0.12)] transition-all duration-300 overflow-hidden"
              >
                <div className="h-44 overflow-hidden">
                  <img
                    src={condition.image}
                    alt={condition.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                        categoryColors[condition.category] || "bg-gray-100 text-gray-600"
                      )}
                    >
                      {condition.category}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-magenta-900 text-base mb-0.5">
                    {condition.name}
                  </h3>
                  <p className="text-xs text-magenta-400 mb-2">{condition.filipinoName}</p>
                  <p className="text-sm text-magenta-700/60 leading-relaxed mb-3 line-clamp-2">
                    {condition.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-magenta-500 group-hover:text-magenta-600">
                    Learn More <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-10 h-10 text-magenta-200 mx-auto mb-3" />
            <p className="text-magenta-400 text-sm">No conditions found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
