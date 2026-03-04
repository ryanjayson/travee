import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
// import {
//   activityService,
//   CreateActivityData,
//   UpdateActivityData,
// } from "../services/activityService";

// interface ActivityData {
//   title: string;
//   description: string;
//   location: string;
// }

interface Place {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface AddActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (activity: string, description: string, location: string) => void;
  initialTitle?: string;
  initialDescription?: string;
  initialLocation?: string;
  travelId?: number;
  sectionId?: number;
  activityId?: number; // For editing existing activities
}

const { height: screenHeight } = Dimensions.get("window");

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

const AddActivityModal = ({
  visible,
  onClose,
  onSave,
  initialTitle = "",
  initialDescription = "",
  initialLocation = "",
  travelId,
  sectionId,
  activityId,
}: AddActivityModalProps) => {
  const [activity, setActivity] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState(initialLocation);
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pan = useRef(new Animated.ValueXY()).current;
  const [modalHeight, setModalHeight] = useState(screenHeight * 0.6);
  const isSavingRef = useRef(false);

  // Update form when initial values change
  useEffect(() => {
    setActivity(initialTitle);
    setDescription(initialDescription);
    setLocation(initialLocation);
  }, [initialTitle, initialDescription, initialLocation]);

  // Filter places based on search query
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

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      pan.setOffset({
        x: (pan.x as any)._value,
        y: (pan.y as any)._value,
      });
    },
    onPanResponderMove: (evt, gestureState) => {
      Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      })(evt, gestureState);

      // Calculate new height based on handle position
      const newHeight =
        screenHeight - (gestureState.moveY + (pan.y as any)._offset);
      const clampedHeight = Math.max(
        screenHeight * 0.4,
        Math.min(screenHeight * 0.8, newHeight)
      );
      setModalHeight(clampedHeight);
    },
    onPanResponderRelease: (evt, gestureState) => {
      pan.flattenOffset();

      // Final height calculation
      const finalHeight =
        screenHeight - (gestureState.moveY + (pan.y as any)._offset);
      const clampedHeight = Math.max(
        screenHeight * 0.4,
        Math.min(screenHeight * 0.8, finalHeight)
      );
      setModalHeight(clampedHeight);

      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
    },
  });

  // const handleSave = async () => {
  //   // Prevent multiple simultaneous saves
  //   if (isSavingRef.current) {
  //     return;
  //   }

  //   if (!activity.trim() || !description.trim()) {
  //     setError("Please fill in all required fields");
  //     return;
  //   }

  //   if (!travelId) {
  //     setError("Travel ID is required");
  //     return;
  //   }

  //   try {
  //     isSavingRef.current = true;
  //     setIsSaving(true);
  //     setError(null);

  //     if (activityId) {
  //       // Update existing activity
  //       const updateData: UpdateActivityData = {
  //         title: activity.trim(),
  //         description: description.trim(),
  //         location: location.trim() || undefined,
  //       };

  //       console.log("Updating activity via API:", updateData);
  //       const updatedActivity = await activityService.updateActivity(
  //         activityId,
  //         updateData
  //       );
  //       console.log("Activity updated successfully:", updatedActivity);
  //     } else {
  //       // Create new activity
  //       const createData: CreateActivityData = {
  //         title: activity.trim(),
  //         description: description.trim(),
  //         location: location.trim() || undefined,
  //         travelId: travelId,
  //         sectionId: sectionId,
  //         status: "planned",
  //       };

  //       console.log("Creating activity via API:", createData);
  //       const newActivity = await activityService.createActivity(createData);
  //       console.log("Activity created successfully:", newActivity);
  //     }

  //     // Call the parent's onSave callback with the saved data
  //     onSave(activity.trim(), description.trim(), location.trim());
  //     handleCancel();
  //   } catch (err) {
  //     console.error("Failed to save activity:", err);
  //     setError("Failed to save activity. Please try again.");
  //   } finally {
  //     isSavingRef.current = false;
  //     setIsSaving(false);
  //   }
  // };

  const handleCancel = () => {
    setActivity("");
    setDescription("");
    setLocation("");
    setLocationQuery("");
    setShowLocationResults(false);
    setError(null);
    setIsSaving(false);
    isSavingRef.current = false;
    onClose();
  };

  const handleLocationSelect = (place: Place) => {
    setLocation(place.name);
    setLocationQuery(place.name);
    setShowLocationResults(false);
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

  const renderFormContent = () => (
    <View style={styles.formContainer}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Activity Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Visit Eiffel Tower"
          value={activity}
          onChangeText={setActivity}
          editable={!isSaving}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Search for a place or address"
          value={locationQuery}
          onChangeText={setLocationQuery}
          onFocus={handleLocationFocus}
          editable={!isSaving}
        />
        {location.trim() !== "" && (
          <View style={styles.selectedLocationContainer}>
            <Text style={styles.selectedLocationText}>{location}</Text>
            <TouchableOpacity
              onPress={() => {
                setLocation("");
                setLocationQuery("");
              }}
              disabled={isSaving}
            >
              <Text style={styles.removeLocationText}>x</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="e.g., Iconic landmark and observation deck"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          editable={!isSaving}
        />
      </View>
    </View>
  );

  const isEditing =
    initialTitle !== "" || initialDescription !== "" || initialLocation !== "";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleCancel} />
        <Animated.View style={[styles.modalContainer, { height: modalHeight }]}>
          <View style={styles.handleContainer}>
            <Animated.View
              style={[styles.handle]}
              {...panResponder.panHandlers}
            >
              <View style={styles.handleBar} />
            </Animated.View>
          </View>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isEditing ? "Edit Activity" : "Add Activity"}
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {showLocationResults ? (
            <View style={styles.locationResultsContainer}>
              <FlatList
                data={filteredPlaces}
                renderItem={renderPlaceItem}
                keyExtractor={(item) => item.id}
                style={styles.placesList}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                  <View style={styles.locationResultsHeader}>
                    <Text style={styles.locationResultsTitle}>
                      Search Results
                    </Text>
                  </View>
                }
              />
            </View>
          ) : (
            renderFormContent()
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!activity.trim() || !description.trim()) &&
                  styles.saveButtonDisabled,
              ]}
              onPress={() => {}} //handleSave
              disabled={!activity.trim() || !description.trim()}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    (!activity.trim() || !description.trim()) &&
                      styles.saveButtonTextDisabled,
                  ]}
                >
                  {isEditing ? "Update Activity" : "Save Activity"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
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
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#183B7A",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F6F8FC",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  locationContainer: {
    position: "relative",
  },
  locationInput: {
    backgroundColor: "#F6F8FC",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedLocation: {
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
  selectedLocationText: {
    fontSize: 16,
    color: "#2E7D32",
    fontWeight: "500",
    flex: 1,
  },
  removeLocation: {
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
  errorContainer: {
    backgroundColor: "#FFEBEB",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "500",
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
});

export default AddActivityModal;
