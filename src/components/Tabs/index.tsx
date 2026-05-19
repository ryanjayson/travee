import React, { useState, FC, ReactNode, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";

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

  const styleFontSizing = type === "normal" ? "text-md" : type === "secondary" ? "text-lg" : "text-2xl";

  const renderTabButton = (tab: TabItem) => {
    const isActive = tab.id === activeTabId;

  return (
      <TouchableOpacity
        key={tab.id}
        className={`items-center justify-center flex-1
        ${isActive && (type === "primary" || type === "secondary") ? 'border-b-4 border-[#263F69]' : ''}
        ${type === "normal" ? "font-sm border border-[#E0E0E0] rounded-xl py-1.5 px-5 mr-4" : "py-1 px-4 "}
        ${type === "secondary" && isActive ? 'border-brand-primary' : ''}
        ${type === "secondary" ? 'm-0 p-0' : ''}`}
        onPress={() => {
          setActiveTabId(tab.id);
          if (onTabChange) onTabChange(tab.id);
        }}
        activeOpacity={0.8}
      >
        <Text className={`font-medium  ${isActive ? ' text-brand ' : 'text-gray-400'}
         ${styleFontSizing}`}>
          {tab.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
       <View className={expanded ? "flex-1" : ""}>

      {/* Tab Header */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className={` bg-white border-b border-[#eee]  
         ${type === "primary" ? "" : ""}
         ${type === "normal" ? "p-4" : ""}`}>
        <View className="flex-1 flex-row mx-1 ">
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


