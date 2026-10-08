import React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { FlightDetailsCard } from "./FlightDetailsCard";
import { AccomodationDetailsCard } from "./AccomodationDetailsCard";
import { TransportationDetailsCard } from "./TransportationDetailsCard";
import { RideRentalDetailsCard } from "./RideRentalDetailsCard";
import { PlanDetailsCard } from "./PlanDetailsCard";
import { MaterialIcons as Icon, Ionicons } from "@expo/vector-icons";
import {
  ItineraryActivity,
  FlightDetailsDto,
  AccomodationDetailsDto,
  TransportationDetailsDto,
  RideRentalDetailsDto,
} from "../../../../../types/TravelDto";
import { TripPlanType } from "../../../../../../../types/enums";
import { getActivityPlanTypeConfig } from "../../../../../constants/activityPlanTypes";
import { hasActivityData } from "./activityDetailUtils";
import { useTravelContext } from "../../../../../../../context/TravelContext";

export { hasActivityData };

interface NoDetailsAddedProps {
  activity?: ItineraryActivity | null;
  onEditActivity?: (activity: ItineraryActivity) => void;
}

const getActivityIconInfo = (
  activity?: ItineraryActivity | null
): { name: any; iconSet: "material" | "ionicons" } => {
  if (!activity) {
    return { name: "flight-takeoff", iconSet: "material" };
  }

  const type = activity.type;
  const planType = activity.planType;

  // 1. Check planType config first if it's an activity
  if (type === TripPlanType.activity && planType != null) {
    const config = getActivityPlanTypeConfig(planType);
    if (config?.iconName) {
      return { name: config.iconName, iconSet: "material" };
    }
  }

  // 2. Extract string subtype from any details or field
  const subType = (
    activity.subType ||
    activity.accomodationDetails?.subType ||
    activity.transportationDetails?.subType ||
    (activity.transportationDetails as any)?.mode ||
    activity.rideRentalDetails?.subType ||
    (activity.rideRentalDetails as any)?.vehicleType ||
    activity.natureDetails?.subType ||
    activity.shoppingDetails?.subType ||
    activity.entertainmentDetails?.subType ||
    activity.sightseeingDetails?.subType ||
    (activity.cafeRestaurantDetails as any)?.cuisine ||
    activity.destinationData?.subType ||
    (activity as any).category ||
    ""
  )
    .toLowerCase()
    .trim();

  if (subType) {
    if (
      subType.includes("flight") ||
      subType.includes("plane") ||
      subType.includes("airport")
    ) {
      return { name: "flight-takeoff", iconSet: "material" };
    }
    if (subType.includes("resort") || subType.includes("beach")) {
      return { name: "beach-access", iconSet: "material" };
    }
    if (
      subType.includes("hotel") ||
      subType.includes("hostel") ||
      subType.includes("motel") ||
      subType.includes("stay") ||
      subType.includes("lodging") ||
      subType.includes("rest")
    ) {
      return { name: "hotel", iconSet: "material" };
    }
    if (
      subType.includes("villa") ||
      subType.includes("apartment") ||
      subType.includes("airbnb") ||
      subType.includes("house") ||
      subType.includes("homestay") ||
      subType.includes("cabin")
    ) {
      return { name: "house", iconSet: "material" };
    }
    if (subType.includes("camp") || subType.includes("glamp")) {
      return { name: "night-shelter", iconSet: "material" };
    }
    if (
      subType.includes("hike") ||
      subType.includes("mountain") ||
      subType.includes("trek")
    ) {
      return { name: "hiking", iconSet: "material" };
    }
    if (
      subType.includes("cafe") ||
      subType.includes("coffee") ||
      subType.includes("tea") ||
      subType.includes("bar")
    ) {
      return { name: "local-cafe", iconSet: "material" };
    }
    if (
      subType.includes("restaurant") ||
      subType.includes("food") ||
      subType.includes("dining")
    ) {
      return { name: "restaurant", iconSet: "material" };
    }
    if (
      subType.includes("photo") ||
      subType.includes("sight") ||
      subType.includes("attraction")
    ) {
      return { name: "photo-camera", iconSet: "material" };
    }
    if (
      subType.includes("shop") ||
      subType.includes("mall") ||
      subType.includes("market") ||
      subType.includes("store")
    ) {
      return { name: "shopping-bag", iconSet: "material" };
    }
    if (
      subType.includes("movie") ||
      subType.includes("cinema") ||
      subType.includes("play") ||
      subType.includes("entertainment")
    ) {
      return { name: "local-play", iconSet: "material" };
    }
    if (
      subType.includes("train") ||
      subType.includes("subway") ||
      subType.includes("metro") ||
      subType.includes("rail")
    ) {
      return { name: "train", iconSet: "material" };
    }
    if (subType.includes("bus")) {
      return { name: "directions-bus", iconSet: "material" };
    }
    if (
      subType.includes("boat") ||
      subType.includes("ferry") ||
      subType.includes("cruise")
    ) {
      return { name: "directions-boat", iconSet: "material" };
    }
    if (
      subType.includes("bike") ||
      subType.includes("motorcycle") ||
      subType.includes("scooter")
    ) {
      return { name: "two-wheeler", iconSet: "material" };
    }
    if (
      subType.includes("car") ||
      subType.includes("taxi") ||
      subType.includes("rental")
    ) {
      return { name: "directions-car", iconSet: "material" };
    }
    if (subType.includes("walk")) {
      return { name: "directions-walk", iconSet: "material" };
    }
  }

  // 3. Fallback to top-level TripPlanType
  switch (type) {
    case TripPlanType.flight:
      return { name: "flight-takeoff", iconSet: "material" };
    case TripPlanType.stay:
      return { name: "hotel", iconSet: "material" };
    case TripPlanType.transit:
      return { name: "directions-bus", iconSet: "material" };
    case TripPlanType.rideRental:
      return { name: "directions-car", iconSet: "material" };
    case TripPlanType.tour:
      return { name: "hiking", iconSet: "material" };
    case TripPlanType.activity:
    default:
      return { name: "lightbulb", iconSet: "material" };
  }
};

export const NoDetailsAdded: React.FC<NoDetailsAddedProps> = ({
  activity,
  onEditActivity,
}) => {
  const { openActivityModal } = useTravelContext();
  const iconInfo = getActivityIconInfo(activity);

  const handleEditPress = () => {
    if (!activity) return;
    if (onEditActivity) {
      onEditActivity(activity);
    } else {
      openActivityModal(
        activity,
        activity.sectionId || undefined,
        activity.travelId || undefined,
        activity.type
      );
    }
  };

  return (
    <View
      className={
        "p-8 items-center justify-center flex-1 my-4 bg-gray-50 " +
        "rounded-2xl mx-2 border border-gray-100"
      }
    >
      <View className="items-center">
        {iconInfo.iconSet === "ionicons" ? (
          <Ionicons name={iconInfo.name} size={42} color={"#d1d5db"} />
        ) : (
          <Icon name={iconInfo.name} size={42} color={"#d1d5db"} />
        )}
        <Text className="text-2xl font-semibold text-secondary text-center mt-3 mb-1">
          No details added
        </Text>
        <Text className="text-md font-normal text-tertiary/70 text-center px-4 leading-5">
          Tap the edit button above or click the button below to add some details
        </Text>

        {activity && (
          <TouchableOpacity
            onPress={handleEditPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit or add more details"
            className="flex-row items-center mt-2 py-1 px-xs gap-1.5"
          >
            <Icon name="edit" size={16} color={"#0EA5E9"} />
            <Text
              className="text-sm font-semibold"
              style={{ color: "#0EA5E9" }}
            >
              Add Details
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export const FlightDetails = ({
  data,
  activity,
  onEditActivity,
}: {
  data?: FlightDetailsDto | null;
  activity?: ItineraryActivity | null;
  onEditActivity?: (activity: ItineraryActivity) => void;
}) => {
  if (!hasActivityData(data)) {
    return (
      <NoDetailsAdded
        activity={activity || ({ type: TripPlanType.flight } as any)}
        onEditActivity={onEditActivity}
      />
    );
  }
  return <FlightDetailsCard data={data!} />;
};

export const AccomodationDetails = ({
  data,
  activity,
  onFullScreenChange,
  onEditActivity,
}: {
  data?: AccomodationDetailsDto | null;
  activity?: ItineraryActivity | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
  onEditActivity?: (activity: ItineraryActivity) => void;
}) => {
  if (!hasActivityData(data)) {
    return (
      <NoDetailsAdded
        activity={activity || ({ type: TripPlanType.stay } as any)}
        onEditActivity={onEditActivity}
      />
    );
  }
  return (
    <AccomodationDetailsCard
      data={data!}
      onFullScreenChange={onFullScreenChange}
    />
  );
};

export const TransportationDetails = ({
  data,
  activity,
  onFullScreenChange,
  onEditActivity,
}: {
  data?: (TransportationDetailsDto & { destinationData?: any }) | null;
  activity?: ItineraryActivity | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
  onEditActivity?: (activity: ItineraryActivity) => void;
}) => {
  if (!hasActivityData(data)) {
    return (
      <NoDetailsAdded
        activity={activity || ({ type: TripPlanType.transit } as any)}
        onEditActivity={onEditActivity}
      />
    );
  }
  return (
    <TransportationDetailsCard
      data={data!}
      onFullScreenChange={onFullScreenChange}
    />
  );
};

export const RideRentalDetails = ({
  data,
  activity,
  onFullScreenChange,
  onEditActivity,
}: {
  data?: (RideRentalDetailsDto & { destinationData?: any }) | null;
  activity?: ItineraryActivity | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
  onEditActivity?: (activity: ItineraryActivity) => void;
}) => {
  if (!hasActivityData(data)) {
    return (
      <NoDetailsAdded
        activity={activity || ({ type: TripPlanType.rideRental } as any)}
        onEditActivity={onEditActivity}
      />
    );
  }
  return (
    <RideRentalDetailsCard
      data={data!}
      onFullScreenChange={onFullScreenChange}
    />
  );
};

export const PlanDetails = ({
  data,
  activity,
  onFullScreenChange,
  onEditActivity,
}: {
  data?: any;
  activity?: ItineraryActivity | null;
  onFullScreenChange?: (fullScreen: boolean) => void;
  onEditActivity?: (activity: ItineraryActivity) => void;
}) => {
  const planItem = activity || data;
  if (!planItem) {
    return (
      <NoDetailsAdded
        activity={activity || ({ type: TripPlanType.activity } as any)}
        onEditActivity={onEditActivity}
      />
    );
  }
  return (
    <PlanDetailsCard
      activity={planItem}
      onFullScreenChange={onFullScreenChange}
      onEditActivity={onEditActivity}
    />
  );
};
