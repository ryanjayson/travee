import * as React from "react";
import { View } from "react-native";
import { Button, Card, Text } from "react-native-paper";

export function ProfileScreen() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text variant="headlineSmall">Profile</Text>

      <Card>
        <Card.Title title="Account" />
        <Card.Content style={{ gap: 6 }}>
          <Text variant="bodyMedium">Signed out</Text>
          <Button mode="contained" onPress={() => {}}>
            Sign in
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

