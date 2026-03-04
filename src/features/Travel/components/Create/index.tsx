import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
// import Datetimepicker, {
//   DateTimePickerEvent,
// } from "@react-native-community/datetimepicker";
import CheckboxGroup from "../../../../components/GroupCheckboxes";

import { travelService } from "../../../../services/travel/travelApi";
import {
  Travel,
  // TravelStatus,
  CreateTravelData,
  UpdateTravelData,
} from "../../types/TravelDto";

interface AddTravelModalProps {
  onClose: () => void;
  // onSave: (travelData: Travel) => void;
}

const Create = ({ onClose }: AddTravelModalProps) => {
  const [destination, setDestination] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const [showStartDatePicker, setShowStartDatePicker] =
    useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: "Ride", value: "ride" },
    { label: "Camp", value: "camp" },
    { label: "Hike", value: "hike" },
    { label: "Event", value: "event" },
  ]);

  // --- Sample Data Type (copied here for context) ---
  // type CheckboxOption = { id: string; label: string; selected: boolean; };
  const destinationTypeOptions = [
    { id: "1", label: "Domestic", selected: false },
    { id: "2", label: "Local", selected: false },
    { id: "3", label: "International", selected: false },
  ];

  const activityOptions = [
    { id: "1", label: "Ride", selected: false },
    { id: "2", label: "Camp", selected: false },
    { id: "3", label: "Hike", selected: false },
    { id: "4", label: "Event", selected: false },
    { id: "5", label: "Concert", selected: false },
    { id: "6", label: "Marathon", selected: false },
    { id: "8", label: "Shopping", selected: false },
    { id: "9", label: "Forum", selected: false },
    { id: "10", label: "Workshop", selected: false },
    { id: "11", label: "Symposium", selected: false },
    { id: "12", label: "Colloquium", selected: false },
  ];
  // ----------------------------------------------------

  const handleSave = async () => {
    // Prevent multiple simultaneous saves using ref
    if (isSavingRef.current) {
      return;
    }

    if (!destination.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      setError(null);

      const travelData: CreateTravelData = {
        title: title.trim(),
        description: description.trim(),
        destination: destination.trim(),
        // startDate: startDate,
        // endDate: endDate,
        // budget: budget.trim() || undefined,
        // notes: notes.trim() || undefined,
        // status: TravelStatus.Draft,
      };

      console.log("Saving travel to API:", travelData);
      const savedTravel = await travelService.createTravel(travelData);
      console.log("Travel saved successfully:", savedTravel);

      // Call the parent's onSave callback with the saved data
      // onSave(travelData);
      handleCancel();
    } catch (err) {
      console.error("Failed to save travel:", err);
      setError("Failed to save travel. Please try again.");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDestination("");
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setEndDate(new Date());
    setBudget("");
    setNotes("");
    setError(null);
    setIsSaving(false);
    isSavingRef.current = false;
    onClose();
  };

  const handleShowStartDatePicker = () => {
    setShowStartDatePicker(true);
  };

  const handleShowEndDatePicker = () => {
    setShowEndDatePicker(true);
  };

  // const handleOnChanageStartDate = (
  //   event: DateTimePickerEvent,
  //   selectedDate?: Date
  // ) => {
  //   if (event.type === "set" || Platform.OS === "ios") {
  //     const currendDate = selectedDate || startDate;

  //     if (Platform.OS === "android") {
  //       setShowStartDatePicker(false);
  //     }
  //     setStartDate(currendDate);
  //   } else if (event.type === "dismissed") {
  //     setShowStartDatePicker(false);
  //   }
  // };

  // const handleOnChanageEndDate = (
  //   event: DateTimePickerEvent,
  //   selectedDate?: Date
  // ) => {
  //   if (event.type === "set" || Platform.OS === "ios") {
  //     const currendDate = selectedDate || endDate;

  //     if (Platform.OS === "android") {
  //       setShowEndDatePicker(false);
  //     }
  //     setEndDate(currendDate);
  //   } else if (event.type === "dismissed") {
  //     setShowEndDatePicker(false);
  //   }
  // };

  const formattedStartDate = startDate.toLocaleDateString();
  const formattedEndDate = endDate.toLocaleDateString();

  const isFormValid = destination.trim();

  return (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Travel Plan</Text>
        <TouchableOpacity onPress={handleCancel} disabled={isSaving}>
          <Text style={[styles.cancelText, isSaving && styles.disabledText]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Travel title"
            value={title}
            onChangeText={setTitle}
            editable={!isSaving}
          />
        </View>

        {/* <View style={styles.inputGroup}>
              <Text style={styles.label}>Type *</Text>
              <DropDownPicker
                open={open}
                value={value}
                items={items}
                setOpen={setOpen}
                setValue={setValue}
                setItems={setItems}
                placeholder="Select travel type"
                style={styles.input}
              />
            </View> */}

        <View style={styles.inputGroup}>
          <CheckboxGroup
            initialOptions={destinationTypeOptions}
            title="Choose Destination type/s"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Destination *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Paris, France"
            value={destination}
            onChangeText={setDestination}
            editable={!isSaving}
          />
        </View>

        <View style={styles.inputGroup}>
          <CheckboxGroup initialOptions={activityOptions} title="Activities" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Start Date *</Text>
          <TouchableOpacity onPress={handleShowStartDatePicker}>
            <Text style={[styles.input]}>{formattedStartDate}</Text>
          </TouchableOpacity>

          {showStartDatePicker && (
            // <Datetimepicker
            //   style={styles.input}
            //   is24Hour={true}
            //   mode="date"
            //   value={startDate}
            //   disabled={!isSaving}
            //   display="default"
            //   onChange={handleOnChanageStartDate}
            // />

            <View></View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>End Date</Text>
          <TouchableOpacity onPress={handleShowEndDatePicker}>
            <Text style={[styles.input]}>{formattedEndDate}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            // <Datetimepicker
            //   style={styles.input}
            //   is24Hour={true}
            //   mode="date"
            //   value={endDate}
            //   disabled={!isSaving}
            //   display="default"
            //   onChange={handleOnChanageEndDate}
            // />
            <View></View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!isSaving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Budget</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2,000"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            editable={!isSaving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any additional notes about your travel..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            editable={!isSaving}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!isFormValid || isSaving}
        >
          {isSaving ? (
            <View style={styles.savingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.savingText}>Saving...</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.saveButtonText,
                (!isFormValid || isSaving) && styles.saveButtonTextDisabled,
              ]}
            >
              Create Travel
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
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
});

export default Create;
