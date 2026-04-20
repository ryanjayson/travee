import React, { useState } from "react";
import { View } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { IconSetProvider, ActivityType } from "../../types/enums";
// import { Icon } from "react-native-vector-icons/Icon";
// eslint-disable-next-line
import { FeatherGlyphs } from "@expo/vector-icons/build/Feather";
// eslint-disable-next-line
import { IoniconsGlyphs } from "@expo/vector-icons/build/Ionicons";
// eslint-disable-next-line
// import { MaterialIconsGlyphs } from "expo/vector-icons/build/MaterialIcons";
import Icon from "react-native-vector-icons/MaterialIcons";

type ActivityTypeProps = {
  type: ActivityType;
  size?: number;
  color?: string;
};

const activityIcons: ActivityIcon[] = [
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.none,
    name: ActivityType.none,
    iconName: "ellipse",
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.flight,
    name: ActivityType.flight,
    iconName: "airplane",
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.checkIn,
    name: ActivityType.checkIn,
    iconName: "bag-check",
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.checkOut,
    name: ActivityType.checkOut,
    iconName: "bag-remove",
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.taxi,
    name: ActivityType.taxi,
    iconName: "local-taxi",
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.sightseeing,
    name: ActivityType.sightseeing,
    iconName: "glasses",
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.shopping,
    name: ActivityType.shopping,
    iconName: "shopping-cart",
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.cafe,
    name: ActivityType.cafe,
    iconName: "local-cafe",
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.food,
    name: ActivityType.food,
    iconName: "restaurant",
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.walk,
    name: ActivityType.walk,
    iconName: "walk",
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.preparation,
    name: ActivityType.preparation,
    iconName: "build",
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.ride,
    name: ActivityType.ride,
    iconName: "directions-car",
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.rest,
    name: ActivityType.rest,
    iconName: "hotel",
  },
];

interface ActivityIcon {
  iconSet: IconSetProvider;
  iconName: any;
  activityType: ActivityType;
  name: ActivityType;
}

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
  color = "#dc3545",
}: ActivityTypeProps) => {
  const [activityIcon, _setActivityIcon] = useState<ActivityIcon>(
    getIcon(type)
  );

  const getIconDisplay = (activityIcon: ActivityIcon) => {
    if (activityIcon.iconSet == IconSetProvider.feather) {
      return <Feather name={activityIcon.iconName as any} size={size} color={color} />;
    } else if (activityIcon.iconSet == IconSetProvider.ionic) {
      return <Ionicons name={activityIcon.iconName as any} size={size} color={color} />;
    } else if (activityIcon.iconSet == IconSetProvider.material) {
      return <Icon name={activityIcon.iconName as any} size={size} color={color} />;
    }
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#FFF",
        borderRadius: 50,
        paddingVertical: 6,
      }}
    >
      {activityIcon && getIconDisplay(activityIcon)}
    </View>
  );
};

export default ActivityIcon;
