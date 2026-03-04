import * as React from "react";
import { ScrollView, View } from "react-native";
import { Card, Text } from "react-native-paper";

export function TripsScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={{ padding: 16, gap: 12 }}>
        <Text variant="headlineSmall">Trips</Text>

        <Card>
          <Card.Title title="Your trips" />
          <Card.Content>
            <Text variant="bodyMedium">No trips yet.</Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

