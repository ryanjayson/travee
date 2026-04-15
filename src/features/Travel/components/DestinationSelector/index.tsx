import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
// @ts-ignore
import { GOOGLE_MAPS_API_KEY } from "@env";

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

const DestinationSelector = ({ onClose, onSelect }: AddTravelModalProps) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="keyboard-arrow-left" size={36} color={"#DDD"} />
        </TouchableOpacity>
        
        <GooglePlacesAutocomplete
          placeholder="Enter place or location"
          fetchDetails={true}
          onPress={(data, details = null) => {
            debugger;
            if (data && details) {
              const place: Place = {
                id: data.place_id,
                name: details.name || data.structured_formatting?.main_text || data.description,
                address: details.formatted_address || data.structured_formatting?.secondary_text || data.description,
                type: data.types?.[0] ? data.types[0].replace(/_/g, " ") : "Location",
              };
              onSelect(place);
            }
          }}
          query={{
            key: GOOGLE_MAPS_API_KEY || "AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao", // Must be provided in .env
            language: "en",
          }}
          styles={{
            container: {
              flex: 1,
            },
            textInputContainer: {
              backgroundColor: "transparent",
              borderTopWidth: 0,
              borderBottomWidth: 0,
              paddingHorizontal: 0,
              paddingVertical: 4,
            },
            textInput: {
              backgroundColor: "transparent",
              fontSize: 20,
              height: 50,
              color: "#333",
              paddingHorizontal: 0,
              margin: 0,
            },
            listView: {
              backgroundColor: "white",
            },
            row: {
              padding: 15,
              flexDirection: "row",
              borderBottomWidth: 1,
              borderBottomColor: "#eee",
            },
            description: {
              fontSize: 16,
              color: "#183B7A",
            },
          }}
          enablePoweredByContainer={false}
          textInputProps={{
            autoFocus: true,
          }}
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
  header: {
    flexDirection: "row",
    paddingTop: 10,
    flex: 1, // Let Google Places expand downwards
  },
  backButton: {
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 10, // Align with the input text
  },
});

export default DestinationSelector;
