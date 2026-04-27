import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { TextInput } from "react-native-paper";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Formik } from "formik";
import * as Yup from "yup";
import TouchButton from "../../../../../../components/atoms/TouchButton";
import { ItineraryActivity } from "../../../../types/TravelDto";
import { useUpdateActivityMutation } from "../../../../hooks/useActivity";
import { useTravelContext } from "../../../../../../context/TravelContext";
import { useDeleteActivityMutation } from "../../../../hooks/useActivity";
import { ActivityType } from "../../../../../../types/enums";
import { Divider, Text, Switch } from 'react-native-paper';
import ActivityIcon from "../../../../../../components/ActivityIcon";
import MapboxDestinationSelector, { MapboxPlace } from "../../../MapboxDestinationSelector";
import { MAPBOX_ACCESS_TOKEN } from "@env";
import { Image } from "react-native";
import { DestinationDto } from "../../../../types/TravelDto";
import { useSaveChecklistItemMutation, useChecklistItems, useToggleChecklistItemMutation, useDeleteChecklistItemMutation } from "../../../../hooks/useChecklist";
import { useAuth } from "../../../../../Auth/hooks/AuthContext";

interface Place {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface EditActivityProps {
  itinerarySectionId?: string;
  itineraryActivity: ItineraryActivity | null;
  onClose: () => void;
}

const TravelSchema = Yup.object().shape({
  title: Yup.string().required("Title is required").min(2),
});

export interface ActivityFormValues {
  travelId?: string;
  sectionId?: string;
  id?: string;
  title: string;
  description: string;
  type?: ActivityType | number;
  sortOrder?: string;
  startDate: string | null;
  startTime: string;
  endDate: string | null;
  endTime: string;
  destination: string;
  destinationData?: DestinationDto;
}

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
  const { userToken } = useAuth();
  const { mutate: deleteActivityMutation, isPending } =
    useDeleteActivityMutation();

  // Checklist state
  const [newCheckTitle, setNewCheckTitle] = useState("");
  const [newCheckDescription, setNewCheckDescription] = useState("");
  const [showCheckDescription, setShowCheckDescription] = useState(false);
  const saveChecklistItem = useSaveChecklistItemMutation();
  const deleteChecklistItem = useDeleteChecklistItemMutation();
  const toggleChecklistItem = useToggleChecklistItemMutation();
  const travelId = selectedTravelPlan?.id || "";
  const activityId = itineraryActivity?.id;
  const { data: checklistItems = [] } = useChecklistItems(travelId);
  const activityChecklistItems = checklistItems.filter(
    (i) => activityId && i.activityId === activityId
  );

  const handleAddChecklistItem = async () => {
    if (!newCheckTitle.trim() || !activityId || !travelId) return;
    await saveChecklistItem.mutateAsync({
      travelId,
      activityId,
      title: newCheckTitle.trim(),
      description: newCheckDescription.trim() || undefined,
      sortOrder: String(Date.now()),
      isDone: false,
      userId: userToken || "user",
      isOffline: true,
    });
    setNewCheckTitle("");
    setNewCheckDescription("");
    setShowCheckDescription(false);
  };

  const handleToggleChecklistItem = async (item: any) => {
    await toggleChecklistItem.mutateAsync({
      id: item.id,
      isDone: !item.isDone,
      userId: userToken || "user",
      travelId,
    });
  };

  const handleDeleteChecklistItem = (item: any) => {
    Alert.alert("Remove Item", `Remove "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => deleteChecklistItem.mutate({ id: item.id, travelId }),
      },
    ]);
  };

  const handleSaveActivity = async (
    values: ActivityFormValues,
  ) => {
    if (
      selectedTravelPlan &&
      selectedTravelPlan?.id
    ) {
debugger;
      // Build proper Date objects from strings
      let finalStartDate: Date | undefined = undefined;
      if (values.startDate) {
        finalStartDate = new Date(`${values.startDate}T${values.startTime}:00`);
      }

      let finalEndDate: Date | undefined = undefined;
      if (values.endDate) {
        finalEndDate = new Date(`${values.endDate}T${values.endTime}:00`);
      }

      const payload: ItineraryActivity = {
        id: values.id,
        sectionId: values.sectionId || "",
        title: values.title,
        description: values.description,
        sortOrder: values.sortOrder || "",
        type: values.type as ActivityType,
        startDate: finalStartDate,
        endDate: finalEndDate,
        destination: values.destination,
        destinationData: values.destinationData,
        isOffline: true,
        travelId: values.travelId,
      };

      await updateMutation.mutateAsync(payload);
      onClose();
    }
  };

  const handleDeleteActivity = (activityId: string) => {
    if (itinerarySectionId && activityId) {
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
    <Formik<ActivityFormValues>
      initialValues={{
        travelId: selectedTravelPlan?.id,
        sectionId: itinerarySectionId,
        id: itineraryActivity?.id,
        title: itineraryActivity?.title || "",
        description: itineraryActivity?.description || "",
        type: itineraryActivity?.type ?? ActivityType.none,
        sortOrder: itineraryActivity?.sortOrder || "",
        startDate: itineraryActivity?.startDate ? new Date(itineraryActivity.startDate).toISOString().split('T')[0] : null,
        startTime: itineraryActivity?.startDate && String(itineraryActivity.startDate).includes('T') ? new Date(itineraryActivity.startDate).toISOString().substring(11, 16) : "08:00",
        endDate: itineraryActivity?.endDate ? new Date(itineraryActivity.endDate).toISOString().split('T')[0] : null,
        endTime: itineraryActivity?.endDate && String(itineraryActivity.endDate).includes('T') ? new Date(itineraryActivity.endDate).toISOString().substring(11, 16) : "09:00",
        destination: itineraryActivity?.destination || (itineraryActivity?.id ? "" : itineraryActivity?.destination || ""),
        destinationData: itineraryActivity?.destinationData || (itineraryActivity?.id ? undefined : itineraryActivity?.destinationData),
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

        return (
          <View className="flex-1 bg-white rounded-t-[20px] overflow-hidden">
            <StatusBar barStyle={"dark-content"} />

            <ScrollView
              className="flex-1 p-[15px] bg-gray-50"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              keyboardShouldPersistTaps="handled"
            >
                <View className="mb-5">
                  <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Title</Text>
                  <TextInput
                    mode="outlined"
                    className="!h-[64px]"
                    placeholder="Activity title"
                    value={values.title}
                    onChangeText={handleChange("title")}
                    onBlur={handleBlur("title")}
                    error={touched.title && Boolean(errors.title)}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#0C4C8A"
                    theme={{ colors: { onSurfaceVariant: '#888' } }}
                    outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                    style={{ marginTop: 6 }}
                    contentStyle={{ backgroundColor: "transparent" }}
                  />
                  {touched.title && errors.title && (
                    <Text className="text-red-500 text-xs mt-1 ml-1">{errors.title}</Text>
                  )}
                </View>
                <View className="mb-5">
                  <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Description</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Activity details"
                    multiline
                    numberOfLines={4}
                    value={values.description}
                    onChangeText={handleChange("description")}
                    onBlur={handleBlur("description")}
                    error={touched.description && Boolean(errors.description)}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#0C4C8A"
                    theme={{ colors: { onSurfaceVariant: '#888' } }}
                    outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                    style={{ marginTop: 6, height: 120 }}
                    textAlignVertical="top"
                    contentStyle={{ backgroundColor: "transparent" }}
                  />
                </View>
                <View className="mb-5">
                  <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Location</Text>
                  {values.destinationData ? (() => {
                    const { longitude, latitude } = values.destinationData.coordinates;
                    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+0C4C8A(${longitude},${latitude})/${longitude},${latitude},12,0/600x300?access_token=${MAPBOX_ACCESS_TOKEN}`;
                    return (
                      <TouchableOpacity 
                        activeOpacity={0.8} 
                        onPress={() => setShowDestinationModal(true)}
                        className="mt-1"
                      >
                        <View className="rounded-2xl overflow-hidden border border-gray-100">
                          <Image source={{ uri: mapUrl }} style={{ width: '100%', height: 120, borderRadius: 16 }} resizeMode="cover" />
                          <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded-full flex-row items-center">
                            <Icon name="location-on" size={12} color="#FFF" />
                            <Text className="text-white text-[10px] ml-1">{values.destination}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })() : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowDestinationModal(true)}
                  >
                    <View pointerEvents="none">
                      <TextInput
                        mode="outlined"
                        className="!h-[64px]"
                        placeholder="Search city or country..."
                        value=""
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
                  )}
                </View>

                <View className="mb-5">
                  <View className="flex-row items-center justify-between">
                     <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Date & Time</Text>
                     <View className="flex-row items-center gap-2">
                        <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">All Day</Text>
                        <Switch value={isAllDay} onValueChange={setIsAllDay} color="#0C4C8A" />
                     </View>
                  </View>
                  
                  <View className="flex-row items-center gap-4 mt-2">
                    <TouchableOpacity 
                      onPress={() => setShowCalendarFor("startDate")}
                      className="border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-3 flex-1 items-center"
                    >
                      <Text className="text-sm font-medium text-gray-800">
                        {values.startDate ? String(values.startDate) : "Start Date"}
                      </Text>
                    </TouchableOpacity>
                    {!isAllDay && (
                      <TouchableOpacity 
                        onPress={() => setShowTimePickerFor("startTime")}
                        className="border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-3 items-center"
                      >
                        <Text className="text-sm font-medium text-gray-800">
                          {String((values as any).startTime)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="flex-row items-center gap-4 mt-3">
                    <TouchableOpacity 
                      onPress={() => setShowCalendarFor("endDate")}
                      className="border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-3 flex-1 items-center"
                    >
                      <Text className="text-sm font-medium text-gray-800">
                        {values.endDate ? String(values.endDate) : "End Date"}
                      </Text>
                    </TouchableOpacity>
                    {!isAllDay && (
                      <TouchableOpacity 
                        onPress={() => setShowTimePickerFor("endTime")}
                        className="border border-[#E0E0E0] rounded-[16px] bg-white px-4 py-3 items-center"
                      >
                        <Text className="text-sm font-medium text-gray-800">
                          {String((values as any).endTime)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View className="mb-5">
                  <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Activity Type</Text>
                  <TouchableOpacity 
                    onPress={() => setShowPrimaryTypeModal(true)}
                    className="border rounded-2xl h-[64px] border-[#E0E0E0] bg-white px-4 py-4 mt-1 flex-row items-center gap-3"
                  >
                    {values.type != null && values.type !== ActivityType.none ? (
                      <ActivityIcon type={values.type as number} size={32} color="#183B7A" />
                    ) : (
                      <Icon name="style" size={32} color={"#B3B3B3"} />
                    )}
                    <Text className="text-base text-gray-800 capitalize font-medium">
                      {values.type != null && values.type !== ActivityType.none
                        ? String(ActivityType[values.type as number]).replace(/([A-Z])/g, ' $1').trim()
                        : "Select Type..."}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ─── Checklist Items for this Activity ──────────────────── */}
                <View className="mb-5">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Icon name="playlist-add-check" size={18} color="#0C4C8A" />
                    <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase flex-1">
                      Checklist Items
                    </Text>
                    {activityId && (
                      <Text className="text-xs text-gray-400">
                        {activityChecklistItems.filter(i => i.isDone).length}/{activityChecklistItems.length} done
                      </Text>
                    )}
                  </View>

                  {/* Existing items */}
                  {activityChecklistItems.length > 0 && (
                    <View className="bg-white rounded-[16px] border border-gray-100 shadow-sm mb-3 overflow-hidden">
                      {activityChecklistItems.map((item) => (
                        <View
                          key={item.id}
                          className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-50"
                        >
                          <TouchableOpacity
                            accessibilityRole="checkbox"
                            onPress={() => handleToggleChecklistItem(item)}
                            className={`w-6 h-6 rounded-full border-2 items-center justify-center flex-shrink-0 ${
                              item.isDone ? "bg-[#0C4C8A] border-[#0C4C8A]" : "border-[#0C4C8A]"
                            }`}
                          >
                            {item.isDone && <Icon name="check" size={14} color="#FFF" />}
                          </TouchableOpacity>
                          <View className="flex-1">
                            <Text className={`text-base ${item.isDone ? "line-through text-gray-400" : "text-gray-800 font-medium"}`}>
                              {item.title}
                            </Text>
                            {item.description ? (
                              <Text className="text-xs text-gray-400 mt-0.5">{item.description}</Text>
                            ) : null}
                          </View>
                          <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Remove checklist item"
                            onPress={() => handleDeleteChecklistItem(item)}
                            className="p-1 opacity-40"
                          >
                            <Icon name="delete-outline" size={18} color="#c93030" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Add new item card — only shown for existing activities */}
                  {activityId ? (
                    <View className="bg-white border border-dashed border-[#0C4C8A]/40 rounded-[16px] p-4">
                      <RNTextInput
                        className="border border-[#E0E0E0] rounded-[12px] px-4 py-3 text-base text-gray-800 bg-gray-50 mb-2"
                        placeholder="New checklist item..."
                        value={newCheckTitle}
                        onChangeText={setNewCheckTitle}
                        onSubmitEditing={handleAddChecklistItem}
                        returnKeyType="done"
                      />
                      {showCheckDescription ? (
                        <RNTextInput
                          className="border border-[#E0E0E0] rounded-[12px] px-4 py-2 text-sm text-gray-700 bg-gray-50 mb-3"
                          placeholder="Optional description..."
                          value={newCheckDescription}
                          onChangeText={setNewCheckDescription}
                          multiline
                        />
                      ) : (
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() => setShowCheckDescription(true)}
                          className="mb-3"
                        >
                          <Text className="text-xs text-[#0C4C8A] font-medium">+ Add description</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={handleAddChecklistItem}
                        disabled={!newCheckTitle.trim() || saveChecklistItem.isPending}
                        className={`flex-row items-center justify-center gap-2 py-2.5 rounded-[12px] ${
                          newCheckTitle.trim() ? "bg-[#0C4C8A]" : "bg-gray-200"
                        }`}
                      >
                        {saveChecklistItem.isPending ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Icon name="add" size={18} color={newCheckTitle.trim() ? "#FFF" : "#AAA"} />
                            <Text className={`text-sm font-semibold ${
                              newCheckTitle.trim() ? "text-white" : "text-gray-400"
                            }`}>Add Item</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="bg-gray-50 border border-dashed border-gray-200 rounded-[16px] p-4 items-center">
                      <Text className="text-xs text-gray-400 text-center">
                        Save the activity first to add checklist items.
                      </Text>
                    </View>
                  )}
                </View>

                {itineraryActivity?.id && (
                  <View className="mt-5 pt-5 border-t border-[#E0E0E0]">
                    <TouchableOpacity 
                      className="flex-row items-center gap-2.5 justify-center py-2"
                      onPress={() => handleDeleteActivity(itineraryActivity?.id || "")}
                      disabled={isPending}
                    >
                      <Icon name="delete-outline" size={24} color={"#c93030"} />
                      <Text className="text-base capitalize font-medium text-[#c93030]">
                        Delete Activity
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
            </ScrollView>

             <View className="px-5 py-4 border-t border-gray-200">
               <TouchButton
                 buttonText={itineraryActivity?.id ? "Update Activity" : "Add Activity"}
                 onPress={() => handleSubmit()}
                 disabled={isPending}
                 className="h-[64px] p-6"
               />
             </View>

            <Modal
              visible={showDestinationModal}
              animationType="slide"
              transparent
              onRequestClose={() => setShowDestinationModal(false)}
            >
              <MapboxDestinationSelector
                onClose={() => setShowDestinationModal(false)}
                onSelect={(place: MapboxPlace) => {
                  setValues({
                    ...values,
                    destination: place.fullName,
                    destinationData: {
                      id: place.id,
                      coordinates: {
                        longitude: place.coordinates.longitude,
                        latitude: place.coordinates.latitude,
                      },
                    } as DestinationDto
                  });
                  setShowDestinationModal(false);
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
                          className="p-4 border-b border-gray-100 flex-row items-center gap-3"
                          onPress={() => {
                            setValues({
                              ...values,
                              type: ActivityType[key as keyof typeof ActivityType],
                            });
                            setShowPrimaryTypeModal(false);
                          }}
                        >
                          <ActivityIcon type={ActivityType[key as keyof typeof ActivityType]} size={24} color="#183B7A" />
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


