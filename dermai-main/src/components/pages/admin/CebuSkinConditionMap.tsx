import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Municipality = {
  id: string;
  name: string;
  grid: Array<{ row: number; col: number }>;
};

type ConditionData = {
  municipality: string;
  tinea: number;
  acne: number;
  eczema: number;
  melasma: number;
  dermatitis: number;
};

const municipalities: Municipality[] = [
  {
    id: "consolacion",
    name: "Consolacion",
    grid: [
      { row: 0, col: 11 },
      { row: 0, col: 12 },
      { row: 1, col: 11 },
      { row: 1, col: 12 },
    ],
  },
  {
    id: "lapu-lapu",
    name: "Lapu-Lapu City",
    grid: [
      { row: 1, col: 13 },
      { row: 2, col: 13 },
      { row: 2, col: 14 },
      { row: 3, col: 14 },
    ],
  },
  {
    id: "liloan",
    name: "Liloan",
    grid: [
      { row: 2, col: 11 },
      { row: 2, col: 12 },
      { row: 3, col: 11 },
    ],
  },
  {
    id: "mandaue",
    name: "Mandaue City",
    grid: [
      { row: 3, col: 12 },
      { row: 4, col: 12 },
      { row: 4, col: 13 },
    ],
  },
  {
    id: "cebu-city",
    name: "Cebu City",
    grid: [
      { row: 4, col: 10 },
      { row: 5, col: 10 },
      { row: 6, col: 10 },
      { row: 6, col: 11 },
      { row: 7, col: 10 },
      { row: 8, col: 10 },
      { row: 9, col: 10 },
      { row: 10, col: 10 },
    ],
  },
  {
    id: "cordova",
    name: "Cordova",
    grid: [
      { row: 6, col: 12 },
      { row: 7, col: 12 },
    ],
  },
  {
    id: "minglanilla",
    name: "Minglanilla",
    grid: [
      { row: 8, col: 9 },
      { row: 9, col: 9 },
      { row: 10, col: 9 },
    ],
  },
  {
    id: "talisay",
    name: "Talisay City",
    grid: [
      { row: 10, col: 8 },
      { row: 11, col: 7 },
      { row: 11, col: 8 },
      { row: 12, col: 7 },
    ],
  },
  {
    id: "naga",
    name: "Naga City",
    grid: [
      { row: 12, col: 5 },
      { row: 12, col: 6 },
      { row: 13, col: 5 },
      { row: 13, col: 6 },
    ],
  },
];

const conditionData: ConditionData[] = [
  {
    municipality: "Cebu City",
    tinea: 4821,
    acne: 3240,
    eczema: 1950,
    melasma: 1640,
    dermatitis: 980,
  },
  {
    municipality: "Mandaue City",
    tinea: 1523,
    acne: 892,
    eczema: 540,
    melasma: 380,
    dermatitis: 210,
  },
  {
    municipality: "Lapu-Lapu City",
    tinea: 987,
    acne: 620,
    eczema: 350,
    melasma: 290,
    dermatitis: 140,
  },
  {
    municipality: "Talisay City",
    tinea: 743,
    acne: 540,
    eczema: 280,
    melasma: 180,
    dermatitis: 95,
  },
  {
    municipality: "Minglanilla",
    tinea: 412,
    acne: 290,
    eczema: 150,
    melasma: 110,
    dermatitis: 50,
  },
  {
    municipality: "Consolacion",
    tinea: 356,
    acne: 250,
    eczema: 130,
    melasma: 90,
    dermatitis: 40,
  },
  {
    municipality: "Liloan",
    tinea: 289,
    acne: 180,
    eczema: 100,
    melasma: 65,
    dermatitis: 35,
  },
  {
    municipality: "Naga City",
    tinea: 198,
    acne: 140,
    eczema: 75,
    melasma: 50,
    dermatitis: 25,
  },
  {
    municipality: "Cordova",
    tinea: 167,
    acne: 110,
    eczema: 60,
    melasma: 40,
    dermatitis: 20,
  },
];

const conditions = [
  { id: "tinea", name: "Tinea Versicolor", color: "text-blue-600" },
  { id: "acne", name: "Acne", color: "text-red-600" },
  { id: "eczema", name: "Eczema", color: "text-yellow-600" },
  { id: "melasma", name: "Melasma", color: "text-purple-600" },
  { id: "dermatitis", name: "Dermatitis", color: "text-orange-600" },
];

export default function CebuSkinConditionMap() {
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [hoveredMunicipality, setHoveredMunicipality] = useState<string | null>(
    null
  );

  const getTotalCases = (municipality: string, condition: string): number => {
    const data = conditionData.find((d) => d.municipality === municipality);
    if (!data) return 0;
    if (condition === "all") {
      return (
        data.tinea +
        data.acne +
        data.eczema +
        data.melasma +
        data.dermatitis
      );
    }
    return data[condition as keyof ConditionData] as number || 0;
  };

  const maxCases = useMemo(() => {
    let max = 0;
    for (const mun of municipalities) {
      const total = getTotalCases(mun.name, selectedCondition);
      if (total > max) max = total;
    }
    return max || 1;
  }, [selectedCondition]);

  const getIntensity = (municipality: string): number => {
    const total = getTotalCases(municipality, selectedCondition);
    return Math.max(0.1, Math.min(1, total / maxCases));
  };

  const getMunicipalityByGridPos = (
    row: number,
    col: number
  ): Municipality | null => {
    for (const mun of municipalities) {
      if (mun.grid.some((g) => g.row === row && g.col === col)) {
        return mun;
      }
    }
    return null;
  };

  const getBackgroundColor = (municipality: Municipality | null): string => {
    if (!municipality) return "bg-gray-100";

    const intensity = getIntensity(municipality.name);

    if (selectedCondition === "tinea") {
      return `bg-blue-${Math.round(intensity * 9) * 100 || 50}`;
    }
    if (selectedCondition === "acne") {
      return `bg-red-${Math.round(intensity * 9) * 100 || 50}`;
    }
    if (selectedCondition === "eczema") {
      return `bg-yellow-${Math.round(intensity * 9) * 100 || 50}`;
    }
    if (selectedCondition === "melasma") {
      return `bg-purple-${Math.round(intensity * 9) * 100 || 50}`;
    }
    if (selectedCondition === "dermatitis") {
      return `bg-orange-${Math.round(intensity * 9) * 100 || 50}`;
    }

    return `bg-magenta-${Math.round(intensity * 9) * 100 || 50}`;
  };

  const topMunicipality = useMemo(() => {
    let top = municipalities[0];
    let maxCount = getTotalCases(top.name, selectedCondition);
    for (const mun of municipalities) {
      const count = getTotalCases(mun.name, selectedCondition);
      if (count > maxCount) {
        maxCount = count;
        top = mun;
      }
    }
    return { municipality: top.name, cases: maxCount };
  }, [selectedCondition]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-magenta-600" />
          <h3 className="font-display font-bold text-gray-900">
            Skin Condition Distribution Map
          </h3>
        </div>
        <p className="text-sm text-gray-400">
          Geographic distribution of AI-analyzed skin conditions across Cebu municipalities
        </p>
      </div>

      {/* Top Stat */}
      <div className="bg-gradient-to-r from-magenta-50 to-purple-50 rounded-2xl border border-magenta-100 p-4 flex items-center gap-3">
        <TrendingUp className="w-5 h-5 text-magenta-600" />
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            Highest Reported Area
          </p>
          <p className="text-lg font-display font-bold text-gray-900">
            {topMunicipality.municipality}{" "}
            <span className="text-magenta-600">({topMunicipality.cases} cases)</span>
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Filter by Condition
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCondition("all")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition-colors",
              selectedCondition === "all"
                ? "bg-magenta-500 text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            )}
          >
            All Conditions
          </button>
          {conditions.map((cond) => (
            <button
              key={cond.id}
              onClick={() => setSelectedCondition(cond.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-colors",
                selectedCondition === cond.id
                  ? "bg-magenta-500 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              )}
            >
              {cond.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-6"
      >
        <div className="bg-gray-50 rounded-xl p-8 overflow-x-auto">
          <div className="grid gap-1 inline-grid" style={{ gridTemplateColumns: "repeat(15, 1fr)" }}>
            {Array.from({ length: 14 * 15 }).map((_, idx) => {
              const row = Math.floor(idx / 15);
              const col = idx % 15;
              const municipality = getMunicipalityByGridPos(row, col);
              const isHovered = hoveredMunicipality === municipality?.id;

              return (
                <motion.div
                  key={idx}
                  className={cn(
                    "rounded transition-all cursor-pointer relative group",
                    municipality
                      ? cn(getBackgroundColor(municipality), isHovered && "ring-2 ring-gray-900 scale-110")
                      : "bg-gray-200"
                  )}
                  style={{ width: "40px", height: "50px" }}
                  onMouseEnter={() => municipality && setHoveredMunicipality(municipality.id)}
                  onMouseLeave={() => setHoveredMunicipality(null)}
                  whileHover={municipality ? { scale: 1.15 } : {}}
                  whileTap={municipality ? { scale: 0.95 } : {}}
                >
                  {municipality && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <p className="font-semibold">{municipality.name}</p>
                      <p className="text-gray-300">
                        {getTotalCases(municipality.name, selectedCondition)} cases
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Intensity Scale
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Low</span>
            <div className="flex gap-1 flex-1">
              {[0.1, 0.3, 0.5, 0.7, 0.9, 1].map((intensity, i) => {
                const bgClass = selectedCondition === "tinea"
                  ? `bg-blue-${Math.round(intensity * 900)}`
                  : selectedCondition === "acne"
                  ? `bg-red-${Math.round(intensity * 900)}`
                  : selectedCondition === "eczema"
                  ? `bg-yellow-${Math.round(intensity * 900)}`
                  : selectedCondition === "melasma"
                  ? `bg-purple-${Math.round(intensity * 900)}`
                  : selectedCondition === "dermatitis"
                  ? `bg-orange-${Math.round(intensity * 900)}`
                  : `bg-magenta-${Math.round(intensity * 900)}`;

                return (
                  <div
                    key={i}
                    className={cn("w-6 h-6 rounded-sm", bgClass)}
                  />
                );
              })}
            </div>
            <span className="text-xs text-gray-500">High</span>
          </div>
        </div>
      </motion.div>

      {/* Municipality Stats Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h4 className="font-display font-bold text-gray-900">Municipality Breakdown</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">
                  Municipality
                </th>
                <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  Tinea
                </th>
                <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  Acne
                </th>
                <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  Eczema
                </th>
                <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  Melasma
                </th>
                <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  Dermatitis
                </th>
                <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {conditionData.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-50 hover:bg-gray-50/70 transition-colors"
                  onMouseEnter={() =>
                    setHoveredMunicipality(
                      municipalities.find((m) => m.name === row.municipality)?.id || null
                    )
                  }
                  onMouseLeave={() => setHoveredMunicipality(null)}
                >
                  <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                    {row.municipality}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {row.tinea}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {row.acne}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {row.eczema}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {row.melasma}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {row.dermatitis}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-semibold text-magenta-600">
                    {row.tinea + row.acne + row.eczema + row.melasma + row.dermatitis}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
