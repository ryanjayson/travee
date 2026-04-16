import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
} from "react-native";
import { Calendar } from "react-native-calendars";
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
import { Divider, Text, Switch } from 'react-native-paper';

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
  const [showPrimaryTypeModal, setShowPrimaryTypeModal] = useState<boolean>(false);
  const [isAllDay, setIsAllDay] = useState<boolean>(true);
  const [showTimePickerFor, setShowTimePickerFor] = useState<"startTime" | "endTime" | null>(null);
  const [showCalendarFor, setShowCalendarFor] = useState<"startDate" | "endDate" | null>(null);
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
      itineraryActivityData.type = Number(itineraryActivityData.type ) || ActivityType.none;
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
        type: itineraryActivity?.type || ActivityType.none,
        sortOrder: itineraryActivity?.sortOrder || "",
        startDate: itineraryActivity?.startDate ? new Date(itineraryActivity.startDate).toISOString().split('T')[0] : null,
        startTime: itineraryActivity?.startDate && String(itineraryActivity.startDate).includes('T') ? new Date(itineraryActivity.startDate).toISOString().substring(11, 16) : "08:00",
        endDate: itineraryActivity?.endDate ? new Date(itineraryActivity.endDate).toISOString().split('T')[0] : null,
        endTime: itineraryActivity?.endDate && String(itineraryActivity.endDate).includes('T') ? new Date(itineraryActivity.endDate).toISOString().substring(11, 16) : "09:00",
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
          <View className="flex-1 bg-white">
            <StatusBar barStyle={"dark-content"} />
            {/* <Text>{errors.title}</Text>
            <Text>{errors.description}</Text>
            <Text>{errors.primaryType}</Text>
            <Text>{errors.sectionId}</Text> */}

            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
            >
              <View className="items-end p-2.5">
               
              </View>
              <View className="px-2.5 pb-2.5">            
                <Text>{values.type}</Text>    
                <TextInput
                  className="text-2xl font-medium pr-12"
                  placeholder="Add title"
                  onChangeText={handleChange("title")}
                  onBlur={handleBlur("title")}
                  value={values.title}
                />
                {errors.title && touched.title && (
                  <Text className="text-red-500 text-sm">{errors.title}</Text>
                )}
                <TouchableOpacity
                  className="hidden flex-row items-center gap-1 border border-primary bg-primary p-1 rounded-md"
                  onPress={() => setShowDestinationModal(true)}
                >
                  <Icon name="explore" size={20} color={"#FFF"} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-white">
                      Explore
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              <Divider/>
              <View className="py-5 px-2.5 flex-1 flex-row items-center gap-2.5">
                <View>
                  <Icon name="notes" size={28} color={"#B3B3B3"} />
                </View>
                <View className="flex-1">
                  <TextInput
                    className={`${values.description ? "pt-0" : ""} text-base`}
                    placeholder="Add Details"
                    multiline
                    numberOfLines={4}
                    onChangeText={handleChange("description")}
                    onBlur={handleBlur("description")}
                    value={values.description}
                  />
                </View>
              </View>
              <Divider/>
              <View className="px-2.5 flex-1 flex-row items-start gap-2.5 py-7">
                  <View>
                    <Icon name="public" size={28} color={"#B3B3B3"} />
                  </View>
                  <View className="flex-1">
                     <TouchableOpacity
                        className="flex-1 flex-row items-center gap-2.5"
                        onPress={() => setShowDestinationModal(true)}
                      >
                    <Text className="text-base">
                      {selectedPlace ? selectedPlace.name : "Add location"}
                    </Text>
                  </TouchableOpacity>
                  </View>
                
              </View>
              <Divider/>
              <View className="py-5 px-2.5 flex-1 flex-row items-start gap-2.5">
                <View>
                  <Icon name="date-range" size={28} color={"#B3B3B3"} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text>Date</Text>
                    <View className="flex-row items-center gap-2">
                       <Text>All Day</Text>
                       <Switch value={isAllDay} onValueChange={setIsAllDay} color="#0C4C8A" />
                    </View>
                  </View>
                  
                  <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => setShowCalendarFor("startDate")}>
                      <Text className="text-base text-primary py-2 font-medium">
                        {values.startDate ? String(values.startDate) : "YYYY-MM-DD"}
                      </Text>
                    </TouchableOpacity>
                    {!isAllDay && (
                      <TouchableOpacity onPress={() => setShowTimePickerFor("startTime")}>
                        <Text className="text-base text-primary py-2 font-medium">
                          {String((values as any).startTime)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text className="mt-4">End Date</Text>
                  <View className="flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => setShowCalendarFor("endDate")}>
                      <Text className="text-base text-primary py-2 font-medium">
                        {values.endDate ? String(values.endDate) : "YYYY-MM-DD"}
                      </Text>
                    </TouchableOpacity>
                    {!isAllDay && (
                      <TouchableOpacity onPress={() => setShowTimePickerFor("endTime")}>
                        <Text className="text-base text-primary py-2 font-medium">
                          {String((values as any).endTime)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text className="mt-2 text-xs text-gray-500">Timezone processing...</Text>
                </View>
              </View>
              <Divider/>
              <View className="py-5 px-2.5 flex-1 flex-row items-center gap-2.5">
                <View>
                  <Icon name="style" size={28} color={"#B3B3B3"} />
                </View>

                <View className="flex-1">
                  <TouchableOpacity onPress={() => setShowPrimaryTypeModal(true)}>
                    <Text className="text-base py-2 capitalize font-medium">
                      {values.type != null && values.type !== ActivityType.none
                        ? String(ActivityType[values.type as number]).replace(/([A-Z])/g, ' $1').trim()
                        : "Select Activity Type"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

 {itineraryActivity?.id && itineraryActivity?.id > 0 && (
                 <>
                 <Divider/>
              <View className="py-5 px-2.5 flex-1 flex-row items-center gap-2.5">
                <View>
                <Icon name="delete-outline" size={32} color={"#c93030"} />
                </View>

                <View className="flex-1">
                  <TouchableOpacity 
                   onPress={() =>
                      handleDeleteActivity(itineraryActivity?.id || 0)
                    }
                    disabled={isPending}
                      >
                    <Text className="text-base py-2 capitalize font-medium !text-danger">
                     Delete Activity
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
                 </>
                        


                )}



            
            </ScrollView>

            <View className="absolute left-0 right-0 bottom-0 p-2.5 ">
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

            <Modal
              visible={showCalendarFor !== null}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowCalendarFor(null)}
            >
              <View className="flex-1 justify-center bg-black/50 p-5">
                <View className="bg-white rounded-[30px] overflow-hidden shadow-lg p-2">
                  <View className="flex-row justify-between items-center px-4 py-2 bg-white">
                    <Text className="text-lg font-bold text-primary">
                      Select {showCalendarFor === "startDate" ? "Start Date" : "End Date"}
                    </Text>
                    <TouchableOpacity onPress={() => setShowCalendarFor(null)}>
                      <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  
                  <Calendar
                    onDayPress={(day: any) => {
                      if (showCalendarFor === "startDate") {
                        setValues({ ...values, startDate: day.dateString });
                      } else {
                        setValues({ ...values, endDate: day.dateString });
                      }
                      setShowCalendarFor(null);
                    }}
                    markedDates={{
                      [String(showCalendarFor === "startDate" ? values.startDate : values.endDate)]: { selected: true, selectedColor: '#0C4C8A' }
                    }}
                    theme={{
                      todayTextColor: '#0C4C8A',
                      arrowColor: '#0C4C8A',
                    }}
                  />
                </View>
              </View>
            </Modal>

            <Modal
              visible={showPrimaryTypeModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowPrimaryTypeModal(false)}
            >
              <View className="flex-1 justify-center items-center bg-black/50 p-5">
                <View className="bg-white rounded-[30px] shadow-lg w-full max-h-[80%] overflow-hidden">
                  <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                    <Text className="text-lg font-bold text-primary">
                      Select Activity Type
                    </Text>
                    <TouchableOpacity onPress={() => setShowPrimaryTypeModal(false)}>
                      <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    {Object.keys(ActivityType)
                      .filter((key) => isNaN(Number(key)))
                      .map((key) => (
                        <TouchableOpacity
                          key={key}
                          className="p-4 border-b border-gray-100 flex-row items-center"
                          onPress={() => {
                            setValues({
                              ...values,
                              type: ActivityType[key as keyof typeof ActivityType],
                            });
                            setShowPrimaryTypeModal(false);
                          }}
                        >
                          <Text className="text-base text-gray-800 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            <Modal
              visible={showTimePickerFor !== null}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowTimePickerFor(null)}
            >
              <View className="flex-1 justify-center items-center bg-black/50 p-5">
                <View className="bg-white rounded-[30px] shadow-lg w-full max-h-[60%] overflow-hidden">
                  <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                    <Text className="text-lg font-bold text-primary">
                      Select Time
                    </Text>
                    <TouchableOpacity onPress={() => setShowTimePickerFor(null)}>
                      <Icon name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    {Array.from({ length: 48 }, (_, i) => {
                      const h = Math.floor(i / 2).toString().padStart(2, '0');
                      const m = i % 2 === 0 ? '00' : '30';
                      return `${h}:${m}`;
                    }).map((time) => (
                      <TouchableOpacity
                        key={time}
                        className="p-4 border-b border-gray-100 items-center justify-center"
                        onPress={() => {
                          if (showTimePickerFor === "startTime") {
                            setValues({ ...values, startTime: time } as any);
                          } else {
                            setValues({ ...values, endTime: time } as any);
                          }
                          setShowTimePickerFor(null);
                        }}
                      >
                        <Text className="text-base text-gray-800">{time}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>
        );
      }}
    </Formik>
  );
};

export default EditActivity;


