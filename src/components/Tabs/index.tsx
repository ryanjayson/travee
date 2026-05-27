import React, { useState, FC, ReactNode, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

// --- Types ---
interface TabItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  initialActiveTabId?: string;
  type?: TabsType;
  onTabChange?: (tabId: string) => void;
  expanded?: boolean;
  hasActionTripStatus?: boolean;
}

type TabsType = "primary" | "secondary" | "default";

// --- Component ---
const Tabs: FC<TabsProps> = ({ tabs, initialActiveTabId, type = "primary", onTabChange, expanded, hasActionTripStatus }) => {
  const [activeTabId, setActiveTabId] = useState(
    initialActiveTabId || tabs[0]?.id
  );

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const renderTabButton = (tab: TabItem) => {
    const isActive = tab.id === activeTabId;
    const isOngoingWithActiveTrip = tab.id === "ongoing" && hasActionTripStatus;

    let displayTitle = tab.title;
    if (type === "default" && tab.id === "ongoing") {
      displayTitle = tab.title.replace(/\s*\(\d+\)/, "");
    }

    let buttonClass = "";
    let textClass = "";

    if (type === "primary") {
      buttonClass = isActive 
        ? "bg-primary rounded-xl px-5 py-2 mr-3 my-2 items-center justify-center shadow-sm h-14 min-w-24"
        : "bg-gray-100 rounded-xl px-5 py-2 mr-3 my-2 items-center justify-center h-14 min-w-24";
      textClass = isActive 
        ? "text-white font-semibold text-base"
        : "text-gray-500 font-medium text-base";
    } else if (type === "secondary") {
      buttonClass = isActive
        ? "px-4 py-3 border-b-2 border-[#263F69] items-center justify-center"
        : "px-4 py-3 border-b-2 border-transparent items-center justify-center";
      textClass = isActive
        ? "text-[#263F69] font-bold text-base"
        : "text-gray-500 font-medium text-base";
    } else { // "default"
      buttonClass = isActive
        ? (isOngoingWithActiveTrip ? "bg-success-100 border border-success-500 rounded-xl py-1.5 px-4 mr-3 my-2 items-center justify-center" : "bg-brand-50 border border-brand-100 rounded-xl py-1.5 px-4 mr-3 my-2 items-center justify-center")
        : "bg-white border border-[#E0E0E0] rounded-xl py-1.5 px-4 mr-3 my-2 items-center justify-center ";
      textClass = isActive
        ? (isOngoingWithActiveTrip ? "text-success-500 font-semibold text-sm" : "text-primary font-semibold text-sm")
        : "text-gray-600 font-medium text-sm";
    }

    return (
      <TouchableOpacity
        key={tab.id}
        className={buttonClass}
        onPress={() => {
          setActiveTabId(tab.id);
          if (onTabChange) onTabChange(tab.id);
        }}
        activeOpacity={0.8}
      >
        <View className="flex-row items-center gap-1.5">
          {isOngoingWithActiveTrip && (
            <Animated.View 
              style={{ opacity: pulseAnim }}
              className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-300' : 'bg-green-500'}`}
            />
          )}
          <Text className={textClass}>
            {displayTitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  let wrapperStyle = "bg-white border-b border-gray-100";

  if (type === "secondary") {
    wrapperStyle = "bg-white border-b border-gray-100";
  } else if (type === "default") {
    wrapperStyle = "";
  } else { // "primary"
    wrapperStyle = "bg-white border-b border-gray-100";
  }

  return (
    <View className={expanded ? "flex-1" : ""}>
      {/* Tab Header */}
      <View className={wrapperStyle}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <View className="flex-row">
            {tabs.map(renderTabButton)}
          </View>
        </ScrollView>
      </View>
     
      {/* Tab Content */}
      {expanded ? (
        <View className="flex-1">
          {activeTab ? (
            activeTab.content
          ) : (
            <Text className="text-[#999] text-center mt-5">No content found.</Text>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {activeTab ? (
            activeTab.content
          ) : (
            <Text className="text-[#999] text-center mt-5">No content found.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default Tabs;


