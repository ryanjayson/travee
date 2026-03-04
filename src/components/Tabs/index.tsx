import React, { useState, FC, ReactNode, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PanResponder,
} from "react-native";
import { TabStyle } from "../../styles/common";

// --- Types ---
interface TabItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  initialActiveTabId?: string;
}

// --- Component ---
const Tabs: FC<TabsProps> = ({ tabs, initialActiveTabId }) => {
  const [activeTabId, setActiveTabId] = useState(
    initialActiveTabId || tabs[0]?.id
  );

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);

  const switchTab = (newIndex: number) => {
    if (newIndex !== currentIndex && tabs[newIndex]) {
      setActiveTabId(tabs[newIndex].id);
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
        style={[TabStyle.tabButton, isActive && TabStyle.activeTabButton]}
        onPress={() => setActiveTabId(tab.id)}
        activeOpacity={0.8}
      >
        <Text style={[TabStyle.tabText, isActive && TabStyle.activeTabText]}>
          {tab.title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {/* Tab Header */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={TabStyle.tabHeader}>{tabs.map(renderTabButton)}</View>
      </ScrollView>

      {/* Tab Content with swipe */}
      <ScrollView style={styles.tabContent} {...panResponder.panHandlers}>
        {activeTab ? (
          activeTab.content
        ) : (
          <Text style={styles.noContentText}>No content found.</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default Tabs;

const styles = StyleSheet.create({
  tabContent: {
    backgroundColor: "#f9f9f9",
  },
  noContentText: {
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
});
