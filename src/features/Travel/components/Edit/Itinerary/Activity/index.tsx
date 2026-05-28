import { MAPBOX_ACCESS_TOKEN } from "@env";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Formik } from "formik";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { TextInput, useTheme } from "react-native-paper";
import * as Yup from "yup";
import ActivityIcon from "../../../../../../components/ActivityIcon";
import TouchButton from "../../../../../../components/atoms/TouchButton";
import Tabs from "../../../../../../components/Tabs";
import { useTravelContext } from "../../../../../../context/TravelContext";
import { useLexicographicSort } from "../../../../../../hooks/useLexicographicSort";
import { ActivityType } from "../../../../../../types/enums";
import { useAuth } from "../../../../../Auth/hooks/AuthContext";
import { useDeleteActivityMutation, useUpdateActivityMutation } from "../../../../hooks/useActivity";
import { useChecklistItems, useDeleteChecklistItemMutation, useSaveChecklistItemMutation, useToggleChecklistItemMutation } from "../../../../hooks/useChecklist";
import { useTravelPlan } from "../../../../hooks/useTravel";
import { DestinationDto, Images, ItineraryActivity, Attachment } from "../../../../types/TravelDto";
import ActivityTypeLookupModal from "../../../Lookups/ActivityTypeLookupModal";
import MapboxDestinationSelector, { MapboxPlace } from "../../../MapboxDestinationSelector";
import { useConfirm } from "../../../../../../context/ConfirmContext";
import { useToast } from "../../../../../../context/ToastContext";

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
  images: Images[];
  attachments: Attachment[];
}

const EditActivity = ({
  itinerarySectionId,
  itineraryActivity,
  onClose,
}: EditActivityProps) => {
  const [showDestinationModal, setShowDestinationModal] =
    useState<boolean>(false);
  const [showPrimaryTypeModal, setShowPrimaryTypeModal] = useState<boolean>(false);
  const [showSectionModal, setShowSectionModal] = useState<boolean>(false);
  const [isAllDay, setIsAllDay] = useState<boolean>(true);
  const [showTimePickerFor, setShowTimePickerFor] = useState<"startTime" | "endTime" | null>(null);
  const [showCalendarFor, setShowCalendarFor] = useState<"startDate" | "endDate" | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const updateMutation = useUpdateActivityMutation();
  const { selectedTravelPlan } = useTravelContext();
  const { userToken } = useAuth();
  const { mutate: deleteActivityMutation, isPending } =
    useDeleteActivityMutation();
  const { generateSortOrder } = useLexicographicSort();
  const {
    data: travelPlan,
  } = useTravelPlan(selectedTravelPlan?.id || "");
  const currentSection = travelPlan?.itinerarySection?.find(s => s.id === itinerarySectionId);
  const { confirm } = useConfirm();

  // Checklist state
  const [newCheckTitle, setNewCheckTitle] = useState("");
  const [newCheckDescription, setNewCheckDescription] = useState("");
  const [showCheckDescription, setShowCheckDescription] = useState(false);
  const { showToast } = useToast();

  const pickDocument = async (setFn: (field: string, value: any) => void, currentAttachments: Attachment[]) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments = result.assets.map((asset) => ({
          name: asset.name,
          url: asset.uri,
          size: asset.size,
          type: asset.mimeType,
        }));
        setFn("attachments", [...currentAttachments, ...newAttachments]);
      }
    } catch (err) {
      console.error("Error picking document:", err);
      showToast({ type: "error", message: "Failed to pick documents." });
    }
  };
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

  const handleDeleteChecklistItem = async (item: any) => {
    const isConfirmed = await confirm({
      title: "Remove Item",
      message: `Remove "${item.title}"?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      type: "danger",
    });

    if (isConfirmed) {
      deleteChecklistItem.mutate({ id: item.id, travelId });
    }
  };

  const pickImage = async (setFn: (field: string, value: any) => void, currentImages: Images[]) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera roll permission is needed to upload images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newImages = result.assets.map((a) => ({ title: "", url: a.uri }));
      setFn("images", [...currentImages, ...newImages]);
    }
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

      let finalSortOrder = values.sortOrder || "";

      const oldStartDate = itineraryActivity?.startDate ? new Date(itineraryActivity.startDate).getTime() : null;
      const newStartDate = finalStartDate ? finalStartDate.getTime() : null;
      const dateChanged = oldStartDate !== newStartDate;

      // If creating a new activity, or if the user changed the date/time, generate a new sortOrder
      if (!itineraryActivity?.id || dateChanged) {
        const currentSection = travelPlan?.itinerarySection?.find(s => s.id === (values.sectionId || ""));
        // Filter out the current activity so it doesn't compare against itself when editing
        const existingActivities = [...(currentSection?.itineraryActivity || [])].filter(a => a.id !== itineraryActivity?.id);

        if (finalStartDate) {
          // Sort ALL activities: timed activities chronologically first, then untimed activities by sortOrder
          const sortedActivities = [...existingActivities].sort((a, b) => {
            if (a.startDate && b.startDate) {
              const timeA = new Date(a.startDate).getTime();
              const timeB = new Date(b.startDate).getTime();
              if (timeA === timeB) {
                return (a.sortOrder || "").localeCompare(b.sortOrder || "");
              }
              return timeA - timeB;
            }
            if (a.startDate) return -1;
            if (b.startDate) return 1;
            return (a.sortOrder || "").localeCompare(b.sortOrder || "");
          });
            
          // Find where this new activity belongs
          const nextNeighborIndex = sortedActivities.findIndex(a => {
            if (!a.startDate) return true; // untimed activities come after our timed activity
            return new Date(a.startDate).getTime() > finalStartDate!.getTime();
          });
          
          let prevNeighbor = null;
          let nextNeighbor = null;
          
          if (nextNeighborIndex !== -1) {
            nextNeighbor = sortedActivities[nextNeighborIndex];
            prevNeighbor = nextNeighborIndex > 0 ? sortedActivities[nextNeighborIndex - 1] : null;
          } else {
            prevNeighbor = sortedActivities.length > 0 ? sortedActivities[sortedActivities.length - 1] : null;
          }
          
          finalSortOrder = generateSortOrder(prevNeighbor?.sortOrder, nextNeighbor?.sortOrder);
        } else {
          // No start date: append to the very end of the section
          const sortedActivities = [...existingActivities].sort((a, b) => (a.sortOrder || "").localeCompare(b.sortOrder || ""));
          const lastActivity = sortedActivities.length > 0 ? sortedActivities[sortedActivities.length - 1] : null;
          
          finalSortOrder = generateSortOrder(lastActivity?.sortOrder, null);
        }
      }

      const payload: ItineraryActivity = {
        id: values.id,
        sectionId: values.sectionId || "",
        title: values.title,
        description: values.description,
        sortOrder: finalSortOrder,
        type: values.type as ActivityType,
        startDate: finalStartDate,
        endDate: finalEndDate,
        destination: values.destination,
        destinationData: values.destinationData,
        images: values.images,
        isOffline: true,
        travelId: values.travelId,
        attachments: values.attachments,
      };

      await updateMutation.mutateAsync(payload);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (itinerarySectionId && activityId) {
      const isConfirmed = await confirm({
        title: "Delete Activity",
        message: "Are you sure you want to delete this activity? All associated expenses, notes, and checklist items will also be permanently deleted. This action is irreversible.",
        confirmText: "Delete",
        cancelText: "Cancel",
        type: "danger",
      });

      if (isConfirmed) {
        deleteActivityMutation({
          sectionId: itinerarySectionId,
          activityId: activityId,
        });
        onClose();
      }
    }
  };

  return (
    <Formik<ActivityFormValues>
      enableReinitialize={true}
      initialValues={{
        travelId: selectedTravelPlan?.id,
        sectionId: itinerarySectionId || (travelPlan?.itinerarySection?.[0]?.id || ""),
        id: itineraryActivity?.id,
        title: itineraryActivity?.title || "",
        description: itineraryActivity?.description || "",
        type: itineraryActivity?.type ?? ActivityType.none,
        sortOrder: itineraryActivity?.sortOrder || "",
        startDate: itineraryActivity?.startDate ? new Date(itineraryActivity.startDate).toISOString().split('T')[0] : (currentSection?.startDate ? new Date(currentSection.startDate).toISOString().split('T')[0] : null),
        startTime: itineraryActivity?.startDate && String(itineraryActivity.startDate).includes('T') ? new Date(itineraryActivity.startDate).toISOString().substring(11, 16) : (currentSection?.startDate ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` : ""),
        endDate: itineraryActivity?.endDate ? new Date(itineraryActivity.endDate).toISOString().split('T')[0] : null,
        endTime: itineraryActivity?.endDate && String(itineraryActivity.endDate).includes('T') ? new Date(itineraryActivity.endDate).toISOString().substring(11, 16) : "09:00",
        destination: itineraryActivity?.destination || (itineraryActivity?.id ? "" : itineraryActivity?.destination || ""),
        destinationData: itineraryActivity?.destinationData || (itineraryActivity?.id ? undefined : itineraryActivity?.destinationData),
        images: itineraryActivity?.images || [],
        attachments: itineraryActivity?.attachments || [],
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
        setFieldValue,
      }) => {
        const { colors } = useTheme();
        const sections = travelPlan?.itinerarySection || [];
        const hasSections = sections.length > 0;
        const selectedSection = sections.find((s) => s.id === values.sectionId);
        const selectedSectionName = selectedSection?.isDefaultSection ? "(Ungrouped)" :  selectedSection?.title || "";

        const tabData = [
          {
            id: "details",
            title: "Details",
            content: (
              <View className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                {/* Title */}
                <View className="mb-5">
                  <Text className="text-xs font-semibold tracking-wider uppercase">Title</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Activity title"
                    value={values.title}
                    onChangeText={handleChange("title")}
                    onBlur={handleBlur("title")}
                    error={touched.title && Boolean(errors.title)}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#263F69"
                    theme={{ colors: { onSurfaceVariant: '#888' } }}
                    outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                    style={{ marginTop: 6, height: 60 }}
                    contentStyle={{ backgroundColor: "transparent" }}
                  />
                  {touched.title && errors.title && (
                    <Text className="text-red-500 text-xs mt-1 ml-1">{errors.title}</Text>
                  )}
                </View>

                {/* Description */}
                <View className="mb-5">
                  <Text className="text-xs font-semibold tracking-wider uppercase">Description</Text>
                  <TextInput
                    mode="outlined"
                    placeholder="Activity details"
                    multiline
                    numberOfLines={4}
                    value={values.description}
                    onChangeText={handleChange("description")}
                    onBlur={handleBlur("description")}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#263F69"
                    theme={{ colors: { onSurfaceVariant: '#888' } }}
                    outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                    style={{ marginTop: 6, height: 120 }}
                    textAlignVertical="top"
                    contentStyle={{ backgroundColor: "transparent" }}
                  />
                </View>

                {/* Date & Time */}
                <View className="mb-5">
                  <Text className="text-xs font-semibold tracking-wider uppercase">Date & Time</Text>
                  <View className="flex-row items-center gap-4 mt-2">
                    <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center">
                      <TouchableOpacity 
                        onPress={() => setShowCalendarFor("startDate")}
                        className="flex-1 py-3 items-center justify-center h-14"
                        accessibilityRole="button"
                      >
                        <Text className="text-md font-medium text-gray-800">
                          {values.startDate ? String(values.startDate) : "Date"}
                        </Text>
                      </TouchableOpacity>
                      {values.startDate && (
                        <TouchableOpacity 
                          onPress={() => setValues({...values, startDate: null, startTime: ""} as any)}
                          className="pr-4 py-3"
                          accessibilityRole="button"
                        >
                          <Icon name="close" size={22} color="#999" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <View className="border border-[#E0E0E0] rounded-[16px] bg-white flex-1 flex-row items-center">
                      <TouchableOpacity 
                        onPress={() => setShowTimePickerFor("startTime")}
                        className="flex-1 py-3 items-center justify-center h-14"
                        accessibilityRole="button"
                      >
                        <Text className="text-md font-medium text-gray-800">
                          {values.startTime ? String(values.startTime) : "Time"}
                        </Text>
                      </TouchableOpacity>
                      {values.startTime !== "" && (
                        <TouchableOpacity 
                          onPress={() => setValues({...values, startTime: ""} as any)}
                          className="pr-4 py-3"
                          accessibilityRole="button"
                        >
                          <Icon name="close" size={22} color="#999" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                {/* Location */}
                <View className="mb-5">
                  <Text className="text-xs font-semibold tracking-wider uppercase mb-1">Location</Text>
                  {values.destinationData ? (() => {
                    const { longitude, latitude } = values.destinationData.coordinates;
                    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+263F69(${longitude},${latitude})/${longitude},${latitude},12,0/600x300?access_token=${MAPBOX_ACCESS_TOKEN}`;
                    return (
                      <TouchableOpacity 
                        activeOpacity={0.8} 
                        onPress={() => setShowDestinationModal(true)}
                        className="mt-1"
                        accessibilityRole="button"
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
                      accessibilityRole="button"
                    >
                      <View pointerEvents="none">
                        <TextInput
                          mode="outlined"
                          placeholder="Search city or country..."
                          value=""
                          editable={false}
                          outlineColor="#E0E0E0"
                          activeOutlineColor="#263F69"
                          left={<TextInput.Icon icon="map-marker" className="opacity-50 mt-2" />}
                          theme={{ colors: { onSurfaceVariant: '#888' } }}
                          outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                          style={{ marginTop: 6, height: 60 }}
                          contentStyle={{ backgroundColor: "transparent" }}
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Itinerary Section */}
                <View className="mb-5">
                  <Text className="text-xs font-semibold tracking-wider uppercase mb-1">Itinerary Section</Text>
                  <TouchableOpacity 
                    onPress={() => hasSections && setShowSectionModal(true)}
                    disabled={!hasSections}
                    className={`border rounded-2xl h-14 border-[#E0E0E0] bg-white px-4 py-4 mt-1 flex-row items-center gap-3 ${!hasSections ? 'opacity-50 bg-gray-100' : ''}`}
                    accessibilityRole="button"
                    accessibilityLabel="Select itinerary section"
                  >
                    <Icon name="folder" size={24} color={hasSections ? "#263F69" : "#B3B3B3"} />
                    <Text className={`text-base flex-1 font-medium ${selectedSectionName ? 'text-gray-800' : 'text-gray-400'}`}>
                      {selectedSectionName || (hasSections ? "Select Section..." : "No Sections Available")}
                    </Text>
                    {hasSections && <Icon name="keyboard-arrow-down" size={24} color="#666" />}
                  </TouchableOpacity>
                </View>

                {/* Activity Type */}
                <View className="mb-5">
                  <Text className="text-xs font-semibold tracking-wider uppercase mb-1">Activity Type</Text>
                  <TouchableOpacity 
                    onPress={() => setShowPrimaryTypeModal(true)}
                    className="border rounded-2xl h-14 border-[#E0E0E0] bg-white px-4 py-4 mt-1 flex-row items-center gap-3"
                    accessibilityRole="button"
                  >
                    {values.type != null && values.type !== ActivityType.none ? (
                      <ActivityIcon type={values.type as number} size={24} />
                    ) : (
                      <Icon name="style" size={24} color={"#B3B3B3"} />
                    )}
                    <Text className="text-base text-gray-800 capitalize font-medium">
                      {values.type != null && values.type !== ActivityType.none
                        ? String(ActivityType[values.type as number]).replace(/([A-Z])/g, ' $1').trim()
                        : "Select Type..."}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Delete Activity */}
                {itineraryActivity?.id && (
                  <View className="mt-2 pt-4 border-t border-gray-100">
                    <TouchableOpacity 
                      className="flex-row items-center gap-2.5 justify-center py-2"
                      onPress={() => handleDeleteActivity(itineraryActivity?.id || "")}
                      disabled={isPending}
                      accessibilityRole="button"
                    >
                      <Icon name="delete-outline" size={24} color={"#c93030"} />
                      <Text className="text-base capitalize font-medium text-[#c93030]">
                        Delete Activity
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ),
          },
          {
            id: "images",
            title: "Images",
            disabled: !itineraryActivity?.id,
            content: (
              <View className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Text className="text-xs font-semibold tracking-wider uppercase mb-3 text-gray-500">Upload Images</Text>
                <TouchableOpacity
                  onPress={() => pickImage(setFieldValue, values.images)}
                  className="border border-dashed border-[#263F69] h-[150px] rounded-[16px] bg-white px-4 py-5 flex-row items-center justify-center gap-3 mb-4"
                  accessibilityRole="button"
                  accessibilityLabel="Upload images"
                >
                  <Icon name="add-photo-alternate" size={28} color="#263F69" />
                  <Text className="text-base text-[#263F69] font-medium">Add Photos</Text>
                </TouchableOpacity>

                {values.images.length > 0 && (
                  <View className="flex-row flex-wrap gap-3">
                    {values.images.map((item, index) => (
                      <View key={`${item.url}-${index}`} className="relative">
                        <Image
                          source={{ uri: item.url }}
                          style={{ width: 100, height: 100, borderRadius: 12 }}
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
                          accessibilityRole="button"
                          accessibilityLabel="Remove image"
                          onPress={() => {
                            const updated = values.images.filter((_, i) => i !== index);
                            setFieldValue("images", updated);
                          }}
                        >
                          <Icon name="close" size={16} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ),
          },
          {
            id: "attachments",
            title: "Attachments",
            disabled: !itineraryActivity?.id,
            content: (
              <View className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <Text className="text-xs font-semibold tracking-wider uppercase mb-3 text-gray-500">File Attachments</Text>
                <TouchableOpacity
                  onPress={() => pickDocument(setFieldValue, values.attachments || [])}
                  className="border border-dashed border-[#263F69] h-[150px] rounded-[16px] bg-white px-4 py-5 flex-row items-center justify-center gap-3 mb-4"
                  accessibilityRole="button"
                  accessibilityLabel="Upload files"
                >
                  <Icon name="attach-file" size={28} color="#263F69" />
                  <Text className="text-base text-[#263F69] font-medium">Attach Files</Text>
                </TouchableOpacity>

                {(values.attachments || []).length > 0 && (
                  <View className="gap-2">
                    {(values.attachments || []).map((file, index) => {
                      const displaySize = file.size 
                        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                        : "Unknown size";
                      return (
                        <View key={`${file.url}-${index}`} className="flex-row items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <Icon name="insert-drive-file" size={24} color="#263F69" className="mr-3" />
                          <View className="flex-1">
                            <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                              {file.name}
                            </Text>
                            <Text className="text-xs text-gray-400 mt-0.5">
                              {displaySize}
                            </Text>
                          </View>
                          <TouchableOpacity
                            className="p-1"
                            accessibilityRole="button"
                            accessibilityLabel="Remove attachment"
                            onPress={() => {
                              const updated = (values.attachments || []).filter((_, i) => i !== index);
                              setFieldValue("attachments", updated);
                            }}
                          >
                            <Icon name="close" size={20} color="#888" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ),
          },
          {
            id: "checklist",
            title: "Checklist",
            disabled: !itineraryActivity?.id,
            content: (
              <View className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <View className="flex-row items-center gap-2 mb-3">
                  <Text className="text-xs font-semibold tracking-wider uppercase flex-1 text-gray-500">Checklist Items</Text>
                  {activityId && (
                    <Text className="text-xs text-gray-500 font-medium">
                      {activityChecklistItems.filter(i => i.isDone).length}/{activityChecklistItems.length} Done
                    </Text>
                  )}
                </View>

                {activityId ? (
                  <View className="bg-white border border-dashed border-[#263F69]/40 rounded-[16px] p-4 mb-4">
                    <TextInput
                      mode="outlined"
                      placeholder="e.g. Bring passport..."
                      onChangeText={setNewCheckTitle}
                      onSubmitEditing={handleAddChecklistItem}
                      value={newCheckTitle}
                      returnKeyType="done"
                      outlineColor="#E0E0E0"
                      activeOutlineColor="#263F69"
                      theme={{ colors: { onSurfaceVariant: '#888' } }}
                      outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                      style={{ height: 60 }}
                      contentStyle={{ backgroundColor: "transparent" }}
                    />

                    {showCheckDescription ? (
                      <TextInput
                        mode="outlined"
                        multiline
                        numberOfLines={2}
                        value={newCheckDescription}
                        placeholder="Optional description..."
                        onChangeText={setNewCheckDescription}
                        onSubmitEditing={handleAddChecklistItem}
                        returnKeyType="done"
                        outlineColor="#E0E0E0"
                        activeOutlineColor="#263F69"
                        theme={{ colors: { onSurfaceVariant: '#888' } }}
                        outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                        style={{ marginTop: 6, marginBottom: 12, height: 90 }}
                        textAlignVertical="top"
                        contentStyle={{ backgroundColor: "transparent" }}
                      />
                    ) : (
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => setShowCheckDescription(true)}
                        className="mb-4 mt-3"
                      >
                        <Text className="text-xs text-[#263F69] font-medium">+ Add description</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={handleAddChecklistItem}
                      disabled={!newCheckTitle.trim() || saveChecklistItem.isPending}
                      style={{ backgroundColor: colors.primary, opacity: newCheckTitle.trim() ? 1 : 0.6 }}
                      className="flex-row items-center justify-center gap-2 py-3 rounded-[16px]"
                    >
                      {saveChecklistItem.isPending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Icon name="add" size={18} color={colors.onPrimary} />
                          <Text className="text-sm font-semibold" style={{ color: colors.onPrimary }}>Add Item</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="bg-gray-50 border border-dashed border-gray-200 rounded-[16px] p-5 items-center mb-4">
                    <Text className="text-xs text-gray-400 text-center">
                      Save the activity first to enable checklist items.
                    </Text>
                  </View>
                )}

                {/* Existing items */}
                {activityChecklistItems.length > 0 && (
                  <View className="bg-white rounded-[16px] border border-gray-100 overflow-hidden">
                    {activityChecklistItems.map((item) => (
                      <View
                        key={item.id}
                        className="flex-row items-center gap-3 px-4 py-3 border-b border-gray-50"
                      >
                        <TouchableOpacity
                          accessibilityRole="checkbox"
                          onPress={() => handleToggleChecklistItem(item)}
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center flex-shrink-0 ${
                            item.isDone ? "bg-[#263F69] border-[#263F69]" : "border-[#263F69]"
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
              </View>
            ),
          },
        ];

        return (
          <View className="flex-1 bg-gray-100 overflow-hidden">
            <StatusBar barStyle={"dark-content"} />

            <View className="flex-1">
              <Tabs tabs={tabData} initialActiveTabId="details" type="default" />
            </View>

            <View className="mb-8 mx-4 bg-transparent">
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

            <DateTimePickerModal
              isVisible={showCalendarFor !== null}
              mode="date"
              onConfirm={(date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                if (showCalendarFor === "startDate") {
                  setValues({ ...values, startDate: dateString });
                } else {
                  setValues({ ...values, endDate: dateString });
                }
                setShowCalendarFor(null);
              }}
              onCancel={() => setShowCalendarFor(null)}
            />

            <Modal
              visible={showSectionModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowSectionModal(false)}
            >
              <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <View className="bg-white rounded-t-[30px] max-h-[50%] min-h-[40%] w-full overflow-hidden">
                  <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
                    <Text className="text-xl font-medium">
                      Trip Sections
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setShowSectionModal(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Close section selection modal"
                    >
                      <Icon name="close" size={24} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                  <ScrollView>
                    {sections.map((section) => (
                      <TouchableOpacity
                        key={section.id}
                        className="p-5 border-b border-gray-100 flex-row items-center gap-4"
                        onPress={() => {
                          setFieldValue("sectionId", section.id);
                          setShowSectionModal(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Select section ${section.title}`}
                      >
                        <Icon name="folder" size={24} color="#263F69" />
                        <Text className="text-base text-gray-800 flex-1">
                           {section?.isDefaultSection ? "(Ungrouped)" : section.title}
                        </Text>
                        {values.sectionId === section.id && (
                          <Icon name="check" size={24} color={colors.primary} style={{ marginLeft: "auto" }} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            <ActivityTypeLookupModal
              visible={showPrimaryTypeModal}
              onClose={() => setShowPrimaryTypeModal(false)}
              selectedType={values.type as ActivityType}
              onSelect={(type) => {
                setValues({
                  ...values,
                  type,
                });
              }}
            />

            <DateTimePickerModal
              isVisible={showTimePickerFor !== null}
              mode="time"
              onConfirm={(date) => {
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const timeString = `${hours}:${minutes}`;
                if (showTimePickerFor === "startTime") {
                  setValues({ ...values, startTime: timeString } as any);
                } else {
                  setValues({ ...values, endTime: timeString } as any);
                }
                setShowTimePickerFor(null);
              }}
              onCancel={() => setShowTimePickerFor(null)}
            />
          </View>
        );
      }}
    </Formik>
  );
};

export default EditActivity;


