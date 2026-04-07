import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { FAB, Portal } from "react-native-paper";

interface FloatingAddButtonProps {
  onAddSection: () => void;
  onAddActivity: () => void;
}

const FloatingAddButton = ({
  onAddSection,
  onAddActivity,
}: FloatingAddButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <FAB.Group
        open={open}
        visible
        icon={open ? "close" : "plus"}
        color="white"
        style={{ position: 'absolute', bottom: 100, right: 0 }}
        fabStyle={{ backgroundColor: "#0C4C8A", borderRadius: 30 }}
        actions={[
          {
            icon: "map-marker-plus",
            label: "Add Activity",
            onPress: onAddActivity,
          },
          {
            icon: "view-list",
            label: "Add Section",
            onPress: onAddSection,
          },
        ]}
        onStateChange={({ open }) => setOpen(open)}
        onPress={() => {
          if (open) {
            // Do nothing if it's already open
          }
        }}
      />
  );
};

export default FloatingAddButton;
