import React from "react";
import { View } from "react-native";
import { Feather, Ionicons, MaterialIcons as Icon } from "@expo/vector-icons";
import { IconSetProvider, TripType } from "../../types/enums";

type TripTypeProps = {
  type: TripType;
  size?: number;
  color?: string;
  showIconOnly?: boolean;
};

interface TripIconConfig {
  iconSet: IconSetProvider;
  tripType: TripType;
  iconName: string;
  color: string;
}

const tripIcons: TripIconConfig[] = [
  {
    iconSet: IconSetProvider.ionic,
    tripType: TripType.none,
    iconName: "ellipse",
    color: "#9E9E9E",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.ride,
    iconName: "directions-car",
    color: "#3F51B5",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.camp,
    iconName: "landscape",
    color: "#4CAF50",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.hike,
    iconName: "hiking",
    color: "#558B2F",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.event,
    iconName: "celebration",
    color: "#E91E63",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.concert,
    iconName: "music-note",
    color: "#7B1FA2",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.marathon,
    iconName: "directions-run",
    color: "#FF5722",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.shopping,
    iconName: "shopping-cart",
    color: "#E91E63",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.forum,
    iconName: "forum",
    color: "#26A69A",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.workshop,
    iconName: "build",
    color: "#607D8B",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.symposium,
    iconName: "school",
    color: "#0288D1",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.colloquium,
    iconName: "groups",
    color: "#6D4C41",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.vacation,
    iconName: "beach-access",
    color: "#FFC107",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.business,
    iconName: "business-center",
    color: "#455A64",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.roadtrip,
    iconName: "drive-eta",
    color: "#2196F3",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.solo,
    iconName: "person",
    color: "#9C27B0",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.family,
    iconName: "family-restroom",
    color: "#4CAF50",
  },
  {
    iconSet: IconSetProvider.material,
    tripType: TripType.backpacking,
    iconName: "backpack",
    color: "#8BC34A",
  },
];

export { tripIcons };

const getIcon = (type: number): TripIconConfig => {
  const selectedIcon = tripIcons.find((i) => i.tripType == type);
  return (
    selectedIcon ??
    tripIcons.find((i) => i.tripType === TripType.none)!
  );
};

const TripIcon = ({
  type,
  size = 20,
  color,
  showIconOnly = false,
}: TripTypeProps) => {
  const tripIcon = getIcon(type);
  const resolvedColor = color ?? tripIcon.color;

  const getIconDisplay = (iconConfig: TripIconConfig) => {
    if (showIconOnly) {
      if (iconConfig.iconSet === IconSetProvider.feather) {
        return <Feather name={iconConfig.iconName as any} size={size} color={resolvedColor} />;
      } else if (iconConfig.iconSet === IconSetProvider.ionic) {
        return <Ionicons name={iconConfig.iconName as any} size={size} color={resolvedColor} />;
      } else if (iconConfig.iconSet === IconSetProvider.material) {
        return <Icon name={iconConfig.iconName as any} size={size} color={resolvedColor} />;
      }
    }

    if (iconConfig.iconSet === IconSetProvider.feather) {
      return (
        <View style={{ borderColor: resolvedColor + '90', borderWidth: 1.5, borderRadius: 50, backgroundColor: resolvedColor + '20' }} className="rounded-full p-2">
          <Feather name={iconConfig.iconName as any} size={size} color={resolvedColor} />
        </View>
      );
    } else if (iconConfig.iconSet === IconSetProvider.ionic) {
      return (
        <View style={{ borderColor: resolvedColor + '90', borderWidth: 1.5, borderRadius: 50, backgroundColor: resolvedColor + '20' }} className="rounded-full p-2">
          <Ionicons name={iconConfig.iconName as any} size={size} color={resolvedColor} />
        </View>
      );
    } else if (iconConfig.iconSet === IconSetProvider.material) {
      return (
        <View style={{ borderColor: resolvedColor + '90', borderWidth: 1, borderRadius: 50, backgroundColor: resolvedColor + '20' }} className="rounded-full p-2">
          <Icon name={iconConfig.iconName as any} size={size} color={resolvedColor} />
        </View>
      );
    }
  };

  return <View>{tripIcon && getIconDisplay(tripIcon)}</View>;
};

export default TripIcon;
