import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Svg, { Circle, G } from "react-native-svg";
import ActivityIcon from "../../../../../components/ActivityIcon";
import { ActivityType, ExpenseCategory } from "../../../../../types/enums";
import { TravelPlan } from "../../../../Travel/types/TravelDto";
import { useChecklistGroups, useChecklistItems } from "../../../hooks/useChecklist";
import { useItineraryExpenses } from "../../../hooks/useExpense";
import { useItineraryNotes } from "../../../hooks/useNote";
import { getExpenseCategoryColor } from "../../Forms/Expense/ExpenseCategoryIcon";

interface DetailsTabProps {
  travelPlan: TravelPlan;
}

const StatCard = ({
  icon,
  label,
  value,
  sub,
  accent = "#263F69",
}: {
  icon: string | any;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) => (
  <View className="bg-white rounded-2xl border border-[#e0e0e0] p-4 flex-1 min-w-[44%]">
    <View
      className="w-9 h-9 rounded-full items-center justify-center mb-3"
      style={{ backgroundColor: accent + "18" }}
    >
      <Icon name={icon} size={20} color={accent} />
    </View>
    <Text className="text-2xl font-bold text-[#1A1A1A]">{value}</Text>
    <Text className="text-xs font-semibold text-gray-500 mt-0.5 uppercase tracking-wider">{label}</Text>
    {sub ? <Text className="text-[11px] text-gray-400 mt-1">{sub}</Text> : null}
  </View>
);

const SectionHeader = ({ icon, title }: { icon: string | any; title: string }) => (
  <View className="flex-1 justify-start gap-0 mt-5">
    <Text className="text-sm font-semibold tracking-wider uppercase mb-1">
      {title}
    </Text>
    {/* <Text className="text-xs font-normal text-gray-400 mb-3">
      Click row to see details
    </Text> */}
  </View>
);

// ─── Donut Chart Component ───────────────────────────────────────────────────
const DonutChart = ({ data, total }: { data: Array<{ amount: number; color: string }>; total: number }) => {
  const radius = 35;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  
  let accumulatedPercent = 0;

  return (
    <View style={{ width: 100, height: 100, alignItems: "center", justifyContent: "center" }}>
      <Svg width={100} height={100} viewBox="0 0 100 100">
        <G transform="rotate(-90 50 50)">
          {/* Background circle */}
          <Circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {data.map((slice, index) => {
            const percent = slice.amount / total;
            const strokeDashoffset = circumference - (percent * circumference);
            const rotation = accumulatedPercent * 360;
            accumulatedPercent += percent;

            return (
              <Circle
                key={index}
                cx="50"
                cy="50"
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${percent * circumference} ${circumference}`}
                strokeDashoffset={0}
                fill="transparent"
                transform={`rotate(${rotation} 50 50)`}
              />
            );
          })}
        </G>
      </Svg>
      {/* Central absolute text for total */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 9, fontWeight: "bold", color: "#888888" }} className="uppercase tracking-wider">Total</Text>
        <Text style={{ fontSize: 13, fontWeight: "bold", color: "#1A1A1A" }} numberOfLines={1}>
          ${total >= 1000 ? `${(total/1000).toFixed(1)}k` : Math.round(total)}
        </Text>
      </View>
    </View>
  );
};

const DetailsTab = ({ travelPlan }: DetailsTabProps) => {
  const { colors } = useTheme();
  const travelId = travelPlan.travel.id || "";

  const { data: expenses = [] } = useItineraryExpenses(travelId);
  const { data: notes = [] } = useItineraryNotes(travelId);
  const { data: checklistGroups = [] } = useChecklistGroups(travelId);
  const { data: checklistItems = [] } = useChecklistItems(travelId);

  const allActivities = useMemo(
    () => travelPlan.itinerarySection?.flatMap((s) => s.itineraryActivity || []) ?? [],
    [travelPlan]
  );

  const totalActivities = allActivities.length;
  const doneActivities = allActivities.filter((a) => a.isDone).length;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const totalChecklist = checklistItems.length;
  const doneChecklist = checklistItems.filter((i) => i.isDone).length;

  const activityTypeBreakdown = useMemo(() => {
    const map: Record<number, number> = {};
    allActivities.forEach((a) => {
      const type = a.type ?? ActivityType.none;
      map[type] = (map[type] || 0) + 1;
    });
    return Object.entries(map)
      .map(([type, count]) => ({ type: Number(type), count }))
      .filter((e) => e.type !== ActivityType.none)
      .sort((a, b) => b.count - a.count);
  }, [allActivities]);

  const activityTypeName = (type: number) =>
    Object.keys(ActivityType)
      .filter((k) => isNaN(Number(k)) && ActivityType[k as keyof typeof ActivityType] === type)
      .map((k) => k.replace(/([A-Z])/g, " $1").trim())
      .join("") || "Other";

  // ─── Checklist group breakdown ──────────────────────────────────────────────
  const groupBreakdown = useMemo(() => {
    return checklistGroups.map((g) => {
      const groupItems = checklistItems.filter((i) => i.checklistGroupId === g.id);
      return {
        ...g,
        total: groupItems.length,
        done: groupItems.filter((i) => i.isDone).length,
      };
    });
  }, [checklistGroups, checklistItems]);

  const ungroupedItems = checklistItems.filter((i) => !i.checklistGroupId && !i.activityId);

  // ─── Expense currency breakdown ─────────────────────────────────────────────
  const currencyBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cur = e.currency || "$";
      map[cur] = (map[cur] || 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // ─── Expense category breakdown ─────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const map: Record<number, { amount: number; name: string; color: string }> = {};
    expenses.forEach((e) => {
      const cat = e.expenseCategory ?? ExpenseCategory.None;
      const amount = e.amount || 0;
      if (!map[cat]) {
        const name = cat === ExpenseCategory.None
          ? "General"
          : ExpenseCategory[cat].replace(/([A-Z])/g, " $1").trim();
        const color = getExpenseCategoryColor(cat);
        map[cat] = { amount: 0, name, color };
      }
      map[cat].amount += amount;
    });
    return Object.entries(map)
      .map(([cat, val]) => ({ category: Number(cat), ...val }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="px-4 py-3">

        {/* ─── Top Summary Cards ─────────────────────────────────────────── */}
        <SectionHeader icon="dashboard" title="Overview" />
        <View className="flex-row flex-wrap gap-3 mb-3">
          <StatCard
            icon="event-note"
            label="Activities"
            value={totalActivities}
            sub={doneActivities > 0 ? `${doneActivities} completed` : "None done yet"}
            accent="#263F69"
          />
            <StatCard
            icon="playlist-add-check"
            label="Checklist"
            value={`${doneChecklist}/${totalChecklist}`}
            sub={totalChecklist > 0 ? `${Math.round((doneChecklist / totalChecklist) * 100)}% complete` : "No items yet"}
            accent="#059669"
          />
        </View>


        {/* <View className="flex-row flex-wrap gap-3">
        
          <StatCard
            icon="account-balance-wallet"
            label="Expenses"
            value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub={`${expenses.length} transaction${expenses.length !== 1 ? "s" : ""}`}
            accent="#DC2626"
          />
        </View> */}

        {/* ─── Expenses Breakdown ────────────────────────────────────────── */}
        {expenses.length > 0 && totalExpenses > 0 && (
          <>
            <SectionHeader icon="pie-chart" title="Expense Distribution" />
            <View className="bg-white rounded-2xl border border-[#e0e0e0] p-4 flex-row items-center gap-6">
              {/* Column 1: Pie/Donut Chart */}
              <View className="items-center justify-center pr-4 border-r border-gray-100">
                <DonutChart data={categoryBreakdown} total={totalExpenses} />
              </View>

              {/* Column 2: Legend List */}
              <View className="flex-1 gap-2.5">
                {categoryBreakdown.map((entry) => (
                  <View key={entry.category} className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                      {/* Dot icon with category color */}
                      <View 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <Text className="text-sm font-semibold text-gray-700 capitalize flex-1" numberOfLines={1}>
                        {entry.name}
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-gray-800 ml-2">
                      ${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ─── Expenses Breakdown ────────────────────────────────────────── */}
        {expenses.length > 0 && (
          <>
            <SectionHeader icon="account-balance-wallet" title="Expenses by Currency" />
            <View className="bg-white rounded-2xl border border-[#e0e0e0] overflow-hidden">
              {currencyBreakdown.map(([currency, amount], idx) => (
                <View
                  key={currency}
                  className={`flex-row items-center px-4 py-4 ${idx < currencyBreakdown.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                    <Text className="text-sm font-bold text-red-600">{currency}</Text>
                  </View>
                  <Text className="text-base text-gray-700 font-medium flex-1 ml-3">
                    {currency === "$" ? "USD" : currency}
                  </Text>
                  <Text className="text-md font-bold text-[#DC2626]">
                    {currency}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
              <View className="flex-row items-center px-4 py-3 bg-gray-50 border-t border-gray-100">
                <Icon name="receipt-long" size={24} color="#555" />
                <Text className="text-sm text-gray-600 font-semibold flex-1 ml-3">Total Transactions</Text>
                <Text className="text-base font-bold text-gray-700">{expenses.length}</Text>
              </View>
            </View>
          </>
        )}


        {/* ─── Checklist Progress ────────────────────────────────────────── */}
        {totalChecklist > 0 && (
          <>
            <SectionHeader icon="folder-open" title="Checklist by Group" />
            <View className="bg-white rounded-2xl border border-[#e0e0e0] overflow-hidden">
              {/* Ungrouped */}
              {ungroupedItems.length > 0 && (
                <View className="flex-row items-center px-4 py-3 border-b border-gray-50">
                  <Icon name="list" size={24} color="#888" />
                  <Text className="text-base text-gray-600 font-medium flex-1 ml-3">General</Text>
                  <View className="items-end">
                    <Text className="text-base text-gray-400 mr-1 bg-gray-200 px-2 border border-gray-200 rounded-full">
                      {ungroupedItems.filter((i) => i.isDone).length}/{ungroupedItems.length}
                    </Text>
                    <View className="bg-gray-200 h-2 w-20 rounded-full mt-1 overflow-hidden">
                      <View
                        className="bg-[#263F69] h-2 rounded-full"
                        style={{
                          width: `${Math.round((ungroupedItems.filter((i) => i.isDone).length / ungroupedItems.length) * 100)}%`,
                        }}
                      />
                    </View>
                  </View>
                </View>
              )}
              {/* Groups */}
              {groupBreakdown.map((group, idx) => (
                <View
                  key={group.id}
                  className={`flex-row items-center px-4 py-3 ${idx < groupBreakdown.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <Icon name="folder" size={24} color="#263F69" />
                  <View className="flex-1 ml-3">
                    <Text className="text-base text-gray-800 font-semibold">{group.title}</Text>
                    {group.description ? (
                      <Text className="text-xs text-gray-400" numberOfLines={1}>{group.description}</Text>
                    ) : null}
                  </View>
                  <View className="items-end">
                    <Text className="text-base text-gray-400 mr-1 bg-gray-200 px-2 border border-gray-200 rounded-full">
                      {group.done}/{group.total}
                    </Text>
                    {group.total > 0 && (
                      <View className="bg-gray-200 h-1.5 w-20 rounded-full mt-1 overflow-hidden">
                        <View
                          className="bg-[#059669] h-1.5 rounded-full"
                          style={{ width: `${Math.round((group.done / group.total) * 100)}%` }}
                        />
                      </View>
                    )}
                  </View>
                </View>
              ))}
              {checklistGroups.length === 0 && ungroupedItems.length === 0 && (
                <View className="p-4 items-center">
                  <Text className="text-sm text-gray-400">No checklist groups created yet.</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ─── Activity Type Breakdown ───────────────────────────────────── */}
        {activityTypeBreakdown.length > 0 && (
          <>
            <SectionHeader icon="category" title="Activities by Type" />
            <View className="bg-white rounded-2xl border border-[#e0e0e0] overflow-hidden">
              {activityTypeBreakdown.map((entry, idx) => (
                <View
                  key={entry.type}
                  className={`flex-row items-center px-4 py-3 ${idx < activityTypeBreakdown.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <ActivityIcon type={entry.type as ActivityType} size={24} />
                  <Text className="text-base text-gray-700 font-medium flex-1 ml-3 capitalize">
                    {activityTypeName(entry.type)}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-[#263F69]/10 px-3 py-1 rounded-full">
                      <Text className="text-base font-bold text-[#263F69]">{entry.count}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ─── Notes ────────────────────────────────────────────────────── */}
        {notes.length > 0 && (
          <>
            <SectionHeader icon="sticky-note-2" title="Recent Notes" />
            <View className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
              {notes.slice(0, 3).map((note, idx) => (
                <View
                  key={note.id}
                  className={`px-4 py-3 ${idx < Math.min(notes.length, 3) - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>{note.title}</Text>
                  {note.content ? (
                    <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={2}>{note.content}</Text>
                  ) : null}
                  <View className="flex-row items-center gap-1 mt-1">
                    <Icon name="schedule" size={11} color="#BDBDBD" />
                    <Text className="text-[10px] text-gray-400">
                      {note.createdAt
                        ? new Date(note.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                        : ""}
                    </Text>
                    {note.images && note.images.length > 0 && (
                      <>
                        <Icon name="photo" size={11} color="#BDBDBD" style={{ marginLeft: 6 }} />
                        <Text className="text-[10px] text-gray-400">{note.images.length}</Text>
                      </>
                    )}
                  </View>
                </View>
              ))}
              {notes.length > 3 && (
                <View className="px-4 py-2 bg-gray-50 border-t border-gray-100 items-center">
                  <Text className="text-xs text-gray-400">+{notes.length - 3} more notes</Text>
                </View>
              )}
            </View>
          </>
        )}

      </View>
    </ScrollView>
  );
};

export default DetailsTab;
