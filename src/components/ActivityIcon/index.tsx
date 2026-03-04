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
  //TODO: move and add more
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.none,
    name: "default",
    iconName: "ellipse",
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.flight,
    name: "flight",
    iconName: "airplane",
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.checkIn,
    name: "checkIn",
    iconName: "bag-check",
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.walk,
    name: "checkIn",
    iconName: "bag-check",
  },
  {
    iconSet: IconSetProvider.ionic,
    activityType: ActivityType.sightseeing,
    name: "sightseeing",
    iconName: "glasses",
  },
  {
    iconSet: IconSetProvider.material,
    activityType: ActivityType.shopping,
    name: "shopping",
    iconName: "shopping-cart",
  },
];

interface ActivityIcon {
  iconSet: IconSetProvider;
  iconName: FeatherGlyphs | IoniconsGlyphs;
  activityType: ActivityType;
  name: string;
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

  const featherIconName = activityIcon.iconName as FeatherGlyphs;
  const ioniconName = activityIcon.iconName as IoniconsGlyphs;

  const getIconDisplay = (activityIcon: ActivityIcon) => {
    if (activityIcon.iconSet == IconSetProvider.feather) {
      return <Feather name={featherIconName} size={size} color={color} />;
    } else if (activityIcon.iconSet == IconSetProvider.ionic) {
      return <Ionicons name={ioniconName} size={size} color={color} />;
    } else if (activityIcon.iconSet == IconSetProvider.material) {
      return <Icon name={activityIcon.iconName} size={size} color={color} />;
    }
  };

  return (
    <View
      style={{
        backgroundColor: "#FFF",
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
