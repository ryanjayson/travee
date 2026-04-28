import React, { useMemo } from "react";
import { View, ScrollView } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import { TravelPlan } from "../../../../Travel/types/TravelDto";
import { useItineraryExpenses } from "../../../hooks/useExpense";
import { useItineraryNotes } from "../../../hooks/useNote";
import { useChecklistGroups, useChecklistItems } from "../../../hooks/useChecklist";
import { ActivityType } from "../../../../../types/enums";
import ActivityIcon from "../../../../../components/ActivityIcon";

interface DetailsTabProps {
  travelPlan: TravelPlan;
}

// ─── Mini Stat Card ────────────────────────────────────────────────────────────
const StatCard = ({
  icon,
  label,
  value,
  sub,
  accent = "#0C4C8A",
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) => (
  <View className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-4 flex-1 min-w-[44%]">
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

// ─── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
  <View className="flex-row items-center gap-2 mb-3 mt-5">
    <Icon name={icon} size={16} color="#0C4C8A" />
    <Text className="text-sm font-bold text-[#0C4C8A] uppercase tracking-wider">{title}</Text>
  </View>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const DetailsTab = ({ travelPlan }: DetailsTabProps) => {
  const { colors } = useTheme();
  const travelId = travelPlan.travel.id || "";

  const { data: expenses = [] } = useItineraryExpenses(travelId);
  const { data: notes = [] } = useItineraryNotes(travelId);
  const { data: checklistGroups = [] } = useChecklistGroups(travelId);
  const { data: checklistItems = [] } = useChecklistItems(travelId);

  // Flatten all activities from all sections
  const allActivities = useMemo(
    () => travelPlan.itinerarySection?.flatMap((s) => s.itineraryActivity || []) ?? [],
    [travelPlan]
  );

  // ─── Derived Stats ─────────────────────────────────────────────────────────
  const totalActivities = allActivities.length;
  const doneActivities = allActivities.filter((a) => a.isDone).length;

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const totalChecklist = checklistItems.length;
  const doneChecklist = checklistItems.filter((i) => i.isDone).length;

  // ─── Activity type breakdown ────────────────────────────────────────────────
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
            accent="#0C4C8A"
          />
          <StatCard
            icon="sticky-note-2"
            label="Notes"
            value={notes.length}
            sub={notes.length === 1 ? "1 note added" : `${notes.length} notes added`}
            accent="#7C3AED"
          />
        </View>


        <View className="flex-row flex-wrap gap-3">
          <StatCard
            icon="playlist-add-check"
            label="Checklist"
            value={`${doneChecklist}/${totalChecklist}`}
            sub={totalChecklist > 0 ? `${Math.round((doneChecklist / totalChecklist) * 100)}% complete` : "No items yet"}
            accent="#059669"
          />
          <StatCard
            icon="account-balance-wallet"
            label="Expenses"
            value={`$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub={`${expenses.length} transaction${expenses.length !== 1 ? "s" : ""}`}
            accent="#DC2626"
          />
        </View>



        {/* ─── Checklist Progress ────────────────────────────────────────── */}
        {totalChecklist > 0 && (
          <>
            <SectionHeader icon="folder-open" title="Checklist by Group" />
            <View className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
              {/* Ungrouped */}
              {ungroupedItems.length > 0 && (
                <View className="flex-row items-center px-4 py-3 border-b border-gray-50">
                  <Icon name="list" size={18} color="#888" />
                  <Text className="text-sm text-gray-600 font-medium flex-1 ml-3">General</Text>
                  <View className="items-end">
                    <Text className="text-sm font-bold text-[#0C4C8A]">
                      {ungroupedItems.filter((i) => i.isDone).length}/{ungroupedItems.length}
                    </Text>
                    <View className="bg-gray-200 h-1.5 w-20 rounded-full mt-1 overflow-hidden">
                      <View
                        className="bg-[#0C4C8A] h-1.5 rounded-full"
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
                  <Icon name="folder" size={18} color="#0C4C8A" />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm text-gray-800 font-semibold">{group.title}</Text>
                    {group.description ? (
                      <Text className="text-xs text-gray-400" numberOfLines={1}>{group.description}</Text>
                    ) : null}
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-bold text-[#0C4C8A]">
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
            <View className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
              {activityTypeBreakdown.map((entry, idx) => (
                <View
                  key={entry.type}
                  className={`flex-row items-center px-4 py-3 ${idx < activityTypeBreakdown.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <ActivityIcon type={entry.type as ActivityType} size={22} color="#0C4C8A" />
                  <Text className="text-sm text-gray-700 font-medium flex-1 ml-3 capitalize">
                    {activityTypeName(entry.type)}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="bg-[#0C4C8A]/10 px-3 py-1 rounded-full">
                      <Text className="text-xs font-bold text-[#0C4C8A]">{entry.count}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ─── Expenses Breakdown ────────────────────────────────────────── */}
        {expenses.length > 0 && (
          <>
            <SectionHeader icon="account-balance-wallet" title="Expenses by Currency" />
            <View className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
              {currencyBreakdown.map(([currency, amount], idx) => (
                <View
                  key={currency}
                  className={`flex-row items-center px-4 py-3 ${idx < currencyBreakdown.length - 1 ? "border-b border-gray-50" : ""}`}
                >
                  <View className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                    <Text className="text-xs font-bold text-red-600">{currency}</Text>
                  </View>
                  <Text className="text-sm text-gray-700 font-medium flex-1 ml-3">
                    {currency === "$" ? "USD" : currency}
                  </Text>
                  <Text className="text-base font-bold text-[#DC2626]">
                    {currency}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
              <View className="flex-row items-center px-4 py-3 bg-gray-50 border-t border-gray-100">
                <Icon name="receipt-long" size={18} color="#555" />
                <Text className="text-sm text-gray-600 font-semibold flex-1 ml-3">Total Transactions</Text>
                <Text className="text-sm font-bold text-gray-700">{expenses.length}</Text>
              </View>
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
