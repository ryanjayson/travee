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
  View,
} from "react-native";
import { Checkbox, TextInput, useTheme } from "react-native-paper";
import * as Yup from "yup";
import TouchButton from "../../../../components/atoms/TouchButton";
import FloatingLabelInput from "../../../../components/atoms/FloatingLabelInput";
import DescriptionInput from "../../../../components/molecules/DescriptionInput";
import TripIcon from "../../../../components/TripIcon";
import { TravelStatus, TripType, getTripTypeLabel } from "../../../../types/enums";
import { useTravels, useUpdateTravel } from "../../hooks/useTravel";
import { DestinationDto, Travel, TripDestinationDto } from "../../types/TravelDto";
import TripTypeLookupModal from "../Lookups/TripTypeLookupModal";
import TravelDateModal from "./TravelDateModal";
import TripDestinationSearchBox, { TripDestinationSearchBoxRef } from "./TripDestinationSearchBox";
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
  const destinationSearchRef = useRef<TripDestinationSearchBoxRef>(null);

  useImperativeHandle(ref, () => ({
    submit: () => {
      formik.handleSubmit();
    },
    isSaving,
    isValid: formik.isValid,
  }));

  const handleSelectDestination = (newDest: TripDestinationDto) => {
    formik.setValues((prevValues) => {
      const currentList: TripDestinationDto[] = prevValues.tripDestinations || [];
      if (currentList.length >= 5) {
        return prevValues;
      }
      const isDuplicate = currentList.some(
        (d) => d.destination.trim().toLowerCase() === newDest.destination.trim().toLowerCase()
      );

      const nextList = isDuplicate ? currentList : [...currentList, newDest].slice(0, 5);
      return {
        ...prevValues,
        tripDestinations: nextList,
        destination: nextList.length > 0 ? nextList[0].destination : prevValues.destination,
        destinationData: nextList.length > 0 ? nextList[0].destinationData : prevValues.destinationData,
      };
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
      const displayName = getTripTypeLabel(typeVal);
      return { id: String(typeVal), label: displayName, selected: false };
    });

  const CreateTripSchema = Yup.object().shape({
    title: Yup.string()
      .required("Trip title is required")
      .min(2, "Trip title is too short, make it more descriptive")
      .max(40, "Trip title must be at most 40 characters"),
    tripDestinations: Yup.array()
      .min(1, "Add your destination")
      .max(3, "Maximum of 3 destinations allowed")
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
          return start > today ? TravelStatus.Upcoming : TravelStatus.Travelling;
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

  const formattedStartDate = formik.values.startOrDepartureDate ? formik.values.startOrDepartureDate.toLocaleDateString() : "";
  const formattedEndDate = formik.values.endOrReturnDate ? formik.values.endOrReturnDate.toLocaleDateString() : "";

  const formattedTripDates = useMemo(() => {
    const start = formik.values.startOrDepartureDate;
    const end = formik.values.endOrReturnDate;
    if (!start) return "";
    const startStr = (start instanceof Date ? start : new Date(start)).toLocaleDateString();
    if (end && !isDayTour) {
      const endStr = (end instanceof Date ? end : new Date(end)).toLocaleDateString();
      return `${startStr} - ${endStr}`;
    }
    return startStr;
  }, [formik.values.startOrDepartureDate, formik.values.endOrReturnDate, isDayTour]);

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
    return startOrDepartureDate > today ? TravelStatus.Upcoming : TravelStatus.Travelling;
  };

  const effectiveStatus = getEffectiveStatus();

  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange(effectiveStatus);
    }
  }, [effectiveStatus, onStatusChange]);

  const getCityOnly = (destination?: string): string => {
    if (!destination) return "";
    return destination.split(',')[0].trim();
  };

  const getTripTypeName = (type: TripType) => {
    if (type === undefined || type === null || type === TripType.none) return "";
    return getTripTypeLabel(type) || String(TripType[type]).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const formatDepartureDate = (date: Date | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}.${month}.${year}`;
  };

  const primaryDest =
    (formik.values.tripDestinations && formik.values.tripDestinations[0]?.destination) ||
    formik.values.destination ||
    "";
  const cityName = getCityOnly(primaryDest);
  const tripTypeName = getTripTypeName(formik.values.type);
  const dateStr = formatDepartureDate(formik.values.startOrDepartureDate);

  // Progressive suggestion format:
  // 1. Destination + Type + Date: [Event name] in [Destination name] [DD.MM.YY]
  // 2. Destination + Type:        [Event name] in [Destination name]
  // 3. Destination + Date:        [Destination name] Trip [DD.MM.YY]
  // 4. Destination only:          [Destination name] Trip
  let suggestion = "";
  if (cityName) {
    if (tripTypeName && dateStr) {
      suggestion = `${tripTypeName} in ${cityName} [${dateStr}]`;
    } else if (tripTypeName) {
      suggestion = `${tripTypeName} in ${cityName}`;
    } else if (dateStr) {
      suggestion = `${cityName} Trip [${dateStr}]`;
    } else {
      suggestion = `${cityName} Trip`;
    }
  }

  const prevSuggestionRef = useRef<string>("");

  useEffect(() => {
    if (suggestion && suggestion !== prevSuggestionRef.current) {
      const isTitleEmpty = !formik.values.title || formik.values.title.trim() === "";
      const wasPreviousSuggestion = formik.values.title === prevSuggestionRef.current;

      prevSuggestionRef.current = suggestion;

      if ((isTitleEmpty || wasPreviousSuggestion) && formik.values.title !== suggestion) {
        formik.setFieldValue("title", suggestion);
        setSuggestionApplied(true);
      }
    }
  }, [suggestion, formik.values.title]);

  return (
    <View className="flex-1 bg-gray-100 overflow-hidden">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 p-[15px]"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* 
        {error && (
          <View className="bg-[#FFEBEE] rounded-lg p-3 mb-4 border border-[#FFCDD2]">
            <Text className="text-[#D32F2F] text-sm">{error}</Text>
          </View>
        )} */}


        <View className="mb-8" style={{ zIndex: 100 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xl text-secondary/80 font-semibold mb-md">
              Where to go? <Text className="text-red-500 text-lg">*</Text>
            </Text>
            {formik.values.tripDestinations && formik.values.tripDestinations.length > 0 && (
              <Text className="text-xs text-secondary/60 font-medium mb-md">
                {formik.values.tripDestinations.length}/3
              </Text>
            )}
          </View>


          {/* Search Box with Predictions Listed Below */}
          <TripDestinationSearchBox
            ref={destinationSearchRef}
            onSelect={handleSelectDestination}
            placeholder={
              formik.values.tripDestinations && formik.values.tripDestinations.length >= 5
                ? "Maximum of 5 destinations reached"
                : formik.values.tripDestinations && formik.values.tripDestinations.length > 0
                  ? "Add another destination..."
                  : "Search place, city, or country"
            }
            disabled={isSaving || Boolean(formik.values.tripDestinations && formik.values.tripDestinations.length >= 5)}
          />

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

          {/* Selected Destination Tags */}
          {formik.values.tripDestinations && formik.values.tripDestinations.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-3 mt-3">
              {formik.values.tripDestinations.map((item: TripDestinationDto, index: number) => (
                <View
                  key={`${item.destination}-${index}`}
                  className="flex-row items-center bg-white border border-[#E0E0E0] rounded-full py-1 pl-2 pr-1 shadow-xs"
                >
                  <Icon name="place" size={15} color={colors.error} style={{ marginRight: 4, opacity: 0.4 }} />
                  <Text className="text-sm font-semibold text-secondary mr-2" numberOfLines={1}>
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
              mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+F04438(${longitude},${latitude})/${longitude},${latitude},${zoom},0/600x260?access_token=${MAPBOX_ACCESS_TOKEN}`;
            } else {
              const pins = validDestinations
                .slice(0, 5)
                .map((d: TripDestinationDto) => {
                  const c = d.destinationData!.coordinates;
                  return `pin-s+F04438(${c.longitude},${c.latitude})`;
                })
                .join(",");
              mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pins}/auto/600x260?padding=40,40,40,40&access_token=${MAPBOX_ACCESS_TOKEN}`;
            }

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => destinationSearchRef.current?.focus()}
                disabled={isSaving}
                className=""
                accessibilityRole="button"
                accessibilityLabel="Focus trip destination search"
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
                </View>
              </TouchableOpacity>
            );
          })()}
        </View>

        <View className="">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xl text-secondary/80 font-semibold mb-md">
              Travel Dates
            </Text>

            {isDayTour && (
              <View className="bg-blue-50 border border-accent/80 rounded-full px-2 mr-2 opacity-50">
                <Text className="text-accent text-[10px] font-bold uppercase tracking-wider">Day Trip</Text>
              </View>
            )}
          </View>
          <View className="relative mt-sm mb-2">
            <TextInput
              mode="outlined"
              placeholder="Depart Date → Return Date"
              value={formattedTripDates}
              editable={false}
              left={<TextInput.Icon icon="calendar" color="#999" />}
              right={formik.values.startOrDepartureDate ? (
                <TextInput.Icon
                  icon="close"
                  onPress={() => {
                    formik.setFieldValue("startOrDepartureDate", null);
                    formik.setFieldValue("endOrReturnDate", null);
                  }}
                />
              ) : null}
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
                marginTop: -6,
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
            }}
          />
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
              <Text className={`mt-2 text-lg text-gray-700`}>
                Generate sections
              </Text>

              <Text className={`text-base text-gray-400 leading-3xl pr-2xl`}>
                Automatically create sections for each day based on your travel dates.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="mb-8">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg text-secondary/80 font-semibold mb-1">Purpose</Text>
            {formik.values.type != null && formik.values.type !== TripType.none && (
              <TouchableOpacity
                onPress={() => formik.setFieldValue("type", TripType.none)}
                accessibilityRole="button"
                accessibilityLabel="Clear travel type"
                className="py-1 px-2.5 rounded-lg bg-gray-100"
                activeOpacity={0.7}
              >
                <Text className="text-sm text-gray-500 font-semibold underline">Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-base text-tertiary mb-3">
            Type helps organize activities and recommendations.
          </Text>

          {/* 6 Selectable Cards in 2 Rows (3 per row) */}
          {(() => {
            const commonCardsRow1 = [
              { type: TripType.vacation, label: "Vacation" },
              { type: TripType.business, label: "Business" },
              { type: TripType.event, label: "Event" },
            ];

            const commonCardsRow2 = [
              { type: TripType.roadtrip, label: "Road Trip" },
              { type: TripType.weekendGetaway, label: "Weekend Getaway" },
            ];

            const isOtherSelected =
              formik.values.type != null &&
              formik.values.type !== TripType.none &&
              ![TripType.vacation, TripType.business, TripType.event, TripType.roadtrip, TripType.weekendGetaway].includes(
                formik.values.type
              );

            const renderCard = (item: { type: TripType; label: string }) => {
              const isSelected = formik.values.type === item.type;
              return (
                <TouchableOpacity
                  key={item.type}
                  onPress={() => {
                    formik.setFieldValue("type", isSelected ? TripType.none : item.type);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${item.label} trip type`}
                  className="flex-1 min-h-[96px] py-3 px-1.5 rounded-2xl items-center justify-center border"
                  style={[
                    {
                      borderColor: isSelected ? colors.primary : "#E5E7EB",
                      backgroundColor: isSelected ? `${colors.primary}12` : "#FFFFFF",
                    },
                  ]}
                >
                  <View className="items-center justify-center">
                    <TripIcon type={item.type} size={30} showIconOnly={true} />
                    <Text
                      numberOfLines={2}
                      className="text-xs font-semibold text-center mt-2 opacity-70"
                      style={{ color: isSelected ? "#344054" : "#374151" }}
                    >
                      {item.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            };

            return (
              <View className="w-full">
                {/* Row 1: Vacation, Business, Event */}
                <View className="flex-row gap-2.5 mb-2.5">
                  {commonCardsRow1.map(renderCard)}
                </View>

                {/* Row 2: Road Trip, Weekend Getaway, See More */}
                <View className="flex-row gap-2.5">
                  {commonCardsRow2.map(renderCard)}

                  {/* Card 6: See More Type */}
                  <TouchableOpacity
                    onPress={() => setShowTripTypeModal(true)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="See more trip types"
                    className="flex-1 min-h-[96px] py-3 px-1.5 rounded-2xl items-center justify-center border"
                    style={[
                      {
                        borderColor: isOtherSelected ? colors.primary : "#E5E7EB",
                        backgroundColor: isOtherSelected ? `${colors.primary}12` : "#FFFFFF",
                      },
                    ]}
                  >
                    <View className="items-center justify-center">
                      {isOtherSelected ? (
                        <TripIcon type={formik.values.type} size={22} showIconOnly={true} />
                      ) : (
                        <View
                          className="rounded-full p-1.5"
                        >
                          <Icon name="grid-view" size={22} color={colors.primary} />
                        </View>
                      )}
                      <Text
                        numberOfLines={2}
                        className="text-xs font-semibold text-center mt-2 opacity-80"
                        style={{ color: isOtherSelected ? "#344054" : "#374151" }}
                      >
                        {isOtherSelected ? getTripTypeLabel(formik.values.type) : "See More"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
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

        <View className="mb-4 flex-1">
          <Text className="text-lg text-secondary/80 font-semibold mb-1">Describe your trip</Text>
          <Text className="text-base text-tertiary mb-3">
            You may give your trip a custom name and describe it to help you stay organized.
          </Text>

          {/* <Text className="text-xs font-semibold tracking-wider uppercase">Title <Text className="text-red-500 text-lg">*</Text></Text> */}
          <View className="relative justify-center flex-1">
            <FloatingLabelInput
              label="Title *"
              placeholder={`e.g. ${currentWord}`}
              value={formik.values.title}
              onChangeText={formik.handleChange("title")}
              onBlur={formik.handleBlur("title")}
              error={formik.touched.title && Boolean(formik.errors.title)}
              disabled={isSaving}
              maxLength={40}
              contentStyle={{
                paddingRight: formik.values.title ? 80 : 55,
              }}
              right={
                formik.values.title ? (
                  <TextInput.Icon
                    icon="close"
                    color="#98A2B3"
                    size={20}
                    onPress={() => formik.setFieldValue("title", "")}
                    accessibilityLabel="Clear title"
                    forceTextInputFocus={false}
                  />
                ) : null
              }
            />
            <Text
              className={`absolute ${formik.values.title ? "right-6" : "right-6"} bottom-2 text-xs`}
              pointerEvents="none"
              style={{ color: '#98A2B3' }}
            >
              {(formik.values.title || "").length}/40
            </Text>
          </View>

          {formik.touched.title && formik.errors.title && (
            <View className="flex flex-row items-center mt-1">
              <Icon name="info-outline" size={14} color="#fb2c36" />
              <Text className="text-red-500 text-xs ml-1" >{formik.errors.title as string}</Text>
            </View>
          )}
        </View>


        <View className="mb-6">
          {/* <Text className="text-xs font-semibold tracking-wider uppercase">Description</Text> */}
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

        <View className="mb-8 mt-2 mx-4 bg-red-50">
          <TouchButton
            buttonText={isSaving ? "Saving..." : mode === "create" ? "Create Trip" : "Update Changes"}
            icon={mode === "create" ? "add" : ""}
            onPress={() => formik.handleSubmit()}
            disabled={!formik.values.title.trim() || isSaving}
            className="h-7xl p-6"
            labelClassName="text-xl"
          />
        </View>
      </ScrollView>
      {/* 
      {!hideSubmitButton && (
       
      )} */}
    </View>
  );
});

export default CreateOrEdit;
