import React from "react";
import { View, Text, StyleSheet, ScrollView, Animated } from "react-native";
import Accordion from "../../../../components/Accordion";
import ActivityItemCard from "./Activity/Card";
import { ItinerarySection } from "../../../Travel/types/TravelDto";
import { ActivityType } from "../../../../types/enums";

interface SectionAccordionProps {
  iterarysections?: ItinerarySection[];
}

const SectionAccordion = ({ iterarysections }: SectionAccordionProps) => {
  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {iterarysections &&
            iterarysections.map((section) => {
              const isDefaultSection = section.isDefaultSection;

              if (isDefaultSection) {
                return (
                  <View key={section.id}>
                    <Text>DEFAULT</Text>
                    {section.itineraryActivity &&
                      section.itineraryActivity
                        // .filter((activity) => activity.sectionId === section.id)
                        .map((eventActivity, index, array) => {
                          const isFirstEvent = index === 0;
                          const isLastEvent = array.length - 1 === index;

                          return (
                            <ActivityItemCard
                              key={eventActivity.id || index} // Use a unique ID if available, otherwise use index
                              itineraryActivity={eventActivity}
                              isFirstItem={isFirstEvent}
                              isLastItem={isLastEvent}
                            />
                          );
                        })}
                  </View>
                );
              } else {
                return (
                  <Accordion
                    key={section.id}
                    title={section.title}
                    headerStyle={{ backgroundColor: "#FFF" }}
                  >
                    <View style={{ backgroundColor: "#FFF" }}>
                      <Text style={styles.contentText}>
                        {section.description}
                      </Text>
                      {section.itineraryActivity &&
                        section.itineraryActivity.map(
                          (eventActivity, index, array) => {
                            const isFirstEvent = index === 0;
                            const isLastEvent = array.length - 1 === index;
                            console.log("eventActivity", eventActivity);
                            eventActivity.primaryType = ActivityType.flight;
                            return (
                              <ActivityItemCard
                                key={eventActivity.id || index}
                                itineraryActivity={eventActivity}
                                isFirstItem={isFirstEvent}
                                isLastItem={isLastEvent}
                              />
                            );
                          }
                        )}
                    </View>
                  </Accordion>
                );
              }
            })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  // heading: {
  //   fontSize: 24,
  //   fontWeight: "bold",
  //   marginBottom: 20,
  //   textAlign: "center",
  //   color: "#333",
  // },
  contentText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    padding: 10,
  },
  // innerContent: {
  //   marginTop: 10,
  //   padding: 10,
  //   backgroundColor: "#e8f4fd",
  //   borderRadius: 5,
  //   borderLeftWidth: 3,
  //   borderLeftColor: "#2196F3",
  // },
  // innerContentText: {
  //   fontSize: 12,
  //   color: "#1976D2",
  //   fontStyle: "italic",
  // },
  // buttonGroup: {
  //   flexDirection: "row",
  //   gap: 10,
  //   marginVertical: 10,
  // },
  // button: {
  //   flex: 1,
  //   backgroundColor: "#2196F3",
  //   paddingVertical: 8,
  //   paddingHorizontal: 12,
  //   borderRadius: 6,
  //   alignItems: "center",
  // },
  // buttonText: {
  //   color: "white",
  //   fontSize: 12,
  //   fontWeight: "500",
  // },
  // minimalContainer: {
  //   backgroundColor: "transparent",
  //   marginVertical: 2,
  // },
  // minimalHeader: {
  //   backgroundColor: "transparent",
  //   paddingVertical: 8,
  //   paddingHorizontal: 0,
  // },
  // minimalTitle: {
  //   fontSize: 14,
  //   color: "#666",
  //   fontWeight: "400",
  // },

  // iconRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   marginVertical: 15,
  //   width: "80%",
  // },
  // iconLabel: {
  //   marginLeft: 15,
  //   fontSize: 16,
  //   color: "#333",
  // },
  // shadowIcon: {
  //   textShadowColor: "rgba(0, 0, 0, 0.3)",
  //   textShadowOffset: { width: 2, height: 2 },
  //   textShadowRadius: 5,
  // },
  // container2: {
  //   padding: 20,
  //   alignItems: "center",
  //   backgroundColor: "#fff",
  // },
});

export default SectionAccordion;
