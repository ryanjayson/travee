import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal, TouchableOpacity, View, Text } from "react-native";
import { CalendarList } from "react-native-calendars";
import { useTheme } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import TouchButton from "../../../../../../../components/atoms/TouchButton";

export interface PlanDateModalProps {
  visible: boolean;
  onClose: () => void;
  initialStartDate: string | Date | null;
  initialEndDate?: string | Date | null;
  tripStartDate?: Date | string | null;
  onConfirm: (startDate: string, endDate: string | null) => void;
}

const formatDateToYYYYMMDD = (dateVal: any): string | null => {
  if (!dateVal) return null;
  if (typeof dateVal === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      return dateVal;
    }
    if (dateVal.includes("T")) {
      return dateVal.split("T")[0];
    }
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const PlanDateModal: React.FC<PlanDateModalProps> = ({
  visible,
  onClose,
  initialStartDate,
  initialEndDate,
  tripStartDate,
  onConfirm,
}) => {
  const { colors } = useTheme();

  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);

  const dateLabel = useMemo(() => {
    if (!tempStartDate) {
      return "Select date or date range";
    }
    if (!tempEndDate || tempStartDate === tempEndDate) {
      return "Single day plan";
    }
    return "Multiple days plan";
  }, [tempStartDate, tempEndDate]);

  // Sync initial dates when modal is opened
  useEffect(() => {
    if (visible) {
      setTempStartDate(formatDateToYYYYMMDD(initialStartDate));
      setTempEndDate(formatDateToYYYYMMDD(initialEndDate));
    }
  }, [visible, initialStartDate, initialEndDate]);

  const initialScrollDate = useMemo(() => {
    if (tempStartDate) return tempStartDate;
    if (tripStartDate) {
      const parsed = formatDateToYYYYMMDD(tripStartDate);
      if (parsed) return parsed;
    }
    return formatDateToYYYYMMDD(new Date())!;
  }, [tempStartDate, tripStartDate]);

  // Marked dates for period range highlight
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    const primaryColor = colors.primary || "#263F69";

    if (tempStartDate) {
      if (!tempEndDate || tempStartDate === tempEndDate) {
        marked[tempStartDate] = {
          startingDay: true,
          endingDay: true,
          selected: true,
          color: primaryColor,
          textColor: "#ffffff",
        };
      } else {
        marked[tempStartDate] = {
          startingDay: true,
          selected: true,
          color: primaryColor,
          textColor: "#ffffff",
        };

        marked[tempEndDate] = {
          endingDay: true,
          selected: true,
          color: primaryColor,
          textColor: "#ffffff",
        };

        // Fill days between tempStartDate and tempEndDate
        const [sYear, sMonth, sDay] = tempStartDate.split("-").map(Number);
        const [eYear, eMonth, eDay] = tempEndDate.split("-").map(Number);
        const current = new Date(sYear, sMonth - 1, sDay);
        const end = new Date(eYear, eMonth - 1, eDay);

        current.setDate(current.getDate() + 1);
        while (current < end) {
          const yyyy = current.getFullYear();
          const mm = String(current.getMonth() + 1).padStart(2, "0");
          const dd = String(current.getDate()).padStart(2, "0");
          const midStr = `${yyyy}-${mm}-${dd}`;
          marked[midStr] = {
            selected: true,
            color: `${primaryColor}20`,
            textColor: primaryColor,
          };
          current.setDate(current.getDate() + 1);
        }
      }
    }

    return marked;
  }, [tempStartDate, tempEndDate, colors.primary]);

  const handleDayPress = useCallback(
    (day: { dateString: string }) => {
      const pressedDateStr = day.dateString;
      if (!tempStartDate || (tempStartDate && tempEndDate)) {
        setTempStartDate(pressedDateStr);
        setTempEndDate(null);
      } else if (pressedDateStr < tempStartDate) {
        setTempStartDate(pressedDateStr);
        setTempEndDate(null);
      } else if (pressedDateStr === tempStartDate) {
        setTempEndDate(null);
      } else {
        setTempEndDate(pressedDateStr);
      }
    },
    [tempStartDate, tempEndDate]
  );

  const handleConfirm = useCallback(() => {
    if (tempStartDate) {
      const finalEndDate = tempEndDate && tempEndDate !== tempStartDate ? tempEndDate : null;
      onConfirm(tempStartDate, finalEndDate);
      onClose();
    }
  }, [tempStartDate, tempEndDate, onConfirm, onClose]);

  const calendarTheme = useMemo(
    () => ({
      todayTextColor: "#FFFFFF",
      todayBackgroundColor: "#B42318",
      selectedDayBackgroundColor: colors.primary || "#263F69",
      selectedDayTextColor: "#ffffff",
      textDayFontWeight: "600" as const,
      textMonthFontWeight: "800" as const,
      textMonthFontSize: 18,
    }),
    [colors.primary]
  );

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white pt-12">
        {/* Header */}
        <View className="flex-row justify-between items-center p-5 border-b border-gray-200 bg-white">
          <View className="flex-1">
            <Text className="text-2xl font-bold">Plan Date</Text>
            {dateLabel && (
              <Text className="text-base text-tertiary">{dateLabel}</Text>
            )}
          </View>
          {tempStartDate !== null && (
            <TouchableOpacity
              onPress={() => {
                setTempStartDate(null);
                setTempEndDate(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear selected dates"
              className="flex-row items-center mr-xl"
            >
              <Text className="text-base text-tertiary underline font-bold" style={{ color: colors.primary }}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close date selector"
          >
            <Icon name="close" size={24} color={colors.onSurfaceVariant || "#999"} />
          </TouchableOpacity>
        </View>

        {/* Calendar List */}
        <View className="flex-1">
          <CalendarList
            current={initialScrollDate}
            pastScrollRange={24}
            futureScrollRange={24}
            scrollEnabled={true}
            horizontal={false}
            showsVerticalScrollIndicator={true}
            hideArrows={true}
            markingType={"period"}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={calendarTheme}
            removeClippedSubviews={true}
            maxToRenderPerBatch={5}
            windowSize={5}
            initialNumToRender={4}
          />
        </View>

        {/* Confirm Button */}
        <View className="p-5 border-t border-gray-200 bg-white mb-6">
          <TouchButton
            buttonText="Confirm Selection"
            onPress={handleConfirm}
            disabled={!tempStartDate}
            className="h-7xl p-6"
          />
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(PlanDateModal);
