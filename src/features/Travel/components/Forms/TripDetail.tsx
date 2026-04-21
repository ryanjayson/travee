import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialIcons";
import { MAPBOX_ACCESS_TOKEN } from "@env";

import CheckboxGroup from "../../../../components/GroupCheckboxes";
import MapboxDestinationSelector, { MapboxPlace } from "../MapboxDestinationSelector";
import TouchButton from "../../../../components/atoms/TouchButton";
import { useUpdateTravel } from "../../hooks/useTravel";
import { Travel, UpdateTravelData, DestinationDto } from "../../types/TravelDto";

interface TripDetailProps {
  tripData: Travel;
}

const TravelSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  destination: Yup.string().required("Destination is required"),
});

const TripDetail = ({ tripData }: TripDetailProps) => {
  const { colors } = useTheme();
  const { mutate: updateTravel, isPending: isSaving } = useUpdateTravel();
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destinationTypeOptions = [
    { id: "1", label: "Local", selected: false },
    { id: "2", label: "Domestic", selected: false },
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
      title: tripData.title || "",
      description: tripData.description || "",
      destination: tripData.destination || "",
      destinationData: tripData.destinationData || null as DestinationDto | null,
      startDate: tripData.startOrDepartureDate ? new Date(tripData.startOrDepartureDate) : null as Date | null,
      endDate: tripData.endOrReturnDate ? new Date(tripData.endOrReturnDate) : null as Date | null,
      budget: tripData.budget || "",
      notes: tripData.notes || "",
    },
    enableReinitialize: true,
    validationSchema: TravelSchema,
    onSubmit: (values) => {
      setError(null);

      const updateData: UpdateTravelData = {
        title: values.title.trim(),
        description: values.description.trim(),
        destination: values.destination.trim(),
        destinationData: values.destinationData || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        budget: values.budget,
        notes: values.notes,
      };

      updateTravel({ id: tripData.id, data: updateData }, {
        onSuccess: () => {
          console.log("Trip updated successfully");
        },
        onError: (err: any) => {
          console.error("Failed to update trip:", err);
          setError("Failed to update trip. Please try again.");
        },
      });
    },
  });

  const formattedStartDate = formik.values.startDate ? formik.values.startDate.toLocaleDateString() : "";
  const formattedEndDate = formik.values.endDate ? formik.values.endDate.toLocaleDateString() : "";

  return (
    <ScrollView className="flex-1 p-[15px] bg-gray-50" showsVerticalScrollIndicator={false}>
      {error && (
        <View className="bg-[#FFEBEE] rounded-lg p-3 mb-4 border border-[#FFCDD2]">
          <Text className="text-[#D32F2F] text-sm">{error}</Text>
        </View>
      )}

      <View className="mb-5">
        <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Title</Text>
        <TextInput
          mode="outlined"
          className="!h-[64px]"
          placeholder="Your trip name"
          value={formik.values.title}
          onChangeText={formik.handleChange("title")}
          onBlur={formik.handleBlur("title")}
          error={formik.touched.title && Boolean(formik.errors.title)}
          disabled={isSaving}
          outlineColor="#E0E0E0"
          activeOutlineColor="#0C4C8A"
          theme={{ colors: { onSurfaceVariant: '#888' } }}
          outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
          style={{ marginTop: 6 }}
          contentStyle={{ backgroundColor: "transparent" }}
        />
        {formik.touched.title && formik.errors.title && (
          <Text className="text-red-500 text-xs mt-1 ml-1">{formik.errors.title as string}</Text>
        )}
      </View>

      <View className="mb-5">
        <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Destination</Text>
        {!formik.values.destinationData?.coordinates ? (
          <>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowDestinationModal(true)} disabled={isSaving}>
              <View pointerEvents="none">
                <TextInput
                  mode="outlined"
                  className="!h-[64px]"
                  placeholder="Search city or country..."
                  value={formik.values.destination}
                  editable={false}
                  error={formik.touched.destination && Boolean(formik.errors.destination)}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#0C4C8A"
                  left={<TextInput.Icon icon="map-marker" className="opacity-50 mt-2" />}
                  theme={{ colors: { onSurfaceVariant: '#888' } }}
                  outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                  style={{ marginTop: 6 }}
                  contentStyle={{ backgroundColor: "transparent" }}
                />
              </View>
            </TouchableOpacity>
            {formik.touched.destination && formik.errors.destination && (
              <Text className="text-red-500 text-xs mt-1 ml-1">{formik.errors.destination as string}</Text>
            )}
          </>
        ) : (() => {
          const { longitude, latitude } = formik.values.destinationData!.coordinates;
          const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+0C4C8A(${longitude},${latitude})/${longitude},${latitude},10,0/600x300?access_token=${MAPBOX_ACCESS_TOKEN}`;
          return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowDestinationModal(true)} disabled={isSaving}>
              <View className="mt-2 rounded-2xl overflow-hidden shadow-sm shadow-black/10 elevation-2">
                <Image source={{ uri: mapUrl }} style={{ width: '100%', height: 160, borderRadius: 16 }} resizeMode="cover" />
                <View className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-full flex-row items-center">
                  <Icon name="location-on" size={14} color="#FFF" />
                  <Text className="text-white text-xs ml-1">{formik.values.destination}</Text>
                </View>
                <View className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-full">
                  <Text className="text-white text-[10px]">Tap to change</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })()}

        <Modal visible={showDestinationModal} 
          transparent
          animationType="slide" onRequestClose={() => setShowDestinationModal(false)}>
          <MapboxDestinationSelector
            onClose={() => setShowDestinationModal(false)}
            onSelect={(place: MapboxPlace) => {
              formik.setFieldValue("destination", place.fullName);
              formik.setFieldValue("destinationData", {
                id: place.id,
                coordinates: { longitude: place.coordinates.longitude, latitude: place.coordinates.latitude },
              } as DestinationDto);
              setShowDestinationModal(false);
            }}
            initialValue={formik.values.destination}
          />
        </Modal>
      </View>

      <View className="mb-5 z-10">
        <CheckboxGroup initialOptions={destinationTypeOptions} title="Type of Destination" />
      </View>

      <View className="flex-row mb-5 gap-3">
        <View className="flex-1">
          <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowStartDatePicker(!showStartDatePicker); setShowEndDatePicker(false); }}>
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label={"Departure"}
                placeholder="Departure Date"
                value={formattedStartDate}
                editable={false}
                left={<TextInput.Icon icon="calendar" className="opacity-50"/>}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0C4C8A"
                theme={{ colors: { onSurfaceVariant: '#888' } }}
                outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                style={{ marginTop: 6, height: 64 }}
                contentStyle={{ backgroundColor: "transparent" }}
              />
            </View>
          </TouchableOpacity>
          <Modal visible={showStartDatePicker} transparent={true} animationType="fade">
            <TouchableOpacity className="flex-1 bg-black/50 justify-center items-center px-5" activeOpacity={1} onPress={() => setShowStartDatePicker(false)}>
              <View className="w-full bg-white p-5 rounded-[40px] overflow-hidden">
                <Calendar
                  onDayPress={(day: any) => {
                    formik.setFieldValue("startDate", new Date(day.timestamp));
                    setShowStartDatePicker(false);
                  }}
                  minDate={new Date().toISOString().split('T')[0]}
                  markedDates={formik.values.startDate ? { [formik.values.startDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#0C4C8A' } } : undefined}
                  theme={{ todayTextColor: '#0C4C8A', arrowColor: '#0C4C8A' }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        <View className="flex-1">
          <TouchableOpacity activeOpacity={0.7} onPress={() => { setShowEndDatePicker(!showEndDatePicker); setShowStartDatePicker(false); }}>
            <View pointerEvents="none">
              <TextInput
                mode="outlined"
                label={"Return"}
                placeholder="Return Date"
                value={formattedEndDate}
                editable={false}
                left={<TextInput.Icon icon="calendar" className="opacity-50"/>}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0C4C8A"
                theme={{ colors: { onSurfaceVariant: '#888' } }}
                outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                style={{ marginTop: 6, height: 64 }}
                contentStyle={{ backgroundColor: "transparent" }}
              />
            </View>
          </TouchableOpacity>
          <Modal visible={showEndDatePicker} transparent={true} animationType="fade">
            <TouchableOpacity className="flex-1 bg-black/50 justify-center items-center px-5" activeOpacity={1} onPress={() => setShowEndDatePicker(false)}>
              <View className="w-full bg-white p-5 rounded-[40px] overflow-hidden">
                <Calendar
                  onDayPress={(day: any) => {
                    formik.setFieldValue("endDate", new Date(day.timestamp));
                    setShowEndDatePicker(false);
                  }}
                  markedDates={formik.values.endDate ? { [formik.values.endDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#0C4C8A' } } : undefined}
                  minDate={formik.values.startDate ? formik.values.startDate.toISOString().split('T')[0] : undefined}
                  theme={{ todayTextColor: '#0C4C8A', arrowColor: '#0C4C8A' }}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>

      <View className="mb-5">
        <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Description</Text>
        <TextInput
          mode="outlined"
          placeholder="Describe your next trip"
          value={formik.values.description}
          onChangeText={formik.handleChange("description")}
          onBlur={formik.handleBlur("description")}
          disabled={isSaving}
          outlineColor="#E0E0E0"
          activeOutlineColor="#0C4C8A"
          multiline
          numberOfLines={4}
          theme={{ colors: { onSurfaceVariant: '#888' } }}
          outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
          style={{ marginTop: 6, height: 100, fontSize: 14 }}
          contentStyle={{ backgroundColor: "transparent" }}
        />
      </View>

      <View className="mb-5">
        <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Budget</Text>
        <TextInput
          mode="outlined"
          placeholder="e.g., 2,000"
          value={formik.values.budget}
          onChangeText={formik.handleChange("budget")}
          onBlur={formik.handleBlur("budget")}
          left={<TextInput.Icon icon="currency-php" className="opacity-50"/>}
          keyboardType="numeric"
          disabled={isSaving}
          outlineColor="#E0E0E0"
          activeOutlineColor="#0C4C8A"
          theme={{ colors: { onSurfaceVariant: '#888' } }}
          outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
          style={{ marginTop: 6, height: 60 }}
          contentStyle={{ backgroundColor: "transparent" }}
        />
      </View>

      <View className="mb-5">
        <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Notes</Text>
        <TextInput
          mode="outlined"
          placeholder="Additional notes..."
          value={formik.values.notes}
          onChangeText={formik.handleChange("notes")}
          onBlur={formik.handleBlur("notes")}
          disabled={isSaving}
          outlineColor="#E0E0E0"
          activeOutlineColor="#0C4C8A"
          multiline
          numberOfLines={3}
          theme={{ colors: { onSurfaceVariant: '#888' } }}
          outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
          style={{ marginTop: 6, height: 80, fontSize: 14 }}
          contentStyle={{ backgroundColor: "transparent" }}
        />
      </View>

      <View className="mb-8 z-10">
        <CheckboxGroup initialOptions={activityOptions} title="Activities" />
      </View>

      <View className="mb-16">
        <TouchButton
          buttonText={isSaving ? "Saving..." : "Save Changes"}
          onPress={() => formik.handleSubmit()}
          disabled={isSaving}
          className="h-[64px] p-6"
        />
      </View>
    </ScrollView>
  );
};

export default TripDetail;
