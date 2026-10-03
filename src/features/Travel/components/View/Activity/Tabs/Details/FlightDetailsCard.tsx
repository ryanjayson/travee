import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { FlightDetailsDto } from "../../../../../types/TravelDto";
import { Barcode } from "../../../../../../../components/Barcode";
import {
  safeFormatTime,
  safeFormatDate,
} from "../../../../../../../utils/dateTimeUtils";
import { FadeInView } from "@/components/animations";
import { parseAirport } from "../../../../../../../utils/airportUtils";
import { copyToClipboard } from "./activityDetailUtils";

interface FlightDetailsCardProps {
  data: FlightDetailsDto;
}

export const FlightDetailsCard: React.FC<FlightDetailsCardProps> = ({ data }) => {
  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text, label);
  };

  return (
    <View
      className={
        "rounded-3xl border-gray-150 mb-6 shadow-md overflow-hidden " +
        "bg-accent mt-4"
      }
    >
      {/* Header Banner */}
      <View
        className={
          "flex-row items-center justify-between rounded-t-3xl px-5 " +
          "py-4 border-2 border-b-0 border-gray-500"
        }
      >
        <View className="flex-row items-center gap-2">
          <Icon name="flight" size={20} color="#2196F3" />
          <Text className="text-white/60 font-bold text-sm tracking-wider uppercase">
            {data.airline || "BOARDING PASS"}
          </Text>
        </View>
        {data.flightNumber ? (
          <View className="bg-[#2196F3]/80 px-3 py-1 rounded-full">
            <Text className="text-white text-xs font-bold tracking-wide">
              {data.flightNumber}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Ticket Body */}
      <View className="p-5 border-l-2 border-r-2 border-gray-500 -mt-1">
        {/* Route Row */}
        <View className="flex-row items-center justify-between mb-4">
          {/* Departure Airport */}
          <View className="flex-1">
            <Text
              className={
                "text-xs font-semibold text-white uppercase " +
                "tracking-widest mb-1"
              }
            >
              Departure
            </Text>
            {(() => {
              const { code, name } = parseAirport(data.departureAirport);
              if (code) {
                return (
                  <View>
                    <Text
                      className="text-5xl font-extrabold tracking-tight text-[#2196F3]"
                    >
                      {code}
                    </Text>
                    {name && name !== code ? (
                      <Text className="text-xxs font-semibold text-white/60 mt-0.5 text-left">
                        {name}
                      </Text>
                    ) : null}
                  </View>
                );
              }
              return (
                <Text
                  className="text-lg font-bold tracking-tight text-[#2196F3]"
                >
                  {data.departureAirport || "N/A"}
                </Text>
              );
            })()}
          </View>

          {/* Plane Icon Divider */}
          <View className="flex-1 items-center justify-center px-2">
            <View className="w-full flex-row items-center justify-center">
              <View className="flex-1 h-1px border-t border-dashed border-gray-300" />
              <FadeInView type="right" delay={500} duration={600}>
                <Icon
                  name="flight"
                  size={52}
                  color={"#2196F3"}
                  style={{
                    marginHorizontal: 8,
                    transform: [{ rotate: "90deg" }],
                  }}
                />
              </FadeInView>
              <View className="flex-1 h-1px border-t border-dashed border-gray-300" />
            </View>
            {data.departureDate && data.arrivalDate && (
              <Text className="text-xs font-semibold text-white/60 mt-1">
                {(() => {
                  const dep = new Date(data.departureDate);
                  const arr = new Date(data.arrivalDate);
                  const diffMs = arr.getTime() - dep.getTime();
                  if (diffMs > 0) {
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    const hours = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;
                    return hours > 0
                      ? `${hours}h${mins > 0 ? ` ${mins}m` : ""}`
                      : `${mins}m`;
                  }
                  return "";
                })()}
              </Text>
            )}
          </View>

          {/* Arrival Airport */}
          <View className="flex-1 items-end">
            <Text
              className={
                "text-xs font-semibold text-white uppercase " +
                "tracking-widest mb-1"
              }
            >
              Arrival
            </Text>
            {(() => {
              const { code, name } = parseAirport(data.arrivalAirport);
              if (code) {
                return (
                  <View className="items-end">
                    <Text
                      className="text-5xl font-extrabold tracking-tight text-right text-[#2196F3]"
                    >
                      {code}
                    </Text>
                    {name && name !== code ? (
                      <Text className="text-xxs font-semibold text-white/60 mt-0.5 text-right">
                        {name}
                      </Text>
                    ) : null}
                  </View>
                );
              }
              return (
                <Text
                  className="text-lg font-bold tracking-tight text-right text-primary"
                >
                  {data.arrivalAirport || "N/A"}
                </Text>
              );
            })()}
          </View>
        </View>

        {/* Date & Time Row */}
        <View className="flex-row items-center justify-between mb-2">
          {/* Departure Date/Time */}
          <View className="flex-1">
            <Text className="text-base font-bold text-white">
              {safeFormatTime(data.departureDate)}
            </Text>
            <Text className="text-xxs font-medium text-white/60 mt-0.5">
              {safeFormatDate(data.departureDate)}
            </Text>
          </View>

          {/* Arrival Date/Time */}
          <View className="flex-1 items-end">
            <Text className="text-base font-bold text-white">
              {data.arrivalDate ? safeFormatTime(data.arrivalDate) : "--:--"}
            </Text>
            <Text className="text-xxs font-medium text-white/60 mt-0.5">
              {data.arrivalDate ? safeFormatDate(data.arrivalDate) : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Perforated Divider Section */}
      <View className="flex-row items-center justify-between relative h-6 my-1 mt-0 ">
        {/* Left Notch */}
        <View
          className="absolute left-[-12px] w-7 h-7 rounded-full border-2 border-gray-500"
          style={{
            transform: [{ translateX: 0 }],
            backgroundColor: "#EAECF0",
          }}
        />
        {/* Dashed Perforation Line */}
        <View
          className="flex-1 mx-4"
          style={{
            height: 1,
            borderStyle: "dashed",
            borderWidth: 1,
            borderColor: "#667085",
            borderRadius: 1,
          }}
        />
        {/* Right Notch */}
        <View
          className="absolute right-[-12px] w-7 h-7 rounded-full border-2 border-gray-500"
          style={{
            backgroundColor: "#EAECF0",
          }}
        />
      </View>

      {/* Ticket Stub */}
      <View
        className={
          "p-5 pt-2 border-2 -mt-[2px] border-t-0 border-gray-500 " +
          "rounded-b-3xl"
        }
      >
        {/* Grid Row 1: Gate, Terminal, Seat */}
        <View className="flex-row justify-between mb-4 gap-2">
          <View className="flex-1">
            <Text
              className={
                "text-xs font-semibold text-white uppercase " +
                "tracking-widest mb-1"
              }
            >
              Terminal
            </Text>
            <Text className="text-xl font-bold text-white/60">
              {data.terminal || "N/A"}
            </Text>
          </View>
          <View className="flex-1 items-center">
            <Text
              className={
                "text-xs font-semibold text-white uppercase " +
                "tracking-widest mb-1"
              }
            >
              Gate
            </Text>
            <Text className="text-xl font-bold text-white/60">
              {data.gate || "N/A"}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text
              className={
                "text-xs font-semibold text-white uppercase " +
                "tracking-widest mb-1"
              }
            >
              Seat
            </Text>
            <Text className="text-xl font-bold text-white/60">
              {data.seatNumber || "N/A"}
            </Text>
          </View>
        </View>

        {/* Grid Row 2: Booking Ref & Price */}
        <View className="flex-row items-center justify-between mb-6 pt-2">
          <View className="flex-1">
            <Text
              className={
                "text-xs font-semibold text-white uppercase " +
                "tracking-widest mb-1"
              }
            >
              Booking Ref
            </Text>
            {data.bookingReference ? (
              <TouchableOpacity
                onPress={() =>
                  handleCopy(data.bookingReference || "", "Booking reference")
                }
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text className="text-xl font-bold text-white/60">
                  {data.bookingReference}
                </Text>
                <Icon name="content-copy" size={12} color={"#999999"} />
              </TouchableOpacity>
            ) : (
              <Text className="text-lg font-bold text-white/60">N/A</Text>
            )}
          </View>

          {data.price ? (
            <View className="flex-1 items-end">
              <Text
                className={
                  "text-xs font-semibold text-white uppercase " +
                  "tracking-widest mb-1"
                }
              >
                Price
              </Text>
              <Text className="text-lg font-bold text-white/60">
                {Number(data.price).toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Barcode Graphic */}
        <Barcode
          value={data.bookingReference}
          onPress={
            data.bookingReference
              ? () => handleCopy(data.bookingReference || "", "Booking reference")
              : undefined
          }
          backgroundColor="#263F69"
          barColor="#FFFFFF"
        />
      </View>
    </View>
  );
};
