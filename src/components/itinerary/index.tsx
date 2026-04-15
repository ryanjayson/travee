import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from "react-native";

import { Activity, ActivitySection } from "../../dtos/ItineraryDto";
import { activityService } from "../../services/activityService";

interface Section {
  id: string;
  title: string;
  description: string;
  activities: Activity[];
  isCollapsed: boolean;
}

interface TravelItineraryPageProps {
  travelData: any;
  onSave: (itineraryData: any) => void;
  onBack: () => void;
  initialSections?: ActivitySection[];
  initialActivities?: Activity[];
  onRefresh?: () => void;
}

const Itinerary = ({
  travelData,
  initialSections = [],
  initialActivities = [],
  onRefresh,
}: TravelItineraryPageProps) => {
  const [activities, setActivities] = useState<Activity[]>(
    initialActivities.map((activity) => ({
      ...activity,
      location: activity.location || "",
    }))
  );
  
  const [sections, setSections] = useState<Section[]>(
    initialSections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      activities: (section.activities || []).map((activity) => ({
        ...activity,
        location: activity.location || "",
      })),
      isCollapsed: section.isCollapsed || false,
    }))
  );
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [sectionMenuVisible, setSectionMenuVisible] = useState(false);
  const [currentSectionForMenu, setCurrentSectionForMenu] = useState<Section | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recentDrop, setRecentDrop] = useState<{ index: number; anim: Animated.Value; } | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (travelData?.id) {
        const generalActivities = await activityService.getActivitiesByTravelId(travelData.id);

        setActivities(
          generalActivities.map((activity) => ({
            ...activity,
            location: activity.location || "",
          }))
        );

        const updatedSections = await Promise.all(
          sections.map(async (section) => {
            try {
              const sectionActivities = await activityService.getActivitiesBySectionId(section.id);
              return {
                ...section,
                activities: sectionActivities.map((activity) => ({
                  ...activity,
                  location: activity.location || "",
                })),
              };
            } catch (error) {
              console.warn(`Failed to fetch activities for section ${section.id}:`, error);
              return section;
            }
          })
        );
        setSections(updatedSections);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error refreshing itinerary:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSectionCollapse = (sectionId: string) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, isCollapsed: !section.isCollapsed }
          : section
      )
    );
  };

  const handleMenuPress = () => setMenuVisible(true);

  const handleSectionMenuPress = (section: Section) => {
    setCurrentSectionForMenu(section);
    setSectionMenuVisible(true);
  };

  return (
    <View className="flex-1 bg-[#F6F8FC]">
      <View className="flex-row justify-between items-center px-5 py-4 bg-white border-b border-[#E0E0E0]">
        <Text className="text-lg font-bold text-primary">Itinerary</Text>
        <View className="flex-row items-center">
          {refreshing && (
            <View className="mr-2">
              <ActivityIndicator size="small" color="#0C4C8A" />
            </View>
          )}
          <TouchableOpacity onPress={handleMenuPress} className="p-2">
            <Text className="text-xl text-primary font-bold">⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 p-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#0C4C8A"]}
            tintColor="#0C4C8A"
          />
        }
      >
        <View className="mb-5">
          <Text className="text-base font-bold text-primary mb-2">Activities</Text>
          {activities.length > 0 ? (
            activities.map((activity) => (
              <TouchableOpacity key={activity.id} activeOpacity={0.7} />
            ))
          ) : (
            <Text className="text-[#888] italic text-center p-5">
              No activities added yet. Tap the + button to add one!
            </Text>
          )}
        </View>

        <View className="mb-5">
          <Text className="text-base font-bold text-primary mb-2">Sections</Text>
          {sections.length > 0 ? (
            sections.map((section, idx) => (
              <Animated.View
                key={section.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm shadow-black/10 elevation-1"
                style={[
                  recentDrop?.index === idx && {
                    transform: [
                      {
                        scale: recentDrop.anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1.05, 1],
                        }),
                      },
                    ],
                    opacity: recentDrop.anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1],
                    }),
                  },
                ]}
              >
                <View className="flex-row justify-between items-center">
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => toggleSectionCollapse(section.id)}
                  >
                    <Text className="text-xl text-primary font-bold">
                      {section.isCollapsed ? "▶" : "▼"}
                    </Text>
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-primary mb-1">{section.title}</Text>
                    <Text className="text-sm text-[#666] leading-5">
                      {section.description} | {section.activities.length}
                    </Text>
                    {section.activities.length > 0 && (
                      <Text className="text-xs text-[#888] mt-1">
                        {section.activities.length} activity{section.activities.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => handleSectionMenuPress(section)}
                  >
                    <Text className="text-xl text-primary font-bold">⋮</Text>
                  </TouchableOpacity>
                </View>

                {!section.isCollapsed && section.activities.length > 0 && (
                  <View className="mt-3">
                    {section.activities.map((activity) => (
                      <TouchableOpacity key={activity.id} activeOpacity={0.7} />
                    ))}
                  </View>
                )}
              </Animated.View>
            ))
          ) : (
            <Text className="text-[#888] italic text-center p-5">
              No sections added yet. Use the menu to add one!
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Main Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="slide" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-start items-end"
          onPress={() => setMenuVisible(false)}
          activeOpacity={1}
        >
          <View className="bg-white w-full h-full pt-24 px-5">
            <TouchableOpacity className="py-5 px-5 border-b border-[#F0F0F0]">
              <Text className="text-lg text-primary font-medium">Add Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity className="py-5 px-5 border-b border-[#F0F0F0]">
              <Text className="text-lg text-primary font-medium">Add Section</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Section Menu Modal */}
      <Modal visible={sectionMenuVisible} transparent animationType="slide" onRequestClose={() => setSectionMenuVisible(false)}>
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-start items-end"
          onPress={() => setSectionMenuVisible(false)}
          activeOpacity={1}
        >
          <View className="bg-white w-full h-full pt-24 px-5">
            <TouchableOpacity className="py-5 px-5 border-b border-[#F0F0F0]">
              <Text className="text-lg text-primary font-medium">Add Activity</Text>
            </TouchableOpacity>
            <TouchableOpacity className="py-5 px-5 border-b border-[#F0F0F0]">
              <Text className="text-lg text-primary font-medium">Edit Section</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Itinerary;
