import React from "react";
import { Linking, Text, View } from "react-native";
import { activityIcons } from "../../../../../../../components/ActivityIcon";
import { ActivityType } from "../../../../../../../types/enums";
import { NatureDetailsDto } from "../../../../../types/TravelDto";
import ActivityDetailCardAddress from "../../../../ActivityDetailCardAddress";
import { ActivityCardDisplayField as Field } from "./ActivityCardDisplayField";
import { safeFormatTime, safeFormatDate } from "../../../../../../../utils/dateTimeUtils";

interface NatureDetailsCardProps {
  data: NatureDetailsDto;
  activityStartDate?: Date | string | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
}

export const NatureDetailsCard: React.FC<NatureDetailsCardProps> = ({
  data,
  activityStartDate,
  onFullScreenChange }) => {
  const dateTimeVal = activityStartDate || (data as any)?.activitydatetime || (data as any)?.startDate;

  return (
    <View className="rounded-3xl mb-6 overflow-hidden">
      {/* Main Details Body */}
      <View className="p-2">
        <View className="mb-1">
          <View className="flex-row justify-between items-center">
            <Text className="text-xs font-medium text-white/80 uppercase tracking-widest mb-2">
              Spot Name
            </Text>
          </View>

          <Text className="text-5xl font-semibold tracking-tight mb-1 text-white">
            {data.spotName || "N/A"}
          </Text>
          <ActivityDetailCardAddress
            address={data.address}
            coordinates={data.destinationAddressData?.coordinates}
            title={data.spotName}
            onFullScreenChange={onFullScreenChange}
          />
        </View>
      </View>

      <View className="flex-row items-center justify-between pb-xl px-md ">
        <View className="flex-1">
          <Text className="text-xs font-semibold text-white uppercase tracking-widest mb-1">
            Date & Time
          </Text>
          <View className="flex-row gap-3">
            <Text className="text-2xl font-medium text-white/90 ">
              {safeFormatDate(dateTimeVal)}
            </Text>
            <Text className="text-2xl font-semibold text-white/60">
              {safeFormatTime(dateTimeVal)}
            </Text>
          </View>
        </View>
      </View>


      {/* Additional Info Section */}
      <View className="px-md"
        style={{ display: data.subType || data.websiteAddress || data.entryFee ? "flex" : "none" }}>
        <View
          className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#205c41]">
          <Field label="Spot Type" value={data.subType} icon="nature" showBorder={false} />
          <Field label="Website" value={data.websiteAddress} icon="link" showBorder={false} isLink={true} />
          <Field label="Entry Fee" value={data.entryFee} icon="price-check" showBorder={false} />
        </View>
      </View>

      <View className="px-md mt-sm"
        style={{ display: data.contactName || data.contactNumber || data.emailAddress ? "flex" : "none" }}>
        <View
          className="rounded-2xl flex-col gap-3 p-5 pb-1 bg-[#205c41]"
        >
          <Field label="Contact Person" value={data.contactName} icon="person" showBorder={false} />
          <Field label="Contact Number" value={data.contactNumber} icon="phone" showBorder={false} isCall />
          <Field label="Email Address" value={data.emailAddress} icon="email" isEmail={true} />
        </View>
      </View>
    </View>
  );
};
