import React, { useState, useEffect } from "react";
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
import { Travel, CreateTravelData } from "../../../../types/TravelDto";
import Icon from "react-native-vector-icons/MaterialIcons";
import DestinationSelector from "../../../DestinationSelector";
import { Formik } from "formik";
import * as Yup from "yup";
import { ButtonStyle } from "../../../../../../styles/common";
import TouchButton from "../../../../../../components/atoms/TouchButton";
import { ItineraryActivity } from "../../../../types/TravelDto";
import { useUpdateActivityMutation } from "../../../../hooks/useActivity";
import { useTravelContext } from "../../../../../../context/TravelContext";
import { useDeleteActivityMutation } from "../../../../hooks/useActivity";
import { ActivityType } from "../../../../../../types/enums";

interface Place {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface EditActivityProps {
  itinerarySectionId?: number;
  itineraryActivity: ItineraryActivity | null;
  onClose: () => void;
}

//Edit page for activity
const TravelSchema = Yup.object().shape({
  title: Yup.string().required("Title is required").min(2),
});

const EditActivity = ({
  itinerarySectionId,
  itineraryActivity,
  onClose,
}: EditActivityProps) => {
  const [showDestinationModal, setShowDestinationModal] =
    useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const updateMutation = useUpdateActivityMutation();
  const { selectedTravelPlan } = useTravelContext();
  const { mutate: deleteActivityMutation, isPending } =
    useDeleteActivityMutation();

  const handleSaveActivity = async (
    itineraryActivityData: ItineraryActivity,
  ) => {
    if (
      itineraryActivityData?.sectionId &&
      selectedTravelPlan &&
      selectedTravelPlan?.id > 0
    ) {
      // const primaryActivityType: ActivityType =
      //   itineraryActivityData.primaryType as ActivityType;
      itineraryActivityData.primaryType = ActivityType.flight;
      debugger;
      await updateMutation.mutateAsync(itineraryActivityData);
      onClose();
    }
  };

  const handleDeleteActivity = (activityId: number) => {
    if (itinerarySectionId && itinerarySectionId > 0 && activityId > 0) {
      deleteActivityMutation({
        sectionId: itinerarySectionId,
        activityId: activityId,
      });
      if (!isPending) {
        onClose();
      }
    }
  };

  return (
    <Formik
      initialValues={{
        travelId: selectedTravelPlan?.id,
        sectionId: itinerarySectionId,
        id: itineraryActivity?.id,
        title: itineraryActivity?.title || "",
        description: itineraryActivity?.description || "",
        primaryType: itineraryActivity?.primaryType || ActivityType.none,
      }}
      validationSchema={TravelSchema}
      onSubmit={handleSaveActivity}
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
        useEffect(() => {}, []);
        return (
          <View style={styles.screenContainer}>
            <StatusBar barStyle={"dark-content"} />
            <Text>{errors.title}</Text>
            <Text>{errors.description}</Text>
            <Text>{errors.primaryType}</Text>
            <Text>{errors.travelId}</Text>
            <Text>{errors.sectionId}</Text>

            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <View>
                <TouchableOpacity
                  onPress={() =>
                    handleDeleteActivity(itineraryActivity?.id || 0)
                  }
                  disabled={isPending}
                >
                  <Icon name="delete-outline" size={24} color={"#c93030"} />
                </TouchableOpacity>
              </View>
              <View style={{ padding: 10, marginLeft: 0 }}>
                <TextInput
                  style={{ fontSize: 20, fontWeight: 500 }}
                  placeholder="Add title"
                  onChangeText={handleChange("title")}
                  onBlur={handleBlur("title")}
                  value={values.title}
                />
                {errors.title && touched.title && (
                  <Text style={styles.error}>{errors.title}</Text>
                )}
                <TouchableOpacity
                  style={{
                    display: "none",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    borderColor: "#0C4C8A",
                    backgroundColor: "#0C4C8B",
                    borderWidth: 1,
                    padding: 4,
                    borderRadius: 10,
                    alignContent: "center",
                  }}
                  onPress={() => setShowDestinationModal(true)}
                >
                  <Icon name="explore" size={20} color={"#FFF"} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 12, fontWeight: "600", color: "#FFF" }}
                    >
                      Explore
                    </Text>
                  </View>
                </TouchableOpacity>
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
                      {selectedPlace ? selectedPlace.name : "Add location"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  borderTopWidth: 1,
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
                  borderTopWidth: 1,
                  borderColor: "#ddd",
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

              <View
                style={{
                  paddingVertical: 20,
                  paddingHorizontal: 10,
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                  borderTopWidth: 1,
                  borderColor: "#ddd",
                }}
              >
                <View>
                  <Icon name="notes" size={28} color={"#B3B3B3"} />
                </View>

                <View>
                  <TextInput
                    style={{ paddingTop: 0, fontSize: 14 }}
                    placeholder="Add Primary Type"
                    onChangeText={handleChange("primaryType")}
                    onBlur={handleBlur("primaryType")}
                    value={String(values.primaryType)}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.footerButtonContainer}>
              <TouchButton
                buttonText={
                  itineraryActivity?.id && itineraryActivity?.id > 0
                    ? "Update Activity"
                    : "Add Activity"
                }
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
                }}
              />
            </Modal>
          </View>
        );
      }}
    </Formik>
  );
};

export default EditActivity;

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    backgroundColor: "wrhite",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#183B7A",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#183B7A",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "white",
    fontWeight: "bold",
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
  },
  travelCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 1,
  },

  travelCardDetail: {
    padding: 10,
  },
  travelCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  travelDestination: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#183B7A",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingBadge: {
    backgroundColor: "#E8F5E8",
  },
  pastBadge: {
    backgroundColor: "#F0F0F0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  upcomingText: {
    color: "#2E7D32",
  },
  pastText: {
    color: "#666",
  },
  travelDates: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#183B7A",
    fontWeight: "500",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#183B7A",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryButtonText: {
    color: "#183B7A",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#183B7A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#183B7A",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#183B7A",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },

  image: {
    width: "auto",
    height: 200,
    resizeMode: "cover",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    // Add resizeMode if needed (e.g., 'contain', 'cover', 'stretch')
  },
  error: { color: "red", fontSize: 14 },
  footerButtonContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
});
