import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import SlideModal from "../../../../components/molecules/SlideModal";
import { TravelMenuAction } from "../../../../types/enums";
import { MenuStyle } from "../../../../styles/common";

interface TravelMenuNavigationProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  onSelect: (selectedMenuAction: TravelMenuAction) => void;
}

const TravelMenuNavigation = ({
  showModal,
  setShowModal,
  onSelect,
}: TravelMenuNavigationProps) => {
  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <SlideModal visible={showModal} onClose={() => setShowModal(false)}>
      <View style={styles.overlay}>
        <View
          style={{
            padding: 6,
            borderBottomWidth: 1,
            borderColor: "#eee",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{ paddingRight: 6 }}
            onPress={handleCancel}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="keyboard-arrow-left" size={36} color={"#DDD"} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, color: "#333", fontWeight: "600" }}>
            Menu
          </Text>
        </View>

        <View style={{ paddingVertical: 8 }}>
          <TouchableOpacity
            style={[MenuStyle.menuItem]}
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.EditTravel);
              setShowModal(false);
            }}
          >
            <Icon name="edit-note" size={24} color={"#183B7A"} />
            <Text style={[MenuStyle.menuItemText]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[MenuStyle.menuItem]}
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Clone);
              setShowModal(false);
            }}
          >
            <Icon name="file-copy" size={24} color={"#183B7A"} />
            <Text style={[MenuStyle.menuItemText]}>Clone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[MenuStyle.menuItem]}
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Archive);
              setShowModal(false);
            }}
          >
            <Icon name="archive" size={24} color={"#183B7A"} />
            <Text style={[MenuStyle.menuItemText]}>Archive</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[MenuStyle.menuItem]}
            activeOpacity={0.7}
            onPress={() => {
              onSelect(TravelMenuAction.Print);
              setShowModal(false);
            }}
          >
            <Icon name="print" size={24} color={"#183B7A"} />
            <Text style={[MenuStyle.menuItemText]}>Print</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SlideModal>
  );
};

export default TravelMenuNavigation;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
