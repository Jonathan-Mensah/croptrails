import { StageId } from "@/types";

export const stages: Array<{
  id: StageId;
  title: string;
  subtitle: string;
  icon: string;
}> = [
  {
    id: "harvest",
    title: "Harvest",
    subtitle: "Check maturity, weather, and field readiness.",
    icon: "sunny-outline",
  },
  {
    id: "dry",
    title: "Dry",
    subtitle: "Decide whether grain is safe to store.",
    icon: "partly-sunny-outline",
  },
  {
    id: "store",
    title: "Store",
    subtitle: "Watch moisture, insects, and storage safety.",
    icon: "cube-outline",
  },
  {
    id: "sell",
    title: "Sell",
    subtitle: "Compare price, urgency, and holding risk.",
    icon: "cash-outline",
  },
];

export const stageQuestions: Record<
  StageId,
  Array<{ id: string; label: string; positiveLabel?: string }>
> = {
  harvest: [
    { id: "husksDry", label: "Husks and leaves are dry and brown" },
    { id: "kernelsHard", label: "Kernels feel very hard when pressed" },
    { id: "rainEnded", label: "Rains have mostly ended in my area" },
    { id: "cobsDroop", label: "Most cobs are drooping downward" },
  ],
  dry: [
    { id: "tarpaulin", label: "Drying is on tarpaulin or a clean raised surface" },
    { id: "sevenSunnyDays", label: "Maize has dried for at least 7 sunny days" },
    { id: "grainsHard", label: "Grains are hard and do not stick together" },
    { id: "noSmell", label: "No mould smell or strange odor" },
  ],
  store: [
    { id: "fullyDry", label: "Maize was fully dry before storage" },
    { id: "raisedBags", label: "Bags are raised off the floor" },
    { id: "noInsects", label: "No visible insects or damaged kernels" },
    { id: "sealedStorage", label: "Storage is hermetic or well sealed" },
  ],
  sell: [
    { id: "needCash", label: "I need cash urgently" },
    { id: "safeStorage", label: "My storage can safely hold maize for months" },
    { id: "priceRising", label: "Nearby maize prices are rising" },
    { id: "qualityGood", label: "My maize is dry, clean, and market-ready" },
  ],
};

export const varieties = [
  "CSIR-Abontem",
  "CSIR-Omanikwa",
  "Obatanpa",
  "Mamaba",
  "Golden Crystal",
  "Dodzi",
];

export const varietyMaturityDays: Record<string, number> = {
  "CSIR-Abontem": 78,
  "CSIR-Omanikwa": 90,
  Obatanpa: 110,
  Mamaba: 110,
  "Golden Crystal": 108,
  Dodzi: 83,
};

export const regions = [
  "Ashanti",
  "Bono East",
  "Greater Accra",
  "Northern",
  "Upper East",
  "Upper West",
  "Volta",
];

export const districtsByRegion: Record<string, string[]> = {
  Ashanti: ["Ejura Sekyedumase", "Kumasi Metropolitan", "Mampong Municipal"],
  "Bono East": ["Techiman", "Techiman North", "Kintampo North"],
  "Greater Accra": ["Accra Metropolitan", "Ga West", "Tema Metropolitan"],
  Northern: ["Tamale Metropolitan", "Savelugu", "Yendi Municipal"],
  "Upper East": ["Bolgatanga Municipal", "Bawku Municipal", "Navrongo"],
  "Upper West": ["Wa Municipal", "Nandom Municipal", "Lawra Municipal"],
  Volta: ["Ho Municipal", "Hohoe Municipal", "Keta Municipal"],
};

export const storageMethods = [
  "Hermetic bags",
  "Open sacks",
  "Metal silo",
  "Ventilated crib",
];
