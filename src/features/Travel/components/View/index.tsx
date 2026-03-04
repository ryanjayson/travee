import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import SectionAccordion from "./SectionAccordion";
import { TravelPlan } from "../../../Travel/types/TravelDto";
import StatusTag from "../../../../components/StatusTag";
import Tabs from "../../../../components/Tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Typography, Color } from "../../../../styles/common";

interface ViewTravelProps {
  travelPlan: TravelPlan;
  onClose: () => void;
}

const ViewTravel = ({ travelPlan, onClose }: ViewTravelProps) => {
  const [showActivityViewModal, setShowActivityViewModal] =
    useState<boolean>(false);
  // const [travelPlan, setTravelPlan] = useState<Travel>(sampleTravel[0]);

  const TabItinerary = () => (
    <View>
      {travelPlan.itinerarySection ? (
        <SectionAccordion iterarysections={travelPlan.itinerarySection} />
      ) : (
        <Text>No itinerary Added</Text>
      )}
    </View>
  );

  const TabChecklistContent = () => (
    <View>
      {travelPlan.itinerarySection ? (
        <SectionAccordion iterarysections={travelPlan.itinerarySection} />
      ) : (
        <Text style={styles.contentText}>No Checklist item added.</Text>
      )}
    </View>
  );

  const TabNotesContent = () => (
    <View>
      {travelPlan.itinerarySection ? (
        <SectionAccordion iterarysections={travelPlan.itinerarySection} />
      ) : (
        <Text style={styles.contentText}>No note added.</Text>
      )}
    </View>
  );

  const TabDetailsContent = () => (
    <View>
      <View>
        <Text style={styles.contentText}>20 - Total Activity </Text>
      </View>
      <View>
        <Text style={styles.contentText}>10 - Paticipants</Text>
      </View>
      <View>
        <Text style={styles.contentText}>$1000 - Running Expenses</Text>
      </View>
    </View>
  );

  const Toolbar = () => (
    <View>
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          backgroundColor: "#000",
          width: 32,
          height: 32,
          padding: 6,
          borderRadius: 50,
          opacity: 0.8,
          position: "absolute",
          right: 60,
          top: 20,
          zIndex: 1,
        }}
      >
        <Animated.View>
          <Icon name="map" size={20} color={"#FFF"} />
        </Animated.View>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          backgroundColor: "#000",
          width: 32,
          height: 32,
          padding: 6,
          borderRadius: 50,
          opacity: 0.8,
          position: "absolute",
          right: 20,
          top: 20,
          zIndex: 1,
        }}
      >
        <Animated.View>
          <Icon name="group" size={20} color={"#FFF"} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );

  const HeaderSection = () => (
    <View>
      <View style={{ flex: 1 }}>
        <Toolbar />
        <View style={styles.container}>
          <Image
            source={require("../../../../assets/images/japan.jpg")}
            style={styles.imageBanner}
          />
        </View>
      </View>

      <View style={{ flex: 2, backgroundColor: "#FFF" }}>
        <View style={styles.travelCardDetail}>
          <View style={styles.travelCardHeader}>
            <Text style={[Typography.h1, {}]}>{travelPlan?.travel.title}</Text>
            <StatusTag type={1} status={travelPlan.travel.status!} />
          </View>
          <View style={{ flexDirection: "row", rowGap: 10 }}>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                marginVertical: 4,
              }}
            >
              <Icon name="location-pin" size={20} color={"red"} />
              <Text style={[Color.primary]}>
                {travelPlan.travel.destination}
              </Text>
            </TouchableOpacity>
            <View style={styles.travelDates}>
              <Text style={styles.dateLabel}>
                {travelPlan.travel.startDate?.toDateString()}
              </Text>
              <Text>3 Day</Text>
            </View>
          </View>

          <View>
            <Text style={[Typography.body, { marginTop: 10 }]}>
              {travelPlan.travel.description}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const tabData = [
    { id: "itinerary", title: "Itinerary", content: <TabItinerary /> },
    { id: "notes", title: "Notes", content: <TabNotesContent /> },
    {
      id: "checklist",
      title: "Checklist",
      content: <TabChecklistContent />,
    },
    {
      id: "details",
      title: "Details",
      content: <TabDetailsContent />,
    },
  ];

  const handleViewModeActivity = (id: number) => {
    setShowActivityViewModal(true);
  };

  return (
    <ScrollView style={styles.scrollView}>
      <HeaderSection />
      <View>
        <Tabs tabs={tabData} initialActiveTabId="itinerary" />
      </View>
    </ScrollView>
  );
};

export default ViewTravel;

const styles = StyleSheet.create({
  //containers
  contentText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },

  travelCard: {
    backgroundColor: "white",
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
  },
  travelDates: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: "#665",
    marginHorizontal: 8,
    paddingHorizontal: 8,
    borderEndWidth: 1,
    borderStartWidth: 1,
    borderColor: "#DDD",
  },
  dateText: {
    fontSize: 14,
    color: "#183B7A",
    fontWeight: "500",
  },

  imageBanner: {
    width: "auto",
    height: 200,
    resizeMode: "cover",
    margin: 10,
    borderRadius: 10,
  },
});
