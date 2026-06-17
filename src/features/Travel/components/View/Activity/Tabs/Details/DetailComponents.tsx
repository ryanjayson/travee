import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { FlightDetailsCard } from "./FlightDetailsCard";
import { AccomodationDetailsCard } from "./AccomodationDetailsCard";
import {
  FlightDetailsDto,
  AccomodationDetailsDto,
  CafeRestaurantDetailsDto,
  NatureDetailsDto,
  ShoppingDetailsDto,
  EntertainmentDetailsDto,
  TransportationDetailsDto,
  WalkDetailsDto,
  SightseeingDetailsDto,
  PreparationDetailsDto,
  RestDetailsDto,
  HikeOrCampDetailsDto,
  MotorcycleRideDetailsDto,
  MeetupDetailsDto,
  RideRentalDetailsDto,
} from "../../../../../types/TravelDto";

// Common layout helpers
const DetailCard = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
      <View className="flex-row items-center border-b border-gray-100 pb-3 mb-4">
        <Icon name={icon as any} size={22} color={colors.primary} />
        <Text className="text-lg font-semibold text-gray-900 ml-2">{title}</Text>
      </View>
      {children}
    </View>
  );
};

const Field = ({
  label,
  value,
  icon,
  onPress,
  isLink,
}: {
  label: string;
  value?: string | number | null;
  icon?: string;
  onPress?: () => void;
  isLink?: boolean;
}) => {
  const { colors } = useTheme();
  if (value === undefined || value === null || String(value).trim() === "") return null;

  return (
    <View className="flex-row items-start mb-3.5 gap-3">
      {icon ? (
        <View className="bg-gray-50 p-2 rounded-lg mt-0.5">
          <Icon name={icon as any} size={16} color="#667085" />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{label}</Text>
        {onPress ? (
          <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
            <Text className={`text-sm font-semibold ${isLink ? "underline" : "text-gray-900"}`} style={isLink ? { color: colors.primary } : {}}>
              {value}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-sm font-medium text-gray-900">{value}</Text>
        )}
      </View>
    </View>
  );
};

const handleOpenLink = (url: string) => {
  if (url) {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    Linking.openURL(formattedUrl).catch((err) => console.error("Failed to open link", err));
  }
};

const handleCall = (phone: string) => {
  if (phone) {
    Linking.openURL(`tel:${phone}`).catch((err) => console.error("Failed to make call", err));
  }
};

const handleEmail = (email: string) => {
  if (email) {
    Linking.openURL(`mailto:${email}`).catch((err) => console.error("Failed to send email", err));
  }
};

const formatDate = (dateValue: Date | string | null | undefined) => {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

export const FlightDetails = ({ data }: { data?: FlightDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No flight details available.</Text>;

  return <FlightDetailsCard data={data} />;
};

export const AccomodationDetails = ({ data }: { data?: AccomodationDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No accommodation details available.</Text>;

  return <AccomodationDetailsCard data={data} />;
};

export const CafeRestaurantDetails = ({ data }: { data?: CafeRestaurantDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No restaurant details available.</Text>;

  return (
    <DetailCard title="Cafe / Restaurant Details" icon="restaurant">
      <Field label="Restaurant Name" value={data.restaurantName} icon="restaurant" />
      <Field label="Address" value={data.address} icon="location-on" />
      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <Field label="Cuisine" value={data.cuisine} icon="local-pizza" />
        </View>
        <View className="w-1/2">
          <Field label="Price Range" value={data.priceRange} icon="attach-money" />
        </View>
        <View className="w-1/2">
          <Field label="Contact Number" value={data.contactNumber} icon="phone" onPress={data.contactNumber ? () => handleCall(data.contactNumber!) : undefined} />
        </View>
        <View className="w-1/2">
          <Field label="Reservation" value={data.reservationLink} icon="book-online" isLink onPress={data.reservationLink ? () => handleOpenLink(data.reservationLink!) : undefined} />
        </View>
        <View className="w-full">
          <Field label="Website" value={data.websiteAddress} icon="language" isLink onPress={data.websiteAddress ? () => handleOpenLink(data.websiteAddress!) : undefined} />
        </View>
      </View>
    </DetailCard>
  );
};

export const NatureDetails = ({ data }: { data?: NatureDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No spot details available.</Text>;

  return (
    <DetailCard title="Nature Details" icon="park">
      <Field label="Spot Name" value={data.spotName} icon="park" />
      <Field label="Address" value={data.address} icon="location-on" />
      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <Field label="Spot Type" value={data.subType} icon="category" />
        </View>
        <View className="w-1/2">
          <Field label="Entry Fee" value={data.entryFee} icon="local-activity" />
        </View>
      </View>
    </DetailCard>
  );
};

export const ShoppingDetails = ({ data }: { data?: ShoppingDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No shopping details available.</Text>;

  return (
    <DetailCard title="Shopping Details" icon="shopping-bag">
      <Field label="Venue Name" value={data.venueName} icon="store" />
      <Field label="Address" value={data.address} icon="location-on" />
      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <Field label="Store Type" value={data.subType} icon="category" />
        </View>
        <View className="w-1/2">
          <Field label="Website" value={data.websiteAddress} icon="language" isLink onPress={data.websiteAddress ? () => handleOpenLink(data.websiteAddress!) : undefined} />
        </View>
      </View>
    </DetailCard>
  );
};

export const EntertainmentDetails = ({ data }: { data?: EntertainmentDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No entertainment details available.</Text>;

  return (
    <DetailCard title="Entertainment Details" icon="local-play">
      <Field label="Venue Name" value={data.venueName} icon="movie" />
      <Field label="Address" value={data.address} icon="location-on" />
      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <Field label="Type" value={data.subType} icon="category" />
        </View>
        <View className="w-1/2">
          <Field label="Ticket Price" value={data.ticketPrice} icon="attach-money" />
        </View>
        <View className="w-1/2">
          <Field label="Booking Ref" value={data.bookingReference} icon="confirmation-number" />
        </View>
        <View className="w-1/2">
          <Field label="Website" value={data.websiteAddress} icon="language" isLink onPress={data.websiteAddress ? () => handleOpenLink(data.websiteAddress!) : undefined} />
        </View>
      </View>
    </DetailCard>
  );
};

export const TransportationDetails = ({ data }: { data?: TransportationDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No transportation details available.</Text>;

  return (
    <DetailCard title="Transportation Details" icon="directions-bus">
      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <Field label="Mode" value={data.mode} icon="train" />
        </View>
        <View className="w-1/2">
          <Field label="Operator / Provider" value={data.operatorProvider} icon="business" />
        </View>
        <View className="w-full">
          <Field label="Pickup Location" value={data.pickupLocation} icon="pin-drop" />
        </View>
        <View className="w-full">
          <Field label="Dropoff Location" value={data.dropoffLocation} icon="place" />
        </View>
        <View className="w-1/2">
          <Field label="Booking Reference" value={data.bookingReference} icon="confirmation-number" />
        </View>
        <View className="w-1/2">
          <Field label="Price" value={data.price} icon="attach-money" />
        </View>
      </View>
    </DetailCard>
  );
};

export const WalkDetails = ({ data }: { data?: WalkDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No walk details available.</Text>;

  return (
    <DetailCard title="Walk Details" icon="directions-walk">
      <Field label="Route Name" value={data.routeName} icon="map" />
      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <Field label="Est. Distance" value={data.estimatedDistanceKm ? `${data.estimatedDistanceKm} Km` : null} icon="straighten" />
        </View>
        <View className="w-1/2">
          <Field label="Est. Duration" value={data.estimatedDuration} icon="timer" />
        </View>
      </View>
    </DetailCard>
  );
};

export const SightseeingDetails = ({ data }: { data?: SightseeingDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No sightseeing details available.</Text>;

  return (
    <DetailCard title="Sightseeing Details" icon="camera-alt">
      <Field label="Attraction Name" value={data.attractionName} icon="museum" />
      <Field label="Address" value={data.address} icon="location-on" />
      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <Field label="Entry Fee" value={data.entryFee} icon="local-activity" />
        </View>
        <View className="w-1/2">
          <Field label="Website" value={data.websiteAddress} icon="language" isLink onPress={data.websiteAddress ? () => handleOpenLink(data.websiteAddress!) : undefined} />
        </View>
      </View>
    </DetailCard>
  );
};

export const PreparationDetails = ({ data }: { data?: PreparationDetailsDto | null }) => {
  const { colors } = useTheme();
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No preparation details available.</Text>;

  const getPriorityColor = (priority?: string | null) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return colors.error || "#D92D20";
      case "medium":
        return "#DC6803";
      case "low":
        return "#079455";
      default:
        return "#475467";
    }
  };

  return (
    <DetailCard title="Preparation Details" icon="assignment-turned-in">
      <Field label="Task" value={data.taskLabel} icon="task" />
      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <Field label="Deadline" value={data.deadlineDateTime ? formatDate(data.deadlineDateTime) : null} icon="event" />
        </View>
        {data.priority ? (
          <View className="w-1/2 mb-3.5 flex-row items-center gap-3">
            <View className="bg-gray-50 p-2 rounded-lg mt-0.5">
              <Icon name="priority-high" size={16} color="#667085" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Priority</Text>
              <View className="flex-row">
                <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: getPriorityColor(data.priority) + "15" }}>
                  <Text className="text-xs font-bold capitalize" style={{ color: getPriorityColor(data.priority) }}>
                    {data.priority}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}
        <View className="w-full">
          <Field label="Notes" value={data.notes} icon="notes" />
        </View>
      </View>
    </DetailCard>
  );
};

export const RestDetails = ({ data }: { data?: RestDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No rest details available.</Text>;

  return (
    <DetailCard title="Rest Details" icon="hotel">
      <Field label="Rest Location" value={data.restLocationName} icon="bed" />
      <Field label="Location Type" value={data.restLocationType} icon="category" />
    </DetailCard>
  );
};

export const HikeOrCampDetails = ({ data }: { data?: HikeOrCampDetailsDto | null }) => {
  const { colors } = useTheme();
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No hike or camp details available.</Text>;

  return (
    <DetailCard title="Hike / Camp Details" icon="terrain">
      <Field label="Trail or Site Name" value={data.trailOrSiteName} icon="landscape" />
      <Field label="Address" value={data.address} icon="location-on" />
      <View className="flex-row">
        <View className="w-1/2">
          <Field label="Check-in / Start" value={data.checkinDateTime ? formatDate(data.checkinDateTime) : null} icon="login" />
        </View>
        <View className="w-1/2">
          <Field label="Check-out / End" value={data.checkoutDateTime ? formatDate(data.checkoutDateTime) : null} icon="logout" />
        </View>
      </View>
      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <Field label="Activity Type" value={data.subType} icon="category" />
        </View>
        <View className="w-1/2">
          <Field label="Est. Distance" value={data.estimatedDistanceKm ? `${data.estimatedDistanceKm} Km` : null} icon="straighten" />
        </View>
        <View className="w-1/2">
          <Field label="Campsite Name" value={data.campsiteName} icon="camping" />
        </View>
        {data.permitRequired !== undefined && data.permitRequired !== null ? (
          <View className="w-1/2 mb-3.5 flex-row items-center gap-3">
            <View className="bg-gray-50 p-2 rounded-lg mt-0.5">
              <Icon name="verified" size={16} color="#667085" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Permit Required</Text>
              <View className="flex-row">
                <View className="rounded-full px-2.5 py-0.5" style={{ backgroundColor: data.permitRequired ? `${colors.error}15` : "#07945515" }}>
                  <Text className="text-xs font-bold capitalize" style={{ color: data.permitRequired ? colors.error : "#079455" }}>
                    {data.permitRequired ? "Yes" : "No"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}
        <View className="w-1/2">
          <Field label="Contact Person" value={data.contactPerson} icon="person" />
        </View>
        <View className="w-1/2">
          <Field label="Contact Number" value={data.contactNumber} icon="phone" onPress={data.contactNumber ? () => handleCall(data.contactNumber!) : undefined} />
        </View>
        <View className="w-1/2">
          <Field label="Reservation Link" value={data.reservationLink} icon="book-online" isLink onPress={data.reservationLink ? () => handleOpenLink(data.reservationLink!) : undefined} />
        </View>
        <View className="w-1/2">
          <Field label="Website" value={data.websiteAddress} icon="language" isLink onPress={data.websiteAddress ? () => handleOpenLink(data.websiteAddress!) : undefined} />
        </View>
      </View>
    </DetailCard>
  );
};

export const MotorcycleRideDetails = ({ data }: { data?: MotorcycleRideDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No motorcycle ride details available.</Text>;

  return (
    <DetailCard title="Motorcycle Ride Details" icon="motorcycle">
      <Field label="Route Name" value={data.routeName} icon="map" />
      <View className="flex-row flex-wrap">
        <View className="w-full">
          <Field label="Starting Point" value={data.startingPoint} icon="trip-origin" />
        </View>
        <View className="w-full">
          <Field label="Ending Point" value={data.endingPoint} icon="sports-score" />
        </View>
        <View className="w-1/2">
          <Field label="Est. Distance" value={data.estimatedDistanceKm ? `${data.estimatedDistanceKm} Km` : null} icon="straighten" />
        </View>
        <View className="w-1/2">
          <Field label="Road Type" value={data.roadType} icon="terrain" />
        </View>
        <View className="w-1/2">
          <Field label="Bike Model" value={data.bikeModel} icon="two-wheeler" />
        </View>
        <View className="w-1/2">
          <Field label="Fuel Stops" value={data.fuelStops} icon="local-gas-station" />
        </View>
      </View>
    </DetailCard>
  );
};

export const MeetupDetails = ({ data }: { data?: MeetupDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No meetup details available.</Text>;

  return (
    <DetailCard title="Meetup Details" icon="people">
      <Field label="Venue Name" value={data.venueName} icon="place" />
      <Field label="Address" value={data.address} icon="location-on" />
      <View className="flex-row flex-wrap">
        <View className="w-1/2">
          <Field label="Host / Organizer" value={data.hostOrOrganizer} icon="person" />
        </View>
        <View className="w-1/2">
          <Field label="No. of People" value={data.numberOfPeople} icon="group" />
        </View>
        <View className="w-1/2">
          <Field label="Meetup Type" value={data.meetupType} icon="category" />
        </View>
        <View className="w-1/2">
          <Field label="RSVP Link" value={data.rsvpLink} icon="insert-link" isLink onPress={data.rsvpLink ? () => handleOpenLink(data.rsvpLink!) : undefined} />
        </View>
      </View>
    </DetailCard>
  );
};

export const RideRentalDetails = ({ data }: { data?: RideRentalDetailsDto | null }) => {
  if (!data) return <Text className="text-gray-500 italic p-4 text-center">No rental details available.</Text>;

  return (
    <DetailCard title="Ride Rental Details" icon="car-rental">
      <Field label="Provider Name" value={data.providerName} icon="business" />
      <Field label="Vehicle Type" value={data.vehicleType} icon="directions-car" />
      <View className="flex-row">
        <View className="w-1/2">
          <Field label="Rental Start" value={data.rentalStartDateTime ? formatDate(data.rentalStartDateTime) : null} icon="login" />
        </View>
        <View className="w-1/2">
          <Field label="Rental End" value={data.rentalEndDateTime ? formatDate(data.rentalEndDateTime) : null} icon="logout" />
        </View>
      </View>
      <View className="flex-row flex-wrap">
        <View className="w-full">
          <Field label="Pickup Location" value={data.pickupLocation} icon="pin-drop" />
        </View>
        <View className="w-full">
          <Field label="Dropoff Location" value={data.dropoffLocation} icon="place" />
        </View>
        <View className="w-1/2">
          <Field label="Booking Ref" value={data.bookingReference} icon="confirmation-number" />
        </View>
        <View className="w-1/2">
          <Field label="Price" value={data.price} icon="attach-money" />
        </View>
      </View>
    </DetailCard>
  );
};
