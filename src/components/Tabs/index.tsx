import React, { useState, FC, ReactNode, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  PanResponder,
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

  const switchTab = (newIndex: number) => {
    if (newIndex !== currentIndex && tabs[newIndex]) {
      const newId = tabs[newIndex].id;
      setActiveTabId(newId);
      if (onTabChange) onTabChange(newId);
    }
  };

  // Swipe navigation
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
        Math.abs(gesture.dx) > 20,

      onPanResponderRelease: (_, gesture) => {
        const threshold = 50;
        if (gesture.dx > threshold) switchTab(currentIndex - 1); // swipe right
        else if (gesture.dx < -threshold) switchTab(currentIndex + 1); // swipe left
      },
    })
  ).current;

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
      <ScrollView 
        {...panResponder.panHandlers}>
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


