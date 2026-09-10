import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import FloatingLabelInput from "../../../../../../../components/atoms/FloatingLabelInput";
import { parseAirport } from "../../../../../../../utils";

interface FlightTabProps {
  values: any;
  handleChange: any;
  handleBlur: any;
  setFieldValue: any;
  openFlightModal: any;
  setShowFlightDatePickerFor: any;
  formatFlightDateTime: any;
  handleFlightSelect: (flightData: any, setFieldValue: any) => void;
  onOpenAirportLookup?: (mode: "departure" | "arrival") => void;
  showArrivalPrefillNotice?: boolean;
  noPadding?: boolean;
  fieldRefs?: React.RefObject<{ [key: string]: any }>;
  tripStartDate?: Date | string | null;
}

export default function FlightTab({
  values,
  handleChange,
  handleBlur,
  setFieldValue,
  openFlightModal,
  setShowFlightDatePickerFor,
  formatFlightDateTime,
  handleFlightSelect,
  onOpenAirportLookup,
  showArrivalPrefillNotice = false,
  noPadding = false,
  fieldRefs,
  tripStartDate,
}: FlightTabProps) {
  const { colors } = useTheme();

  const departureAirport = values.flightDetails?.departureAirport;
  const arrivalAirport = values.flightDetails?.arrivalAirport;
  const depParsed = parseAirport(departureAirport);
  const arrParsed = parseAirport(arrivalAirport);

  return (
    <View className={`flex-1  pt-2 ${noPadding ? "" : "px-5"}`}>
      <View className="flex-row gap-2 justify-start items-center mb-6 border-l-3 border-primary pl-4">
        <Icon name="local-airport" size={24} color={"#344054"} />
        <Text className="text-lg font-semibold tracking-wider uppercase text-secondary">
          Flight Details
        </Text>
      </View>

      <Text className="text-lg text-secondary/80 font-semibold mb-3 px-sm">
        Departure & Arrival Airport
      </Text>
      {/* Departure Airport */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.departureAirport"] = el; }} className=" flex-row">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={departureAirport ? `Departure airport: ${departureAirport}` : "Select departure airport"}
          activeOpacity={0.7}
          onPress={() => onOpenAirportLookup?.("departure")}
          className="bg-white border border-primary/60 px-4 py-4 rounded-t-3xl w-full border-b-0"
        >
          <View className="flex-row gap-2 items-center">
            <View className="border-r border-secondary/10 pr-3 items-center min-w-[56px]">
              <Icon name="flight-takeoff" size={24} color={depParsed.code ? "#0EA5E9" : "#98A2B3"} />
              <Text
                className={`text-2xl font-semibold ${depParsed.code ? "text-secondary/60" : "text-secondary/40"}`}
              >
                {depParsed.code || "---"}
              </Text>
            </View>

            <View className="flex-1 justify-center gap-0 px-sm pr-14">
              <Text className="text-lg text-secondary/80 ">From</Text>
              <Text
                className={`text-2xl font-semibold ${depParsed.name ? "text-secondary/80" : "text-secondary/40 font-normal text-lg"}`}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {depParsed.name || "Select departure airport"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.departureDate"] = el; }} className="flex-row gap-4 ">
          <View className="flex-1 flex-row justify-end -mb-lg z-50 -mt-3xl absolute right-4" pointerEvents="box-none">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Swap departure and arrival airports"
              activeOpacity={0.8}
              onPress={() => {
                const currentDep = values.flightDetails?.departureAirport || "";
                const currentArr = values.flightDetails?.arrivalAirport || "";
                setFieldValue("flightDetails.departureAirport", currentArr);
                setFieldValue("flightDetails.arrivalAirport", currentDep);
              }}
              className="border-2 border-primary/60 bg-primary w-14 h-14 rounded-full p-3 items-center justify-center"
            >
              <Icon name="swap-vert" size={24} color={"#ffffff"} />
            </TouchableOpacity>
          </View>
        </View>


        {/* Arrival Airport */}
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.arrivalAirport"] = el; }} className="mb-5 flex-row">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={arrivalAirport ? `Arrival airport: ${arrivalAirport}` : "Select arrival airport"}
            activeOpacity={0.7}
            onPress={() => onOpenAirportLookup?.("arrival")}
            className="bg-white border border-primary/60 px-4 py-4 rounded-b-3xl w-full"
          >
            <View className="flex-row gap-2 items-center">
              <View className="border-r border-secondary/10 pr-3 items-center min-w-[56px]">
                <Icon name="flight-land" size={24} color={arrParsed.code ? "#0EA5E9" : "#98A2B3"} />
                <Text
                  className={`text-2xl font-semibold ${arrParsed.code ? "text-secondary/60" : "text-secondary/40"}`}
                >
                  {arrParsed.code || "---"}
                </Text>
              </View>

              <View className="flex-1 justify-center gap-0 px-sm pr-14">
                <Text className="text-lg text-secondary/80 ">To</Text>
                <Text
                  className={`text-2xl font-semibold ${arrParsed.name ? "text-secondary/80" : "text-secondary/40 font-normal text-lg"}`}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {arrParsed.name || "Select arrival airport"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

        </View>
      </View>


      {/* Departure Date & Time */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.departureDate"] = el; }} className="flex-row gap-4 mb-5">
        <FloatingLabelInput
          label="Departure Date & Time"
          value={values.flightDetails?.departureDate ? formatFlightDateTime(values.flightDetails.departureDate) : ""}
          editable={false}
          right={
            values.flightDetails?.departureDate ? (
              <TextInput.Icon
                icon="close"
                color="#999"
                onPress={() => setFieldValue("flightDetails.departureDate", null)}
              />
            ) : (
              <TextInput.Icon icon="calendar" color="#999" />
            )
          }
          onPress={() => setShowFlightDatePickerFor("departureDate")}
        />
      </View>

      {/* Arrival Date & Time */}
      <View
        ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.arrivalDate"] = el; }}
        className="flex-col mb-10"
      >
        <View className="flex-row gap-4">
          <FloatingLabelInput
            label="Arrival Date & Time"
            value={values.flightDetails?.arrivalDate ? formatFlightDateTime(values.flightDetails.arrivalDate) : ""}
            editable={false}
            right={
              values.flightDetails?.arrivalDate ? (
                <TextInput.Icon
                  icon="close"
                  color="#999"
                  onPress={() => setFieldValue("flightDetails.arrivalDate", null)}
                />
              ) : (
                <TextInput.Icon icon="calendar" color="#999" />
              )
            }
            onPress={() => setShowFlightDatePickerFor("arrivalDate")}
          />
        </View>
        <Text className={`text-xs text-[#DC6803] mt-1 ml-2 font-medium ${showArrivalPrefillNotice ? "" : "hidden"}`}>
          Please check the actual date of your flight arrival and update accordingly.
        </Text>
      </View>

      <Text className="text-lg text-secondary/80 font-semibold mb-3 px-sm flex-1">
        Booking Information
      </Text>

      {/* Flight Number & Airline */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.airline"] = el; }} className="flex-row gap-4 mb-6">
        <FloatingLabelInput
          label="Airline"
          value={values.flightDetails?.airline || ""}
          onChangeText={handleChange("flightDetails.airline")}
          onBlur={handleBlur("flightDetails.airline")}
        />
      </View>

      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.flightNumber"] = el; }} className="flex-row gap-4 mb-6">
        <FloatingLabelInput
          label="Flight Number"
          value={values.flightDetails?.flightNumber || ""}
          onChangeText={handleChange("flightDetails.flightNumber")}
          onBlur={handleBlur("flightDetails.flightNumber")}
        />

      </View>

      {/* Gate & Terminal */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.gate"] = el; }} className="flex-row gap-4 mb-6">
        <FloatingLabelInput
          label="Gate"
          value={values.flightDetails?.gate || ""}
          onChangeText={handleChange("flightDetails.gate")}
          onBlur={handleBlur("flightDetails.gate")}
        />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.terminal"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Terminal"
            value={values.flightDetails?.terminal || ""}
            onChangeText={handleChange("flightDetails.terminal")}
            onBlur={handleBlur("flightDetails.terminal")}
          />
        </View>
      </View>

      {/* Seat Number & Booking Reference */}
      <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.seatNumber"] = el; }} className="flex-row gap-4 mb-6">
        <FloatingLabelInput
          label="Seat Number"
          value={values.flightDetails?.seatNumber || ""}
          onChangeText={handleChange("flightDetails.seatNumber")}
          onBlur={handleBlur("flightDetails.seatNumber")}
        />
        <View ref={(el) => { if (fieldRefs) fieldRefs.current["flightDetails.bookingReference"] = el; }} style={{ flex: 1 }}>
          <FloatingLabelInput
            label="Booking Reference"
            value={values.flightDetails?.bookingReference || ""}
            onChangeText={handleChange("flightDetails.bookingReference")}
            onBlur={handleBlur("flightDetails.bookingReference")}
          />
        </View>
      </View>

    </View>
  );
}
