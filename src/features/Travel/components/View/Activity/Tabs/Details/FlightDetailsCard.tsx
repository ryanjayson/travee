import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert } from "react-native";
// import { Clipboard } from "react-native-clipboard";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { FlightDetailsDto } from "../../../../../types/TravelDto";

interface FlightDetailsCardProps {
  data: FlightDetailsDto;
}

const safeFormatTime = (dateValue: Date | string | null | undefined) => {
  if (!dateValue) return "--:--";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch (e) {
    return "--:--";
  }
};

const safeFormatDate = (dateValue: Date | string | null | undefined) => {
  if (!dateValue) return "N/A";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return "N/A";
  }
};

const parseAirport = (airportStr: string | null | undefined) => {
  if (!airportStr) return { code: "", name: "" };

  const str = airportStr.trim();
  if (!str) return { code: "", name: "" };

  // 1. Try to find the last opening parenthesis '('
  const lastParenIndex = str.lastIndexOf('(');
  if (lastParenIndex !== -1) {
    const afterParen = str.slice(lastParenIndex + 1).trim();
    // Match the first 3 alphanumeric characters as the IATA code
    const codeMatch = afterParen.match(/^([a-z0-9]{3})/i);
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();
      const name = str.slice(0, lastParenIndex).trim();
      return { code, name };
    }
  }

  // 2. Try to find the last opening bracket '['
  const lastBracketIndex = str.lastIndexOf('[');
  if (lastBracketIndex !== -1) {
    const afterBracket = str.slice(lastBracketIndex + 1).trim();
    const codeMatch = afterBracket.match(/^([a-z0-9]{3})/i);
    if (codeMatch) {
      const code = codeMatch[1].toUpperCase();
      const name = str.slice(0, lastBracketIndex).trim();
      return { code, name };
    }
  }

  // 3. Fallback to other patterns if no parenthesis or bracket is found
  // Match patterns like "MNL - Name" or "Name - MNL"
  const dashMatchStart = str.match(/^([a-z0-9]{3})\s*[-–—]\s*(.+)$/i);
  if (dashMatchStart) {
    return { code: dashMatchStart[1].trim().toUpperCase(), name: dashMatchStart[2].trim() };
  }

  const dashMatchEnd = str.match(/^(.+?)\s*[-–—]\s*([a-z0-9]{3})$/i);
  if (dashMatchEnd) {
    return { code: dashMatchEnd[2].trim().toUpperCase(), name: dashMatchEnd[1].trim() };
  }

  // Match pure 3-letter alphanumeric code
  if (/^[a-z0-9]{3}$/i.test(str)) {
    return { code: str.toUpperCase(), name: "" };
  }

  // Default: No code found, return the whole thing as name
  return { code: "", name: str };
};

export const FlightDetailsCard: React.FC<FlightDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    Clipboard.setString(text);
    if (Platform.OS === "android") {
      ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
    } else {
      Alert.alert("Copied", `${label} copied to clipboard`);
    }
  };

  const barcodeBars = [
    2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 4
  ];

  return (
    <View className="rounded-3xl border-gray-150 mb-6 shadow-md overflow-hidden bg-white mt-2">
      {/* Header Banner */}
      <View
        className="flex-row items-center justify-between rounded-t-3xl px-5 py-4 border-2 border-b-0 border-gray-500  bg-white"
      // style={{ backgroundColor: "red" }}
      >
        <View className="flex-row items-center gap-2">
          <Icon name="flight" size={20} color="#2196F3" />
          <Text className="text-gray-500 font-bold text-sm tracking-wider uppercase">
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
      <View className="p-5 border-l-2 border-r-2 border-gray-500 bg-white -mt-1">
        {/* Route Row */}
        <View className="flex-row items-center justify-between mb-4">
          {/* Departure Airport */}
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
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
                    {name ? (
                      <Text className="text-xxs font-semibold text-gray-500 mt-0.5 text-left">
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
              <View className="flex-1 h-[1px] border-t border-dashed border-gray-300" />
              <Icon
                name="flight"
                size={62}
                color={"#2196F3"}
                style={{
                  marginHorizontal: 8,
                  transform: [{ rotate: "90deg" }],
                }}
              />
              <View className="flex-1 h-[1px] border-t border-dashed border-gray-300" />
            </View>
          </View>

          {/* Arrival Airport */}
          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
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
                    {name ? (
                      <Text className="text-xxs font-semibold text-gray-500 mt-0.5 text-right">
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
            <Text className="text-base font-bold text-gray-800">
              {safeFormatTime(data.departureDate)}
            </Text>
            <Text className="text-xxs font-medium text-gray-500 mt-0.5">
              {safeFormatDate(data.departureDate)}
            </Text>
          </View>

          {/* Arrival Date/Time */}
          <View className="flex-1 items-end">
            <Text className="text-base font-bold text-gray-800">
              {data.arrivalDate ? safeFormatTime(data.arrivalDate) : "--:--"}
            </Text>
            <Text className="text-xxs font-medium text-gray-500 mt-0.5">
              {data.arrivalDate ? safeFormatDate(data.arrivalDate) : "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Perforated Divider Section */}
      <View className="flex-row items-center justify-between relative h-6 my-1 mt-0 bg-white">
        {/* Left Notch */}
        <View
          className="absolute left-[-12px] w-7 h-7 rounded-full bg-gray-25 border-2 border-gray-500"
          style={{
            transform: [{ translateX: 0 }],
            backgroundColor: "#2196F3",
          }}
        />
        {/* Dashed Perforation Line */}
        <View
          className="flex-1 mx-4"
          style={{
            height: 1,
            borderStyle: "dashed",
            borderWidth: 1,
            borderColor: "#EAECF0",
            borderRadius: 1,
          }}
        />
        {/* Right Notch */}
        <View
          className="absolute right-[-12px] w-7 h-7 rounded-full border-2 border-gray-500"
          style={{
            backgroundColor: "#2196F3",
          }}
        />
      </View>

      {/* Ticket Stub */}
      <View className="p-5 pt-2 border-2 -mt-[2px] border-t-0 border-gray-500 rounded-b-3xl bg-white">
        {/* Grid Row 1: Gate, Terminal, Seat */}
        <View className="flex-row justify-between mb-4 gap-2">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-800 uppercase tracking-widest mb-1">
              Terminal
            </Text>
            <Text className="text-xl font-bold text-gray-400">
              {data.terminal || "N/A"}
            </Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-xs font-semibold text-gray-800 uppercase tracking-widest mb-1">
              Gate
            </Text>
            <Text className="text-xl font-bold text-gray-400">
              {data.gate || "N/A"}
            </Text>
          </View>
          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-gray-800 uppercase tracking-widest mb-1">
              Seat
            </Text>
            <Text className="text-xl font-bold text-gray-400">
              {data.seatNumber || "N/A"}
            </Text>
          </View>
        </View>

        {/* Grid Row 2: Booking Ref & Price */}
        <View className="flex-row items-center justify-between mb-6 pt-2 border-t border-gray-100">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-800 uppercase tracking-widest mb-1">
              Booking Ref
            </Text>
            {data.bookingReference ? (
              <TouchableOpacity
                onPress={() => handleCopy(data.bookingReference || "", "Booking reference")}
                className="flex-row items-center gap-1"
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Text className="text-xl font-bold text-gray-400">
                  {data.bookingReference}
                </Text>
                <Icon name="content-copy" size={12} color={"263F69"} />
              </TouchableOpacity>
            ) : (
              <Text className="text-lg font-bold text-gray-400">N/A</Text>
            )}
          </View>

          {data.price ? (
            <View className="flex-1 items-end">
              <Text className="text-xxs font-semibold text-gray-400 uppercase tracking-widest mb-1">
                Price
              </Text>
              <Text className="text-sm font-bold text-emerald-600">
                ₱{Number(data.price).toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Barcode Graphic */}
        <View className="items-center justify-center pt-2">
          <View className="flex-row items-center h-9 justify-center opacity-70">
            {barcodeBars.map((width, index) => (
              <View
                key={index}
                style={{
                  width: width,
                  height: "100%",
                  backgroundColor: "#101828",
                  marginLeft: index % 3 === 0 ? 2 : 1,
                }}
              />
            ))}
          </View>
          <Text className="text-[9px] text-gray-400 text-center tracking-[4px] mt-1.5 uppercase">
            {data.bookingReference || "BOARDING PASS"}
          </Text>
        </View>
      </View>
    </View>
  );
};
