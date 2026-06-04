import { MAPBOX_ACCESS_TOKEN } from "@env";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useFormik } from "formik";
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Calendar, CalendarList } from "react-native-calendars";
import { Checkbox, TextInput, useTheme } from "react-native-paper";
import * as Yup from "yup";
import TouchButton from "../../../../components/atoms/TouchButton";
import CheckboxGroup from "../../../../components/GroupCheckboxes";
import { TravelStatus, TripType } from "../../../../types/enums";
import TripIcon from "../../../../components/TripIcon";
import TripTypeLookupModal from "../Lookups/TripTypeLookupModal";
import { useNavigation } from "@react-navigation/native";
import { useTravels, useUpdateTravel } from "../../hooks/useTravel";
import { DestinationDto, Travel } from "../../types/TravelDto";
import MapboxDestinationSelector, { MapboxPlace } from "../MapboxDestinationSelector";
import DescriptionInput from "../../../../components/molecules/DescriptionInput";

export interface CreateOrEditProps {
  onClose: () => void;
  onStatusChange?: (status: TravelStatus) => void;
  tripData?: Travel;
  mode?: "create" | "edit";
  hideSubmitButton?: boolean;
  onScroll?: (event: any) => void;
}

export interface CreateOrEditRef {
  submit: () => void;
  isSaving: boolean;
  isValid: boolean;
}

const CreateOrEdit = forwardRef<CreateOrEditRef, CreateOrEditProps>(({ onClose, onStatusChange, tripData, mode = "create", hideSubmitButton, onScroll }, ref) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { mutate: createTravel, isPending: isSaving } = useUpdateTravel();
  const scrollViewRef = useRef<ScrollView>(null);

  useImperativeHandle(ref, () => ({
    submit: () => {
      formik.handleSubmit();
    },
    isSaving,
    isValid: formik.isValid,
  }));
  const [error, setError] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [tempDepartureDate, setTempDepartureDate] = useState<Date | null>(null);
  const [tempReturnDate, setTempReturnDate] = useState<Date | null>(null);

  const destinationTypeOptions = [
    { id: "1", label: "Local", selected: false },
    { id: "2", label: "Domestic", selected: false },
    { id: "3", label: "International", selected: false },
  ];

  const [showTripTypeModal, setShowTripTypeModal] = useState(false);
  const [suggestionApplied, setSuggestionApplied] = useState(false);

  const activityOptions = Object.keys(TripType)
    .filter((key) => isNaN(Number(key)) && key !== "none")
    .map((key) => {
      const typeVal = TripType[key as keyof typeof TripType];
      const displayName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
      return { id: String(typeVal), label: displayName, selected: false };
    });

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
      type: tripData?.type ?? TripType.none,
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
        type: values.type !== TripType.none ? values.type : undefined,
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
          onSuccess: (result: any) => {
            formik.resetForm();
            onClose();
            const createdId = result?.data?.id || result?.id;
            if (createdId) {
              navigation.navigate("EditTravelPlan", { travelId: String(createdId) });
            }
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

  const getPeriodMarkedDates = (start: Date | null, end: Date | null) => {
    const marked: Record<string, any> = {};

    if (start && !isNaN(start.getTime())) {
      const startStr = start.toISOString().split('T')[0];
      marked[startStr] = {
        startingDay: true,
        selected: true,
        color: '#263F69',
        textColor: '#ffffff',
      };

      if (end && !isNaN(end.getTime())) {
        const endStr = end.toISOString().split('T')[0];
        marked[endStr] = {
          endingDay: true,
          selected: true,
          color: '#263F69',
          textColor: '#ffffff',
        };

        let currentDate = new Date(start.getTime());
        currentDate.setDate(currentDate.getDate() + 1);

        while (currentDate.toDateString() !== end.toDateString() && currentDate < end) {
          const midStr = currentDate.toISOString().split('T')[0];
          marked[midStr] = {
            selected: true,
            color: '#263F6920',
            textColor: '#263F69',
          };
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    return {
      ...blockedDates,
      ...marked,
    };
  };

  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange(effectiveStatus);
    }
  }, [effectiveStatus, onStatusChange]);

  React.useEffect(() => {
    if (mode === "create") {
      setShowDestinationModal(true);
    }
  }, [mode]);

  const getCityOnly = (destination?: string): string => {
    if (!destination) return "";
    return destination.split(',')[0].trim();
  };

  const getTripTypeName = (type: TripType) => {
    if (type === undefined || type === null || type === TripType.none) return "";
    return String(TripType[type]).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const formatDepartureDate = (date: Date | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${year}`;
  };

  const tripTypeName = getTripTypeName(formik.values.type);
  const cityName = getCityOnly(formik.values.destination);
  const dateStr = formatDepartureDate(formik.values.startOrDepartureDate);

  const hasAllThree = !!cityName && !!formik.values.startOrDepartureDate && formik.values.type !== TripType.none;
  const suggestion = hasAllThree ? `${tripTypeName} in ${cityName} - ${dateStr}` : "";

  return (
    <View className="flex-1 bg-gray-100 overflow-hidden">
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 p-[15px]" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        // onScroll={onScroll}
        // scrollEventThrottle={16}
      >
{/* 
        {error && (
          <View className="bg-[#FFEBEE] rounded-lg p-3 mb-4 border border-[#FFCDD2]">
            <Text className="text-[#D32F2F] text-sm">{error}</Text>
          </View>
        )} */}


 
        <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Title</Text>
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
          {suggestion && !suggestionApplied ? (
            <TouchableOpacity 
              onPress={() => {
                formik.setFieldValue("title", suggestion);
                setSuggestionApplied(true);
              }}
              className="mt-2.5 ml-1"
              accessibilityRole="button"
              accessibilityLabel={`Apply suggested title: ${suggestion}`}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-medium" style={{ color: colors.primary }}>
                Suggested: <Text className="underline">{suggestion}</Text>
              </Text>
            </TouchableOpacity>
          ) : null}
          {formik.touched.title && formik.errors.title && (
            <Text className="text-error text-sm mt-1 ml-1">{formik.errors.title as string}</Text>
          )}
        </View>

         <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Destination</Text>

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
                    className="h-7xl"
                    placeholder="Search place to visit..."
                    value={formik.values.destination}
                    editable={false}
                    error={formik.touched.destination && Boolean(formik.errors.destination)}
                    outlineColor="#E0E0E0"
                    activeOutlineColor="#263F69"
                    left={<TextInput.Icon icon="map-marker" color="#999" />}
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
                  <View className="absolute bottom-2 left-2 px-3 py-1 rounded-xl flex-row items-center" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
                    <Icon name="location-on" size={14} color="#FFF" />
                    <Text className="text-white text-xs ml-1">{formik.values.destination}</Text>
                  </View>
                  <View className="absolute top-2 right-2 px-2 py-1 rounded-full" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
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
                if (mode === "create") {
                  setTimeout(() => {
                    setTempDepartureDate(formik.values.startOrDepartureDate ? new Date(formik.values.startOrDepartureDate) : null);
                    setTempReturnDate(formik.values.endOrReturnDate ? new Date(formik.values.endOrReturnDate) : null);
                    setShowStartDatePicker(true);
                  }, 300);
                }
              }}
              initialValue={formik.values.destination}
            />
                    </Animated.View>
       
          </Modal>
        </View>

        <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase mb-1">Trip Type</Text>
          <TouchableOpacity 
            onPress={() => setShowTripTypeModal(true)}
            className="border rounded-2xl h-7xl border-[#E0E0E0] bg-white px-4 py-4 mt-1 flex-row items-center gap-3"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            {formik.values.type != null && formik.values.type !== TripType.none ? (
              <TripIcon type={formik.values.type} size={24} showIconOnly={true} />
            ) : (
              <Icon name="style" size={24} color={"#B3B3B3"} />
            )}
            <Text className="text-base text-gray-800 capitalize font-medium">
              {formik.values.type != null && formik.values.type !== TripType.none
                ? String(TripType[formik.values.type]).replace(/([A-Z])/g, ' $1').trim()
                : "Select Trip Type..."}
            </Text>
          </TouchableOpacity>
        </View>

        <TripTypeLookupModal
          visible={showTripTypeModal}
          onClose={() => setShowTripTypeModal(false)}
          selectedType={formik.values.type}
          onSelect={(type) => {
            formik.setFieldValue("type", type);
          }}
        />

        {mode === "edit" && (
          <View className="mb-5 z-10">
            <CheckboxGroup initialOptions={destinationTypeOptions} title="Type of Destination" />
          </View>
        )}


        <View className="">
          <Text className="text-xs font-semibold tracking-wider uppercase">Travel dates</Text>
          <View className="flex-row mb-2 gap-1 -mt-3px items-center">
            <View className="flex-1">
              <View className="relative mt-sm">
                <TextInput
                  mode="outlined"
                  label={`${!formik.values.startOrDepartureDate ? "Departure" : ""}`}
                  value={formattedStartDate}
                  editable={false}
                  left={<TextInput.Icon icon="calendar" color="#999"/>}
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
                      marginTop: formik.values.startOrDepartureDate ? 0 : -6,
                    }}
                    contentStyle={{
                      backgroundColor: "transparent",
                    }}
                />
                <TouchableOpacity 
                  style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 50, zIndex: 20 }}
                  onPress={() => {
                    setTempDepartureDate(formik.values.startOrDepartureDate ? new Date(formik.values.startOrDepartureDate) : null);
                    setTempReturnDate(formik.values.endOrReturnDate ? new Date(formik.values.endOrReturnDate) : null);
                    setShowStartDatePicker(true);
                  }}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel="Open calendar range selector"
                />
              </View>
              <Modal 
                visible={showStartDatePicker} 
                transparent={false} 
                animationType="slide"
                onRequestClose={() => setShowStartDatePicker(false)}
              >
                <View className="flex-1 bg-white pt-12">
                  {/* Header */}
                  <View className="flex-row justify-between items-center p-5 border-b border-gray-200 bg-white">
                    <TouchableOpacity 
                      onPress={() => setShowStartDatePicker(false)}
                      accessibilityRole="button"
                      accessibilityLabel="Close date selector"
                    >
                      <Icon name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold">Select Travel Dates</Text>
                    <View className="w-10" />
                  </View>

                  {/* Calendar List */}
                  <View className="flex-1">
                    <CalendarList
                      pastScrollRange={0}
                      futureScrollRange={12}
                      scrollEnabled={true}
                      horizontal={false}
                      showsVerticalScrollIndicator={true}
                      hideArrows={true}
                      markingType={'period'}
                      onDayPress={(day: any) => {
                        const pressedDate = new Date(day.timestamp);
                        if (!tempDepartureDate || (tempDepartureDate && tempReturnDate)) {
                          setTempDepartureDate(pressedDate);
                          setTempReturnDate(null);
                        } else if (pressedDate < tempDepartureDate) {
                          setTempDepartureDate(pressedDate);
                          setTempReturnDate(null);
                        } else {
                          setTempReturnDate(pressedDate);
                        }
                      }}
                      minDate={new Date().toISOString().split('T')[0]}
                      markedDates={getPeriodMarkedDates(tempDepartureDate, tempReturnDate)}
                      theme={{
                        todayTextColor: '#263F69',
                        selectedDayBackgroundColor: '#263F69',
                        selectedDayTextColor: '#ffffff',
                      }}
                    />
                  </View>

                  {/* Confirm Button */}
                  <View className="p-5 border-t border-gray-200 bg-white mb-6">
                    <TouchButton
                      buttonText="Confirm Selection"
                      onPress={() => {
                        if (tempDepartureDate) {
                          formik.setFieldValue("startOrDepartureDate", tempDepartureDate);
                          formik.setFieldValue("endOrReturnDate", tempReturnDate);
                        }
                        setShowStartDatePicker(false);
                        if (mode === "create") {
                          setTimeout(() => {
                            setShowTripTypeModal(true);
                          }, 300);
                        }
                      }}
                      disabled={!tempDepartureDate}
                      className="h-7xl p-6"
                    />
                  </View>
                </View>
              </Modal>
            </View>
            <Icon name="arrow-forward" size={24} color="#999" className="mt-sm" />
            <View className="flex-1">
              <View className="relative mt-sm">
                <TextInput
                  mode="outlined"
                  label={`${!formik.values.endOrReturnDate ? "Return" : ""}`}
                  value={formattedEndDate}
                  editable={false}
                  left={<TextInput.Icon icon="calendar" color="#999"/>}
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
                      marginTop: formik.values.endOrReturnDate ? 0 : -6,
                    }}
                    contentStyle={{
                      backgroundColor: "transparent",
                    }}
                />
                <TouchableOpacity 
                  style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 50, zIndex: 20 }}
                  onPress={() => {
                    setTempDepartureDate(formik.values.startOrDepartureDate ? new Date(formik.values.startOrDepartureDate) : null);
                    setTempReturnDate(formik.values.endOrReturnDate ? new Date(formik.values.endOrReturnDate) : null);
                    setShowStartDatePicker(true);
                  }}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel="Open calendar range selector"
                />
              </View>
            </View>
          </View>
        </View>

        {!tripData && (
          <View className="flex-row items-start mb-6 mr-5">
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
                      <Text className={`mt-1 text-lg ${!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate ? 'opacity-80' : 'text-gray-700'}`}>
                        Generate sections
                      </Text>

                        <Text className={`text-base ${!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate ? 'text-gray-400 opacity-80' : 'text-gray-400'}`}>
                          When checked it will create itinerary sections based on dates. Travel dates should be set to create.
                      </Text>
                    </TouchableOpacity>
          </View>
        )}
    

      <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Description</Text>
          <DescriptionInput
            value={formik.values.description}
            onChange={(text) => formik.setFieldValue("description", text)}
            label="Description"
            placeholder="Describe this trip..."
            confirmLabel="Add"
            disabled={isSaving}
          />
        </View>

        {mode === "edit" && (
          <>
            <View className="mb-5">
              <Text className="text-xs font-semibold tracking-wider uppercase">Budget</Text>
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
              <Text className="text-xs font-semibold tracking-wider uppercase">Notes</Text>
              <DescriptionInput
                value={formik.values.notes}
                onChange={(text) => formik.setFieldValue("notes", text)}
                label="Notes"
                placeholder="Additional notes..."
                confirmLabel="Save"
                disabled={isSaving}
              />
            </View>

            <View className="mb-5 z-10">
              <CheckboxGroup initialOptions={activityOptions} title="Activities" />
            </View>
          </>
        )}

      </ScrollView>

    {!hideSubmitButton && (
      <View className="mb-8 mt-2 mx-4 bg-red-50">
         <TouchButton
            buttonText={isSaving ? "Saving..." : mode === "create" ? "Add trip" : "Update Changes"}
            icon={mode === "create" ? "add" : ""}
            onPress={() => formik.handleSubmit()}
            disabled={!formik.values.title.trim() || isSaving}
            className="h-7xl p-6"  
          />
      </View>
    )}
    </View>
  );
});

export default CreateOrEdit;
