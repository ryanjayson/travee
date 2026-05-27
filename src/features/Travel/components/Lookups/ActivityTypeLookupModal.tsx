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
import { ActivityType } from "../../../../types/enums";
import ActivityIcon from "../../../../components/ActivityIcon";

interface ActivityTypeLookupModalProps {
  visible: boolean;
  onClose: () => void;
  selectedType?: ActivityType;
  onSelect: (type: ActivityType) => void;
}

const ActivityTypeLookupModal = ({
  visible,
  onClose,
  selectedType,
  onSelect,
}: ActivityTypeLookupModalProps) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelect = (type: ActivityType) => {
    onSelect(type);
    setSearchQuery(""); // reset search
    onClose();
  };

  const handleClose = () => {
    setSearchQuery(""); // reset search
    onClose();
  };

  const types = Object.keys(ActivityType)
    .filter((key) => isNaN(Number(key)))
    .map((key) => {
      const typeValue = ActivityType[key as keyof typeof ActivityType];
      const displayName = key.replace(/([A-Z])/g, " $1").trim();
      return { key, typeValue, displayName };
    });

  const filteredTypes = types.filter((t) =>
    t.displayName.toLowerCase().includes(searchQuery.toLowerCase())
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
              Select Activity Type
            </Text>
            <TouchableOpacity 
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close activity type selection modal"
            >
              <Icon name="close" size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View className="px-6 py-4 border-b border-gray-200">
            <TextInput
              mode="outlined"
              placeholder="Search activity type"
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
              theme={{ colors: { onSurfaceVariant: '#888' } }}
              outlineColor="#E0E0E0"
              activeOutlineColor="#263F69"
              outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
              style={{ backgroundColor: colors.surface, borderRadius: 20 }}
            />
          </View>

          <ScrollView>
            {filteredTypes.map(({ key, typeValue, displayName }) => (
              <TouchableOpacity
                key={key}
                className="p-5 border-b border-gray-100 flex-row items-center gap-4"
                onPress={() => handleSelect(typeValue)}
                accessibilityRole="button"
                accessibilityLabel={`Select activity type ${displayName}`}
              >
                {/* Note: Not passing a color override here so that it automatically uses the assigned per-type color we defined in ActivityIcon */}
                <ActivityIcon type={typeValue} size={24} />
                <Text className="text-base text-gray-800 flex-1 capitalize">
                  {displayName}
                </Text>
                {selectedType === typeValue && (
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

export default ActivityTypeLookupModal;
