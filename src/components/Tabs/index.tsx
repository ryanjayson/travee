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
}

type TabsType = "primary" | "secondary" | "normal";

// --- Component ---
const Tabs: FC<TabsProps> = ({ tabs, initialActiveTabId, type = "primary", onTabChange }) => {
  const [activeTabId, setActiveTabId] = useState(
    initialActiveTabId || tabs[0]?.id
  );

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);

  const styleFontSizing = type === "normal" ? "text-md" : type === "secondary" ? "text-xl" : "text-2xl";

  const renderTabButton = (tab: TabItem) => {
    const isActive = tab.id === activeTabId;

  return (
      <TouchableOpacity
        key={tab.id}
        className={`items-center justify-center
        ${isActive && (type === "primary" || type === "secondary") ? 'text-brand border-b-2 border-brand-primary' : ''}
        ${type === "normal" ? "!font-sm border border-[#E0E0E0] rounded-xl py-1.5 px-5 mr-4" : "py-3 px-4 "}
        ${type === "secondary" && isActive ? '!border-brand-primary' : ''}
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
    <View className="">
      {/* Tab Header */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className={`bg-white border-b border-[#eee]  
         ${type === "primary" ? "" : ""}
         ${type === "normal" ? "p-4" : ""}`}>
        <View className="flex-row mx-1 ">
          {tabs.map(renderTabButton)}
        </View>
      </ScrollView>

      {/* Tab Content with swipe */}
      <ScrollView contentContainerStyle={{ paddingBottom: 100}}>
        {activeTab ? (
          activeTab.content
        ) : (
          <Text className="text-[#999] text-center mt-5">No content found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default Tabs;


