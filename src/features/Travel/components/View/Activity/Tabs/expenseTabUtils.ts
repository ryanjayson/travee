import { Ionicons } from "@expo/vector-icons";

export interface CategoryStyle {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

export const CATEGORY_ICONS: Record<string, CategoryStyle> = {
  food: { icon: "restaurant-outline", color: "#D97706", bg: "#FEF3C7" },
  transport: { icon: "car-outline", color: "#2563EB", bg: "#DBEAFE" },
  accommodation: { icon: "bed-outline", color: "#7C3AED", bg: "#EDE9FE" },
  shopping: { icon: "bag-handle-outline", color: "#DB2777", bg: "#FCE7F3" },
  entertainment: { icon: "film-outline", color: "#059669", bg: "#D1FAE5" },
  health: { icon: "medkit-outline", color: "#DC2626", bg: "#FEE2E2" },
  default: { icon: "cash-outline", color: "#263F69", bg: "#DBEAFE" },
};

export const getCategoryStyle = (category?: string): CategoryStyle => {
  const key = (category ?? "").toLowerCase();
  return CATEGORY_ICONS[key] ?? CATEGORY_ICONS.default;
};

export const formatCurrency = (amount: number, currency?: string): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency ?? ""} ${amount.toFixed(2)}`.trim();
  }
};
