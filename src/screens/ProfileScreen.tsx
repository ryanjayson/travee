import * as React from "react";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import TouchButton from "../components/atoms/TouchButton";

export function ProfileScreen() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">Profile</Text>

      <Card>
        <Card.Title title="Account" />
        <Card.Content style={{ gap: 6 }}>
          <Text variant="bodyMedium">Signed out</Text>
          <TouchButton buttonText="Sign in" onPress={() => {}} />
        </Card.Content>
      </Card>
    </View>
  );
}

