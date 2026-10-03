import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal, TouchableOpacity, View, Text } from "react-native";
import { CalendarList } from "react-native-calendars";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import TouchButton from "../../../../components/atoms/TouchButton";
import { TravelStatus } from "../../../../types/enums";
import { Travel } from "../../types/TravelDto";
import { useTravels } from "../../hooks/useTravel";

import {
  computeBlockedTravelDates,
  computeMarkedDates,
  hasBlockedDateInRange,
} from "./createOrEditUtils";

export interface TravelDateModalProps {
  visible: boolean;
  onClose: () => void;
  initialStartDate: Date | null;
  initialEndDate: Date | null;
  tripData?: Travel;
  mode?: "create" | "edit";
  onConfirm: (startDate: Date, endDate: Date | null) => void;
}

const CALENDAR_THEME: any = {
  todayTextColor: "#FFFFFF",
  todayBackgroundColor: "#B42318",
  selectedDayBackgroundColor: "#FFFFFF",
  selectedDayTextColor: "#ffffff",
  textDayFontWeight: "600",
  textMonthFontWeight: "800",
  textMonthFontSize: 18,
};

const TravelDateModal: React.FC<TravelDateModalProps> = ({
  visible,
  onClose,
  initialStartDate,
  initialEndDate,
  tripData,
  onConfirm,
}) => {
  const { data: travels } = useTravels();

  const [tempDepartureDate, setTempDepartureDate] = useState<Date | null>(null);
  const [tempReturnDate, setTempReturnDate] = useState<Date | null>(null);

  const dateLabel = useMemo(() => {
    if (!tempDepartureDate) {
      return "Select date or date range";
    }
    if (
      !tempReturnDate ||
      tempDepartureDate.getTime() === tempReturnDate.getTime()
    ) {
      return "Day tour only";
    }
    return "Multiple days trip";
  }, [tempDepartureDate, tempReturnDate]);

  // Sync initial dates when modal is opened
  useEffect(() => {
    if (visible) {
      setTempDepartureDate(
        initialStartDate ? new Date(initialStartDate) : null
      );
      setTempReturnDate(initialEndDate ? new Date(initialEndDate) : null);
    }
  }, [visible, initialStartDate, initialEndDate]);

  // Memoize blocked dates calculation using pure helper
  const blockedDates = useMemo(
    () => computeBlockedTravelDates(travels, tripData?.id),
    [travels, tripData?.id]
  );

  // Memoize marked dates for range highlight using pure helper
  const markedDates = useMemo(
    () => computeMarkedDates(tempDepartureDate, tempReturnDate, blockedDates),
    [tempDepartureDate, tempReturnDate, blockedDates]
  );

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
      } else if (
        hasBlockedDateInRange(tempDepartureDate, pressedDate, blockedDates)
      ) {
        // A date is already selected in between, so reset start to pressed
        setTempDepartureDate(pressedDate);
        setTempReturnDate(null);
      } else {
        setTempReturnDate(pressedDate);
      }
    },
    [tempDepartureDate, tempReturnDate, blockedDates]
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
        <View
          className={
            "flex-row justify-between items-center p-5 " +
            "border-b border-gray-200 bg-white"
          }
        >
          <View className="flex-1">
            <Text className="text-2xl font-bold">Travel Dates</Text>
            {dateLabel && (
              <Text className="text-base text-tertiary">{dateLabel}</Text>
            )}
          </View>
          {tempDepartureDate !== null && (
            <TouchableOpacity
              onPress={() => {
                setTempDepartureDate(null);
                setTempReturnDate(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear selected dates"
              className="flex-row items-center mr-xl"
            >
              <Text className="text-base text-tertiary underline font-bold">Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close date selector"
          >
            <Icon name="close" size={24} color={"#999"} />
          </TouchableOpacity>
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
