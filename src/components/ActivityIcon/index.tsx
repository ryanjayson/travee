import React, { useState } from "react";
import { View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { IconSetProvider, ActivityType } from "../../types/enums";
// eslint-disable-next-line
import Icon from "react-native-vector-icons/MaterialIcons";

type ActivityTypeProps = {
  type: ActivityType;
  size?: number;
  color?: string;
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
    color: "#9E9E9E", // grey
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.flight,
    name: ActivityType.flight,
    iconName: "airplane",
    color: "#2196F3", // blue hsl(207)
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.checkIn,
    name: ActivityType.checkIn,
    iconName: "bag-check",
    color: "#4CAF50", // green hsl(122)
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.checkOut,
    name: ActivityType.checkOut,
    iconName: "bag-remove",
    color: "#F44336", // red hsl(4)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.taxi,
    name: ActivityType.taxi,
    iconName: "local-taxi",
    color: "#FFC107", // amber hsl(45)
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.sightseeing,
    name: ActivityType.sightseeing,
    iconName: "glasses",
    color: "#FF9800", // orange hsl(36)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.shopping,
    name: ActivityType.shopping,
    iconName: "shopping-cart",
    color: "#E91E63", // pink hsl(340)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.cafe,
    name: ActivityType.cafe,
    iconName: "local-cafe",
    color: "#795548", // brown hsl(16)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.food,
    name: ActivityType.food,
    iconName: "restaurant",
    color: "#FF5722", // deep-orange hsl(14)
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
    activityType: ActivityType.preparation,
    name: ActivityType.preparation,
    iconName: "build",
    color: "#607D8B", // blue-grey hsl(200)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.ride,
    name: ActivityType.ride,
    iconName: "directions-car",
    color: "#3F51B5", // indigo hsl(231)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.rest,
    name: ActivityType.rest,
    iconName: "hotel",
    color: "#9C27B0", // purple hsl(291)
  },
  // --- New entries ---
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.bus,
    name: ActivityType.bus,
    iconName: "directions-bus",
    color: "#00BCD4", // cyan hsl(187)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.train,
    name: ActivityType.train,
    iconName: "train",
    color: "#673AB7", // deep-purple hsl(261)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.ferry,
    name: ActivityType.ferry,
    iconName: "directions-boat",
    color: "#0288D1", // light-blue hsl(199)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.hike,
    name: ActivityType.hike,
    iconName: "hiking",
    color: "#558B2F", // dark-green hsl(86)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.museum,
    name: ActivityType.museum,
    iconName: "museum",
    color: "#6D4C41", // dark-brown hsl(15)
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.beach,
    name: ActivityType.beach,
    iconName: "sunny",
    color: "#FFD600", // yellow hsl(53)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.sports,
    name: ActivityType.sports,
    iconName: "sports-soccer",
    color: "#43A047", // green hsl(123)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.spa,
    name: ActivityType.spa,
    iconName: "spa",
    color: "#EC407A", // pink hsl(340)
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
    activityType: ActivityType.photography,
    name: ActivityType.photography,
    iconName: "photo-camera",
    color: "#455A64", // blue-grey-dark hsl(200)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.concert,
    name: ActivityType.concert,
    iconName: "music-note",
    color: "#7B1FA2", // purple hsl(289)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.nightOut,
    name: ActivityType.nightOut,
    iconName: "nightlife",
    color: "#1A237E", // deep-indigo hsl(234)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.bike,
    name: ActivityType.bike,
    iconName: "directions-bike",
    color: "#F57F17", // dark-amber hsl(41)
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.borderCrossing,
    name: ActivityType.borderCrossing,
    iconName: "flag",
    color: "#D32F2F", // dark-red hsl(0)
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
  size = 26,
  color,
}: ActivityTypeProps) => {
  const [activityIcon, _setActivityIcon] = useState<ActivityIcon>(
    getIcon(type)
  );

  // Use the per-type hue color if no override was provided
  const resolvedColor = color ?? activityIcon.color;

  const getIconDisplay = (activityIcon: ActivityIcon) => {
    if (activityIcon.iconSet == IconSetProvider.feather) {
      return <Feather name={activityIcon.iconName as any} size={size} color={resolvedColor} />;
    } else if (activityIcon.iconSet == IconSetProvider.ionic) {
      return <Ionicons name={activityIcon.iconName as any} size={size} color={resolvedColor} />;
    } else if (activityIcon.iconSet == IconSetProvider.material) {
      return <Icon name={activityIcon.iconName as any} size={size} color={resolvedColor} />;
    }
  };

  return (
    <View>
      {activityIcon && getIconDisplay(activityIcon)}
    </View>
  );
};

export default ActivityIcon;
