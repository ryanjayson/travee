import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { Calendar } from "react-native-calendars";
import { useFormik } from "formik";
import * as Yup from "yup";
import CheckboxGroup from "../../../../components/GroupCheckboxes";
import { useUpdateTravel } from "../../hooks/useTravel";
import { CreateTravelData } from "../../types/TravelDto";
import { TravelStatus } from "../../../../types/enums";

interface AddTravelModalProps {
  onClose: () => void;
}

const TravelSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  destination: Yup.string().required("Destination is required"),
});

const Create = ({ onClose }: AddTravelModalProps) => {
  const { mutate: createTravel, isPending: isSaving } = useUpdateTravel();
  const [error, setError] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

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

  const formik = useFormik({
    initialValues: {
      title: "",
      destination: "",
      description: "",
      startDate: null as Date | null,
      endDate: null as Date | null,
      budget: "",
      notes: "",
    },
    validationSchema: TravelSchema,
    onSubmit: (values) => {
      setError(null);

      const travelData: CreateTravelData = {
        title: values.title.trim(),
        description: values.description.trim(),
        destination: values.destination.trim(),
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        budget: values.budget,
        notes: values.notes,
        status: TravelStatus.Draft,
      };

      createTravel(travelData, {
        onSuccess: () => {
          formik.resetForm();
          onClose();
        },
        onError: (err: any) => {
          console.error("Failed to save travel:", err);
          setError("Failed to save travel. Please try again.");
        },
      });
    },
  });

  const handleCancel = () => {
    formik.resetForm();
    setError(null);
    onClose();
  };

  const formattedStartDate = formik.values.startDate ? formik.values.startDate.toLocaleDateString() : "Select Start Date";
  const formattedEndDate = formik.values.endDate ? formik.values.endDate.toLocaleDateString() : "Select End Date";

  return (
    <View className="flex-1 justify-end bg-white rounded-t-[20px]">
      <View className="flex-row justify-between items-center px-5 py-4 border-b border-[#E0E0E0]">
        <Text className="text-lg font-bold text-primary">Create Travel Plan</Text>
        <TouchableOpacity onPress={handleCancel} disabled={isSaving}>
          <Text className={`text-base ${isSaving ? "text-[#999]" : "text-primary"}`}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-[15px] mb-[15px]" showsVerticalScrollIndicator={false}>
        {error && (
          <View className="bg-[#FFEBEE] rounded-lg p-3 mb-4 border border-[#FFCDD2]">
            <Text className="text-[#D32F2F] text-sm">{error}</Text>
          </View>
        )}

        <View className="mb-5">
          <TextInput
            mode="outlined"
            label="Title *"
            className="bg-white"
            placeholder="Travel title"
            value={formik.values.title}
            onChangeText={formik.handleChange("title")}
            onBlur={formik.handleBlur("title")}
            error={formik.touched.title && Boolean(formik.errors.title)}
            disabled={isSaving}
            outlineColor="#E0E0E0"
            activeOutlineColor="#0C4C8A"
          />
          {formik.touched.title && formik.errors.title && (
            <Text className="text-red-500 text-xs mt-1 ml-1">{formik.errors.title as string}</Text>
          )}
        </View>

        <View className="mb-5 z-10">
          <CheckboxGroup initialOptions={destinationTypeOptions} title="Choose Destination type/s" />
        </View>

        <View className="mb-5">
          <TextInput
            mode="outlined"
            label="Destination *"
            className="bg-white"
            placeholder="e.g., Paris, France"
            value={formik.values.destination}
            onChangeText={formik.handleChange("destination")}
            onBlur={formik.handleBlur("destination")}
            error={formik.touched.destination && Boolean(formik.errors.destination)}
            disabled={isSaving}
            outlineColor="#E0E0E0"
            activeOutlineColor="#0C4C8A"
          />
          {formik.touched.destination && formik.errors.destination && (
            <Text className="text-red-500 text-xs mt-1 ml-1">{formik.errors.destination as string}</Text>
          )}
        </View>

        <View className="mb-5 z-10">
          <CheckboxGroup initialOptions={activityOptions} title="Activities" />
        </View>

        <View className="mb-5">
          <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowStartDatePicker(!showStartDatePicker); setShowEndDatePicker(false); }}>
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label="Start Date"
                className="bg-white my-1"
                value={formattedStartDate}
                editable={false}
                   left={<TextInput.Icon icon="calendar" />}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0C4C8A"
              />
            </View>
          </TouchableOpacity>
          <Modal visible={showStartDatePicker} transparent={true} animationType="fade">
            <TouchableOpacity 
              className="flex-1 bg-black/50 justify-center items-center px-5" 
              activeOpacity={1} 
              onPress={() => setShowStartDatePicker(false)}
            >
              <View className="w-full bg-white rounded-xl overflow-hidden" onStartShouldSetResponder={() => true}>
                <Calendar
                  onDayPress={(day: any) => {
                    formik.setFieldValue("startDate", new Date(day.timestamp));
                    setShowStartDatePicker(false);
                  }}
                  markedDates={formik.values.startDate ? {
                    [formik.values.startDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#0C4C8A' }
                  } : undefined}
                  theme={{
                    todayTextColor: '#0C4C8A',
                    arrowColor: '#0C4C8A',
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        <View className="mb-5">
          <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowEndDatePicker(!showEndDatePicker); setShowStartDatePicker(false); }}>
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label="End Date"
                className="bg-white my-1"
                value={formattedEndDate}
                editable={false}
                left={<TextInput.Icon icon="calendar" />}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0C4C8A"
              />
            </View>
          </TouchableOpacity>
          <Modal visible={showEndDatePicker} transparent={true} animationType="fade" >
            <TouchableOpacity 
              className="flex-1 bg-black/50 justify-center items-center px-5" 
              activeOpacity={1} 
              onPress={() => setShowEndDatePicker(false)}
            >
              <View className="w-full bg-white verflow-hidden rounded-[50px] " onStartShouldSetResponder={() => true}>
                <Calendar
                  onDayPress={(day: any) => {
                    formik.setFieldValue("endDate", new Date(day.timestamp));
                    setShowEndDatePicker(false);
                  }}
                  markedDates={formik.values.endDate ? {
                    [formik.values.endDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#0C4C8A' }
                  } : undefined}
                  minDate={formik.values.startDate ? formik.values.startDate.toISOString().split('T')[0] : undefined}
                  theme={{
                    todayTextColor: '#0C4C8A',
                    arrowColor: '#0C4C8A',
                  }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        <View className="mb-5">
          <TextInput
            mode="outlined"
            label="Description"
            className="bg-white"
            placeholder="Description"
            value={formik.values.description}
            onChangeText={formik.handleChange("description")}
            onBlur={formik.handleBlur("description")}
            multiline
            numberOfLines={4}
            disabled={isSaving}
            outlineColor="#E0E0E0"
            activeOutlineColor="#0C4C8A"
          />
        </View>

        <View className="mb-5">
          <TextInput
            mode="outlined"
            label="Budget"
            className="bg-white"
            placeholder="e.g., 2,000"
            value={formik.values.budget}
            onChangeText={formik.handleChange("budget")}
            onBlur={formik.handleBlur("budget")}
            keyboardType="numeric"
            disabled={isSaving}
            outlineColor="#E0E0E0"
            activeOutlineColor="#0C4C8A"
          />
        </View>

        <View className="mb-5">
          <TextInput
            mode="outlined"
            label="Notes"
            className="bg-white"
            placeholder="Any additional notes about your travel..."
            value={formik.values.notes}
            onChangeText={formik.handleChange("notes")}
            onBlur={formik.handleBlur("notes")}
            multiline
            numberOfLines={4}
            disabled={isSaving}
            outlineColor="#E0E0E0"
            activeOutlineColor="#0C4C8A"
          />
        </View>
      </ScrollView>

      <View className="px-5 py-4 border-t border-[#E0E0E0]">
        <Button
          mode="contained"
          onPress={() => formik.handleSubmit()}
          disabled={!formik.isValid || !formik.dirty || isSaving}
          loading={isSaving}
          className="rounded-lg py-1"
          buttonColor="#0C4C8A"
          textColor="white"
        >
          Create Travel
        </Button>
      </View>
    </View>
  );
};

export default Create;
