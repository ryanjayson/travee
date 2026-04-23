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
  onTabChange?: (tabId: string) => void;
}

// --- Component ---
const Tabs: FC<TabsProps> = ({ tabs, initialActiveTabId, onTabChange }) => {
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
        className={`py-3 px-4 items-center justify-center ${isActive ? 'text-primary border-b-2 border-primary' : ''}`}
        onPress={() => {
          setActiveTabId(tab.id);
          if (onTabChange) onTabChange(tab.id);
        }}
        activeOpacity={0.8}
      >
        <Text className={`text-base ${isActive ? 'font-bold text-primary ' : 'text-[#666]'}`}>
          {tab.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View >
      {/* Tab Header */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white">
        <View className="flex-row border-b border-[#eee] mx-1  ">
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


