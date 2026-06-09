import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Switch,
} from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import SectionAccordion from "../SectionAccordion";
import { TravelPlan } from "../../../../Travel/types/TravelDto";
import { useTripSetting, useUpdateTripSetting } from "../../../hooks/useTripSetting";

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

const toViewMode = (itineraryView?: string): "plain" | "narrow" | "expanded" => {
  switch (itineraryView) {
    case "plain":
      return "plain";
    case "compact":
      return "narrow";
    case "detailed":
    default:
      return "expanded";
  }
};

const toItineraryView = (viewMode: "plain" | "narrow" | "expanded"): "plain" | "compact" | "detailed" => {
  switch (viewMode) {
    case "plain":
      return "plain";
    case "narrow":
      return "compact";
    case "expanded":
    default:
      return "detailed";
  }
};

const ItineraryTab = ({ travelPlan, plainMode: initialPlainMode }: ItineraryTabProps) => {
  const { colors } = useTheme();
  const travelId = travelPlan.travel.id || "";
  const { data: dbSetting } = useTripSetting(travelId);
  const updateSettingMutation = useUpdateTripSetting();

  // Combine fetched settings, travel payload settings, and defaults
  const currentSetting = dbSetting || travelPlan.travel.tripSetting || travelPlan.tripSetting;

  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"plain" | "narrow" | "expanded">(() => {
    if (initialPlainMode) return "plain";
    if (currentSetting) {
      return toViewMode(currentSetting.itineraryView);
    }
    return "expanded";
  });

  const [allowItemReordering, setAllowItemReordering] = useState(() => {
    if (currentSetting) {
      return currentSetting.allowItemReordering;
    }
    return true;
  });

  // Reactively synchronize local states when database settings update
  useEffect(() => {
    if (currentSetting) {
      setViewMode(toViewMode(currentSetting.itineraryView));
      setAllowItemReordering(currentSetting.allowItemReordering);
    }
  }, [currentSetting]);

  const toggleSettings = () => {
    LayoutAnimation.configureNext(springConfig);
    setIsSettingsExpanded((prev) => !prev);
  };

  const collapseSettings = () => {
    if (isSettingsExpanded) {
      LayoutAnimation.configureNext(springConfig);
      setIsSettingsExpanded(false);
    }
  };

  const handleModeChange = (mode: "plain" | "narrow" | "expanded") => {
    LayoutAnimation.configureNext(springConfig);
    setViewMode(mode);

    const itineraryView = toItineraryView(mode);
    updateSettingMutation.mutate({
      id: currentSetting?.id,
      travelId,
      currency: currentSetting?.currency || "PHP",
      timezone: currentSetting?.timezone || "Asia/Manila",
      itineraryView,
      allowItemReordering,
    });
  };

  const handleReorderToggle = (value: boolean) => {
    setAllowItemReordering(value);

    const itineraryView = toItineraryView(viewMode);
    updateSettingMutation.mutate({
      id: currentSetting?.id,
      travelId,
      currency: currentSetting?.currency || "PHP",
      timezone: currentSetting?.timezone || "Asia/Manila",
      itineraryView,
      allowItemReordering: value,
    });
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Settings Accordion Header */}
      <TouchableOpacity
        onPress={toggleSettings}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Toggle Display Settings"
        className={`flex-row items-center justify-between px-5 py-3  ${isSettingsExpanded ? " bg-white" : ""}`}
      >
        <View className="flex-row items-center gap-3">
          {/* <Text className="text-sm font-semibold text-gray-900">
            Itinerary Settings
          </Text> */}
        </View>
        <View className="flex-row items-center gap-2">
          <MaterialIcons name="settings" size={20} color={colors.primary} />
          <MaterialIcons
            name={isSettingsExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
            size={22}
            color="#667085"
          />
        </View>
        
      </TouchableOpacity>

      {/* Settings Accordion Body */}
      {isSettingsExpanded && (
        <View className="bg-white border-b border-gray-200 px-5 py-4 gap-4 absolute z-50 top-5xl right-0 w-full">
          {/* View Mode Selection Row */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-semibold text-gray-900">View Style</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Choose layout style for activities</Text>
            </View>
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
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: "center",
                      justifyContent: "center",
                      marginHorizontal: 3
                    }}
                  >
                    <MaterialIcons
                      name={config.icon}
                      size={20}
                      color={isActive ? "#FFF" : "#666"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-100" />

          {/* Reordering Permission Row */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-semibold text-gray-900">Allow drag & drop reordering</Text>
              <Text className="text-xs text-gray-500 mt-0.5">Toggle section and activity sorting</Text>
            </View>
            <Switch
              value={allowItemReordering}
              onValueChange={handleReorderToggle}
              trackColor={{ false: "#D0D5DD", true: `${colors.primary}80` }}
              thumbColor={allowItemReordering ? colors.primary : "#F2F4F7"}
              ios_backgroundColor="#D0D5DD"
            />
          </View>
        </View>
      )}

      {travelPlan.itinerarySection && travelPlan.itinerarySection?.length > 0 ? (
        <SectionAccordion
          iterarysections={travelPlan.itinerarySection}
          plainMode={viewMode === "plain"}
          viewMode={viewMode}
          allowItemReordering={allowItemReordering}
          onInteraction={collapseSettings}
        />
      ) : (
        <View 
          onTouchStart={collapseSettings}
          className="flex-1 items-center justify-center h-[300px]"
        >
          <Text className="text-sm text-[#555] tracking-wider leading-5">No itinerary Added</Text>
        </View>
      )}
    </View>
  );
};

export default ItineraryTab;

