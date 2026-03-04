import { StyleSheet } from "react-native";

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 26,
    fontWeight: "500",
  },
  h2: {
    fontSize: 20,
    fontWeight: "400",
  },
  body: {
    fontSize: 16,
    color: "#222",
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    color: "#888",
  },
});

export const Color = StyleSheet.create({
  primary: {
    color: "#0C4C8A",
  },
  secondary: {},
});

export const ButtonStyle = StyleSheet.create({
  primary: {
    backgroundColor: "blue",
  },
  secondary: {},
});

export const MenuStyle = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#183B7A",
    fontWeight: "500",
  },
});

export const TabStyle = StyleSheet.create({
  tabHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginHorizontal: 10,
    paddingBottom: 10,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: "#007bff", // Active indicator line color
    backgroundColor: "#007bff",
    borderRadius: 50,
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    fontWeight: "500",
    color: "#FFF",
  },
});
