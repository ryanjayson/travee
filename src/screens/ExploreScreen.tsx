import * as React from "react";
import { ScrollView, View } from "react-native";
import { Card, Text } from "react-native-paper";

export function ExploreScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={{ padding: 16, gap: 12 }}>
        <Text variant="headlineSmall">Explore</Text>

        <Card>
          <Card.Title title="Discover" />
          <Card.Content>
            <Text variant="bodyMedium">Search and recommendations go here.</Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

