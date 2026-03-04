import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusType, TravelStatus } from "../../types/enums";

type StatusTagProps = {
  type: StatusType;
  status: TravelStatus;
};

const StatusTag = ({ type, status }: StatusTagProps) => {
  return (
    <View
      style={[
        styles.statusBadge,
        status === TravelStatus.Upcoming
          ? styles.upcomingBadge
          : styles.pastBadge,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          status === TravelStatus.Upcoming
            ? styles.upcomingText
            : styles.pastText,
        ]}
      >
        {status === TravelStatus.Upcoming ? "Upcoming" : "Past"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingBadge: {
    backgroundColor: "#E8F5E8",
  },
  pastBadge: {
    backgroundColor: "#F0F0F0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  upcomingText: {
    color: "#2E7D32",
  },
  pastText: {
    color: "#666",
  },
});

export default StatusTag;
