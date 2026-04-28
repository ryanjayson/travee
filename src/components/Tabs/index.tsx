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

type TabsType = "primary" | "secondary";

// --- Component ---
const Tabs: FC<TabsProps> = ({ tabs, initialActiveTabId, type = "primary", onTabChange }) => {
  const [activeTabId, setActiveTabId] = useState(
    initialActiveTabId || tabs[0]?.id
  );

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);

  const renderTabButton = (tab: TabItem) => {
    const isActive = tab.id === activeTabId;

    return (
      <TouchableOpacity
        key={tab.id}
        className={`items-center justify-center ${isActive && type === "primary"  ? 'text-primary border-b-2 border-primary' : ''} 
        ${type === "secondary" ? "!font-sm border border-[#E0E0E0] rounded-xl py-1.5 px-5 mr-4" : "py-3 px-4 "}`}
        onPress={() => {
          setActiveTabId(tab.id);
          if (onTabChange) onTabChange(tab.id);
        }}
        activeOpacity={0.8}
      >
        <Text className={`font-semibold ${isActive ? ' text-primary ' : 'text-[#666]'}
         ${type === "primary" ? "text-base " : "text-sm"}`}>
          {tab.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="">
      {/* Tab Header */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className={`bg-white border-b border-[#eee]  
         ${type === "primary" ? "" : "p-4"}`}>
        <View className="flex-row mx-1 ">
          {tabs.map(renderTabButton)}
        </View>
      </ScrollView>

      {/* Tab Content with swipe */}
      <ScrollView>
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


