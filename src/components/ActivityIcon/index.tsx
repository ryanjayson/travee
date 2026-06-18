import React from "react";
import { View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { IconSetProvider, ActivityType } from "../../types/enums";
// eslint-disable-next-line
import Icon from "react-native-vector-icons/MaterialIcons";

type ActivityTypeProps = {
  type: ActivityType;
  size?: number;
  color?: string;
  showIconOnly?: boolean;
};

interface ActivityIcon {
  iconSet: IconSetProvider;
  iconName: any;
  activityType: ActivityType;
  name: ActivityType;
  color: string; // hue color per activity
}

const activityIcons: ActivityIcon[] = [
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.none,
    name: ActivityType.none,
    iconName: "ellipse",
    color: "#F04438", // grey
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.flight,
    name: ActivityType.flight,
    iconName: "airplane",
    color: "#2196F3", // blue hsl(207)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.accomodation,
    name: ActivityType.accomodation,
    iconName: "hotel",
    color: "#9C27B0", // purple hsl(291)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.cafeRestaurant,
    name: ActivityType.cafeRestaurant,
    iconName: "restaurant",
    color: "#FF5722", // deep-orange hsl(14)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.nature,
    name: ActivityType.nature,
    iconName: "terrain",
    color: "#165135", // green hsl(122)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.shopppingAndService,
    name: ActivityType.shopppingAndService,
    iconName: "shopping-bag",
    color: "#E91E63", // pink hsl(340)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.entertainmentAndRecreation,
    name: ActivityType.entertainmentAndRecreation,
    iconName: "local-play",
    color: "#7B1FA2", // purple hsl(289)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.transportation,
    name: ActivityType.transportation,
    iconName: "directions-bus",
    color: "#00BCD4", // cyan hsl(187)
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.walk,
    name: ActivityType.walk,
    iconName: "walk",
    color: "#8BC34A", // light-green hsl(88)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.sightseeing,
    name: ActivityType.sightseeing,
    iconName: "photo-camera",
    color: "#FF9800", // orange hsl(36)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.preparation,
    name: ActivityType.preparation,
    iconName: "build",
    color: "#607D8B", // blue-grey hsl(200)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.rest,
    name: ActivityType.rest,
    iconName: "hotel",
    color: "#9E9E9E", // grey
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.hikeOrCamp,
    name: ActivityType.hikeOrCamp,
    iconName: "hiking",
    color: "#429862", // dark-green hsl(86)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.motorcycleRide,
    name: ActivityType.motorcycleRide,
    iconName: "motorcycle",
    color: "#F57F17", // dark-amber hsl(41)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.meetup,
    name: ActivityType.meetup,
    iconName: "people",
    color: "#26A69A", // teal hsl(175)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.rideRental,
    name: ActivityType.rideRental,
    iconName: "directions-car",
    color: "#3F51B5", // indigo hsl(231)
  },
];

export { activityIcons };

const getIcon = (type: number): ActivityIcon => {
  const selectedIcon = activityIcons.find((i) => i.activityType == type);
  return (
    selectedIcon ??
    activityIcons.find((i) => i.activityType === ActivityType.none)!
  );
};

const ActivityIcon = ({
  type,
  size = 20,
  color,
  showIconOnly = false,
}: ActivityTypeProps) => {
  const activityIcon = getIcon(type);

  // Use the per-type hue color if no override was provided
  const resolvedColor = color ?? activityIcon.color;

  const getIconDisplay = (activityIcon: ActivityIcon) => {
    if (showIconOnly) {
      if (activityIcon.iconSet == IconSetProvider.feather) {
        return <Feather name={activityIcon.iconName as any} size={size} color={resolvedColor} />;
      } else if (activityIcon.iconSet == IconSetProvider.ionic) {
        return <Ionicons name={activityIcon.iconName as any} size={size} color={resolvedColor} />;
      } else if (activityIcon.iconSet == IconSetProvider.material) {
        return <Icon name={activityIcon.iconName as any} size={size} color={resolvedColor} />;
      }
    }

    if (activityIcon.iconSet == IconSetProvider.feather) {
      return <View style={{ borderColor: resolvedColor + '20', borderWidth: 1, borderRadius: 50, backgroundColor: resolvedColor + '20' }} className="rounded-full p-3"><Feather name={activityIcon.iconName as any} size={size} color={resolvedColor} /></View>;
    } else if (activityIcon.iconSet == IconSetProvider.ionic) {
      return <View style={{ borderColor: resolvedColor + '20', borderWidth: 1, borderRadius: 50, backgroundColor: resolvedColor + '20' }} className="rounded-full p-3"><Ionicons name={activityIcon.iconName as any} size={size} color={resolvedColor} /></View>;
    } else if (activityIcon.iconSet == IconSetProvider.material) {
      return <View style={{ borderColor: resolvedColor + '20', borderWidth: 1, borderRadius: 50, backgroundColor: resolvedColor + '20' }} className="rounded-full p-3"><Icon name={activityIcon.iconName as any} size={size} color={resolvedColor} /></View>;
    }
  };

  return (
    <View>
      {activityIcon && getIconDisplay(activityIcon)}
    </View>
  );
};

export default ActivityIcon;
