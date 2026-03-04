import * as React from "react";
import { View } from "react-native";
import { List, Text } from "react-native-paper";

export function SettingsScreen() {
  return (
    <View style={{ padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 12 }}>
        Settings
      </Text>

      <List.Section>
        <List.Item title="Notifications" description="Configure alerts" />
        <List.Item title="Privacy" description="Manage sharing & permissions" />
        <List.Item title="About" description="App version and legal" />
      </List.Section>
    </View>
  );
}

