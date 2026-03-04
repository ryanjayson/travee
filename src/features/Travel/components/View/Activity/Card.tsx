import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Image,
} from "react-native";
import ViewActivityModal from "./Modal";
import ActivityIcon from "../../../../../components/ActivityIcon";
import TextLimiter from "../../../../../components/atoms/TextLimiter";
import { ItineraryActivity } from "../../../types/TravelDto";
import { Typography } from "../../../../../styles/common";

interface ItineraryActivityProps {
  itineraryActivity: ItineraryActivity;
  isFirstItem?: boolean;
  isLastItem?: boolean;
}
const ActivityItemCard = ({
  itineraryActivity,
  isFirstItem,
  isLastItem,
}: ItineraryActivityProps) => {
  const [itineraryEventActivity, setItineraryEventActivity] =
    useState<ItineraryActivity>(itineraryActivity);

  const [showActivityViewModal, setShowActivityViewModal] =
    useState<boolean>(false);

  const handleViewModeActivity = (id: number) => {
    console.log(id);
    setShowActivityViewModal(true);
  };

  return (
    <Animated.View>
      <View
        style={{
          paddingHorizontal: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          // paddingVertical: 2,
          backgroundColor: "#fff",
        }}
      >
        {!isLastItem ? (
          <View
            style={{
              width: 6,
              alignItems: "center",
              height: "100%",
              position: "absolute",
            }}
          >
            {isFirstItem ? (
              <View
                style={{
                  position: "absolute",
                  height: "50%",
                  width: 1,
                  top: "50%",
                  left: 20,
                  zIndex: 0,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "#ccc",
                }}
              ></View>
            ) : (
              <View
                style={{
                  position: "absolute",
                  height: "100%",
                  width: 1,
                  left: 20,
                  zIndex: 0,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "#ccc",
                }}
              ></View>
            )}
          </View>
        ) : (
          <View
            style={{
              width: 6,
              alignItems: "center",
              height: "100%",
              position: "absolute",
            }}
          >
            <View
              style={{
                position: "absolute",
                height: "50%",
                width: 1,
                left: 20,
                zIndex: 0,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#ccc",
              }}
            ></View>
          </View>
        )}

        <View>
          <ActivityIcon
            type={itineraryEventActivity.primaryType!}
            size={24}
            color="#dc3545"
          />
        </View>
        <TouchableOpacity
          onPress={() => handleViewModeActivity(itineraryEventActivity.id!)}
          style={styles.container}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#333",
                lineHeight: 20,
              }}
            >
              {itineraryEventActivity.title}
            </Text>
            <View>
              <Text style={Typography.small}>
                {itineraryEventActivity.startDate?.toDateString()} 11:00AM
              </Text>
            </View>
          </View>

          {itineraryEventActivity && itineraryEventActivity.images && (
            <View style={{ marginVertical: 4 }}>
              <Image
                src={itineraryEventActivity.images[0].url}
                style={styles.imageBanner}
              />
            </View>
          )}
          <Text
            style={{
              fontSize: 14,
              color: "#555",
              lineHeight: 20,
              marginBottom: 6,
            }}
          >
            <TextLimiter text={itineraryEventActivity.description!} />
          </Text>
          <Text style={Typography.small}>
            {itineraryEventActivity.commentsCount} Comments |{" "}
            {itineraryEventActivity.notesCount} Notes
          </Text>
        </TouchableOpacity>
      </View>
      <ViewActivityModal
        id={itineraryEventActivity.id!}
        showModal={showActivityViewModal}
        setShowModal={setShowActivityViewModal}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    padding: 10,
    flexGrow: 1,
    marginStart: 12,
    marginVertical: 4,
  },
  imageBanner: {
    height: 120,
    width: "100%",
    resizeMode: "cover",
    borderRadius: 4,
  },
});

export default ActivityItemCard;
