import React, { useState, FC, ReactNode, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
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
}

type TabsType = "primary" | "secondary" | "default";

// --- Component ---
const Tabs: FC<TabsProps> = ({ tabs, initialActiveTabId, type = "primary", onTabChange, expanded }) => {
  const [activeTabId, setActiveTabId] = useState(
    initialActiveTabId || tabs[0]?.id
  );

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const renderTabButton = (tab: TabItem) => {
    const isActive = tab.id === activeTabId;

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
        ? "px-4 py-3 mr-4 border-b-2 border-[#263F69] items-center justify-center"
        : "px-4 py-3 mr-4 border-b-2 border-transparent items-center justify-center";
      textClass = isActive
        ? "text-[#263F69] font-bold text-base"
        : "text-gray-500 font-medium text-base";
    } else { // "default"
      buttonClass = isActive
        ? "bg-brand-50 border border-brand-100 rounded-xl py-1.5 px-4 mr-3 my-2 items-center justify-center"
        : "bg-white border border-[#E0E0E0] rounded-xl py-1.5 px-4 mr-3 my-2 items-center justify-center";
      textClass = isActive
        ? "text-primary font-semibold text-sm"
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
        <Text className={textClass}>
          {tab.title}
        </Text>
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


