import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
  Alert,
  Keyboard,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import DestinationSelector from "../../../DestinationSelector";
import { Formik } from "formik";
import * as Yup from "yup";
import TouchButton from "../../../../../../components/atoms/TouchButton";
import { ItinerarySection } from "../../../../types/TravelDto";
import { useUpdateSectionMutation } from "../../../../hooks/useSection";
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
  const updateMutation = useUpdateSectionMutation();
  const { selectedTravelPlan } = useTravelContext();

  const handleSaveSection = async (itinerarySectionData: ItinerarySection) => {
    debugger;
    
    const isValidId = !!itinerarySectionData?.travelId;
    
    if (isValidId) {
      itinerarySectionData.isOffline = isNaN(Number(itinerarySectionData.travelId));
      await updateMutation.mutateAsync(itinerarySectionData);
      onClose();
    }
    //Throw error here
  };

  return (
    <Formik
      initialValues={{
        id: itinerarySection?.id,
        travelId: selectedTravelPlan?.id,
        title: itinerarySection?.title || "",
        description: itinerarySection?.description || "",
        // primaryType: itinerarySection?.primaryType || 1,
        sortOrder: itinerarySection?.sortOrder || "",
        notes: itinerarySection?.notes || "",
      }}
      validationSchema={TravelSchema}
      onSubmit={handleSaveSection}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        values,
        errors,
        touched,
        setValues,
        isSubmitting,
      }) => {

        return (
          <ScrollView 
            className="flex-1 bg-white" 
            contentContainerStyle={{ flex: 1 }} 
            keyboardShouldPersistTaps="handled" 
            scrollEnabled={false} 
            bounces={false}
          >
            <StatusBar barStyle={"dark-content"} />

              <ScrollView
                className="flex-1"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
              >
                <View className="p-2.5 ml-0">
                  <TextInput
                    className="text-xl font-medium"
                    placeholder="Add title"
                    onChangeText={handleChange("title")}
                    onBlur={handleBlur("title")}
                    value={values.title}
                  />
                  {errors.title && touched.title && (
                    <Text className="text-red-500 text-sm">{errors.title}</Text>
                  )}
                </View>

                <View className="py-5 px-2.5 flex-1 flex-row items-start gap-2.5 border-t border-[#ddd]">
                  <View>
                    <Icon name="notes" size={28} color={"#B3B3B3"} />
                  </View>

                  <View className="flex-1">
                    <TextInput
                      className="pt-0 text-base"
                      placeholder="Add Description"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      onChangeText={handleChange("description")}
                      onBlur={handleBlur("description")}
                      value={values.description}
                    />
                  </View>
                </View>

                <View className="border-t border-[#ddd] py-5 px-2.5">
                  <TouchableOpacity
                    className="flex-1 flex-row items-center gap-2.5"
                    onPress={() => setShowDestinationModal(true)}
                  >
                    <View>
                      <Icon name="pin-drop" size={28} color={"#B3B3B3"} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm">Location</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                 <View className="border-t border-[#ddd] py-5 px-2.5">
                  <TouchableOpacity
                    className="flex-1 flex-row items-center gap-2.5"
                    onPress={() => setShowDestinationModal(true)}
                  >
                    <View>
                      <Icon name="text-fields" size={28} color={"#B3B3B3"} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm">More Fields</Text>
                    </View>
                  </TouchableOpacity>
                </View>

            </ScrollView>

            <View className="absolute left-0 right-0 bottom-0 p-2.5 bg-white border-t border-[#ddd]">
              <TouchableOpacity
                activeOpacity={0.7}
                className="p-4 items-center rounded-full bg-button-primary"
                style={{ opacity: (isSubmitting || updateMutation.isPending) ? 0.5 : 1 }}
                disabled={isSubmitting || updateMutation.isPending}
                onPressIn={() => {
                   Keyboard.dismiss();
                   setTimeout(() => {
                    handleSubmit();
                   }, 100);
                }}
              >
                <Text className="text-white font-semibold text-base">
                  {isSubmitting || updateMutation.isPending
                    ? "Saving..."
                    : itinerarySection?.id
                    ? "Update Section"
                    : "Add Section"}
                </Text>
              </TouchableOpacity>
            </View>

            <Modal
              visible={showDestinationModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowDestinationModal(false)}
            >
              <DestinationSelector
                onClose={() => setShowDestinationModal(false)}
                onSelect={(selectedPlace) => {
                  console.log(selectedPlace);
                  setSelectedPlace(selectedPlace);
                }}
              />
            </Modal>
          </ScrollView>
        );
      }}
    </Formik>
  );
};

export default EditSection;

