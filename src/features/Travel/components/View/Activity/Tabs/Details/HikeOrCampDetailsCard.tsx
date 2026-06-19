import React from "react";
import { View, Text, TouchableOpacity, Clipboard, ToastAndroid, Platform, Alert, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { HikeOrCampDetailsDto } from "../../../../../types/TravelDto";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";

interface HikeOrCampDetailsCardProps {
  data: HikeOrCampDetailsDto;
}

const hikeColor = activityIcons.find((icon) => icon.name === ActivityType.hikeOrCamp)?.color || "#558B2F";

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

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

const handleCall = (phone: string) => {
  if (phone) {
    Linking.openURL(`tel:${phone}`).catch((err) => console.error("Failed to make call", err));
  }
};

const Field = ({
  label,
  value,
  icon,
  onPress,
  isLink,
  showBorder = true,
}: {
  label: string;
  value?: string | number | null;
  icon?: string;
  onPress?: () => void;
  isLink?: boolean;
  showBorder?: boolean;
}) => {
  if (value === undefined || value === null || String(value).trim() === "") return null;

  return (
    <View className="flex-row items-start pr-xl gap-6 ">
      {icon ? (
        <View
          style={{
            // backgroundColor:"white",
            // padding: 12,
            // borderRadius: 12,
            // width: 40,
            // height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={icon as any} size={24} color={"#fffefe"} />
        </View>
      ) : null}
      <View className={`flex-1 ${showBorder ? "border-b border-[#016630]/10" : ""} pb-3`} >
        <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">{label}</Text>
        {onPress ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" className="flex-row items-center gap-1">
            <Text
              className="text-lg font-medium text-white/60"
              style={{
                // color: isLink ? hikeColor : "#182230",
                textDecorationLine: isLink ? "underline" : "none",
              }}
            >
              {value}
            </Text>
            {isLink && <Icon name="open-in-new" size={16} color={"#016630"} />}
          </TouchableOpacity>
        ) : (
          <Text className="text-lg font-semibold text-white/60">{value}</Text>
        )}
      </View>
    </View>
  );
};

export const HikeOrCampDetailsCard: React.FC<HikeOrCampDetailsCardProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <View className="rounded-3xl mb-6  overflow-hidden">
      {/* Main Details Body */}
      <View className="px-2">
        <View className="mb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest">
            Trail / Site Name
          </Text>
                {data.permitRequired !== undefined && data.permitRequired !== null ? (
          <View
            className="px-3 py-2 rounded-full"
            style={{ backgroundColor: data.permitRequired ? `#07945550` : "#07945525" }}
          >
            <Text
              className="text-xs font-extrabold tracking-wide uppercase"
              style={{ color: data.permitRequired ? colors.error : "#079455" }}
            >
              {data.permitRequired ? "Permit Required" : "No Permit Required"}
            </Text>
          </View>
        ) : null}
        </View>
          
          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white ">
            {data.trailOrSiteName || "N/A"}
          </Text>
          {data.address ? (
            <TouchableOpacity
              onPress={() => handleOpenLink(`https://maps.google.com/?q=${encodeURIComponent(data.address || "")}`)}
              className="flex-row items-center  mt-1"
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Icon name="location-on" size={24} color="#FFFFFF" className="mr-6"/>
              <Text className="text-base text-white underline flex-1" numberOfLines={1}>
                {data.address} 
              </Text>
              <Icon name="open-in-new" size={16} color={"#016630"} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Start & End Dates Row */}
        <View className="flex-row items-center justify-between pt-4 border-t-2 border-dashed border-[#016630]">
          <View className="flex-1">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              Start / Check-in
            </Text>
            <Text className="text-2xl font-semibold text-white/60">
              {safeFormatTime(data.checkinDateTime)}
            </Text>
            <Text className="text-md font-medium text-white/60 mt-0.5">
              {safeFormatDate(data.checkinDateTime)}
            </Text>
          </View>

          <View className="px-3 items-center justify-center">
            <Icon name="arrow-forward" size={18} color={"#FFFFFF"} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
              End / Check-out
            </Text>
            <Text className="text-2xl font-semibold text-white/60 text-right">
              {data.checkoutDateTime ? safeFormatTime(data.checkoutDateTime) : "--:--"}
            </Text>
            <Text className="text-md font-medium text-white/60 mt-0.5 text-right">
              {data.checkoutDateTime ? safeFormatDate(data.checkoutDateTime) : "N/A"}
            </Text>
          </View>
        </View>

        {/* Additional details */}
        <View className="flex-row justify-between mt-5 border-dashed-t border-gray-100">
           {/* {data.campsiteName ? (
          <View className="mt-3 pt-3">
            <Text className="text-xs font-medium text-gray-200 uppercase tracking-widest mb-0.5">
              Campsite Name
            </Text>
            <Text className="text-lg font-medium text-white">
              {data.campsiteName} /   {data.subType}
            </Text>
          </View>
        ) : null} */}

          {data.subType ? (
            <View className="flex-1">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">
                Activity Type
              </Text>
              <Text className="text-lg font-semibold text-white/60 capitalize">
                {data.subType}
              </Text>
            </View>
          ) : null}

          {data.estimatedDistanceKm ? (
            <View className="flex-1 items-end">
              <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-0.5">
                Distance
              </Text>
              <Text className="text-lg font-semibold text-white/60">
                {data.estimatedDistanceKm} Km
              </Text>
            </View>
          ) : null}
        </View>

       
      </View>

      {/* Stub Area */}
      <View className="px-md mt-4">
        <View className="rounded-2xl  flex-col gap-3 p-5 pb-1 bg-[#016630]/10">
          {/* <Field label="Contact Person / number" value={`${data.contactPerson} / ${data.contactNumber}`} icon="person" /> */}
          <Field
            label="Contact Person / number"
            value={`${data.contactPerson} / ${data.contactNumber}`} 
            icon="person"
            onPress={data.contactNumber ? () => handleCall(data.contactNumber!) : undefined}
          />
          <Field
            label="Reservation"
            value={data.reservationLink}
            icon="book-online"
            isLink
            onPress={data.reservationLink ? () => handleOpenLink(data.reservationLink!) : undefined}
          />
          <Field
            label="Website"
            value={data.websiteAddress}
            icon="language"
            isLink
            showBorder={false}
            onPress={data.websiteAddress ? () => handleOpenLink(data.websiteAddress!) : undefined}
          />
        </View>
      </View>
    </View>
  );
};
