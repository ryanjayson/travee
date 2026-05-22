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

type TabsType = "primary" | "secondary" | "normal";

// --- Component ---
const Tabs: FC<TabsProps> = ({ tabs, initialActiveTabId, type = "primary", onTabChange, expanded }) => {
  const [activeTabId, setActiveTabId] = useState(
    initialActiveTabId || tabs[0]?.id
  );

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);

  const styleFontSizing = type === "normal" ? "text-md" : type === "secondary" ? "text-lg" : "text-lg";

  const renderTabButton = (tab: TabItem) => {
    const isActive = tab.id === activeTabId;

  return (
      <TouchableOpacity
        key={tab.id}
        className={`bg-gray-100 my-4 rounded-md items-center justify-center flex-1 p-10
        ${isActive && (type === "primary" || type === "secondary") ? ' bg-brand-primary! text-white' : ''}
        ${type === "normal" ? "font-sm border border-[#E0E0E0] rounded-xl py-1.5 px-5 mr-4" : "py-1 px-4 "}
        ${type === "secondary" && isActive ? 'border-brand-primary' : ''}
        ${type === "secondary" ? 'm-0 p-0' : ''}`}
        onPress={() => {
          setActiveTabId(tab.id);
          if (onTabChange) onTabChange(tab.id);
        }}
        activeOpacity={0.8}
      >
        <Text className={`font-medium flex-row items-center gap-2 py-2 px-5 ${isActive ? ' text-white ' : 'text-gray-500'}
         ${styleFontSizing}`}>
            {/* <Icon name="calendar-today" size={24} color={"#333"} /> */}
          {tab.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
       <View className={expanded ? "flex-1" : ""}>

      {/* Tab Header */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className={`  
         ${type === "primary" ? "bg-white" : ""}
         ${type === "normal" ? "p-4" : ""}`}>
        <View className="flex-1 flex-row mx-4 gap-4">
          {tabs.map(renderTabButton)}
        </View>
      </ScrollView>

     
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


