import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ActivityLocationMap from "../../ActivityLocationMap";

const MapTab = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.contentText}>Tab B features a list of settings.</Text>
      <ActivityLocationMap />
    </View>
  );
};

export default MapTab;

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  contentText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
});
