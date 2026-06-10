import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal, TouchableOpacity, View, Text } from "react-native";
import { CalendarList } from "react-native-calendars";
import { useTheme } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import TouchButton from "../../../../components/atoms/TouchButton";
import { TravelStatus } from "../../../../types/enums";
import { Travel } from "../../types/TravelDto";
import { useTravels } from "../../hooks/useTravel";

export interface TravelDateModalProps {
  visible: boolean;
  onClose: () => void;
  initialStartDate: Date | null;
  initialEndDate: Date | null;
  tripData?: Travel;
  mode?: "create" | "edit";
  onConfirm: (startDate: Date, endDate: Date | null) => void;
}

const CALENDAR_THEME = {
  todayTextColor: "#FFFFFF",
  todayBackgroundColor: "#B42318",
  selectedDayBackgroundColor: "#FFFFFF",
  selectedDayTextColor: "#ffffff",
};

const TravelDateModal: React.FC<TravelDateModalProps> = ({
  visible,
  onClose,
  initialStartDate,
  initialEndDate,
  tripData,
  mode = "create",
  onConfirm,
}) => {
  const { colors } = useTheme();
  const { data: travels } = useTravels();

  const [tempDepartureDate, setTempDepartureDate] = useState<Date | null>(null);
  const [tempReturnDate, setTempReturnDate] = useState<Date | null>(null);

  // Sync initial dates when modal is opened
  useEffect(() => {
    if (visible) {
      setTempDepartureDate(initialStartDate ? new Date(initialStartDate) : null);
      setTempReturnDate(initialEndDate ? new Date(initialEndDate) : null);
    }
  }, [visible, initialStartDate, initialEndDate]);

  // Memoize blocked dates calculation
  const blockedDates = useMemo(() => {
    const dates: Record<string, any> = {};
    if (!travels) return dates;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    travels.forEach((t: any) => {
      if (tripData && t.id === tripData.id) return;
      if (
        t.isArchived ||
        [TravelStatus.Cancelled, TravelStatus.Archieved, TravelStatus.Past].includes(
          t.status as TravelStatus
        )
      ) {
        return;
      }

      if (t.startOrDepartureDate) {
        const start = new Date(t.startOrDepartureDate);
        start.setHours(0, 0, 0, 0);
        const end = t.endOrReturnDate ? new Date(t.endOrReturnDate) : start;
        end.setHours(0, 0, 0, 0);

        if (end >= today) {
          let current = new Date(start);
          const isOngoing = start <= today && end >= today;
          const color = isOngoing ? "#E8F5E8" : "#E3F2FD";
          const textColor = isOngoing ? "#2E7D32" : "#263F69";

          while (current <= end) {
            const dateStr = current.toISOString().split("T")[0];
            dates[dateStr] = {
              disableTouchEvent: true,
              selected: true,
              color: color,
              textColor: textColor,
            };
            current.setDate(current.getDate() + 1);
          }
        }
      }
    });
    return dates;
  }, [travels, tripData]);

  // Memoize marked dates for range highlight
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    const start = tempDepartureDate;
    const end = tempReturnDate;

    if (start && !isNaN(start.getTime())) {
      const startStr = start.toISOString().split("T")[0];
      marked[startStr] = {
        startingDay: true,
        selected: true,
        color: "#263F69",
        textColor: "#ffffff",
      };

      if (end && !isNaN(end.getTime())) {
        const endStr = end.toISOString().split("T")[0];
        marked[endStr] = {
          endingDay: true,
          selected: true,
          color: "#263F69",
          textColor: "#ffffff",
        };

        let currentDate = new Date(start.getTime());
        currentDate.setDate(currentDate.getDate() + 1);

        while (currentDate.toDateString() !== end.toDateString() && currentDate < end) {
          const midStr = currentDate.toISOString().split("T")[0];
          marked[midStr] = {
            selected: true,
            color: "#263F6920",
            textColor: "#ffffff",
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    return {
      ...blockedDates,
      ...marked,
    };
  }, [tempDepartureDate, tempReturnDate, blockedDates]);

  // Helper to check for blocked dates in the middle of a selected range
  const hasBlockedDateInBetween = useCallback((start: Date, end: Date) => {
    let current = new Date(start.getTime());
    current.setDate(current.getDate() + 1);
    
    while (current.getTime() < end.getTime()) {
      const dateStr = current.toISOString().split("T")[0];
      if (blockedDates[dateStr]) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  }, [blockedDates]);

  // Memoize date selection handler
  const handleDayPress = useCallback(
    (day: any) => {
      const pressedDate = new Date(day.timestamp);
      if (!tempDepartureDate || (tempDepartureDate && tempReturnDate)) {
        setTempDepartureDate(pressedDate);
        setTempReturnDate(null);
      } else if (pressedDate < tempDepartureDate) {
        setTempDepartureDate(pressedDate);
        setTempReturnDate(null);
      } else if (hasBlockedDateInBetween(tempDepartureDate, pressedDate)) {
        // A date is already selected in between, so reset start date to pressed date
        setTempDepartureDate(pressedDate);
        setTempReturnDate(null);
      } else {
        setTempReturnDate(pressedDate);
      }
    },
    [tempDepartureDate, tempReturnDate, hasBlockedDateInBetween]
  );

  const handleConfirm = useCallback(() => {
    if (tempDepartureDate) {
      onConfirm(tempDepartureDate, tempReturnDate);
    }
  }, [tempDepartureDate, tempReturnDate, onConfirm]);

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
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close date selector"
          >
            <Icon name="close" size={28} color={colors.onSurface} />
          </TouchableOpacity>
          <Text className="text-xl font-bold">Travel Dates</Text>
          <View className="w-10" />
        </View>

        {/* Calendar List */}
        <View className="flex-1">
          <CalendarList
            pastScrollRange={36}
            futureScrollRange={12}
            scrollEnabled={true}
            horizontal={false}
            showsVerticalScrollIndicator={true}
            hideArrows={true}
            markingType={"period"}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            theme={CALENDAR_THEME}
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
            disabled={!tempDepartureDate}
            className="h-7xl p-6"
          />
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(TravelDateModal);
