import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import SectionAccordion from "../SectionAccordion";
import { TravelPlan } from "../../../../Travel/types/TravelDto";

interface ItineraryTabProps {
  travelPlan: TravelPlan;
  plainMode?: boolean;
}

// Enable LayoutAnimation experimental support on Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Tactile spring layout animation configuration
const springConfig = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.8,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

// Icons and labels configuration for each view mode
const viewModeConfig = {
  plain: {
    icon: "view-headline" as const,
    label: "Plain list view",
  },
  narrow: {
    icon: "format-list-bulleted" as const,
    label: "Compact view",
  },
  expanded: {
    icon: "view-list" as const,
    label: "Detailed view",
  },
};

//TODO in the future use travel contex data to avoid API calling 
const ItineraryTab = ({ travelPlan, plainMode: initialPlainMode }: ItineraryTabProps) => {
  const { colors } = useTheme();
  const [viewMode, setViewMode] = useState<"plain" | "narrow" | "expanded">(
    initialPlainMode ? "plain" : "expanded"
  );

  const handleModeChange = (mode: "plain" | "narrow" | "expanded") => {
    // Schedule springy native UI layout transition
    LayoutAnimation.configureNext(springConfig);
    setViewMode(mode);
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Segmented control view mode toolbar */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Itinerary View
        </Text>
        <View className="flex-row bg-gray-100 rounded-full p-1 border border-gray-200">
          {(["plain", "narrow", "expanded"] as const).map((mode) => {
            const isActive = viewMode === mode;
            const config = viewModeConfig[mode];
            return (
              <TouchableOpacity
                key={mode}
                accessibilityRole="button"
                accessibilityLabel={config.label}
                accessibilityState={{ selected: isActive }}
                onPress={() => handleModeChange(mode)}
                style={{
                  backgroundColor: isActive ? colors.primary || "#263F69" : "transparent",
                  width: 28,
                  height: 28,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  marginHorizontal: 2
                }}
              >
                <MaterialIcons
                  name={config.icon}
                  size={18}
                  color={isActive ? "#FFF" : "#666"}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {travelPlan.itinerarySection && travelPlan.itinerarySection?.length > 0 ? (
        <SectionAccordion
          iterarysections={travelPlan.itinerarySection}
          plainMode={viewMode === "plain"}
          viewMode={viewMode}
        />
      ) : (
        <View className="flex-1 items-center justify-center h-[300px]">
          <Text className="text-sm text-[#555] tracking-wider leading-5">No itinerary Added</Text>
        </View>
      )}
    </View>
  );
};

export default ItineraryTab;
