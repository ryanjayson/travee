import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
} from "react-native";
import { CreateTravelData } from "../types/TravelDto";
import Icon from "react-native-vector-icons/MaterialIcons";
import DestinationSelector from "../components/DestinationSelector";
import { Formik } from "formik";
import * as Yup from "yup";
import TouchButton from "../../../components/atoms/TouchButton";
import { useUpdateTravel } from "../../Travel/hooks/useTravel";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

interface Place {
  id: string;
  name: string;
  address: string;
  type: string;
}

const TravelSchema = Yup.object().shape({
  title: Yup.string().required("Title is required").min(2),
});

interface AddTravelProps {
  travel: CreateTravelData | null;
  navigation: NativeStackNavigationProp<any>;
}

const CreateTravelPlan = ({ travel, navigation }: AddTravelProps) => {
  const [showDestinationModal, setShowDestinationModal] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const updateMutation = useUpdateTravel();

  const handleSaveTravel = async (travelData: CreateTravelData) => {
    const result = await updateMutation.mutateAsync(travelData);
    if (result.isSuccess) {
      setIsSaving(false);
      navigation.navigate("EditTravelPlan", {
        travelId: result.data.id,
        //TODO: add userid
      });
    }
  };

  return (
    <Formik
      initialValues={{
        title: travel?.title || "",
        destination: travel?.description || "",
        description: travel?.description || "",
      }}
      validationSchema={TravelSchema}
      onSubmit={handleSaveTravel}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        values,
        errors,
        touched,
        setValues,
      }) => {
        return (
          <View style={styles.screenContainer}>
            <StatusBar barStyle={"dark-content"} />

            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <View style={{ padding: 10, marginLeft: 0 }}>
                <TextInput
                  style={{ fontSize: 26, fontWeight: 500 }}
                  placeholder="Add title"
                  onChangeText={handleChange("title")}
                  onBlur={handleBlur("title")}
                  value={values.title}
                />
                {errors.title && touched.title && (
                  <Text style={styles.error}>{errors.title}</Text>
                )}
              </View>

              <View
                style={{
                  borderTopWidth: 1,
                  borderColor: "#ddd",
                  paddingVertical: 20,
                  paddingHorizontal: 10,
                }}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                  onPress={() => setShowDestinationModal(true)}
                >
                  <View style={{}}>
                    <Icon name="public" size={28} color={"#B3B3B3"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16 }}>
                      {selectedPlace
                        ? selectedPlace.name
                        : "Travel destination"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  borderTopWidth: 1,
                  borderBottomWidth: 1,
                  borderColor: "#ddd",
                  paddingVertical: 20,
                  paddingHorizontal: 10,
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <View>
                  <Icon name="date-range" size={28} color={"#B3B3B3"} />
                </View>
                <View>
                  <Text style={{}}>Start Date *</Text>
                  <TextInput
                    style={{}}
                    placeholder="YYYY-MM-DD"
                    // value={startDate}
                    // onChangeText={setStartDate}
                    // editable={!isSaving}
                  />

                  <Text style={{}}>End Date *</Text>
                  <TextInput
                    style={{}}
                    placeholder="YYYY-MM-DD"
                    // value={endDate}
                    // onChangeText={setEndDate}
                    // editable={!isSaving}
                  />

                  <Text>Timezone here</Text>
                </View>
              </View>

              <View
                style={{
                  paddingVertical: 20,
                  paddingHorizontal: 10,
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <View>
                  <Icon name="notes" size={28} color={"#B3B3B3"} />
                </View>

                <View>
                  <TextInput
                    style={{ paddingTop: 0, fontSize: 14 }}
                    placeholder="Add Description"
                    multiline
                    numberOfLines={4}
                    onChangeText={handleChange("description")}
                    onBlur={handleBlur("description")}
                    value={values.description}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.footerButtonContainer}>
              <TouchButton
                disabled={!values.title || isSaving}
                buttonText="Add Travel Plan"
                onPress={() => handleSubmit()}
              />
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
                  setValues((prevValues) => ({
                    ...prevValues,
                    destination: selectedPlace?.name || "",
                  }));
                }}
              />
            </Modal>
          </View>
        );
      }}
    </Formik>
  );
};

export default CreateTravelPlan;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingTop: 40,
  },
  error: { color: "red", fontSize: 14 },
  footerButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    padding: 10,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
});
