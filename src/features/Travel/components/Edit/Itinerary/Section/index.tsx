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
import Icon from "react-native-vector-icons/MaterialIcons";
import DestinationSelector from "../../../DestinationSelector";
import { useFormik } from "formik";
import * as Yup from "yup";
import TouchButton from "../../../../../../components/atoms/TouchButton";
import { ItinerarySection } from "../../../../types/TravelDto";
import { useUpdateSectionMutation, useDeleteSectionMutation } from "../../../../hooks/useSection";
import { useTravelContext } from "../../../../../../context/TravelContext";

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

  const handleDeleteSection = () => {
    if (itinerarySection?.travelId && itinerarySection?.id) {
      deleteSectionMutation({
        travelId: itinerarySection.travelId,
        sectionId: itinerarySection.id,
      });
      if (!isDeleting) {
        onClose();
      }
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
    },
    validationSchema: TravelSchema,
    onSubmit: async (values) => {
      const isValidId = !!values?.travelId;
      if (isValidId) {
        const sectionData: ItinerarySection = {
          ...values,
          isOffline: isNaN(Number(values.travelId)),
        };
        await updateMutation(sectionData);
        onClose();
      }
    },
  });

  return (
    <View className="flex-1 justify-end bg-white rounded-t-[20px]">
             <StatusBar barStyle={"dark-content"} />

             <ScrollView className="flex-1 p-[15px] bg-gray-50 pb-[100px]" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View className="mb-5">
                  <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Title</Text>
                  <TextInput
                    mode="outlined"
                    className="!h-[64px]"
                    placeholder="Section title"
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
                    placeholder="Section description"
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
                        placeholder="Search city or country..."
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
                  <View className="mt-5 pt-5 border-t border-[#E0E0E0]">
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
             </ScrollView>

             <View className="px-5 py-4 border-t border-gray-200 ">
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

