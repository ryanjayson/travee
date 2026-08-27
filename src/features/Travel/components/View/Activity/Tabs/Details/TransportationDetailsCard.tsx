import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import { TransportationDetailsDto } from "../../../../../types/TravelDto";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import ActivityDetailCardAddress from "../../../../ActivityDetailCardAddress";
interface TransportationDetailsCardProps {
  data: TransportationDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

export const TransportationDetailsCard: React.FC<TransportationDetailsCardProps> = ({
  data,
  onFullScreenChange,
}) => {

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-2">
        <View className="mb-0">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Operator / Provider
          </Text>
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.operatorProvider || "N/A"}
          </Text>
        </View>

        {/* Pickup & Dropoff Route Map */}
        {data.pickupLocation || data.dropoffLocation ? (
          <View className="mb-2">
            <ActivityDetailCardAddress
              pickupAddress={data.pickupLocation}
              dropoffAddress={data.dropoffLocation}
              title={data.operatorProvider || "Transportation Route"}
              onFullScreenChange={onFullScreenChange}
            />
          </View>
        ) : null}

        {/* Departure & Arrival Dates Row */}
        {data.departureDateTime || data.arrivalDateTime ? (
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                Departure
              </Text>
              <Text className="text-xl font-semibold text-white/80">
                {data.departureDateTime ? new Date(data.departureDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
              </Text>
              <Text className="text-xxs font-medium text-white/80 mt-0.5">
                {data.departureDateTime ? new Date(data.departureDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
              </Text>
            </View>

            <View className="px-3 items-center justify-center">
              <Icon name="arrow-forward" size={18} color={"#FFFFFF"} />
            </View>

            <View className="flex-1 items-end">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
                Arrival
              </Text>
              <Text className="text-xl font-semibold text-white/80 text-right">
                {data.arrivalDateTime ? new Date(data.arrivalDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
              </Text>
              <Text className="text-xxs font-medium text-white/80 mt-0.5 text-right">
                {data.arrivalDateTime ? new Date(data.arrivalDateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
              </Text>
            </View>
          </View>
        ) : null}

      </View>

      <View className="px-md"
        style={{ display: data.mode || data.seatOrVehicleNumber || data.bookingReference || data.bookingStatus || data.price ? "flex" : "none" }}
      >
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#018091]">
          <Field
            label="Transit Mode"
            value={data.mode}
            icon="commute"
          />
          <Field
            label="Seat / Vehicle #"
            value={data.seatOrVehicleNumber}
            icon="event-seat"
            isCopy
          />
          <Field
            label="Booking Ref"
            value={data.bookingReference}
            icon="confirmation-number"
            isCopy
          />
          <Field
            label="Booking Status"
            value={data.bookingStatus}
            icon="info-outline"
          />
          <Field
            label="Price"
            value={data.price ? Number(data.price).toLocaleString() : null}
            icon="attach-money"
          />
        </View>
      </View>

      <View className="px-md mt-sm"
        style={{ display: data.websiteAddress || data.contactNumber ? "flex" : "none" }}
      >
        <View className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#018091]">
          <Field
            label="Website / Ticket"
            value={data.websiteAddress}
            icon="language"
            isLink={true}
          />

          <Field
            label="Contact"
            value={data.contactNumber}
            icon="phone"
            isCall
          />
        </View>
      </View>

    </View>
  );
};
