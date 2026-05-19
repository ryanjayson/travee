import React from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useItineraryExpensesByActivity } from "../../../../hooks/useExpense";
import { ItineraryExpense } from "../../../../types/TravelDto";

// ─── Category icon map ────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  food: { icon: "restaurant-outline", color: "#D97706", bg: "#FEF3C7" },
  transport: { icon: "car-outline", color: "#2563EB", bg: "#DBEAFE" },
  accommodation: { icon: "bed-outline", color: "#7C3AED", bg: "#EDE9FE" },
  shopping: { icon: "bag-handle-outline", color: "#DB2777", bg: "#FCE7F3" },
  entertainment: { icon: "film-outline", color: "#059669", bg: "#D1FAE5" },
  health: { icon: "medkit-outline", color: "#DC2626", bg: "#FEE2E2" },
  default: { icon: "cash-outline", color: "#263F69", bg: "#DBEAFE" },
};

function getCategoryStyle(category?: string) {
  const key = (category ?? "").toLowerCase();
  return CATEGORY_ICONS[key] ?? CATEGORY_ICONS.default;
}

function formatCurrency(amount: number, currency?: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency ?? ""} ${amount.toFixed(2)}`.trim();
  }
}

// ─── Single expense row ───────────────────────────────────────────────────────
interface ExpenseRowProps {
  item: ItineraryExpense;
  onPress: (item: ItineraryExpense) => void;
}

const ExpenseRow = ({ item, onPress }: ExpenseRowProps) => {
  const style = getCategoryStyle(item.category);
  return (
    <TouchableOpacity
      className="flex-row items-center py-3 border-b border-gray-100 active:bg-gray-50"
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${item.title} expense`}
    >
      <View
        className="w-10 h-10 rounded-full justify-center items-center mr-3"
        style={{ backgroundColor: style.bg }}
      >
        <Ionicons name={style.icon} size={20} color={style.color} />
      </View>

      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          {item.dateTime
            ? new Date(item.dateTime).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "–"}
        </Text>
      </View>

      <View className="items-end">
        <Text className="text-lg text-[#263F69] mr-2">
          {formatCurrency(item.amount, item.currency)}
        </Text>
      </View>
        <Ionicons name="chevron-forward" size={28} color="#9CA3AF" style={{ marginTop: 2 }} />

    </TouchableOpacity>
  );
};

interface TotalBarProps {
  expenses: ItineraryExpense[];
}

const TotalBar = ({ expenses }: TotalBarProps) => {
  const total = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const currency = expenses[0]?.currency;
  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-[#EFF6FF] border-b border-blue-100">
      <Text className="text-xs font-bold text-[#263F69] uppercase tracking-wider">
        Total · {expenses.length} {expenses.length === 1 ? "item" : "items"}
      </Text>
      <Text className="text-base font-bold text-[#263F69]">
        {formatCurrency(total, currency)}
      </Text>
    </View>
  );
};

interface ExpensesTabProps {
  activityId: string;
  onEditExpense: (expense: ItineraryExpense) => void;
}

const ExpensesTab = ({ activityId, onEditExpense }: ExpensesTabProps) => {
  const { data: expenses, isLoading, isError, refetch } = useItineraryExpensesByActivity(activityId);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-10">
        <ActivityIndicator size="small" color="#263F69" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center py-10 px-6 ">
        <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
        <Text className="text-red-500 text-sm mt-2 text-center">Failed to load expenses.</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 px-5 py-2 bg-red-50 rounded-full"
          accessibilityRole="button"
        >
          <Text className="text-red-500 text-sm font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <View className="flex-1 justify-center items-center py-10 px-6">
        <View className="w-16 h-16 rounded-full bg-blue-50 justify-center items-center mb-3">
          <Ionicons name="cash-outline" size={32} color="#93C5FD" />
        </View>
        <Text className="text-base font-semibold text-gray-600">No expenses yet</Text>
        <Text className="text-sm text-gray-400 mt-1 text-center">
          Tap the + button to log your first expense.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ paddingBottom: 100 }}>
      <TotalBar expenses={expenses} />
      {expenses.map((item) => (
        <View key={item.id} className="px-4 bg-white">
          <ExpenseRow item={item} onPress={onEditExpense} />
        </View>
      ))}
    </View>
  );
};

export default ExpensesTab;
