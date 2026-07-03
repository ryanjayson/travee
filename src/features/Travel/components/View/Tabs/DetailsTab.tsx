import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ScrollView, TouchableOpacity, View, Text } from "react-native";
import { useTheme } from "react-native-paper";
import Svg, { Circle, G } from "react-native-svg";
import ActivityIcon from "../../../../../components/ActivityIcon";
import { ActivityType, ExpenseCategory, TripType, getActivityTypeLabel } from "../../../../../types/enums";
import TripIcon from "../../../../../components/TripIcon";
import { TravelPlan } from "../../../../Travel/types/TravelDto";
import { useChecklistGroups, useChecklistItems } from "../../../hooks/useChecklist";
import { useItineraryExpenses } from "../../../hooks/useExpense";
import { useItineraryNotes } from "../../../hooks/useNote";
import { getExpenseCategoryColor } from "../../Forms/Expense/ExpenseCategoryIcon";

interface DetailsTabProps {
  travelPlan: TravelPlan;
  scrollEnabled?: boolean;
  onScrollY?: (y: number) => void;
  onTabChange?: (tabId: string) => void;
}

const StatCard = ({
  icon,
  label,
  value,
  sub,
  accent = "#263F69",
  onPress,
}: {
  icon: string | any;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    className="bg-white rounded-3xl border border-[#e0e0e0] p-4 flex-1 min-w-[44%]"
    style={{ backgroundColor: accent + "" }}
    accessibilityRole="button"
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View
      className="w-9 h-9 rounded-full justify-center mb-3"
      // style={{ backgroundColor: accent + "20" }}
    >
      <Icon name={icon} size={30} color={'white'} />
    </View>
    <Text className="text-3xl font-bold text-white">{value}</Text>
    <Text className="text-xs font-semibold text-gray-100 uppercase tracking-wider mt-2">{label}</Text>
    {sub ? <Text className="text-[11px] text-gray-300">{sub}</Text> : null}
  </TouchableOpacity>
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

const DetailsTab = ({ travelPlan, scrollEnabled = false, onScrollY, onTabChange }: DetailsTabProps) => {
  const { colors } = useTheme();
  const travelId = travelPlan.travel.id || "";
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [showMoreButton, setShowMoreButton] = useState<boolean>(false);
  const [isNoteDescriptionExpanded, setIsNoteDescriptionExpanded] = useState<boolean>(false);
  const [showNoteMoreButton, setShowNoteMoreButton] = useState<boolean>(false);

  const { data: expenses = [] } = useItineraryExpenses(travelId);
  // const { data: notes = [] } = useItineraryNotes(travelId);
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

  const activityTypeName = (type: number) => getActivityTypeLabel(type);

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
      <View className="px-4">

        {/* ─── Top Summary Cards ─────────────────────────────────────────── */}
        <SectionHeader icon="dashboard" title="Overview" />
        <View className="flex-row flex-wrap gap-3 mb-4">
          <StatCard
            icon="event-note"
            label="Activities"
            value={totalActivities}
            sub={doneActivities > 0 ? `${doneActivities} completed` : "None done yet"}
            accent="#263F69"
            onPress={() => onTabChange?.("itinerary")}
          />
          <StatCard
            icon="playlist-add-check"
            label="Checklist"
            value={`${doneChecklist}/${totalChecklist}`}
            sub={totalChecklist > 0 ? `${Math.round((doneChecklist / totalChecklist) * 100)}% complete` : "No items yet"}
            accent="#059669"
            onPress={() => onTabChange?.("checklist")}
          />
        </View>

        {/* <View className="flex-row items-center flex-wrap rounded-lg p-2 mb-4">
          <View className="flex-row items-center my-1 pr-3 border-r border-[#DDD]">
            <View className="flex-row items-center">
                <Icon name="calendar-month" size={28} color={"#858585"} />
                <View className="flex-col px-1">
                    <Text className="text-xs text-tertiary leading-3 pb-2">Trip Duration  {travelPlan.travel?.startOrDepartureDate && travelPlan.travel?.endOrReturnDate
                        ? ` (${Math.ceil((new Date(travelPlan.travel.endOrReturnDate).getTime() - new Date(travelPlan.travel.startOrDepartureDate).getTime()) / (1000 * 60 * 60 * 24))} days)`
                        : ""}</Text>
                    <Text className="text-lg font-bold text-secondary -mt-2">
                      {travelPlan.travel?.startOrDepartureDate
                        ? new Date(travelPlan.travel.startOrDepartureDate).toLocaleDateString("en-US", { month: "short", day:"2-digit"})
                        : ""}
    
                        - {travelPlan.travel?.endOrReturnDate
                        ? new Date(travelPlan.travel.endOrReturnDate).toLocaleDateString("en-US", { month: "short", day:"2-digit" })
                        : ""}
                    </Text>
                </View>             
            </View>
          </View>
          <View className="flex-row items-center my-1 pl-3">
            <Icon name="location-pin" size={24} color={"#B42318"} />
            <View className="flex-row items-center ">
            {travelPlan.travel.destination ? (
              <Text className="text-[#183B7A] font-medium mx-1 " numberOfLines={1} ellipsizeMode="tail">
              {travelPlan.travel.destination}
              </Text>
            ) : (
              <Text className="text-tertiary italic text-base  mx-1 " numberOfLines={1} ellipsizeMode="tail">
                    Not set
                  </Text>
                  )}
          </View>
            
            </View>
          </View>  */}

{travelPlan.travel.description && (
    <View className="bg-white rounded-3xl border border-[#e0e0e0] p-4 mb-3 flex-row items-start gap-4 mb-4">
            <View className="flex-1 gap-2">
              <Text className="text-xs font-bold uppercase tracking-wide">About this trip</Text>

               {travelPlan.travel.type != null && travelPlan.travel.type !== TripType.none && (
              <View className="flex-row items-center gap-2">
                <TripIcon type={travelPlan.travel.type} size={34} showIconOnly/>
                  <Text className="text-base font-bold text-[#1A1A1A] capitalize">
                    {String(TripType[travelPlan.travel.type]).replace(/([A-Z])/g, " $1").trim()}
                  </Text>
              </View>
               )}

            <View>
            <Text 
               className="text-base leading-6"
               numberOfLines={isDescriptionExpanded ? undefined : 3}
               onTextLayout={(e) => {
                 if (!showMoreButton && e.nativeEvent.lines.length >= 3) {
                   setShowMoreButton(true);
                 }
              }}
            >
              {travelPlan.travel.description || null}
            </Text>
            
            {travelPlan.travel.description && showMoreButton && (
              <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                <Text className="text-sm font-black text-[#555] mt-1 underline">
                  {isDescriptionExpanded ? "Show less" : "Show more"}
                </Text>
              </TouchableOpacity>
            )}
            </View>
          </View>
        </View>
) }
      

        <View className="px-4">
            <Text 
               className="text-md text-tertiary leading-6"
               numberOfLines={isNoteDescriptionExpanded ? undefined : 2}
               onTextLayout={(e) => {
                 if (!showNoteMoreButton && e.nativeEvent.lines.length >= 2) {
                   setShowNoteMoreButton(true);
                 }
              }}
            >
              {travelPlan.travel.notes || null}
            </Text>
            
            {travelPlan.travel.notes && showMoreButton && (
              <TouchableOpacity onPress={() => setIsNoteDescriptionExpanded(!isNoteDescriptionExpanded)}>
                <Text className="text-sm font-medium text-[#555] mt-1 underline">
                  {isNoteDescriptionExpanded ? "Show less" : "Show more"}
                </Text>
              </TouchableOpacity>
            )}
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
        {false && expenses.length > 0 && totalExpenses > 0 && (
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
        {false && expenses.length > 0 && (
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
        {false && totalChecklist > 0 && (
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

      </View>
    </ScrollView>
  );
};

export default DetailsTab;
