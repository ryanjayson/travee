import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TravelCatalog from "../screens/TravelCatalog";
import TravelDetails from "../screens/TravelDetails";

export const TripStack = () => (
  <Stack.Navigator id="TravelStack">
    <Stack.Screen name="Catalog" component={TravelCatalog} />
    <Stack.Screen name="Details" component={TravelDetails} />
  </Stack.Navigator>
);
