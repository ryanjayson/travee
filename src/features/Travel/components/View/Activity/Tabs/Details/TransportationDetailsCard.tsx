import { MaterialIcons as Icon } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import {
  safeFormatDate,
  safeFormatTime,
} from "../../../../../../../utils/dateTimeUtils";
import { TransportationDetailsDto } from "../../../../../types/TravelDto";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { FadeInView } from "../../../../../../../components/animations";
import {
  formatPrice,
  getLocationAddress,
  getLocationTitle,
  parseLocObject,
} from "./activityDetailUtils";

interface TransportationDetailsCardProps {
  data: TransportationDetailsDto & { destinationData?: any };
  onFullScreenChange?: (fullScreen: boolean) => void;
}

export const TransportationDetailsCard: React.FC<TransportationDetailsCardProps> = ({
  data,
}) => {
  const formattedPrice = formatPrice(data.price);

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

  const themeColor = "#018091";

  return (
    <View className="mt-4 px-2">
      {/* Main Details Body */}
      <View
        className="py-xl px-2xl rounded-3xl mb-2 gap-4"
        style={{ backgroundColor: `${themeColor}40` }}
      >
        <View className="flex-row items-start w-full mb-1">
          <View className="flex-col gap-2 flex-1">
            {data.operatorProvider ? (
              <View className="flex flex-col gap-3">
                <View className="flex flex-row gap-3 items-start flex-1">
                  <View className="flex-1">
                    <Text
                      className={
                        "text-lg leading-xl font-semibold " +
                        "text-secondary tracking-tight"
                      }
                    >
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
                  <View className="flex flex-row gap-1 items-start flex-1">
                    <View className="flex-1 gap-0">
                      <Text
                        className={
                          "text-lg font-semibold text-secondary "
                        }
                      >
                        Route
                      </Text>
                      <Text className="text-secondary/60 font-normal leading-relaxed text-lg">
                        {locationText}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>
        </View>

        {/* Departure Info Block */}
        <View className="flex-row gap-6 pl-xl">
          <View className="mb-2">
            <Icon name="departure-board" size={34} color={themeColor} />
          </View>
          <View className="mb-1 flex-1">
            <Text className="text-lg font-semibold text-secondary">
              Departure
            </Text>

            {pickupTitle ? (
              <View className="">
                <Text className="text-lg font-semibold text-secondary/60 leading-relaxed">
                  {pickupTitle}
                </Text>
                {pickupSubtitle && pickupSubtitle !== pickupTitle ? (
                  <Text className="text-lg text-secondary/60">
                    {pickupSubtitle}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {data.departureDateTime && (
              <View className="flex-row items-end gap-2">
                <Text className="text-lg font-semibold text-secondary/40">
                  {safeFormatTime(data.departureDateTime)}
                </Text>
                <Text className="text-lg text-secondary/50">
                  {safeFormatDate(data.departureDateTime)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Arrival Info Block */}
        <View className="flex-row gap-6 px-xl">
          <View className="mb-2">
            <Icon name="place" size={34} color={themeColor} />
          </View>
          <View className="mb-1 flex-1">
            <Text className="text-lg font-semibold text-secondary ">
              Arrival
            </Text>
            {dropoffTitle ? (
              <View className="">
                <Text className="text-lg font-semibold text-secondary/60 leading-relaxed">
                  {dropoffTitle}
                </Text>
                {dropoffSubtitle && dropoffSubtitle !== dropoffTitle ? (
                  <Text className="text-lg text-secondary/60 leading-relaxed">
                    {dropoffSubtitle}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {data.arrivalDateTime && (
              <View className="flex-row items-end gap-2">
                <Text className="text-lg font-semibold text-secondary/40">
                  {safeFormatTime(data.arrivalDateTime)}
                </Text>
                <Text className="text-lg  text-secondary/50">
                  {safeFormatDate(data.arrivalDateTime)}
                </Text>
              </View>
            )}

          </View>
        </View>
      </View>

      <FadeInView delay={180} duration={400}>
        <View
          className="px-md mt-sm"
          style={{ display: hasTransitInfo ? "flex" : "none" }}
        >
          <Text className="text-xl font-semibold text-secondary mt-lg">
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
          className="px-md mt-xl"
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
