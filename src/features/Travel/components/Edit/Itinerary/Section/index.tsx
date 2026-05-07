import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TextInput } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import DestinationSelector from "../../../DestinationSelector";
import { useFormik } from "formik";
import * as Yup from "yup";
import TouchButton from "../../../../../../components/atoms/TouchButton";
import { ItinerarySection } from "../../../../types/TravelDto";
import { useUpdateSectionMutation, useDeleteSectionMutation } from "../../../../hooks/useSection";
import { useTravel } from "../../../../hooks/useTravel";
import { useTravelContext } from "../../../../../../context/TravelContext";
import { Calendar } from "react-native-calendars";

interface Place {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface EditSectionProps {
  itinerarySection: ItinerarySection | null;
  onClose: () => void;
}

const TravelSchema = Yup.object().shape({
  title: Yup.string().required("Title is required").min(2),
});

const EditSection = ({ itinerarySection, onClose }: EditSectionProps) => {
  const [showDestinationModal, setShowDestinationModal] =
    useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const { mutate: updateMutation, isPending: isUpdating } = useUpdateSectionMutation();
  const { mutate: deleteSectionMutation, isPending: isDeleting } = useDeleteSectionMutation();
  const { selectedTravelPlan } = useTravelContext();
  const { data: travel } = useTravel(selectedTravelPlan?.id || "");

  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);

  const handleDeleteSection = () => {
    if (itinerarySection?.travelId && itinerarySection?.id) {
      Alert.alert(
        "Delete Section",
        "Are you sure you want to delete this section? All associated activities will also be permanently deleted. This action is irreversible.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              deleteSectionMutation({
                travelId: itinerarySection.travelId!,
                sectionId: itinerarySection.id!,
              });
              onClose();
            },
          },
        ]
      );
    }
  };

  const formik = useFormik({
    initialValues: {
      id: itinerarySection?.id,
      travelId: selectedTravelPlan?.id,
      title: itinerarySection?.title || "",
      description: itinerarySection?.description || "",
      sortOrder: itinerarySection?.sortOrder || "",
      notes: itinerarySection?.notes || "",
      startDate: itinerarySection?.startDate ? new Date(itinerarySection.startDate) : travel?.startOrDepartureDate ? new Date(travel.startOrDepartureDate) : null as Date | null,
    },
    validationSchema: TravelSchema,
    onSubmit: async (values) => {
      const isValidId = !!values?.travelId;
      if (isValidId) {
        const sectionData: ItinerarySection = {
          ...values,
          startDate: values.startDate || undefined,
          isOffline: isNaN(Number(values.travelId)),
        };
        await updateMutation(sectionData);
        onClose();
      }
    },
  });

  const formattedStartDate = formik.values.startDate ? formik.values.startDate.toLocaleDateString() : "";

  return (
    <View className="flex-1 justify-end bg-gray-100 rounded-t-[20px]">
          <StatusBar barStyle={"dark-content"} />

          <ScrollView className="flex-1 p-[15px] bg-gray-100 pb-[100px]" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View className="mb-5">
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Title</Text>
              <TextInput
                mode="outlined"
                className="!h-[64px]"
                placeholder="e.g Day 1"
                value={formik.values.title}
                onChangeText={formik.handleChange("title")}
                onBlur={formik.handleBlur("title")}
                error={formik.touched.title && Boolean(formik.errors.title)}
                disabled={isUpdating}
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
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Description</Text>
              <TextInput
                mode="outlined"
                placeholder="Add a short description"
                multiline
                numberOfLines={4}
                value={formik.values.description}
                onChangeText={formik.handleChange("description")}
                onBlur={formik.handleBlur("description")}
                error={formik.touched.description && Boolean(formik.errors.description)}
                disabled={isUpdating}
                outlineColor="#E0E0E0"
                activeOutlineColor="#0C4C8A"
                  theme={{
              colors: {
                onSurfaceVariant: '#888', 
              },
            }}
            outlineStyle={{
              borderWidth: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
            }}
            style={{
              marginTop: 6,
              height: 120,
              fontSize: 14,
            }}
            textAlignVertical="top"
            contentStyle={{
              backgroundColor: "transparent",
            }}
              />
            </View>

            <View className="mb-5">
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Date</Text>
              <View className="relative mt-[6px]">
                <TextInput
                  mode="outlined"
                  placeholder="Select Date"
                  value={formattedStartDate}
                  editable={false}
                  left={<TextInput.Icon icon="calendar" className="opacity-50"/>}
                  right={formik.values.startDate ? <TextInput.Icon icon="close" onPress={() => formik.setFieldValue("startDate", null)} /> : null}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#0C4C8A"
                  theme={{ colors: { onSurfaceVariant: '#888' } }}
                  outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                  style={{ height: 64 }}
                  contentStyle={{ backgroundColor: "transparent" }}
                />
                <TouchableOpacity 
                  style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 50, zIndex: 20 }}
                  onPress={() => setShowStartDatePicker(true)}
                  activeOpacity={0.6}
                />
              </View>
              <Modal visible={showStartDatePicker} transparent={true} animationType="fade">
                <TouchableOpacity
                  className="flex-1 bg-black/50 justify-center items-center px-5"
                  activeOpacity={1}
                  onPress={() => setShowStartDatePicker(false)}
                >
                  <View className="w-full bg-white p-5 rounded-[40px] overflow-hidden" onStartShouldSetResponder={() => true}>
                    <Calendar
                      onDayPress={(day: any) => {
                        formik.setFieldValue("startDate", new Date(day.timestamp));
                        setShowStartDatePicker(false);
                      }}
                      renderArrow={(direction: string) => (
                        <Icon
                          name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
                          size={32}
                          color="#0C4C8A"
                        />
                      )}
                      enableSwipeMonths={true}
                      markedDates={{
                        ...(formik.values.startDate ? {
                          [formik.values.startDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#0C4C8A', selectedTextColor: '#ffffff' }
                        } : {})
                      }}
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
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Location</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDestinationModal(true)}
                disabled={isUpdating}
              >
                <View pointerEvents="none">
                  <TextInput
                    mode="outlined"
                    className="!h-[64px]"
                    placeholder="Search a place..."
                    value={selectedPlace?.name || selectedPlace?.address || ""}
                    editable={false}
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
            </View>

            <Modal
              visible={showDestinationModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowDestinationModal(false)}
            >
              <View className="flex-1 bg-white">
                <DestinationSelector
                  onClose={() => setShowDestinationModal(false)}
                  onSelect={(place) => {
                    setSelectedPlace(place);
                    setShowDestinationModal(false);
                  }}
                />
              </View>
            </Modal>

            {itinerarySection?.id && (
              <View className="py-6 ">
                <TouchableOpacity 
                  className="flex-row items-center gap-2.5 justify-center py-2"
                  onPress={handleDeleteSection}
                  disabled={isDeleting}
                >
                  <Icon name="delete-outline" size={24} color={"#c93030"} />
                  <Text className="text-base capitalize font-medium text-[#c93030]">
                    Delete Section
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="mb-5"></View>
          </ScrollView>

            <View className="mb-8 mx-4 bg-transparent">
              <TouchButton
              buttonText={itinerarySection?.id ? "Update Section" : "Add Section"}
              onPress={() => formik.handleSubmit()}
              disabled={!formik.isValid || !formik.dirty || isUpdating}
              className="h-[64px] p-6"
            />
          </View>
          
      </View>
    );
};

export default EditSection;

