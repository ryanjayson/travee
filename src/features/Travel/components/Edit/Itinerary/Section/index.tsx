import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  Alert,
} from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import DestinationSelector from "../../../DestinationSelector";
import { useFormik } from "formik";
import * as Yup from "yup";
import TouchButton from "../../../../../../components/atoms/TouchButton";
import { ItinerarySection } from "../../../../types/TravelDto";
import { useUpdateSectionMutation } from "../../../../hooks/useSection";
import { useTravelPlan } from "../../../../hooks/useTravel";
import { useLexicographicSort } from "../../../../../../hooks/useLexicographicSort";
import { CalendarList } from "react-native-calendars";

interface Place {
  id: string;
  name: string;
  address: string;
  type: string;
}

interface EditSectionProps {
  itinerarySection: ItinerarySection | null;
  travelId?: string;
  onClose: () => void;
  onScroll?: (event: any) => void;
  onSaveSuccess?: (section: ItinerarySection) => void;
}

const TravelSchema = Yup.object().shape({
  title: Yup.string().required("Title is required").max(40, "Title cannot exceed 40 characters"),
});

const EditSection = ({ itinerarySection, travelId: propTravelId, onClose, onScroll, onSaveSuccess }: EditSectionProps) => {
  const paperTheme = useTheme();
  const [showDestinationModal, setShowDestinationModal] =
    useState<boolean>(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const { mutate: updateMutation, isPending: isUpdating } = useUpdateSectionMutation();

  const travelId = itinerarySection?.travelId || propTravelId || "";
  const { data: travelPlan } = useTravelPlan(travelId);
  const { generateSortOrder } = useLexicographicSort();

  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: itinerarySection?.id,
      travelId: travelId,
      title: itinerarySection?.title || "",
      description: itinerarySection?.description || "",
      sortOrder: itinerarySection?.sortOrder || "",
      notes: itinerarySection?.notes || "",
      startDate: itinerarySection?.startDate ? new Date(itinerarySection.startDate) : null as Date | null,
    },
    validationSchema: TravelSchema,
    onSubmit: async (values) => {
      const isValidId = !!values?.travelId;
      if (isValidId) {
        let finalSortOrder = values.sortOrder;

        const oldStartDate = itinerarySection?.startDate ? new Date(itinerarySection.startDate).getTime() : null;
        const newStartDate = values.startDate ? new Date(values.startDate).getTime() : null;
        const dateChanged = oldStartDate !== newStartDate;

        if (!itinerarySection?.id || dateChanged) {
          const existingSections = [...(travelPlan?.itinerarySection || [])].filter(s => s.id !== itinerarySection?.id);

          if (values.startDate) {
            const sortedSections = [...existingSections].sort((a, b) => {
              if (a.isDefaultSection && !b.isDefaultSection) return -1;
              if (!a.isDefaultSection && b.isDefaultSection) return 1;
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

            const targetTime = new Date(values.startDate).getTime();
            const nextNeighborIndex = sortedSections.findIndex(s => {
              if (s.isDefaultSection) return false;
              if (!s.startDate) return true;
              return new Date(s.startDate).getTime() > targetTime;
            });

            let prevNeighbor = null;
            let nextNeighbor = null;

            if (nextNeighborIndex !== -1) {
              nextNeighbor = sortedSections[nextNeighborIndex];
              prevNeighbor = nextNeighborIndex > 0 ? sortedSections[nextNeighborIndex - 1] : null;
            } else {
              prevNeighbor = sortedSections.length > 0 ? sortedSections[sortedSections.length - 1] : null;
            }

            finalSortOrder = generateSortOrder(prevNeighbor?.sortOrder, nextNeighbor?.sortOrder);
          } else {
            // No date set: append to the end of existing sections
            const sortedSections = [...existingSections].sort((a, b) => {
              if (a.isDefaultSection && !b.isDefaultSection) return -1;
              if (!a.isDefaultSection && b.isDefaultSection) return 1;
              return (a.sortOrder || "").localeCompare(b.sortOrder || "");
            });
            const lastSection = sortedSections.length > 0 ? sortedSections[sortedSections.length - 1] : null;
            finalSortOrder = generateSortOrder(lastSection?.sortOrder, null);
          }
        }

        const sectionData: ItinerarySection = {
          ...values,
          sortOrder: finalSortOrder,
          startDate: values.startDate || undefined,
          isOffline: isNaN(Number(values.travelId)),
        };
        updateMutation(sectionData, {
          onSuccess: (result) => {
            const sectionId = (result as any)?.id || (result as any)?.data?.id;
            if (sectionId && onSaveSuccess) {
              onSaveSuccess({ ...sectionData, id: sectionId });
            }
          }
        });
        onClose();
      }
    },
  });

  const formattedStartDate = formik.values.startDate ? formik.values.startDate.toLocaleDateString() : "";

  const initialCalendarDate = React.useMemo(() => {
    if (formik.values.startDate) {
      const d = formik.values.startDate;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }
    if (travelPlan?.travel?.startOrDepartureDate) {
      const d = new Date(travelPlan.travel.startOrDepartureDate);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [formik.values.startDate, travelPlan?.travel?.startOrDepartureDate]);

  return (
    <View className="flex-1 justify-end bg-gray-100 rounded-t-[20px]">
      <StatusBar barStyle={"dark-content"} />

      <ScrollView
        className="flex-1 p-[15px] bg-gray-100 pb-[100px]"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Title</Text>
          <View className="relative">
            <TextInput
              mode="outlined"
              className="h-7xl!"
              placeholder="e.g Day 1"
              value={formik.values.title}
              onChangeText={formik.handleChange("title")}
              onBlur={formik.handleBlur("title")}
              error={formik.touched.title && Boolean(formik.errors.title)}
              disabled={isUpdating}
              outlineColor="#E0E0E0"
              activeOutlineColor="#263F69"
              theme={{ colors: { onSurfaceVariant: '#888' } }}
              outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
              style={{ marginTop: 6 }}
              contentStyle={{ backgroundColor: "transparent", paddingRight: 60 }}
              maxLength={40}
            />
            <Text
              className="absolute right-4 bottom-3 text-xs"
              style={{ color: '#98A2B3' }}
            >
              {(formik.values.title || "").length}/40
            </Text>
          </View>
          {formik.touched.title && formik.errors.title && (
            <Text className="text-red-500 text-xs mt-1 ml-1">{formik.errors.title as string}</Text>
          )}
        </View>

        <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Description</Text>
          <TextInput
            mode="outlined"
            placeholder="Add a short description"
            multiline
            numberOfLines={4}
            value={formik.values.description}
            onChangeText={formik.handleChange("description")}
            onBlur={formik.handleBlur("description")}
            error={formik.touched.description && Boolean(formik.errors.description)}
            disabled={isUpdating}
            outlineColor="#E0E0E0"
            activeOutlineColor="#263F69"
            theme={{
              colors: {
                onSurfaceVariant: '#98A2B3',
              },
            }}
            outlineStyle={{
              borderWidth: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
            }}
            style={{
              marginTop: 6,
              height: 120,
              fontSize: 14,
            }}
            textAlignVertical="top"
            contentStyle={{
              backgroundColor: "transparent",
            }}
          />
        </View>

        <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Date</Text>
          <View className="relative mt-sm">
            <TextInput
              mode="outlined"
              placeholder="Select Date"
              value={formattedStartDate}
              editable={false}
              left={<TextInput.Icon icon="calendar" className="opacity-50" />}
              right={formik.values.startDate ? <TextInput.Icon icon="close" onPress={() => formik.setFieldValue("startDate", null)} /> : null}
              outlineColor="#E0E0E0"
              activeOutlineColor="#263F69"
              theme={{ colors: { onSurfaceVariant: '#888' } }}
              outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
              style={{ height: 64 }}
              contentStyle={{ backgroundColor: "transparent" }}
            />
            <TouchableOpacity
              style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 50, zIndex: 20 }}
              onPress={() => setShowStartDatePicker(true)}
              activeOpacity={0.6}
            />
          </View>
          <Modal
            visible={showStartDatePicker}
            transparent={false}
            animationType="slide"
            onRequestClose={() => setShowStartDatePicker(false)}
          >
            <View className="flex-1 bg-white pt-12">
              <View className="flex-row justify-between items-center p-5 border-b border-gray-200 bg-white">
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close date selector"
                >
                  <Icon name="close" size={28} color={paperTheme.colors.onSurface} />
                </TouchableOpacity>
                <Text className="text-xl font-bold">Select Date</Text>
                <View className="w-10" />
              </View>

              <View className="flex-1">
                <CalendarList
                  current={initialCalendarDate}
                  pastScrollRange={12}
                  futureScrollRange={24}
                  scrollEnabled={true}
                  horizontal={false}
                  showsVerticalScrollIndicator={true}
                  hideArrows={true}
                  onDayPress={(day: any) => {
                    const parts = day.dateString.split('-');
                    const localDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    formik.setFieldValue("startDate", localDate);
                    setShowStartDatePicker(false);
                  }}
                  markedDates={{
                    [initialCalendarDate]: { selected: true, selectedColor: '#263F69', selectedTextColor: '#ffffff' }
                  }}
                  theme={{
                    todayTextColor: "#263F69",
                    todayBackgroundColor: "#E3F2FD",
                    selectedDayBackgroundColor: "#263F69",
                    selectedDayTextColor: "#ffffff",
                    textDayFontWeight: "600",
                    textMonthFontWeight: "800",
                    textMonthFontSize: 18,
                  }}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={5}
                  windowSize={5}
                  initialNumToRender={4}
                />
              </View>
            </View>
          </Modal>
        </View>

        {/* <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Location</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDestinationModal(true)}
                disabled={isUpdating}
              >
                <View pointerEvents="none">
                  <TextInput
                    mode="outlined"
                    className="h-7xl!"
                    placeholder="Search a place..."
                    value={selectedPlace?.name || selectedPlace?.address || ""}
                    editable={false}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#263F69"
                    left={<TextInput.Icon icon="map-marker" className="opacity-50 mt-2" />}
                    theme={{ colors: { onSurfaceVariant: '#888' } }}
                    outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                    style={{ marginTop: 6 }}
                    contentStyle={{ backgroundColor: "transparent" }}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <Modal
              visible={showDestinationModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowDestinationModal(false)}
            >
              <View className="flex-1 bg-white">
                <DestinationSelector
                  onClose={() => setShowDestinationModal(false)}
                  onSelect={(place) => {
                    setSelectedPlace(place);
                    setShowDestinationModal(false);
                  }}
                />
              </View>
            </Modal> */}



        <View className="mb-5"></View>
      </ScrollView>

      <View className="mb-8 mx-4 bg-transparent">
        <TouchButton
          buttonText={itinerarySection?.id ? "Update Section" : "Create Section"}
          onPress={() => formik.handleSubmit()}
          disabled={!formik.values.title.trim() || isUpdating}
          className="h-7xl p-6"
        />
      </View>

    </View>
  );
};

export default EditSection;

