import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { safeFormatDate, safeFormatTime } from "../../../../../../../utils/dateTimeUtils";
import { DestinationDto, TransportationDetailsDto } from "../../../../../types/TravelDto";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { FadeInView } from "../../../../../../../components/animations";

const resolveLocationObject = (loc?: string | DestinationDto | null): DestinationDto | null => {
  if (!loc) return null;
  if (typeof loc === "object") return loc;
  if (typeof loc === "string" && loc.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(loc);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch {
      return null;
    }
  }
  return null;
};

const getLocationTitle = (loc?: string | DestinationDto | null): string => {
  if (!loc) return "";
  const obj = resolveLocationObject(loc);
  if (obj) {
    return obj.name || obj.city || obj.address || "";
  }
  if (typeof loc === "string") return loc;
  return "";
};

const getLocationSubtitle = (loc?: string | DestinationDto | null): string => {
  if (!loc) return "";
  const obj = resolveLocationObject(loc);
  if (obj) {
    return (
      obj.address ||
      [obj.city, obj.regionOrState, obj.country].filter(Boolean).join(", ")
    );
  }
  return "";
};

interface TransportationDetailsCardProps {
  data: TransportationDetailsDto;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

export const TransportationDetailsCard: React.FC<TransportationDetailsCardProps> = ({
  data,
}) => {
  const formattedPrice = data.price
    ? data.price.startsWith("₱") || data.price.startsWith("$")
      ? data.price
      : !isNaN(Number(data.price))
        ? `₱${Number(data.price).toLocaleString()}`
        : data.price
    : null;

  const pickupTitle = getLocationTitle(data.pickupLocation);
  const pickupSubtitle = getLocationSubtitle(data.pickupLocation);
  const dropoffTitle = getLocationTitle(data.dropoffLocation);
  const dropoffSubtitle = getLocationSubtitle(data.dropoffLocation);

  const locationText =
    pickupTitle && dropoffTitle && pickupTitle !== dropoffTitle
      ? `${pickupTitle} → ${dropoffTitle}`
      : pickupTitle || dropoffTitle || "";

  const hasTransitInfo = Boolean(
    data.mode ||
    data.seatOrVehicleNumber ||
    data.bookingReference ||
    data.bookingStatus ||
    data.price ||
    data.websiteAddress
  );

  const hasContactInfo = Boolean(
    data.contactNumber ||
    (data as any).contactName ||
    (data as any).emailAddress
  );

  return (
    <View className="mt-4 overflow-hidden">
      {/* Main Details Body */}
      <FadeInView delay={180} duration={400} className="bg-[#018091] rounded-3xl p-5">
        <View className="">
          <View className="">
            {/* <Text className="text-xs font-medium text-secondary/80 uppercase tracking-wide mb-1">
              {data.mode ? `${data.mode.charAt(0).toUpperCase() + data.mode.slice(1)} Transit` : "Transportation"}
            </Text> */}
            {data.operatorProvider &&
              <Text className="text-2xl leading-2xl font-semibold mb-1 text-white">
                {data.operatorProvider}
              </Text>
            }
            {/* 
            <Text className="text-lg font-semibold mb-1 text-white/40">
              {locationText || "N/A"}
            </Text> */}
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white/80 uppercase tracking-widest mb-1">
              Departure
            </Text>
            <Text className="text-xl font-semibold text-white">
              {pickupTitle || "N/A"}
            </Text>
            {pickupSubtitle ? (
              <Text className="text-base font-medium text-white/80 mt-0.5">
                {pickupSubtitle}
              </Text>
            ) : null}
            <View className="mt-2">
              <Text className="text-2xl font-semibold text-white">
                {safeFormatTime(data.departureDateTime)}
              </Text>
              <Text className="text-base font-medium text-white/80 mt-0.5">
                {safeFormatDate(data.departureDateTime)}
              </Text>
            </View>
          </View>

          <View className="items-center justify-center px-2">
            <Icon name="chevron-right" size={38} color={"#FFFFFF"} style={{ opacity: 0.75 }} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-white/80 uppercase tracking-widest mb-1">
              Arrival
            </Text>
            <Text className="text-xl font-semibold text-white text-right">
              {dropoffTitle || "N/A"}
            </Text>
            {dropoffSubtitle ? (
              <Text className="text-base font-medium text-white/80 mt-0.5 text-right">
                {dropoffSubtitle}
              </Text>
            ) : null}
            <View className="mt-2 items-end">
              <Text className="text-2xl font-semibold text-white text-right">
                {data.arrivalDateTime ? safeFormatTime(data.arrivalDateTime) : "--:--"}
              </Text>
              <Text className="text-base font-medium text-white/80 mt-0.5 text-right">
                {data.arrivalDateTime ? safeFormatDate(data.arrivalDateTime) : ""}
              </Text>
            </View>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md my-lg"
          style={{ display: hasTransitInfo ? "flex" : "none" }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Transit Info
          </Text>
          <View className="rounded-2xl flex-col gap-3 p-2">
            <Field
              label="Booking Ref"
              value={data.bookingReference}
              icon="folder-open"
              showBorder={false}
              isCopyable={true}
              borderColor="border-[#018091]"
            />
            <Field
              label="Transit Mode"
              value={data.mode}
              icon="commute"
              showBorder={false}
              borderColor="border-[#018091]"
            />
            <Field
              label="Seat / Vehicle #"
              value={data.seatOrVehicleNumber}
              icon="event-seat"
              showBorder={false}
              isCopyable={true}
              borderColor="border-[#018091]"
            />
            <Field
              label="Booking Status"
              value={data.bookingStatus}
              icon="info-outline"
              showBorder={false}
              borderColor="border-[#018091]"
            />
            <Field
              label="Price"
              value={formattedPrice}
              icon="attach-money"
              showBorder={false}
              borderColor="border-[#018091]"
            />
            <Field
              label="Website"
              value={data.websiteAddress}
              icon="link"
              showBorder={false}
              isLink={true}
              borderColor="border-[#018091]"
            />
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md"
          style={{
            display: hasContactInfo ? "flex" : "none",
          }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
            Contact Info
          </Text>
          <View className="rounded-2xl flex-col gap-3 p-2 pb-1 pl-1">
            {(data as any).contactName ? (
              <Field
                label="Contact Person"
                value={(data as any).contactName}
                icon="person"
                showBorder={false}
                borderColor="border-[#018091]"
              />
            ) : null}
            <Field
              label="Contact Number"
              value={data.contactNumber}
              icon="phone"
              showBorder={false}
              borderColor="border-[#018091]"
              isCall
            />
            {(data as any).emailAddress ? (
              <Field
                label="Email Address"
                value={(data as any).emailAddress}
                icon="email"
                showBorder={false}
                borderColor="border-[#018091]"
                isEmail={true}
              />
            ) : null}
          </View>
        </View>
      </FadeInView>

      {data.notes ? (
        <FadeInView delay={180} duration={400}>
          <View className="px-md my-lg">
            <Text className="text-xl font-semibold text-secondary mt-lg">
              Notes
            </Text>
            <View className="rounded-2xl flex-col gap-3 p-2">
              <Text className="text-base text-secondary/60 leading-6">
                {data.notes}
              </Text>
            </View>
          </View>
        </FadeInView>
      ) : null}
    </View>
  );
};
