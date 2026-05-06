import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { TextInput } from "react-native-paper";
import TouchButton from "../../../../components/atoms/TouchButton";
import { Calendar } from "react-native-calendars";
import { useFormik } from "formik";
import * as Yup from "yup";
import CheckboxGroup from "../../../../components/GroupCheckboxes";
import { useUpdateTravel, useTravels } from "../../hooks/useTravel";
import { CreateTravelData, DestinationDto } from "../../types/TravelDto";
import { TravelStatus } from "../../../../types/enums";
import MapboxDestinationSelector, { MapboxPlace } from "../MapboxDestinationSelector";
import { MAPBOX_ACCESS_TOKEN } from "@env";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import StatusBadge from "../../../../components/StatusBadge";
import { Divider, Text, Checkbox } from 'react-native-paper';

interface AddTravelModalProps {
  onClose: () => void;
  onStatusChange?: (status: TravelStatus) => void;
}

const Create = ({ onClose, onStatusChange }: AddTravelModalProps) => {
  const { mutate: createTravel, isPending: isSaving } = useUpdateTravel();
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
    title: Yup.string().required("Title is required").min(2),
  });

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      destination: "",
      destinationData: null as DestinationDto | null,
      startOrDepartureDate: null as Date | null,
      endOrReturnDate: null as Date | null,
      budget: "",
      notes: "",
      createSectionsBasedOnDates: false,
    },
    validationSchema: CreateTripSchema,
    onSubmit: (values) => {
      setError(null);

      const travelData: CreateTravelData = {
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
        isOffline: true,
        createSectionsBasedOnDates: values.createSectionsBasedOnDates,
      };
        console.log(travelData);

      createTravel({ data: travelData }, {
        onSuccess: () => {
          formik.resetForm();
          onClose();
        },
        onError: (err: any) => {
          console.error("Failed to save travel:", err);
          setError("Failed to save travel. Please try again.");
        },
      });
    },
  });

  const handleCancel = () => {
    formik.resetForm();
    setError(null);
    onClose();
  };

  const formattedStartDate = formik.values.startOrDepartureDate ? formik.values.startOrDepartureDate.toLocaleDateString() : "";
  const formattedEndDate = formik.values.endOrReturnDate ? formik.values.endOrReturnDate.toLocaleDateString() : "";
  const { data: travels } = useTravels();

  const getEffectiveStatus = (): TravelStatus => {
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
          const textColor = isOngoing ? '#0C4C8A' : '#2E7D32';

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
    <View className="flex-1 bg-gray-100  overflow-hidden ">

      <ScrollView className="flex-1 p-[15px] pb-20" showsVerticalScrollIndicator={false}>
        {error && (
          <View className="bg-[#FFEBEE] rounded-lg p-3 mb-4 border border-[#FFCDD2]">
            <Text className="text-[#D32F2F] text-sm">{error}</Text>
          </View>
        )}

        <View className="mb-5">
          <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Title</Text>
          <TextInput
            mode="outlined"
            className="!h-[64px]"
            placeholder="Your trip name"
            value={formik.values.title}
            onChangeText={formik.handleChange("title")}
            onBlur={formik.handleBlur("title")}
            error={formik.touched.title && Boolean(formik.errors.title)}
            disabled={isSaving}
            outlineColor="#E0E0E0"
            activeOutlineColor="#0C4C8A"
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
            }}
            contentStyle={{
              backgroundColor: "transparent",
            }}
          />
          {formik.touched.title && formik.errors.title && (
            <Text className="text-[#D32F2F] text-sm mt-1 ml-1">{formik.errors.title as string}</Text>
          )}
        </View>

         <View className="mb-5">
          <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Destination</Text>
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
                    className="!h-[64px]"
                    placeholder="Search city or country..."
                    value={formik.values.destination}
                    editable={false}
                    error={formik.touched.destination && Boolean(formik.errors.destination)}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#0C4C8A"
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
            const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+0C4C8A(${longitude},${latitude})/${longitude},${latitude},10,0/600x300?access_token=${MAPBOX_ACCESS_TOKEN}`;
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

        {/* <View className="mb-5 z-10">
          <CheckboxGroup initialOptions={destinationTypeOptions} title="Choose Destination type/s" />
        </View> */}

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
                activeOutlineColor="#0C4C8A"
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
                        color="#0C4C8A"
                      />
                    )}
                    // minDate={new Date().toISOString().split('T')[0]}
                    enableSwipeMonths={true}
                    markedDates={{
                      ...blockedDates,
                      ...(formik.values.startOrDepartureDate ? {
                        [formik.values.startOrDepartureDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#0C4C8A', selectedTextColor: '#ffffff' }
                      } : {})
                    }}
                    theme={{
                      todayTextColor: '#0C4C8A',
                      arrowColor: '#0C4C8A',
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
                activeOutlineColor="#0C4C8A"
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
                        color="#0C4C8A"
                      />
                    )}
                    enableSwipeMonths={true}
                    markedDates={{
                      ...blockedDates,
                      ...(formik.values.endOrReturnDate ? {
                        [formik.values.endOrReturnDate.toISOString().split('T')[0]]: { selected: true, selectedColor: '#0C4C8A', selectedTextColor: '#ffffff' }
                      } : {})
                    }}
                    minDate={formik.values.startOrDepartureDate ? formik.values.startOrDepartureDate.toISOString().split('T')[0] : undefined}
                    current={formik.values.startOrDepartureDate ? new Date(formik.values.startOrDepartureDate.getTime() + 86400000).toISOString().split('T')[0] : undefined}
                    theme={{
                      todayTextColor: '#0C4C8A',
                      arrowColor: '#0C4C8A',
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
             color="#0C4C8A"
           />
           <TouchableOpacity 
             activeOpacity={0.7}
             disabled={!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate}
             onPress={() => formik.setFieldValue('createSectionsBasedOnDates', !formik.values.createSectionsBasedOnDates)}
           >
             <Text className={`text-sm ${!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate ? 'text-gray-400 opacity-40' : 'text-gray-700'}`}>
               Create sections based on dates
             </Text>
           </TouchableOpacity>
        </View>

      <View className="mb-5">
          <Text className="text-xs text-gray-500 font-medium tracking-wider uppercase">Description</Text>
          <TextInput
            mode="outlined"
            placeholder="Describe your next trip"
            value={formik.values.description}
            onChangeText={formik.handleChange("description")}
            onBlur={formik.handleBlur("description")}
            error={formik.touched.description && Boolean(formik.errors.description)}
            disabled={isSaving}
            outlineColor="#E0E0E0"
            activeOutlineColor="#0C4C8A"
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
{/* 
      <View className="mb-5 z-10">
          <CheckboxGroup initialOptions={activityOptions} title="Activities" />
        </View> */}

{/* 
        <View className="mb-5">
          <Text className="text-md tracking-wide">Budget</Text>
           <TextInput
                  mode="outlined"
                  placeholder="e.g., 2,000"
                  value={formik.values.budget}
                  onChangeText={formik.handleChange("budget")}
                  onBlur={formik.handleBlur("budget")}
                  left={<TextInput.Icon icon="currency-php" className="opacity-50"/>}
                  keyboardType="numeric"
                      outlineColor="#E0E0E0"
            activeOutlineColor="#0C4C8A"
                   theme={{
                      colors: {
                        onSurfaceVariant: '#888', 
                      },
                    }}
                    outlineStyle={{
                      borderWidth: 2,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 16,
                    }}
                    style={{
                      height: 64,
                    }}
                    contentStyle={{
                      backgroundColor: "transparent",
                    }}
                />
        </View>

        <View className="mb-5">
          <TextInput
            mode="outlined"
            label="Notes"
            className="bg-white"
            placeholder="Any additional notes about your travel..."
            value={formik.values.notes}
            onChangeText={formik.handleChange("notes")}
            onBlur={formik.handleBlur("notes")}
            multiline
            numberOfLines={4}
            disabled={isSaving}
            outlineColor="#E0E0E0"
            activeOutlineColor="#0C4C8A"
          />
        </View> */}
      </ScrollView>

    <View className="mb-8 mx-5 bg-transparent  ">
       <TouchButton
          buttonText="Add trip"
          onPress={() => formik.handleSubmit()}
          disabled={!formik.values.title.trim() || isSaving}
          className="h-[64px] p-6 "  
        />
    </View>
     
    </View>
  );
};

export default Create;
