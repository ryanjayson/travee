import { MaterialIcons as Icon } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import ActivityIcon from "../../../../components/ActivityIcon";
import { ItineraryActivity } from "../../types/TravelDto";

interface ActivityLookupModalProps {
  visible: boolean;
  onClose: () => void;
  activities?: ItineraryActivity[];
  selectedActivityId?: string;
  onSelect: (activityId?: string) => void;
}

const ActivityLookupModal = ({
  visible,
  onClose,
  activities = [],
  selectedActivityId,
  onSelect,
}: ActivityLookupModalProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelect = (activityId?: string) => {
    onSelect(activityId);
    setSearchQuery(""); // reset search
    onClose();
  };

  const handleClose = () => {
    setSearchQuery(""); // reset search
    onClose();
  };

  const filteredActivities = activities.filter((activity) =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View className="bg-white rounded-t-[30px] max-h-[78%] min-h-[78%] w-full overflow-hidden">
          <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
            <Text 
              className="text-xl font-medium"
              style={{ color: colors.primary }}
            >
              Select Activity
            </Text>
            <TouchableOpacity 
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close activity selection modal"
            >
              <Icon name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View className="px-6 py-4 border-b border-gray-200">
            <TextInput
              mode="outlined"
              placeholder="Search activity"
              value={searchQuery}
              onChangeText={setSearchQuery}
              right={
                searchQuery ? (
                  <TextInput.Icon
                    icon="close"
                    onPress={() => setSearchQuery("")}
                    color={colors.onSurfaceVariant}
                  />
                ) : null
              }
              activeOutlineColor={colors.primary}
              outlineColor={colors.outlineVariant}
              style={{ backgroundColor: colors.surface }}
            />
          </View>
          
          <ScrollView>
            <TouchableOpacity
              className="p-4 border-b border-gray-100 flex-row items-center gap-4"
              onPress={() => handleSelect(undefined)}
              accessibilityRole="button"
              accessibilityLabel="Select no activity"
            >
              <Icon name="event-busy" size={24} color={colors.onSurfaceVariant} />
              <Text className="text-base text-gray-800">
                None
              </Text>
              {!selectedActivityId && (
                <Icon name="check" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
              )}
            </TouchableOpacity>
            
            {filteredActivities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                className="p-4 border-b border-gray-100 flex-row items-center gap-4"
                onPress={() => handleSelect(activity.id)}
                accessibilityRole="button"
                accessibilityLabel={`Select activity ${activity.title}`}
              >
                <ActivityIcon type={activity.type as any} size={24} />
                <View className="flex-1">
                  <Text className="text-base text-gray-800 font-medium">
                    {activity.title}
                  </Text>
                  {activity.startDate && (
                    <Text className="text-xs text-gray-500">
                      {new Date(activity.startDate).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                {selectedActivityId === activity.id && (
                  <Icon name="check" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ActivityLookupModal;
