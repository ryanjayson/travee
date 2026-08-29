import { MAPBOX_ACCESS_TOKEN } from "@env";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFormik } from "formik";
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image, ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Checkbox, TextInput, useTheme } from "react-native-paper";
import * as Yup from "yup";
import TouchButton from "../../../../components/atoms/TouchButton";
import DescriptionInput from "../../../../components/molecules/DescriptionInput";
import TripIcon from "../../../../components/TripIcon";
import { useTravelContext } from "../../../../context/TravelContext";
import { TravelStatus, TripType } from "../../../../types/enums";
import { useTravels, useUpdateTravel } from "../../hooks/useTravel";
import { DestinationDto, Travel, TripDestinationDto } from "../../types/TravelDto";
import TripTypeLookupModal from "../Lookups/TripTypeLookupModal";
import { MapboxPlace } from "../MapboxDestinationSelector";
import TravelDateModal from "./TravelDateModal";
import { getDestinationZoom } from "../../../../utils/mapUtils";

export interface CreateOrEditProps {
  onClose: () => void;
  onStatusChange?: (status: TravelStatus) => void;
  tripData?: Travel;
  mode?: "create" | "edit";
  hideSubmitButton?: boolean;
  onScroll?: (event: any) => void;
  onCreated?: (createdId: string) => void;
}

export interface CreateOrEditRef {
  submit: () => void;
  isSaving: boolean;
  isValid: boolean;
}

const CreateOrEdit = forwardRef<CreateOrEditRef, CreateOrEditProps>(({ onClose, onStatusChange, tripData, mode = "create", hideSubmitButton, onScroll, onCreated }, ref) => {
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
  const { openDestinationModal } = useTravelContext();

  const handleOpenDestinationSelect = () => {
    openDestinationModal("", (place: MapboxPlace) => {
      const newDest: TripDestinationDto = {
        destination: place.name,
        destinationData: {
          id: place.id,
          city: place.city,
          regionOrState: place.regionOrState,
          country: place.country,
          coordinates: {
            longitude: place.coordinates.longitude,
            latitude: place.coordinates.latitude,
          },
        } as DestinationDto,
      };

      const currentList: TripDestinationDto[] = formik.values.tripDestinations || [];
      const isDuplicate = currentList.some(
        (d) => d.destination.trim().toLowerCase() === place.name.trim().toLowerCase()
      );

      const nextList = isDuplicate ? currentList : [...currentList, newDest];
      formik.setFieldValue("tripDestinations", nextList);
      if (nextList.length > 0) {
        formik.setFieldValue("destination", nextList[0].destination);
        formik.setFieldValue("destinationData", nextList[0].destinationData);
      }

      if (mode === "create" && currentList.length === 0) {
        setTimeout(() => {
          setShowStartDatePicker(true);
        }, 300);
      }
    });
  };

  const handleRemoveDestination = (index: number) => {
    const currentList: TripDestinationDto[] = formik.values.tripDestinations || [];
    const nextList = currentList.filter((_, i) => i !== index);
    formik.setFieldValue("tripDestinations", nextList);
    if (nextList.length > 0) {
      formik.setFieldValue("destination", nextList[0].destination);
      formik.setFieldValue("destinationData", nextList[0].destinationData);
    } else {
      formik.setFieldValue("destination", "");
      formik.setFieldValue("destinationData", null);
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);

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
    title: Yup.string()
      .required("Trip title is required")
      .min(2, "Trip title is too short, make it more descriptive")
      .max(40, "Trip title must be at most 40 characters"),
    tripDestinations: Yup.array()
      .min(1, "At least one destination is required")
      .required("Destination is required"),
  });

  const formik = useFormik({
    initialValues: {
      title: tripData?.title || "",
      description: tripData?.description || "",
      destination: tripData?.destination || "",
      destinationData: tripData?.destinationData || null as DestinationDto | null,
      tripDestinations: (tripData?.tripDestinations && tripData.tripDestinations.length > 0)
        ? tripData.tripDestinations
        : (tripData?.destination
            ? [{ destination: tripData.destination, destinationData: tripData.destinationData || null }]
            : [] as TripDestinationDto[]),
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

      const tripDestinations = values.tripDestinations || [];
      const primaryDestination = tripDestinations[0]?.destination || values.destination.trim();
      const primaryDestinationData = tripDestinations[0]?.destinationData || values.destinationData || undefined;

      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        destination: primaryDestination,
        destinationData: primaryDestinationData,
        tripDestinations: tripDestinations,
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
          if (end < today) return TravelStatus.Past;
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
              if (onCreated) {
                onCreated(String(createdId));
              } else {
                navigation.navigate("EditTravelPlan", { travelId: String(createdId) });
              }
            }
          },
          onError: (err: any) => {
            console.error("Failed to save travel:", err);
            setError("Failed to save travel. Please try again.");
          },
        });
      } else if (mode === "edit" && tripData?.id) {
        createTravel({ id: tripData.id, data: payload as any }, {
          onSuccess: () => {
            formik.resetForm();
            onClose();
          },
          onError: (err: any) => {
            console.error("Failed to update travel:", err);
            setError("Failed to update travel. Please try again.");
          },
        });
      }
    },
  });

  const words = ['Quick weekend getaway', 'My International trip 2026', 'Travel with friends', 'Travel to home province', 'My Solo Trip to Japan'];
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

  const isDayTour = useMemo(() => {
    const start = formik.values.startOrDepartureDate;
    const end = formik.values.endOrReturnDate;
    if (!start) return false;
    if (!end) return true;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return startDate.toDateString() === endDate.toDateString();
  }, [formik.values.startOrDepartureDate, formik.values.endOrReturnDate]);

  const getEffectiveStatus = (): TravelStatus => {
    if (tripData && (tripData.status === TravelStatus.Past ||
      tripData.status === TravelStatus.Archieved ||
      tripData.status === TravelStatus.Cancelled)) {
      return tripData.status;
    }
    if (!formik.values.startOrDepartureDate) return TravelStatus.Draft;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOrDepartureDate = new Date(formik.values.startOrDepartureDate);
    startOrDepartureDate.setHours(0, 0, 0, 0);

    const endOrReturnDate = formik.values.endOrReturnDate ? new Date(formik.values.endOrReturnDate) : startOrDepartureDate;
    endOrReturnDate.setHours(0, 0, 0, 0);

    if (endOrReturnDate < today) return TravelStatus.Past;
    return startOrDepartureDate > today ? TravelStatus.Upcoming : TravelStatus.Ongoing;
  };

  const effectiveStatus = getEffectiveStatus();

  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange(effectiveStatus);
    }
  }, [effectiveStatus, onStatusChange]);

  React.useEffect(() => {
    if (mode === "create") {
      handleOpenDestinationSelect();
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
        contentContainerStyle={{ paddingBottom: 10 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* 
        {error && (
          <View className="bg-[#FFEBEE] rounded-lg p-3 mb-4 border border-[#FFCDD2]">
            <Text className="text-[#D32F2F] text-sm">{error}</Text>
          </View>
        )} */}

        <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Title <Text className="text-red-500 text-lg">*</Text></Text>
          <View className="relative justify-center">
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
                height: 64,
              }}
              contentStyle={{
                backgroundColor: "transparent",
                paddingRight: 60,
              }}
              maxLength={40}
            />
            <Text
              className="absolute right-4 bottom-3 text-xs"
              style={{ color: '#98A2B3' }}
            >
              {(formik.values.title || "").length}/40
            </Text>
          </View>
          {!tripData?.id && suggestion && !suggestionApplied ? (
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
            <View className="flex flex-row items-center mt-1">
              <Icon name="info-outline" size={14} color="#fb2c36" />
              <Text className="text-red-500 text-xs ml-1" >{formik.errors.title as string}</Text>
            </View>
          )}
        </View>

        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold tracking-wider uppercase">
              Trip Destinations <Text className="text-red-500 text-lg">*</Text>
            </Text>
            {formik.values.tripDestinations && formik.values.tripDestinations.length > 0 && (
              <TouchableOpacity
                onPress={handleOpenDestinationSelect}
                disabled={isSaving}
                activeOpacity={0.7}
                className="flex-row items-center gap-1 py-1 px-3 rounded-full bg-primary/10"
                accessibilityRole="button"
                accessibilityLabel="Add another destination"
              >
                <Icon name="add-location-alt" size={14} color={colors.primary} />
                <Text style={{ color: colors.primary }} className="text-xs font-bold">
                  Add Place
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Selected Destination Tags */}
          {formik.values.tripDestinations && formik.values.tripDestinations.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 mb-2">
              {formik.values.tripDestinations.map((item: TripDestinationDto, index: number) => (
                <View
                  key={`${item.destination}-${index}`}
                  className="flex-row items-center bg-[#F2F4F7] border border-[#E0E0E0] rounded-full py-1.5 pl-3 pr-2 shadow-xs"
                >
                  <Icon name="place" size={15} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text className="text-xs font-semibold text-[#101828] mr-2" numberOfLines={1}>
                    {item.destination}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveDestination(index)}
                    disabled={isSaving}
                    activeOpacity={0.7}
                    className="w-5 h-5 rounded-full bg-gray-300/70 items-center justify-center"
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.destination}`}
                  >
                    <Icon name="close" size={12} color="#475467" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            /* Empty state: Search input button */
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenDestinationSelect}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Select trip destination"
            >
              <View pointerEvents="none">
                <TextInput
                  mode="outlined"
                  className="h-7xl"
                  placeholder="Search place or country"
                  value=""
                  editable={false}
                  error={formik.touched.tripDestinations && Boolean(formik.errors.tripDestinations)}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#263F69"
                  left={<TextInput.Icon icon="map-marker" color="#999" />}
                  theme={{
                    colors: {
                      onSurfaceVariant: "#98A2B3",
                    },
                  }}
                  outlineStyle={{
                    borderWidth: 1,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                  }}
                  style={{
                    marginTop: 4,
                    height: 56,
                  }}
                  contentStyle={{
                    backgroundColor: "transparent",
                  }}
                />
              </View>
            </TouchableOpacity>
          )}

          {/* Validation error */}
          {formik.touched.tripDestinations && formik.errors.tripDestinations && (
            <View className="flex flex-row items-center mt-1">
              <Icon name="info-outline" size={14} color="#fb2c36" />
              <Text className="text-red-500 text-xs ml-1">
                {typeof formik.errors.tripDestinations === "string"
                  ? (formik.errors.tripDestinations as string)
                  : "At least one destination is required"}
              </Text>
            </View>
          )}

          {/* Multi-destination Map Preview */}
          {(() => {
            const validDestinations = (formik.values.tripDestinations || []).filter(
              (d: TripDestinationDto) =>
                d.destinationData?.coordinates &&
                (d.destinationData.coordinates.latitude !== 0 || d.destinationData.coordinates.longitude !== 0)
            );

            if (validDestinations.length === 0) return null;

            let mapUrl: string;
            if (validDestinations.length === 1) {
              const destObj = validDestinations[0];
              const { longitude, latitude } = destObj.destinationData!.coordinates;
              const zoom = getDestinationZoom(destObj.destination, destObj.destinationData);
              mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+263F69(${longitude},${latitude})/${longitude},${latitude},${zoom},0/600x260?access_token=${MAPBOX_ACCESS_TOKEN}`;
            } else {
              const pins = validDestinations
                .slice(0, 5)
                .map((d: TripDestinationDto) => {
                  const c = d.destinationData!.coordinates;
                  return `pin-s+263F69(${c.longitude},${c.latitude})`;
                })
                .join(",");
              mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pins}/auto/600x260?padding=40,40,40,40&access_token=${MAPBOX_ACCESS_TOKEN}`;
            }

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleOpenDestinationSelect}
                disabled={isSaving}
                className="mt-2"
                accessibilityRole="button"
                accessibilityLabel="Add or view trip destinations on map"
              >
                <View className="rounded-2xl overflow-hidden shadow-xs border border-[#EAECF0]">
                  <Image
                    source={{ uri: mapUrl }}
                    style={{ width: "100%", height: 140, borderRadius: 16 }}
                    resizeMode="cover"
                  />
                  <View
                    className="absolute bottom-2 left-2 px-3 py-1 rounded-xl flex-row items-center"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                  >
                    <Icon name="location-on" size={14} color="#FFF" />
                    <Text className="text-white text-xs ml-1 font-medium">
                      {validDestinations.length === 1
                        ? validDestinations[0].destination
                        : `${validDestinations.length} destinations`}
                    </Text>
                  </View>
                  <View
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-full flex-row items-center gap-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                  >
                    <Icon name="add" size={12} color="#FFF" />
                    <Text className="text-white text-[10px] font-semibold">Tap to add</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })()}
        </View>


        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-semibold tracking-wider uppercase">Travel dates</Text>
            {isDayTour && (
              <View className="bg-blue-50 border border-accent/80 rounded-full px-2 mr-2 opacity-50">
                <Text className="text-accent text-[10px] font-bold uppercase tracking-wider">Day Trip</Text>
              </View>
            )}
          </View>
          <View className="flex-row mb-2 gap-1 -mt-3px items-center">
            <View className="flex-1">
              <View className="relative mt-sm">
                <TextInput
                  mode="outlined"
                  label={`${!formik.values.startOrDepartureDate ? "Departure" : ""}`}
                  value={formattedStartDate}
                  editable={false}
                  left={<TextInput.Icon icon="calendar" color="#999" />}
                  right={formik.values.startOrDepartureDate ? <TextInput.Icon icon="close" onPress={() => {
                    formik.setFieldValue("startOrDepartureDate", null);
                    formik.setFieldValue("endOrReturnDate", null);
                  }} /> : null}
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
                    setShowStartDatePicker(true);
                  }}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel="Open calendar range selector"
                />
              </View>
              <TravelDateModal
                visible={showStartDatePicker}
                onClose={() => setShowStartDatePicker(false)}
                initialStartDate={formik.values.startOrDepartureDate}
                initialEndDate={formik.values.endOrReturnDate}
                tripData={tripData}
                mode={mode}
                onConfirm={(startDate, endDate) => {
                  formik.setFieldValue("startOrDepartureDate", startDate);
                  formik.setFieldValue("endOrReturnDate", endDate);
                  setShowStartDatePicker(false);
                  if (mode === "create" && !formik.values.type) {
                    setTimeout(() => {
                      setShowTripTypeModal(true);
                    }, 300);
                  }
                }}
              />
            </View>
            {!isDayTour && (
              <>
                <Icon name="arrow-forward" size={24} color="#999" className="mt-sm" />
                <View className="flex-1">
                  <View className="relative mt-sm">
                    <TextInput
                      mode="outlined"
                      label={`${!formik.values.endOrReturnDate ? "Return" : ""}`}
                      value={formattedEndDate}
                      editable={false}
                      left={<TextInput.Icon icon="calendar" color="#999" />}
                      right={formik.values.endOrReturnDate ? <TextInput.Icon icon="close" onPress={() => formik.setFieldValue("endOrReturnDate", null)} /> : null}
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
                        setShowStartDatePicker(true);
                      }}
                      activeOpacity={0.6}
                      accessibilityRole="button"
                      accessibilityLabel="Open calendar range selector"
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {!tripData && (
          <View className="flex-row items-start mb-6 mr-5"
            style={{ opacity: !formik.values.startOrDepartureDate || !formik.values.endOrReturnDate ? 0.5 : 1 }}>
            <Checkbox
              status={formik.values.createSectionsBasedOnDates ? 'checked' : 'unchecked'}
              onPress={() => formik.setFieldValue('createSectionsBasedOnDates', !formik.values.createSectionsBasedOnDates)}
              disabled={!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate}
              color="#263F69"
            />
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={!formik.values.startOrDepartureDate || !formik.values.endOrReturnDate}
              onPress={() => formik.setFieldValue('createSectionsBasedOnDates', !formik.values.createSectionsBasedOnDates)}
            >
              <Text className={`mt-1 text-lg text-gray-700`}>
                Generate sections
              </Text>

              <Text className={`text-base text-gray-400`}>
                When checked it will create itinerary sections based on dates. Travel dates should be set to create.
              </Text>
            </TouchableOpacity>
          </View>
        )}


        <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Trip Type</Text>
          <Text className={`text-md text-gray-400`}>
            Type helps organize activities and recommendations.
          </Text>
          <View className="border rounded-2xl h-7xl border-[#E0E0E0] bg-white mt-1 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setShowTripTypeModal(true)}
              className="flex-1 flex-row items-center gap-3 px-4 py-4"
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              {formik.values.type != null && formik.values.type !== TripType.none ? (
                <TripIcon type={formik.values.type} size={24} showIconOnly={true} />
              ) : (
                <Icon name="style" size={24} color={"#B3B3B3"} />
              )}
              {formik.values.type != null && formik.values.type !== TripType.none
                ? (
                  <Text className="text-lg text-[#000000] capitalize">
                    {String(TripType[formik.values.type]).replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                )
                : (
                  <Text className="text-lg text-[#98A2B3]">
                    Select travel purpose
                  </Text>
                )}
            </TouchableOpacity>
            {formik.values.type != null && formik.values.type !== TripType.none && (
              <TouchableOpacity
                onPress={() => formik.setFieldValue("type", TripType.none)}
                accessibilityRole="button"
                accessibilityLabel="Clear travel type"
                className="pr-4 py-4 pl-2 justify-center items-center"
                activeOpacity={0.7}
              >
                <Icon name="close" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TripTypeLookupModal
          visible={showTripTypeModal}
          onClose={() => setShowTripTypeModal(false)}
          selectedType={formik.values.type}
          onSelect={(type) => {
            formik.setFieldValue("type", type);
          }}
        />

        {/* {mode === "edit" && (
          <View className="mb-5 z-10">
            <CheckboxGroup initialOptions={destinationTypeOptions} title="Type of Destination" />
          </View>
        )} */}



        <View className="mb-5">
          <Text className="text-xs font-semibold tracking-wider uppercase">Description</Text>
          <DescriptionInput
            value={formik.values.description}
            onChange={(text) => formik.setFieldValue("description", text)}
            label="Description"
            placeholder="Describe this trip"
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
                // left={<TextInput.Icon icon="currency-php" className="opacity-50"/>}
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


          </>
        )}

      </ScrollView>

      {!hideSubmitButton && (
        <View className="mb-8 mt-2 mx-4 bg-red-50">
          <TouchButton
            buttonText={isSaving ? "Saving..." : mode === "create" ? "Create trip" : "Update Changes"}
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
