import React from "react";
import { TouchableOpacity, StyleSheet, Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

interface FloatingAddButtonProps {
  onPress: () => void;
}

const FloatingAddButton = ({ onPress }: FloatingAddButtonProps) => {
  return (
    <TouchableOpacity style={styles.floatingButton} onPress={onPress}>
      <Icon name="add" size={32} color={"#FFF"} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 10,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#183B7A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  plusIcon: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
  },
});

export default FloatingAddButton;
