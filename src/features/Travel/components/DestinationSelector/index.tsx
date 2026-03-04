import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from "react-native";

import { Travel } from "../../types/TravelDto";
import Icon from "react-native-vector-icons/MaterialIcons";

interface Place {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface AddTravelModalProps {
  onClose: () => void;
  onSelect: (selectedPlace: Place) => void;
}

// Mock places data - in a real app, this would come from Google Places API
const mockPlaces: Place[] = [
  {
    id: "1",
    name: "Eiffel Tower",
    address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
    type: "Tourist Attraction",
  },
  {
    id: "2",
    name: "Louvre Museum",
    address: "Rue de Rivoli, 75001 Paris, France",
    type: "Museum",
  },
  {
    id: "3",
    name: "Notre-Dame Cathedral",
    address: "6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris, France",
    type: "Religious Site",
  },
  {
    id: "4",
    name: "Arc de Triomphe",
    address: "Place Charles de Gaulle, 75008 Paris, France",
    type: "Monument",
  },
  {
    id: "5",
    name: "Champs-Élysées",
    address: "Avenue des Champs-Élysées, 75008 Paris, France",
    type: "Shopping Street",
  },
  {
    id: "6",
    name: "Sacre-Coeur Basilica",
    address: "35 Rue du Chevalier de la Barre, 75018 Paris, France",
    type: "Religious Site",
  },
  {
    id: "7",
    name: "Palace of Versailles",
    address: "Place d'Armes, 78000 Versailles, France",
    type: "Palace",
  },
  {
    id: "8",
    name: "Montmartre",
    address: "75018 Paris, France",
    type: "Neighborhood",
  },
  {
    id: "9",
    name: "Seine River Cruise",
    address: "Various locations along Seine River, Paris",
    type: "Activity",
  },
  {
    id: "10",
    name: "Musée d'Orsay",
    address: "1 Rue de la Légion d'Honneur, 75007 Paris, France",
    type: "Museum",
  },
];

const DestinationSelector = ({ onClose, onSelect }: AddTravelModalProps) => {
  const [destination, setDestination] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingRef = useRef(false);
  useState<boolean>(false);
  const [location, setLocation] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);

  useEffect(() => {
    if (locationQuery.trim()) {
      const filtered = mockPlaces.filter(
        (place) =>
          place.name.toLowerCase().includes(locationQuery.toLowerCase()) ||
          place.address.toLowerCase().includes(locationQuery.toLowerCase()) ||
          place.type.toLowerCase().includes(locationQuery.toLowerCase())
      );
      setFilteredPlaces(filtered);
      setShowLocationResults(true);
    } else {
      setShowLocationResults(false);
      setFilteredPlaces([]);
    }
  }, [locationQuery]);

  const handleCancel = () => {
    setDestination("");
    setError(null);
    setIsSaving(false);
    isSavingRef.current = false;
    onClose();
  };

  const handleLocationSelect = (place: Place) => {
    onSelect(place);

    setLocationQuery(place.name);
    setShowLocationResults(false);
    onClose();
  };

  const handleLocationFocus = () => {
    if (locationQuery.trim()) {
      setShowLocationResults(true);
    }
  };

  const renderPlaceItem = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.placeItem}
      onPress={() => handleLocationSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.placeInfo}>
        <Text style={styles.placeName}>{item.name}</Text>
        <Text style={styles.placeAddress}>{item.address}</Text>
        <Text style={styles.placeType}>{item.type}</Text>
      </View>
      <Text style={styles.placeIcon}>📍</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.overlay}>
      <View
        style={{
          padding: 6,
          borderBottomWidth: 1,
          borderColor: "#eee",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          style={{ paddingRight: 6 }}
          onPress={handleCancel}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="keyboard-arrow-left" size={36} color={"#DDD"} />
        </TouchableOpacity>
        <View>
          <TextInput
            style={styles.input}
            placeholder="Enter place or location"
            value={locationQuery}
            onChangeText={setLocationQuery}
            editable={!isSaving}
            onFocus={handleLocationFocus}
          />
        </View>
      </View>

      <View style={styles.locationResultsContainer}>
        <FlatList
          data={filteredPlaces}
          renderItem={renderPlaceItem}
          keyExtractor={(item) => item.id}
          style={styles.placesList}
          showsVerticalScrollIndicator={false}
          // ListHeaderComponent={
          //   <View style={styles.locationResultsHeader}>
          //     <Text style={styles.locationResultsTitle}>Search Results</Text>
          //   </View>
          // }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#fff",
  },

  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183B7A",
  },
  cancelText: {
    color: "#183B7A",
    fontSize: 16,
  },
  disabledText: {
    color: "#999",
  },
  formContainer: {
    flex: 1,
    padding: 15,
    marginBottom: 15,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },

  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#183B7A",
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    fontSize: 20,
    height: 60,
    width: 300,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  saveButton: {
    backgroundColor: "#183B7A",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonTextDisabled: {
    color: "#999",
  },
  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  savingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  placesList: {
    flex: 1,
  },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#183B7A",
  },
  placeAddress: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  placeType: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  placeIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  selectedLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E8F5E8",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  removeLocationText: {
    fontSize: 16,
    color: "#2E7D32",
    fontWeight: "bold",
    marginLeft: 10,
  },
  locationResultsContainer: {
    flex: 1,
  },
  locationResultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  locationResultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#183B7A",
  },
  selectedLocationText: {
    fontSize: 16,
    color: "#2E7D32",
    fontWeight: "bold",
  },
});

export default DestinationSelector;
