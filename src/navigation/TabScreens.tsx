import React from "react";
import { View, Text, StyleSheet } from "react-native";
import TouchButton from "../components/atoms/TouchButton";
import { useAuth } from "../features/Auth/hooks/AuthContext";
import TravelCatalog from "../features/Travel/screens/TravelCatalog";
import CreateTravelPlan from "../features/Travel/screens/CreateTravelPlan";
import Basic from "../features/Travel/screens/Drag";
import EditTravelPlan from "../features/Travel/screens/EditTravelPlan";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TravelProvider } from "../context/TravelContext";

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const HomeScreen = ({ navigation }: HomeScreenProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>Home Dashboard!</Text>
    <Text>View your main feed here.</Text>
    <TouchButton
      buttonText="Add Travel Plan"
      onPress={() => navigation.navigate("CreateTravelPlan")}
    />

    <Text>Edit test travel.</Text>

    <TouchButton
      buttonText="Edit Travel Plan"
      onPress={() => navigation.navigate("EditTravelPlan")}
    />
  </View>
);

// --- Travel Screen ---
export const TravelScreen = () => {
  return (
    <TravelProvider>
      <TravelCatalog />
    </TravelProvider>
  );
};

// --- Settings Screen ---
export const SettingsScreen = () => {
  const { signOut } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchButton buttonText="Logout" onPress={signOut} />
    </View>
  );
};

export const CreateTravelPlanScreen = ({ navigation }: HomeScreenProps) => {
  // return <Basic />;
  return <Text>TEST</Text>;
};

export const EditTravelPlanScreen = () => {
  return (
    <TravelProvider>
      <EditTravelPlan />
    </TravelProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
  },
});
