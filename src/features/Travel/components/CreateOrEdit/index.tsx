import { MAPBOX_ACCESS_TOKEN } from "@env";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useFormik } from "formik";
import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { Checkbox, TextInput } from "react-native-paper";
import * as Yup from "yup";
import TouchButton from "../../../../components/atoms/TouchButton";
import CheckboxGroup from "../../../../components/GroupCheckboxes";
import { TravelStatus } from "../../../../types/enums";
import { useTravels, useUpdateTravel } from "../../hooks/useTravel";
import { DestinationDto, Travel } from "../../types/TravelDto";
import MapboxDestinationSelector, { MapboxPlace } from "../MapboxDestinationSelector";

export interface CreateOrEditProps {
  onClose: () => void;
  onStatusChange?: (status: TravelStatus) => void;
  tripData?: Travel;
  mode?: "create" | "edit";
}

const CreateOrEdit = ({ onClose, onStatusChange, tripData, mode = "create" }: CreateOrEditProps) => {
  const { mutate: createTravel, isPending: isSaving } = useUpdateTravel();
  const scrollViewRef = useRef<ScrollView>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);

  const destinationTypeOptions = [
    { id: "1", label: "Local", selected: false },
    { id: "2", label: "Domestic", selected: false },
    { id: "3", label: "International", selected: false },
  ];

  const activityOptions = [
    { id: "1", label: "Ride", selected: false },
    { id: "2", label: "Camp", selected: false },
    { id: "3", label: "Hike", selected: false },
    { id: "4", label: "Event", selected: false },
    { id: "5", label: "Concert", selected: false },
    { id: "6", label: "Marathon", selected: false },
    { id: "8", label: "Shopping", selected: false },
    { id: "9", label: "Forum", selected: false },
    { id: "10", label: "Workshop", selected: false },
    { id: "11", label: "Symposium", selected: false },
    { id: "12", label: "Colloquium", selected: false },
  ];

  const CreateTripSchema = Yup.object().shape({
    title: Yup.string().required("Trip title is required").min(2, "Trip title is too short, make it more descriptive"),
  });

  const formik = useFormik({
    initialValues: {
      title: tripData?.title || "",
      description: tripData?.description || "",
      destination: tripData?.destination || "",
      destinationData: tripData?.destinationData || null as DestinationDto | null,
      startOrDepartureDate: tripData?.startOrDepartureDate ? new Date(tripData.startOrDepartureDate) : null as Date | null,
      endOrReturnDate: tripData?.endOrReturnDate ? new Date(tripData.endOrReturnDate) : null as Date | null,
      budget: tripData?.budget || "",
      notes: tripData?.notes || "",
      createSectionsBasedOnDates: false,
    },
    enableReinitialize: true,
    validationSchema: CreateTripSchema,
    onSubmit: (values) => {
      setError(null);

      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        destination: values.destination.trim(),
        destinationData: values.destinationData || undefined,
        startOrDepartureDate: values.startOrDepartureDate || undefined,
        endOrReturnDate: values.endOrReturnDate || undefined,
        budget: values.budget,
        notes: values.notes, 
        status: (() => {
          if (!values.startOrDepartureDate || !values.endOrReturnDate) return TravelStatus.Draft;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const end = new Date(values.endOrReturnDate);
          end.setHours(0, 0, 0, 0);
          if (end < today) return TravelStatus.Completed;
          const start = new Date(values.startOrDepartureDate);
          start.setHours(0, 0, 0, 0);
          return start > today ? TravelStatus.Upcoming : TravelStatus.Ongoing;
        })(),
      };

      if (mode === "create") {
        createTravel({ data: { ...payload, isOffline: true, createSectionsBasedOnDates: values.createSectionsBasedOnDates } as any }, {
          onSuccess: () => {
            formik.resetForm();
            onClose();
          },
          onError: (err: any) => {
            console.error("Failed to save travel:", err);
            setError("Failed to save travel. Please try again.");
          },
        });
      } else {
        createTravel({ id: tripData!.id, data: { ...payload, isOffline: true } as any }, {
          onSuccess: () => {
            console.log("Trip updated successfully");
            onClose();
          },
          onError: (err: any) => {
            console.error("Failed to update trip:", err);
            setError("Failed to update trip. Please try again.");
          },
        });
      }
    },
  });

  // const handleCancel = () => {
  //   formik.resetForm();
  //   setError(null);
  //   onClose();
  // };
  const words = ['Quick weekend gateaway', 'My International trip 2026', 'A trip with my friends', 'A trip to My Province', 'My Solo Trip to Japan'];
  const [currentWord, setCurrentWord] = useState(words[0]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentWord((prev) => {
          const nextIndex = (words.indexOf(prev) + 1) % words.length;
          return words[nextIndex];
        });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  
  const formattedStartDate = formik.values.startOrDepartureDate ? formik.values.startOrDepartureDate.toLocaleDateString() : "";
  const formattedEndDate = formik.values.endOrReturnDate ? formik.values.endOrReturnDate.toLocaleDateString() : "";
  const { data: travels } = useTravels();

  const getEffectiveStatus = (): TravelStatus => {
    if (tripData && (tripData.status === TravelStatus.Completed || 
        tripData.status === TravelStatus.Archieved || 
        tripData.status === TravelStatus.Cancelled)) {
      return tripData.status;
    }
    if (!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate) return TravelStatus.Draft;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOrReturnDate = new Date(formik.values.endOrReturnDate);
    endOrReturnDate.setHours(0, 0, 0, 0);
    if (endOrReturnDate < today) return TravelStatus.Completed;

    const startOrDepartureDate = new Date(formik.values.startOrDepartureDate);
    startOrDepartureDate.setHours(0, 0, 0, 0);
    return startOrDepartureDate > today ? TravelStatus.Upcoming : TravelStatus.Ongoing;
  };

  const generateBlockedDates = () => {
    const dates: any = {};
    if (!travels) return dates;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    travels.forEach((t: any) => {
      if (tripData && t.id === tripData.id) return;
      if (t.isArchived || [TravelStatus.Cancelled, TravelStatus.Archieved, TravelStatus.Completed].includes(t.status as TravelStatus)) return;
      
      if (t.startOrDepartureDate) {
        const start = new Date(t.startOrDepartureDate);
        start.setHours(0, 0, 0, 0);
        const end = t.endOrReturnDate ? new Date(t.endOrReturnDate) : start;
        end.setHours(0, 0, 0, 0);

        if (end >= today) {
          let current = new Date(start);
          const isOngoing = start <= today && end >= today;
          const color = isOngoing ? '#E3F2FD' : '#E8F5E8';
          const textColor = isOngoing ? '#263F69' : '#2E7D32';

          while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            dates[dateStr] = {
              disabled: true,
              disableTouchEvent: true,
              selected: true,
              selectedColor: color,
              selectedTextColor: textColor,
            };
            current.setDate(current.getDate() + 1);
          }
        }
      }
    });
    return dates;
  };

  const effectiveStatus = getEffectiveStatus();
  const blockedDates = generateBlockedDates();

  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange(effectiveStatus);
    }
  }, [effectiveStatus, onStatusChange]);


  return (
    <View className="flex-1 bg-gray-100 overflow-hidden">

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 p-[15px]" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
{/* 
        {error && (
          <View className="bg-[#FFEBEE] rounded-lg p-3 mb-4 border border-[#FFCDD2]">
            <Text className="text-[#D32F2F] text-sm">{error}</Text>
          </View>
        )} */}

        <View className="mb-5">
          <Text className="text-xs font-medium tracking-wider uppercase">Title</Text>
          <TextInput
            mode="outlined"
            placeholder={`e.g. ${currentWord}`}
            value={formik.values.title}
            onChangeText={formik.handleChange("title")}
            onBlur={formik.handleBlur("title")}
            error={formik.touched.title && Boolean(formik.errors.title)}
            disabled={isSaving}
            outlineColor="#E0E0E0"
            activeOutlineColor="#263F69"
            theme={{
              colors: {
                onSurfaceVariant: '#888', 
              },
            }}
            outlineStyle={{
              borderWidth: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
            }}
            style={{
              marginTop: 6,
              height: 64,
            }}
            contentStyle={{
              backgroundColor: "transparent",
            }}
          />
          {formik.touched.title && formik.errors.title && (
            <Text className="text-error text-sm mt-1 ml-1">{formik.errors.title as string}</Text>
          )}
        </View>

         <View className="mb-5">
          <Text className="text-xs font-medium tracking-wider uppercase">Destination</Text>

          {!formik.values.destinationData?.coordinates ? (
            <>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDestinationModal(true)}
                disabled={isSaving}
              >
                <View pointerEvents="none">
                  <TextInput
                    mode="outlined"
                    className="h-[64px]"
                    placeholder="Search place to visit..."
                    value={formik.values.destination}
                    editable={false}
                    error={formik.touched.destination && Boolean(formik.errors.destination)}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#263F69"
                    left={<TextInput.Icon icon="map-marker" className="opacity-50 mt-2" />}
                    theme={{
                      colors: {
                        onSurfaceVariant: '#888', 
                      },
                    }}
                    outlineStyle={{
                      borderWidth: 1,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 16,
                    }}
                    style={{
                      marginTop: 6,
                      height: 64,
                    }}
                    contentStyle={{
                      backgroundColor: "transparent",
                    }}
                  />
                </View>
              </TouchableOpacity>
              {formik.touched.destination && formik.errors.destination && (
                <Text className="text-red-500 text-xs mt-1 ml-1">{formik.errors.destination as string}</Text>
              )}
            </>
          ) : (() => {
            const { longitude, latitude } = formik.values.destinationData.coordinates;
            const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+263F69(${longitude},${latitude})/${longitude},${latitude},10,0/600x300?access_token=${MAPBOX_ACCESS_TOKEN}`;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowDestinationModal(true)}
                disabled={isSaving}
              >
                <View className="mt-2 rounded-2xl overflow-hidden">
                  <Image
                    source={{ uri: mapUrl }}
                    style={{ width: '100%', height: 160, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-full flex-row items-center">
                    <Icon name="location-on" size={14} color="#FFF" />
                    <Text className="text-white text-xs ml-1">{formik.values.destination}</Text>
                  </View>
                  <View className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded-full">
                    <Text className="text-white text-[10px]">Tap to change</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })()}

          <Modal
            visible={showDestinationModal}
            animationType="slide"
            transparent
            onRequestClose={() => setShowDestinationModal(false)}
          >
             <Animated.View className="bg-white flex-1">
                         <MapboxDestinationSelector
              onClose={() => setShowDestinationModal(false)}
              onSelect={(place: MapboxPlace) => {
                formik.setFieldValue("destination", place.fullName);
                formik.setFieldValue("destinationData", {
                  id: place.id,
                  coordinates: {
                    longitude: place.coordinates.longitude,
                    latitude: place.coordinates.latitude,
                  },
                } as DestinationDto);
                setShowDestinationModal(false);
              }}
              initialValue={formik.values.destination}
            />
                    </Animated.View>
       
          </Modal>
        </View>

        {mode === "edit" && (
          <View className="mb-5 z-10">
            <CheckboxGroup initialOptions={destinationTypeOptions} title="Type of Destination" />
          </View>
        )}

        <View className="flex-row mb-5 gap-3">
          <View className="flex-1">
            <View className="relative mt-[6px]">
              <TextInput
                mode="outlined"
                label={"Departure"}
                placeholder="Departure Date."
                value={formattedStartDate}
                editable={false}
                left={<TextInput.Icon icon="calendar" className="opacity-50"/>}
                right={formik.values.startOrDepartureDate ? <TextInput.Icon icon="close" onPress={() => formik.setFieldValue("startOrDepartureDate", null)} /> : null}
                outlineColor="#E0E0E0"
                activeOutlineColor="#263F69"
                theme={{
                    colors: {
                      onSurfaceVariant: '#888', 
                    },
                  }}
                  outlineStyle={{
                    borderWidth: 1,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                  }}
                  style={{
                    height: 64,
                    flex: 1,
                  }}
                  contentStyle={{
                    backgroundColor: "transparent",
                  }}
              />
              <TouchableOpacity 
                style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 50, zIndex: 20 }}
                onPress={() => { setShowStartDatePicker(true); setShowEndDatePicker(false); }}
                activeOpacity={0.6}
              />
            </View>
            <Modal visible={showStartDatePicker} transparent={true} animationType="fade">
              <TouchableOpacity
                className="flex-1 bg-black/50 justify-center items-center px-5"
                activeOpacity={1}
                onPress={() => setShowStartDatePicker(false)}
              >
                <View className="w-full bg-white p-5 rounded-[40px] overflow-hidden" onStartShouldSetResponder={() => true}>
                  <Calendar
                    onDayPress={(day: any) => {
                      formik.setFieldValue("startOrDepartureDate", new Date(day.timestamp));
                      setShowStartDatePicker(false);
                    }}
                  renderArrow={(direction: string) => (
                      <Icon
                        name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
                        size={32}
                        color="#263F69"
                      />
                    )}
                    // minDate={new Date().toISOString().split('T')[0]}
                    enableSwipeMonths={true}
                    markedDates={{
                      ...blockedDates,
                      ...(formik.values.startOrDepartureDate ? {
                        [formik.values.startOrDepartureDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#263F69', selectedTextColor: '#ffffff' }
                      } : {})
                    }}
                    theme={{
                      todayTextColor: '#263F69',
                      arrowColor: '#263F69',
                    }}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>

          <View className="flex-1">
            <View className="relative mt-[6px]">
              <TextInput
                mode="outlined"
                label={"Return"}
                placeholder="Search city or country..."
                value={formattedEndDate}
                editable={false}
                left={<TextInput.Icon icon="calendar" className="opacity-50"/>}
                right={formik.values.endOrReturnDate ? <TextInput.Icon icon="close" onPress={() => formik.setFieldValue("endOrReturnDate", null)} /> : null}
                outlineColor="#E0E0E0"
                activeOutlineColor="#263F69"
                theme={{
                    colors: {
                      onSurfaceVariant: '#888', 
                    },
                  }}
                  outlineStyle={{
                    borderWidth: 1,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                  }}
                  style={{
                    height: 64,
                    flex: 1,
                    marginTop: 1,
                  }}
                  contentStyle={{
                    backgroundColor: "transparent",
                  }}
              />
              <TouchableOpacity 
                style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 50, zIndex: 20 }}
                onPress={() => { setShowEndDatePicker(true); setShowStartDatePicker(false); }}
                activeOpacity={0.6}
              />
            </View>
            <Modal visible={showEndDatePicker} transparent={true} animationType="fade">
              <TouchableOpacity
                className="flex-1 bg-black/50 justify-center items-center px-5"
                activeOpacity={1}
                onPress={() => setShowEndDatePicker(false)}
              >
                <View className="w-full bg-white verflow-hidden p-5 rounded-[40px] " onStartShouldSetResponder={() => true}>
                  <Calendar
                    onDayPress={(day: any) => {
                      formik.setFieldValue("endOrReturnDate", new Date(day.timestamp));
                      setShowEndDatePicker(false);
                    }}
                    renderArrow={(direction: string) => (
                      <Icon
                        name={direction === 'left' ? 'chevron-left' : 'chevron-right'}
                        size={32}
                        color="#263F69"
                      />
                    )}
                    enableSwipeMonths={true}
                    markedDates={{
                      ...blockedDates,
                      ...(formik.values.endOrReturnDate ? {
                        [formik.values.endOrReturnDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#263F69', selectedTextColor: '#ffffff' }
                      } : {})
                    }}
                    minDate={formik.values.startOrDepartureDate ? formik.values.startOrDepartureDate.toISOString().split('T')[0] : undefined}
                    current={formik.values.startOrDepartureDate ? new Date(formik.values.startOrDepartureDate.getTime() + 86400000).toISOString().split('T')[0] : undefined}
                    theme={{
                      todayTextColor: '#263F69',
                      arrowColor: '#263F69',
                    }}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>

        <View className="flex-row items-center mb-5 -mt-2 -ml-2">
           <Checkbox
             status={formik.values.createSectionsBasedOnDates ? 'checked' : 'unchecked'}
             onPress={() => formik.setFieldValue('createSectionsBasedOnDates', !formik.values.createSectionsBasedOnDates)}
             disabled={!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate}
             color="#263F69"
           />
           <TouchableOpacity 
             activeOpacity={0.7}
             disabled={!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate}
             onPress={() => formik.setFieldValue('createSectionsBasedOnDates', !formik.values.createSectionsBasedOnDates )}
           >
             <Text className={`mt-4 text-base ${!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate ? 'text-gray-400 opacity-40' : 'text-gray-700'}`}>
               Generate sections
             </Text>

              <Text className={`text-sm ${!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate ? 'text-gray-400 opacity-40' : 'text-gray-400'}`}>
                Create itinerary sections based on travel dates. [DD/MM] Day No.
             </Text>
           </TouchableOpacity>
        </View>

      <View className="mb-5">
          <Text className="text-xs font-medium tracking-wider uppercase">Description</Text>
          <TextInput
            mode="outlined"
            placeholder="Describe your next trip"
            value={formik.values.description}
            onChangeText={formik.handleChange("description")}
            onBlur={formik.handleBlur("description")}
            onFocus={(e) => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 120);
            }}
            error={formik.touched.description && Boolean(formik.errors.description)}
            disabled={isSaving}
            outlineColor="#E0E0E0"
            activeOutlineColor="#263F69"
            multiline
            numberOfLines={4}
            theme={{
                  colors: {
                    onSurfaceVariant: '#888', 
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
          {formik.touched.description && formik.errors.description && (
            <Text className="text-red-500 text-xs mt-1 ml-1">{formik.errors.description as string}</Text>
          )}
          
        </View>

        {mode === "edit" && (
          <>
            <View className="mb-5">
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Budget</Text>
              <TextInput
                mode="outlined"
                placeholder="e.g., 2,000"
                value={formik.values.budget}
                onChangeText={formik.handleChange("budget")}
                onBlur={formik.handleBlur("budget")}
                left={<TextInput.Icon icon="currency-php" className="opacity-50"/>}
                keyboardType="numeric"
                disabled={isSaving}
                outlineColor="#E0E0E0"
                activeOutlineColor="#263F69"
                theme={{ colors: { onSurfaceVariant: '#888' } }}
                outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                style={{ marginTop: 6, height: 60 }}
                contentStyle={{ backgroundColor: "transparent" }}
              />
            </View>

            <View className="mb-5">
              <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Notes</Text>
              <TextInput
                mode="outlined"
                placeholder="Additional notes..."
                value={formik.values.notes}
                onChangeText={formik.handleChange("notes")}
                onBlur={formik.handleBlur("notes")}
                disabled={isSaving}
                outlineColor="#E0E0E0"
                activeOutlineColor="#263F69"
                multiline
                numberOfLines={3}
                theme={{ colors: { onSurfaceVariant: '#888' } }}
                outlineStyle={{ borderWidth: 1, backgroundColor: "#FFFFFF", borderRadius: 16 }}
                style={{ marginTop: 6, height: 80, fontSize: 14 }}
                contentStyle={{ backgroundColor: "transparent" }}
              />
            </View>

            <View className="mb-5 z-10">
              <CheckboxGroup initialOptions={activityOptions} title="Activities" />
            </View>
          </>
        )}
            <View className="mb-5"></View>

      </ScrollView>

    <View className="mb-8 mt-2 mx-4 bg-red-50">
       <TouchButton
          buttonText={isSaving ? "Saving..." : mode === "create" ? "Add trip" : "Update Changes"}
          icon={mode === "create" ? "add" : ""}
          onPress={() => formik.handleSubmit()}
          disabled={!formik.values.title.trim() || isSaving}
          className="h-7xl p-6"  
        />
    </View>
     
    </View>
  );
};

export default CreateOrEdit;
