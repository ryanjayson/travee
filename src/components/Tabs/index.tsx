import React, { useState, FC, ReactNode, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { FadeInView } from "../animations";

// --- Types ---
interface TabItem {
  id: string;
  title: string;
  content: ReactNode;
  isVisible?: boolean;
  disabled?: boolean;
  icon?: string | ReactNode;
  applyFadeAnimation?: boolean;
}

interface TabsProps {
  tabs: TabItem[];
  initialActiveTabId?: string;
  activeTabId?: string;
  type?: TabsType;
  onTabChange?: (tabId: string) => void;
  expanded?: boolean;
  hasActionTripStatus?: boolean;
  onScroll?: (event: any) => void;
  scrollViewRef?: React.RefObject<ScrollView>;
  wrapperStyle?: string;
  applyFadeAnimation?: boolean;
}

type TabsType = "primary" | "secondary" | "default";

// --- Component ---
const Tabs: FC<TabsProps> = ({
  tabs,
  initialActiveTabId,
  activeTabId: controlledActiveTabId,
  type = "primary",
  onTabChange,
  expanded,
  hasActionTripStatus,
  onScroll,
  scrollViewRef,
  wrapperStyle,
  applyFadeAnimation = true,
}) => {
  const [localActiveTabId, setLocalActiveTabId] = useState(
    initialActiveTabId || tabs[0]?.id
  );

  const activeTabId = controlledActiveTabId !== undefined ? controlledActiveTabId : localActiveTabId;

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

    if (tab.isVisible === false) return null;
    const isActive = tab.id === activeTabId && !tab.disabled;
    const isOngoingWithActiveTrip = tab.id === "ongoing" && hasActionTripStatus;

    let displayTitle = tab.title;
    if (type === "default" && tab.id === "ongoing") {
      displayTitle = tab.title.replace(/\s*\(\d+\)/, "");
    }

    let buttonClass = "";
    let textClass = "";

    if (type === "primary") {
      buttonClass = isActive 
        ? "bg-primary rounded-xl px-5 py-2 mr-3 my-2 items-center justify-center shadow-sm h-14 "
        : (tab.disabled
            ? "bg-gray-50 rounded-xl px-5 py-2 mr-3 my-2 items-center justify-center h-14 min-w-24 opacity-50"
            : "bg-gray-100 rounded-xl px-5 py-2 mr-3 my-2 items-center justify-center h-14 min-w-24");
      textClass = isActive 
        ? "text-white font-semibold text-base"
        : (tab.disabled ? "text-gray-300 font-medium text-base" : "text-gray-500 font-medium text-base");
    } else if (type === "secondary") {
      buttonClass = isActive
        ? "px-4 py-3 border-b-2 border-[#263F69] items-center justify-center "
        : "px-4 py-3 border-b-2 border-transparent items-center justify-center ";
      textClass = isActive
        ? "text-[#263F69] font-bold text-base"
        : (tab.disabled ? "text-gray-300 font-medium text-base opacity-50" : "text-gray-500 font-medium text-base");
    } else { // "default"
      buttonClass = isActive
        ? (isOngoingWithActiveTrip ? "bg-success-100 border border-success-500 rounded-4xl py-2 px-4 mr-3 my-2 items-center justify-center" 
                                  : "bg-primary/30 border border-primary/20 rounded-4xl py-2 px-4 mr-3 my-2 items-center justify-center")
        : (tab.disabled 
            ? "bg-gray-50 border border-gray-300 rounded-4xl py-2 px-4 mr-3 my-2 items-center justify-center opacity-30"
            : "bg-white border border-[#E0E0E0] rounded-4xl py-2 px-4 mr-3 my-2 items-center justify-center");
      textClass = isActive
        ? (isOngoingWithActiveTrip ? "text-success-500 text-base" : "text-primary font-bold text-base")
        : (tab.disabled ? "text-gray-800 font-medium text-base" : "text-gray-600 font-medium text-base");
    }

    return (
      <TouchableOpacity
        key={tab.id}
        className={buttonClass}
        onPress={() => {
          if (tab.disabled) return;
          setLocalActiveTabId(tab.id);
          if (onTabChange) onTabChange(tab.id);
        }}
        activeOpacity={tab.disabled ? 1 : 0.5}
        disabled={tab.disabled}
      >
        <View className="flex-row items-center gap-1.5">
          {isOngoingWithActiveTrip && (
            <Animated.View 
              style={{ opacity: pulseAnim }}
              className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-300' : 'bg-green-500'}`}
            />
          )}
          {tab.icon && (
            typeof tab.icon === "string" ? (
              <Icon 
                name={tab.icon as any} 
                size={24} 
                color={
                  type === "primary"
                    ? (isActive ? "white" : (tab.disabled ? "#D0D5DD" : "#667085"))
                    : type === "secondary"
                    ? (isActive ? "#263F69" : (tab.disabled ? "#E0E0E0" : "#667085"))
                    : (isActive ? (isOngoingWithActiveTrip ? "#17B26A" : "#0EA5E9") : (tab.disabled ? "#98A2B3" : "#475467"))
                }
              />
            ) : (
              tab.icon
            )
          )}
          <Text className={textClass}>
            {displayTitle}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  let finalWrapperStyle = "bg-white border-gray-100";

  if (type === "secondary") {
    finalWrapperStyle = "bg-white border-b border-gray-100";
  } else if (type === "default") {
    finalWrapperStyle = "";
  } else { // "primary"
    finalWrapperStyle = "bg-white border-b border-gray-100";
  }

  if (wrapperStyle) {
    finalWrapperStyle = wrapperStyle;
  }

  return (
    <View className={expanded ? "flex-1" : ""}>
      {/* Tab Header */}
      <View className={finalWrapperStyle}>
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
      {(() => {
        const shouldFade = activeTab?.applyFadeAnimation !== undefined ? activeTab.applyFadeAnimation : applyFadeAnimation;
        
        return expanded ? (
          <View className="flex-1">
            {activeTab ? (
              shouldFade ? (
                <FadeInView key={activeTabId} type="fade" duration={300} style={{ flex: 1 }}>
                  {activeTab.content}
                </FadeInView>
              ) : (
                activeTab.content
              )
            ) : (
              <Text className="text-[#999] text-center mt-5">No content found.</Text>
            )}
          </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={{ paddingBottom: 100 }}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {activeTab ? (
              shouldFade ? (
                <FadeInView key={activeTabId} type="fade" duration={300}>
                  {activeTab.content}
                </FadeInView>
              ) : (
                activeTab.content
              )
            ) : (
              <Text className="text-[#999] text-center mt-5">No content found.</Text>
            )}
          </ScrollView>
        );
      })()}
    </View>
  );
};

export default Tabs;


