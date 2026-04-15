import React from "react";
import { View, Text, ScrollView, Animated } from "react-native";
import Accordion from "../../../../components/Accordion";
import ActivityItemCard from "./Activity/Card";
import { ItinerarySection } from "../../../Travel/types/TravelDto";
import { ActivityType } from "../../../../types/enums";

interface SectionAccordionProps {
  iterarysections?: ItinerarySection[];
}

const SectionAccordion = ({ iterarysections }: SectionAccordionProps) => {
  return (
    <View className="flex-1">
      <ScrollView className="flex-1">
        <View className="flex-1 p-2.5">
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
                      <Text className="text-sm text-[#555] leading-5 p-2.5">
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

export default SectionAccordion;
