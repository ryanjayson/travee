import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { safeFormatDate, safeFormatTime } from "../../../../../../../utils/dateTimeUtils";
import { DestinationDto, TransportationDetailsDto } from "../../../../../types/TravelDto";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { FadeInView } from "../../../../../../../components/animations";

const parseLocObject = (loc?: any): DestinationDto | null => {
  if (!loc) return null;
  if (typeof loc === "object" && (loc.name || loc.address || loc.city)) {
    return loc as DestinationDto;
  }
  if (typeof loc === "string" && loc.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(loc);
      if (parsed && typeof parsed === "object") {
        return parsed as DestinationDto;
      }
    } catch { }
  }
  return null;
};

const getLocationTitle = (loc?: any): string => {
  if (!loc) return "";
  const obj = parseLocObject(loc);
  if (obj) {
    return obj.name || obj.city || obj.address || "";
  }
  if (typeof loc === "string") {
    const commaIndex = loc.indexOf(",");
    if (commaIndex > 0) {
      return loc.substring(0, commaIndex).trim();
    }
    return loc.trim();
  }
  return "";
};

const getLocationAddress = (loc?: any): string => {
  if (!loc) return "";
  const obj = parseLocObject(loc);
  if (obj) {
    if (obj.address && (!obj.name || obj.address.toLowerCase() !== obj.name.toLowerCase())) {
      return obj.address;
    }
    const regionParts = [
      obj.city && obj.name && obj.city.toLowerCase() !== obj.name.toLowerCase() ? obj.city : (!obj.name ? obj.city : null),
      obj.regionOrState,
      obj.country,
    ].filter(Boolean);
    if (regionParts.length > 0) {
      return regionParts.join(", ");
    }
    return obj.address || "";
  }
  if (typeof loc === "string") {
    const commaIndex = loc.indexOf(",");
    if (commaIndex > 0) {
      return loc.substring(commaIndex + 1).trim();
    }
    return "";
  }
  return "";
};

interface TransportationDetailsCardProps {
  data: TransportationDetailsDto & { destinationData?: any };
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

  const destData = (data as any).destinationData;
  const pickLocObj = parseLocObject(data.pickupLocation);
  const destPickObj = parseLocObject(destData?.pickupLocation);
  const dropLocObj = parseLocObject(data.dropoffLocation);
  const destDropObj = parseLocObject(destData?.dropoffLocation);

  const rawPickup =
    (pickLocObj?.address ? pickLocObj : null) ||
    (destPickObj?.address ? destPickObj : null) ||
    pickLocObj ||
    destPickObj ||
    data.pickupLocation ||
    destData?.pickupLocation ||
    (data as any).pickupAddress;

  const rawDropoff =
    (dropLocObj?.address ? dropLocObj : null) ||
    (destDropObj?.address ? destDropObj : null) ||
    dropLocObj ||
    destDropObj ||
    data.dropoffLocation ||
    destData?.dropoffLocation ||
    (data as any).dropoffAddress;

  const pickupTitle = getLocationTitle(rawPickup);
  const pickupSubtitle = getLocationAddress(rawPickup);
  const dropoffTitle = getLocationTitle(rawDropoff);
  const dropoffSubtitle = getLocationAddress(rawDropoff);

  const locationText =
    pickupTitle && dropoffTitle && pickupTitle !== dropoffTitle
      ? `${pickupTitle} ➠ ${dropoffTitle}`
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

  const themeColor = "#018091";

  return (
    <View className="mt-4 px-2 overflow-hidden">
      {/* Main Details Body */}
      <FadeInView type="down" delay={180} duration={200}>
        <View
          className="p-2xl rounded-3xl flex-1 mb-2 gap-4"
          style={{ backgroundColor: `${themeColor}30` }}
        >
          <View className="flex-row items-start w-full mb-2">
            <View className="flex-col gap-2 flex-1">
              {data.operatorProvider ? (
                <View className="flex flex-col gap-3">
                  <View className="flex flex-row gap-3 items-start flex-1">
                    <View className="flex-1">
                      <Text className="text-2xl leading-xl font-semibold text-secondary tracking-tight">
                        {data.operatorProvider}
                      </Text>
                      {locationText ? (
                        <Text className="text-secondary/60 font-normal leading-2xl text-lg">
                          {locationText}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ) : (
                locationText && (
                  <View className="flex flex-col flex-1">
                    <View className="flex flex-row gap-3 items-start flex-1">
                      <View className="flex-1">
                        <Text className="text-[10px] font-semibold text-secondary uppercase tracking-wide">
                          Route
                        </Text>
                        <Text className="text-secondary/60 font-normal leading-2xl text-lg">
                          {locationText}
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              )}
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="mb-3">
              <Icon name="timer" size={38} color={themeColor} />
            </View>
            <View className="mb-3 flex-1">
              <Text className="text-sm font-semibold text-secondary/50  tracking-wide">
                Departure
              </Text>
              {pickupTitle ? (
                <Text className="text-xl font-semibold text-secondary">
                  {pickupTitle}
                </Text>
              ) : null}
              {pickupSubtitle && pickupSubtitle !== pickupTitle ? (
                <Text className="text-lg leading-2xl text-secondary/50 mt-1">
                  {pickupSubtitle}
                </Text>
              ) : null}

              <Text className="text-lg font-semibold text-secondary/40 mt-1">
                {data.departureDateTime ? safeFormatTime(data.departureDateTime) : "--:--"}{data.departureDateTime ? `, ${safeFormatDate(data.departureDateTime)}` : ""}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-4
          ">
            <View className="mb-3">
              <Icon name="timer" size={38} color={themeColor} />
            </View>
            <View className="mb-3 flex-1">
              <Text className="text-sm font-semibold text-secondary/50  tracking-wide">
                Arrival
              </Text>
              {dropoffTitle ? (
                <Text className="text-xl font-semibold text-secondary">
                  {dropoffTitle}
                </Text>
              ) : null}
              {dropoffSubtitle && dropoffSubtitle !== dropoffTitle ? (
                <Text className="text-lg leading-2xl text-secondary/50">
                  {dropoffSubtitle}
                </Text>
              ) : null}
              <Text className="text-lg font-semibold text-secondary/40 mt-1">
                {data.arrivalDateTime ? safeFormatTime(data.arrivalDateTime) : "--:--"}{data.arrivalDateTime ? `, ${safeFormatDate(data.arrivalDateTime)}` : ""}
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
          <Text className="text-xl font-semibold text-secondary">
            Transit Info
          </Text>
          <View className="rounded-2xl flex-col p-2 pl-0">

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
          <Text className="text-xl font-semibold text-secondary">
            Contact Info
          </Text>
          <View className="rounded-2xl flex-col p-2 pb-1 pl-0">
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
