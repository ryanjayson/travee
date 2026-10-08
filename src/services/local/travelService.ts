import { database } from "../../db";
import { Q } from "@nozbe/watermelondb";
import Travel from "../../db/models/Travel";
import Section from "../../db/models/Section";
import Activity from "../../db/models/Activity";
import FlightDetails from "../../db/models/FlightDetails";
import AccomodationDetails from "../../db/models/AccomodationDetails";
import SightseeingDetails from "../../db/models/SightseeingDetails";
import HikeOrCampDetails from "../../db/models/HikeOrCampDetails";
import CafeRestaurantDetails from "../../db/models/CafeRestaurantDetails";
import NatureDetails from "../../db/models/NatureDetails";
import ShoppingDetails from "../../db/models/ShoppingDetails";
import EntertainmentDetails from "../../db/models/EntertainmentDetails";
import TransportationDetails from "../../db/models/TransportationDetails";
import WalkDetails from "../../db/models/WalkDetails";
import PreparationDetails from "../../db/models/PreparationDetails";
import RestDetails from "../../db/models/RestDetails";
import MotorcycleRideDetails from "../../db/models/MotorcycleRideDetails";
import MeetupDetails from "../../db/models/MeetupDetails";
import RideRentalDetails from "../../db/models/RideRentalDetails";
import TripDestination from "../../db/models/TripDestination";
import TripSetting from "../../db/models/TripSetting";
import ChecklistGroup from "../../db/models/ChecklistGroup";
import ChecklistItem from "../../db/models/ChecklistItem";
import Expense from "../../db/models/Expense";
import Note from "../../db/models/Note";
import { ActivityType, TripPlanType, TravelStatus } from "../../types/enums";
import { safeJsonParse } from "../../utils/safeJsonParse";

const sanitizeDate = (d: any) => {
  if (!d) return null;
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime()) || dateObj.getTime() <= 0) return null;
  return dateObj;
};

export const fetchLocalAccomodationDetails = async (activityId: string): Promise<any | null> => {
  try {
    const accomodationDetailsList = await database.get<AccomodationDetails>("accomodation_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (accomodationDetailsList.length > 0) {
      const a = accomodationDetailsList[0];
      return {
        id: a.id,
        activityId: a.activity.id,
        accomodationName: a.accomodationName,
        address: a.address,
        destinationAddressData: safeJsonParse(a.destinationAddressData, undefined),
        subType: a.subType,
        checkinDateTime: sanitizeDate(a.checkinDateTime),
        checkoutDateTime: sanitizeDate(a.checkoutDateTime),
        websiteAddress: a.websiteAddress,
        bookingReference: a.bookingReference,
        bookingStatus: a.bookingStatus,
        contactNumber: a.contactNumber,
        emailAddress: a.emailAddress,
        contactName: a.contactName,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local accomodation details:", err);
    return null;
  }
};

export const fetchLocalFlightDetails = async (activityId: string): Promise<any | null> => {
  try {
    const flightDetailsList = await database.get<FlightDetails>("flight_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (flightDetailsList.length > 0) {
      const f = flightDetailsList[0];
      return {
        id: f.id,
        activityId: f.activity.id,
        departureAirport: f.departureAirport,
        arrivalAirport: f.arrivalAirport,
        departureDate: sanitizeDate(f.departureDate),
        arrivalDate: sanitizeDate(f.arrivalDate),
        flightNumber: f.flightNumber,
        airline: f.airline,
        gate: f.gate,
        terminal: f.terminal,
        seatNumber: f.seatNumber,
        bookingReference: f.bookingReference,
        price: f.price,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local flight details:", err);
    return null;
  }
};

export const fetchLocalSightseeingDetails = async (activityId: string): Promise<any | null> => {
  try {
    const sightseeingDetailsList = await database.get<SightseeingDetails>("sightseeing_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (sightseeingDetailsList.length > 0) {
      const s = sightseeingDetailsList[0];
      return {
        id: s.id,
        activityId: s.activity.id,
        attractionName: s.attractionName,
        address: s.address,
        destinationAddressData: s.destinationAddressData ? JSON.parse(s.destinationAddressData) : null,
        entryFee: s.entryFee,
        websiteAddress: s.websiteAddress,
        bookingReference: s.bookingReference,
        contactNumber: s.contactNumber,
        emailAddress: s.emailAddress,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local sightseeing details:", err);
    return null;
  }
};

export const fetchLocalHikeOrCampDetails = async (activityId: string): Promise<any | null> => {
  try {
    const hikeOrCampDetailsList = await database.get<HikeOrCampDetails>("hike_or_camp_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (hikeOrCampDetailsList.length > 0) {
      const h = hikeOrCampDetailsList[0];
      return {
        id: h.id,
        activityId: h.activity.id,
        trailOrSiteName: h.trailOrSiteName,
        address: h.address,
        destinationAddressData: safeJsonParse(h.destinationAddressData, undefined),
        subType: h.subType,
        estimatedDistanceKm: h.estimatedDistanceKm,
        campsiteName: h.campsiteName,
        permitRequired: h.permitRequired,
        contactPerson: h.contactPerson,
        contactNumber: h.contactNumber,
        emailAddress: h.emailAddress,
        websiteAddress: h.websiteAddress,
        reservationLink: h.reservationLink,
        checkinDateTime: h.checkinDateTime,
        checkoutDateTime: h.checkoutDateTime,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local hike or camp details:", err);
    return null;
  }
};

export const fetchLocalCafeRestaurantDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<CafeRestaurantDetails>("cafe_restaurant_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        restaurantName: item.restaurantName,
        address: item.address,
        destinationAddressData: safeJsonParse(item.destinationAddressData, undefined),
        cuisine: item.cuisine,
        priceRange: item.priceRange,
        reservationLink: item.reservationLink,
        websiteAddress: item.websiteAddress,
        contactNumber: item.contactNumber,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local cafe restaurant details:", err);
    return null;
  }
};

export const fetchLocalNatureDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<NatureDetails>("nature_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        spotName: item.spotName,
        address: item.address,
        destinationAddressData: safeJsonParse(item.destinationAddressData, undefined),
        subType: item.subType,
        entryFee: item.entryFee,
        websiteAddress: item.websiteAddress,
        contactName: item.contactName,
        contactNumber: item.contactNumber,
        emailAddress: item.emailAddress,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local nature details:", err);
    return null;
  }
};

export const fetchLocalShoppingDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<ShoppingDetails>("shopping_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        venueName: item.venueName,
        address: item.address,
        destinationAddressData: safeJsonParse(item.destinationAddressData, undefined),
        subType: item.subType,
        websiteAddress: item.websiteAddress,
        bookingReferenceOrLink: item.bookingReferenceOrLink,
        promoCodeOrLink: item.promoCodeOrLink,
        contactNumber: item.contactNumber,
        emailAddress: item.emailAddress,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local shopping details:", err);
    return null;
  }
};

export const fetchLocalEntertainmentDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<EntertainmentDetails>("entertainment_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        venueName: item.venueName,
        address: item.address,
        destinationAddressData: safeJsonParse(item.destinationAddressData, undefined),
        subType: item.subType,
        websiteAddress: item.websiteAddress,
        ticketPrice: item.ticketPrice,
        bookingReference: item.bookingReference,
        contactName: item.contactName,
        contactNumber: item.contactNumber,
        emailAddress: item.emailAddress,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local entertainment details:", err);
    return null;
  }
};

export const fetchLocalTransportationDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<TransportationDetails>("transportation_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        mode: item.mode,
        operatorProvider: item.operatorProvider,
        pickupLocation: item.pickupLocation,
        dropoffLocation: item.dropoffLocation,
        departureDateTime: sanitizeDate(item.departureDateTime),
        arrivalDateTime: sanitizeDate(item.arrivalDateTime),
        seatOrVehicleNumber: item.seatOrVehicleNumber,
        bookingReference: item.bookingReference,
        bookingStatus: item.bookingStatus,
        price: item.price,
        websiteAddress: item.websiteAddress,
        contactNumber: item.contactNumber,
        notes: item.notes,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local transportation details:", err);
    return null;
  }
};

export const fetchLocalWalkDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<WalkDetails>("walk_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        routeName: item.routeName,
        estimatedDistanceKm: item.estimatedDistanceKm,
        estimatedDuration: item.estimatedDuration,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local walk details:", err);
    return null;
  }
};

export const fetchLocalPreparationDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<PreparationDetails>("preparation_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        taskLabel: item.taskLabel,
        deadlineDateTime: item.deadlineDateTime,
        priority: item.priority,
        notes: item.notes,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local preparation details:", err);
    return null;
  }
};

export const fetchLocalRestDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<RestDetails>("rest_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        restLocationName: item.restLocationName,
        restLocationType: item.restLocationType,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local rest details:", err);
    return null;
  }
};

export const fetchLocalMotorcycleRideDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<MotorcycleRideDetails>("motorcycle_ride_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        routeName: item.routeName,
        startingPoint: item.startingPoint,
        endingPoint: item.endingPoint,
        estimatedDistanceKm: item.estimatedDistanceKm,
        roadType: item.roadType,
        bikeModel: item.bikeModel,
        fuelStops: item.fuelStops,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local motorcycle ride details:", err);
    return null;
  }
};

export const fetchLocalMeetupDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<MeetupDetails>("meetup_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        venueName: item.venueName,
        address: item.address,
        destinationAddressData: safeJsonParse(item.destinationAddressData, undefined),
        hostOrOrganizer: item.hostOrOrganizer,
        numberOfPeople: item.numberOfPeople,
        meetupType: item.meetupType,
        rsvpLink: item.rsvpLink,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local meetup details:", err);
    return null;
  }
};

export const fetchLocalRideRentalDetails = async (activityId: string): Promise<any | null> => {
  try {
    const list = await database.get<RideRentalDetails>("ride_rental_details").query(
      Q.where("activity_id", activityId)
    ).fetch();
    if (list.length > 0) {
      const item = list[0];
      return {
        id: item.id,
        activityId: item.activity.id,
        providerName: item.providerName,
        address: item.address,
        destinationAddressData: safeJsonParse(item.destinationAddressData, undefined),
        vehicleType: item.vehicleType,
        vehicleModel: item.vehicleModel,
        pickupLocation: item.pickupLocation,
        dropoffLocation: item.dropoffLocation,
        rentalStartDateTime: sanitizeDate(item.rentalStartDateTime),
        rentalEndDateTime: sanitizeDate(item.rentalEndDateTime),
        bookingReference: item.bookingReference,
        bookingStatus: item.bookingStatus,
        price: item.price,
        websiteAddress: item.websiteAddress,
        contactName: item.contactName,
        contactNumber: item.contactNumber,
        emailAddress: item.emailAddress,
        notes: item.notes,
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local ride rental details:", err);
    return null;
  }
};

export const fetchLocalTripDestinations = async (travelId: string): Promise<any[]> => {
  try {
    const list = await database.get<TripDestination>("trip_destinations").query(
      Q.where("travel_id", travelId)
    ).fetch();
    return list.map((d) => ({
      id: d.id,
      travelId: d.travelId,
      destination: d.destination,
      destinationData: safeJsonParse(d.destinationData, undefined),
    }));
  } catch (err) {
    console.error("Error fetching local trip destinations:", err);
    return [];
  }
};

export const getTravelsLocally = async (): Promise<any[]> => {
  const offlineTravels = await database.get<Travel>("travels").query(
    Q.where("is_offline", true)
  ).fetch();

  let destinationsByTravelId = new Map<string, any[]>();
  try {
    const allTripDestinations = await database.get<TripDestination>("trip_destinations").query().fetch();
    for (const d of allTripDestinations) {
      const list = destinationsByTravelId.get(d.travelId) || [];
      list.push({
        id: d.id,
        travelId: d.travelId,
        destination: d.destination,
        destinationData: safeJsonParse(d.destinationData, undefined),
      });
      destinationsByTravelId.set(d.travelId, list);
    }
  } catch (e) {
    console.warn("Could not query trip_destinations:", e);
  }

  return offlineTravels.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    destination: t.destination,
    destinationData: safeJsonParse(t.destinationData, undefined),
    tripDestinations: destinationsByTravelId.get(t.id) || (t.destination ? [{ destination: t.destination, destinationData: safeJsonParse(t.destinationData, undefined) }] : []),
    startOrDepartureDate: t.startOrDepartureDate,
    endOrReturnDate: t.endOrReturnDate,
    status: t.status,
    budget: t.budget,
    notes: t.notes,
    isOffline: t.isOffline,
    isArchived: t.isArchived,
    type: t.type,
  }));
};

export const getTravelPlanLocally = async (id: number | string): Promise<any> => {
  try {
    const travelId = id.toString();
    const t = await database.get<Travel>("travels").find(travelId);

    const settings = await database.get("trip_settings").query(Q.where("travel_id", travelId)).fetch();
    let tripSetting = null;
    if (settings.length > 0) {
      const s = settings[0] as any;
      tripSetting = {
        id: s.id,
        travelId: travelId,
        currency: s.currency,
        timezone: s.timezone,
        itineraryView: s.itineraryView,
        allowItemReordering: s.allowItemReordering,
        showSectionTabNavigation: s.showSectionTabNavigation ?? false,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    }

    const tripDestinations = await fetchLocalTripDestinations(travelId);

    const travelDto = {
      id: t.id,
      title: t.title,
      description: t.description,
      destination: t.destination,
      destinationData: safeJsonParse(t.destinationData, undefined),
      tripDestinations,
      startOrDepartureDate: t.startOrDepartureDate,
      endOrReturnDate: t.endOrReturnDate,
      status: t.status,
      budget: t.budget,
      notes: t.notes,
      isOffline: t.isOffline,
      isArchived: t.isArchived,
      type: t.type,
      tripSetting,
    };

    let sections = await database.get<Section>("itinerary_sections").query(
      Q.where("travel_id", travelId),
      Q.sortBy("is_default_section", Q.desc),
      Q.sortBy("sort_order", Q.asc)
    ).fetch();

    const hasDefault = sections.some((s) => s.isDefaultSection);
    if (!hasDefault) {
      const defaultSec = await database.write(async () => {
        return await database.get<Section>("itinerary_sections").create((s) => {
          s.travel.id = travelId;
          s.title = "Activities";
          s.isDefaultSection = true;
          s.sortOrder = "0";
          s.isOffline = true;
        });
      });
      sections = [defaultSec, ...sections];
    }

    // ── Bulk-fetch all activity-level related records for this travel ──────────
    // This replaces the N+1 pattern (5 queries × N activities) with 5 flat
    // queries total. Each result is reduced into a Map keyed by activity_id
    // so lookups below are O(1).
    const [
      allNotes,
      allExpenses,
      allChecklists,
      allFlights,
      allAccomodations,
      allSightseeings,
      allHikeOrCamps,
      allCafeRestaurants,
      allNatures,
      allShoppings,
      allEntertainments,
      allTransportations,
      allWalks,
      allPreparations,
      allRests,
      allMotorcycles,
      allMeetups,
      allRideRentals
    ] = await Promise.all([
      database.get("itinerary_notes").query(Q.where("travel_id", travelId)).fetch(),
      database.get("itinerary_expenses").query(Q.where("travel_id", travelId)).fetch(),
      database.get("checklist_items").query(Q.where("travel_id", travelId)).fetch(),
      database.get<FlightDetails>("flight_details").query().fetch(),
      database.get<AccomodationDetails>("accomodation_details").query().fetch(),
      database.get<SightseeingDetails>("sightseeing_details").query().fetch(),
      database.get<HikeOrCampDetails>("hike_or_camp_details").query().fetch(),
      database.get<CafeRestaurantDetails>("cafe_restaurant_details").query().fetch(),
      database.get<NatureDetails>("nature_details").query().fetch(),
      database.get<ShoppingDetails>("shopping_details").query().fetch(),
      database.get<EntertainmentDetails>("entertainment_details").query().fetch(),
      database.get<TransportationDetails>("transportation_details").query().fetch(),
      database.get<WalkDetails>("walk_details").query().fetch(),
      database.get<PreparationDetails>("preparation_details").query().fetch(),
      database.get<RestDetails>("rest_details").query().fetch(),
      database.get<MotorcycleRideDetails>("motorcycle_ride_details").query().fetch(),
      database.get<MeetupDetails>("meetup_details").query().fetch(),
      database.get<RideRentalDetails>("ride_rental_details").query().fetch(),
    ]);

    // Count maps: activityId → count
    const notesCountMap = new Map<string, number>();
    for (const n of allNotes as any[]) {
      const aid = n._raw?.activity_id as string | null;
      if (aid) notesCountMap.set(aid, (notesCountMap.get(aid) ?? 0) + 1);
    }

    const expensesCountMap = new Map<string, number>();
    for (const e of allExpenses as any[]) {
      const aid = e._raw?.activity_id as string | null;
      if (aid) expensesCountMap.set(aid, (expensesCountMap.get(aid) ?? 0) + 1);
    }

    const checklistCountMap = new Map<string, number>();
    for (const c of allChecklists as any[]) {
      const aid = c._raw?.activity_id as string | null;
      if (aid) checklistCountMap.set(aid, (checklistCountMap.get(aid) ?? 0) + 1);
    }

    // Detail maps: activityId → first matching record (shaped DTO)
    const flightDetailsMap = new Map<string, any>();
    for (const f of allFlights) {
      const aid = (f as any)._raw?.activity_id as string | undefined;
      if (aid && !flightDetailsMap.has(aid)) {
        flightDetailsMap.set(aid, {
          id: f.id,
          activityId: aid,
          departureAirport: f.departureAirport,
          arrivalAirport: f.arrivalAirport,
          departureDate: sanitizeDate(f.departureDate),
          arrivalDate: sanitizeDate(f.arrivalDate),
          flightNumber: f.flightNumber,
          airline: f.airline,
          gate: f.gate,
          terminal: f.terminal,
          seatNumber: f.seatNumber,
          bookingReference: f.bookingReference,
          price: f.price,
        });
      }
    }

    const accomodationDetailsMap = new Map<string, any>();
    for (const a of allAccomodations) {
      const aid = (a as any)._raw?.activity_id as string | undefined;
      if (aid && !accomodationDetailsMap.has(aid)) {
        accomodationDetailsMap.set(aid, {
          id: a.id,
          activityId: aid,
          accomodationName: a.accomodationName,
          address: a.address,
          destinationAddressData: safeJsonParse(a.destinationAddressData, null),
          subType: a.subType,
          checkinDateTime: sanitizeDate(a.checkinDateTime),
          checkoutDateTime: sanitizeDate(a.checkoutDateTime),
          websiteAddress: a.websiteAddress,
          bookingReference: a.bookingReference,
          bookingStatus: a.bookingStatus,
          contactNumber: a.contactNumber,
          emailAddress: a.emailAddress,
          contactName: a.contactName,
        });
      }
    }
    const sightseeingDetailsMap = new Map<string, any>();
    for (const s of allSightseeings) {
      const aid = (s as any)._raw?.activity_id as string | undefined;
      if (aid && !sightseeingDetailsMap.has(aid)) {
        sightseeingDetailsMap.set(aid, {
          id: s.id,
          activityId: aid,
          attractionName: s.attractionName,
          address: s.address,
          destinationAddressData: s.destinationAddressData ? JSON.parse(s.destinationAddressData) : null,
          entryFee: s.entryFee,
          websiteAddress: s.websiteAddress,
          bookingReference: s.bookingReference,
          contactNumber: s.contactNumber,
          emailAddress: s.emailAddress,
        });
      }
    }

    const hikeOrCampDetailsMap = new Map<string, any>();
    for (const h of allHikeOrCamps) {
      const aid = (h as any)._raw?.activity_id as string | undefined;
      if (aid && !hikeOrCampDetailsMap.has(aid)) {
        hikeOrCampDetailsMap.set(aid, {
          id: h.id,
          activityId: aid,
          trailOrSiteName: h.trailOrSiteName,
          address: h.address,
          destinationAddressData: h.destinationAddressData ? JSON.parse(h.destinationAddressData) : null,
          subType: h.subType,
          estimatedDistanceKm: h.estimatedDistanceKm,
          campsiteName: h.campsiteName,
          permitRequired: h.permitRequired,
          contactPerson: h.contactPerson,
          contactNumber: h.contactNumber,
          websiteAddress: h.websiteAddress,
          reservationLink: h.reservationLink,
          checkinDateTime: h.checkinDateTime,
          checkoutDateTime: h.checkoutDateTime,
        });
      }
    }

    const cafeRestaurantDetailsMap = new Map<string, any>();
    for (const item of allCafeRestaurants) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !cafeRestaurantDetailsMap.has(aid)) {
        cafeRestaurantDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          restaurantName: item.restaurantName,
          address: item.address,
          destinationAddressData: item.destinationAddressData ? JSON.parse(item.destinationAddressData) : null,
          cuisine: item.cuisine,
          priceRange: item.priceRange,
          reservationLink: item.reservationLink,
          websiteAddress: item.websiteAddress,
          contactNumber: item.contactNumber,
        });
      }
    }

    const natureDetailsMap = new Map<string, any>();
    for (const item of allNatures) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !natureDetailsMap.has(aid)) {
        natureDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          spotName: item.spotName,
          address: item.address,
          destinationAddressData: item.destinationAddressData ? JSON.parse(item.destinationAddressData) : null,
          subType: item.subType,
          entryFee: item.entryFee,
        });
      }
    }

    const shoppingDetailsMap = new Map<string, any>();
    for (const item of allShoppings) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !shoppingDetailsMap.has(aid)) {
        shoppingDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          venueName: item.venueName,
          address: item.address,
          destinationAddressData: item.destinationAddressData ? JSON.parse(item.destinationAddressData) : null,
          subType: item.subType,
          websiteAddress: item.websiteAddress,
          bookingReferenceOrLink: item.bookingReferenceOrLink,
          promoCodeOrLink: item.promoCodeOrLink,
          contactNumber: item.contactNumber,
          emailAddress: item.emailAddress,
        });
      }
    }

    const entertainmentDetailsMap = new Map<string, any>();
    for (const item of allEntertainments) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !entertainmentDetailsMap.has(aid)) {
        entertainmentDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          venueName: item.venueName,
          address: item.address,
          destinationAddressData: item.destinationAddressData ? JSON.parse(item.destinationAddressData) : null,
          subType: item.subType,
          websiteAddress: item.websiteAddress,
          ticketPrice: item.ticketPrice,
          bookingReference: item.bookingReference,
        });
      }
    }

    const transportationDetailsMap = new Map<string, any>();
    for (const item of allTransportations) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !transportationDetailsMap.has(aid)) {
        transportationDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          mode: item.mode,
          operatorProvider: item.operatorProvider,
          pickupLocation: safeJsonParse(item.pickupLocation, item.pickupLocation),
          dropoffLocation: safeJsonParse(item.dropoffLocation, item.dropoffLocation),
          departureDateTime: sanitizeDate(item.departureDateTime),
          arrivalDateTime: sanitizeDate(item.arrivalDateTime),
          seatOrVehicleNumber: item.seatOrVehicleNumber,
          bookingReference: item.bookingReference,
          bookingStatus: item.bookingStatus,
          price: item.price,
          websiteAddress: item.websiteAddress,
          contactNumber: item.contactNumber,
          notes: item.notes,
        });
      }
    }

    const walkDetailsMap = new Map<string, any>();
    for (const item of allWalks) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !walkDetailsMap.has(aid)) {
        walkDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          routeName: item.routeName,
          estimatedDistanceKm: item.estimatedDistanceKm,
          estimatedDuration: item.estimatedDuration,
        });
      }
    }

    const preparationDetailsMap = new Map<string, any>();
    for (const item of allPreparations) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !preparationDetailsMap.has(aid)) {
        preparationDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          taskLabel: item.taskLabel,
          deadlineDateTime: item.deadlineDateTime,
          priority: item.priority,
          notes: item.notes,
        });
      }
    }

    const restDetailsMap = new Map<string, any>();
    for (const item of allRests) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !restDetailsMap.has(aid)) {
        restDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          restLocationName: item.restLocationName,
          restLocationType: item.restLocationType,
        });
      }
    }

    const motorcycleRideDetailsMap = new Map<string, any>();
    for (const item of allMotorcycles) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !motorcycleRideDetailsMap.has(aid)) {
        motorcycleRideDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          routeName: item.routeName,
          startingPoint: item.startingPoint,
          endingPoint: item.endingPoint,
          estimatedDistanceKm: item.estimatedDistanceKm,
          roadType: item.roadType,
          bikeModel: item.bikeModel,
          fuelStops: item.fuelStops,
        });
      }
    }

    const meetupDetailsMap = new Map<string, any>();
    for (const item of allMeetups) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !meetupDetailsMap.has(aid)) {
        meetupDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          venueName: item.venueName,
          address: item.address,
          destinationAddressData: item.destinationAddressData ? JSON.parse(item.destinationAddressData) : null,
          hostOrOrganizer: item.hostOrOrganizer,
          numberOfPeople: item.numberOfPeople,
          meetupType: item.meetupType,
          rsvpLink: item.rsvpLink,
        });
      }
    }

    const rideRentalDetailsMap = new Map<string, any>();
    for (const item of allRideRentals) {
      const aid = (item as any)._raw?.activity_id as string | undefined;
      if (aid && !rideRentalDetailsMap.has(aid)) {
        rideRentalDetailsMap.set(aid, {
          id: item.id,
          activityId: aid,
          providerName: item.providerName,
          address: item.address,
          destinationAddressData: safeJsonParse(item.destinationAddressData, null),
          vehicleType: item.vehicleType,
          vehicleModel: item.vehicleModel,
          pickupLocation: safeJsonParse(item.pickupLocation, item.pickupLocation),
          dropoffLocation: safeJsonParse(item.dropoffLocation, item.dropoffLocation),
          rentalStartDateTime: sanitizeDate(item.rentalStartDateTime),
          rentalEndDateTime: sanitizeDate(item.rentalEndDateTime),
          bookingReference: item.bookingReference,
          bookingStatus: item.bookingStatus,
          price: item.price,
          websiteAddress: item.websiteAddress,
          contactName: item.contactName,
          contactNumber: item.contactNumber,
          emailAddress: item.emailAddress,
          notes: item.notes,
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const itinerarySection = await Promise.all(sections.map(async (s) => {
      const activities = await database.get<Activity>("itinerary_activities").query(
        Q.where("section_id", s.id),
        Q.sortBy("sort_order", Q.asc)
      ).fetch();

      const itineraryActivity = activities.map((a) => ({
        id: a.id,
        sectionId: s.id,
        travelId: travelId,
        title: a.title,
        description: a.description,
        destination: a.destination,
        destinationData: safeJsonParse(a.destinationData, undefined),
        startDate: a.startDate,
        endDate: a.endDate,
        budget: a.budget,
        notes: a.notes,
        isOffline: a.isOffline,
        sortOrder: a.sortOrder,
        type: a.type,
        planType: a.planType ?? null,
        website: a.website ?? null,
        bookingReference: a.bookingReference ?? null,
        contactName: a.contactName ?? null,
        contactNumber: a.contactNumber ?? null,
        contactEmail: a.contactEmail ?? null,
        priority: a.priority ?? null,
        secondaryType: safeJsonParse(a.secondaryType, undefined),
        images: safeJsonParse(a.images, undefined),
        isDone: a.isDone,
        attachments: safeJsonParse(a.attachments, undefined),
        customTags: safeJsonParse(a.customTags, a.customTags ? [a.customTags] : undefined),
        notesCount: notesCountMap.get(a.id) ?? 0,
        expensesCount: expensesCountMap.get(a.id) ?? 0,
        checklistCount: checklistCountMap.get(a.id) ?? 0,
        flightDetails: flightDetailsMap.get(a.id) ?? null,
        accomodationDetails: accomodationDetailsMap.get(a.id) ?? null,
        sightseeingDetails: sightseeingDetailsMap.get(a.id) ?? null,
        hikeOrCampDetails: hikeOrCampDetailsMap.get(a.id) ?? null,
        cafeRestaurantDetails: cafeRestaurantDetailsMap.get(a.id) ?? null,
        natureDetails: natureDetailsMap.get(a.id) ?? null,
        shoppingDetails: shoppingDetailsMap.get(a.id) ?? null,
        entertainmentDetails: entertainmentDetailsMap.get(a.id) ?? null,
        transportationDetails: transportationDetailsMap.get(a.id) ?? null,
        walkDetails: walkDetailsMap.get(a.id) ?? null,
        preparationDetails: preparationDetailsMap.get(a.id) ?? null,
        restDetails: restDetailsMap.get(a.id) ?? null,
        motorcycleRideDetails: motorcycleRideDetailsMap.get(a.id) ?? null,
        meetupDetails: meetupDetailsMap.get(a.id) ?? null,
        rideRentalDetails: rideRentalDetailsMap.get(a.id) ?? null,
      }));

      return {
        id: s.id,
        title: s.title,
        description: s.description,
        destination: s.destination,
        startDate: s.startDate,
        endDate: s.endDate,
        budget: s.budget,
        notes: s.notes,
        isOffline: s.isOffline,
        sortOrder: s.sortOrder,
        isDefaultSection: s.isDefaultSection,
        isCollapsed: s.isCollapsed,
        travelId: t.id.toString(),
        itineraryActivity,
      };
    }));

    return {
      travel: travelDto,
      itinerarySection,
      tripSetting,
    };
  } catch (err) {
    throw new Error(`Travel Plan not found locally with ID: ${id}`);
  }
};

export const saveTravelLocally = async (travelData: any, id?: string) => {
  return await database.write(async () => {
    const tripDestinationsInput = Array.isArray(travelData.tripDestinations)
      ? travelData.tripDestinations
      : (travelData.destination ? [{ destination: travelData.destination, destinationData: travelData.destinationData }] : []);
    const primaryDest = tripDestinationsInput[0]?.destination || travelData.destination || "";
    const primaryDestData = tripDestinationsInput[0]?.destinationData || travelData.destinationData;

    let travelId: string;
    let resultTravel: any;

    if (id) {
      travelId = id.toString();
      const travel = await database.get<Travel>("travels").find(travelId);
      await travel.update((t) => {
        Object.assign(t, {
          title: travelData.title,
          description: travelData.description,
          destination: primaryDest,
          destinationData: primaryDestData ? JSON.stringify(primaryDestData) : null,
          startOrDepartureDate: travelData.startOrDepartureDate ? new Date(travelData.startOrDepartureDate) : null,
          endOrReturnDate: travelData.endOrReturnDate ? new Date(travelData.endOrReturnDate) : null,
          status: travelData.status,
          budget: travelData.budget,
          notes: travelData.notes,
          isOffline: true,
          isArchived: travelData.isArchived ?? false,
          type: travelData.type ?? null,
        });
      });
      resultTravel = travel;

      // Sync trip_destinations
      if (tripDestinationsInput.length > 0) {
        const existing = await database.get<TripDestination>("trip_destinations").query(Q.where("travel_id", travelId)).fetch();
        for (const item of existing) {
          await item.destroyPermanently();
        }
        for (const destItem of tripDestinationsInput) {
          await database.get<TripDestination>("trip_destinations").create((d) => {
            d.travel.id = travelId;
            d.destination = destItem.destination;
            d.destinationData = destItem.destinationData ? JSON.stringify(destItem.destinationData) : null;
          });
        }
      }
    } else {
      const newTravel = await database.get<Travel>("travels").create((t) => {
        Object.assign(t, {
          title: travelData.title,
          description: travelData.description,
          destination: primaryDest,
          destinationData: primaryDestData ? JSON.stringify(primaryDestData) : null,
          startOrDepartureDate: travelData.startOrDepartureDate ? new Date(travelData.startOrDepartureDate) : null,
          endOrReturnDate: travelData.endOrReturnDate ? new Date(travelData.endOrReturnDate) : null,
          status: travelData.status,
          budget: travelData.budget,
          notes: travelData.notes,
          isOffline: true,
          isArchived: travelData.isArchived ?? false,
          type: travelData.type ?? null,
        });
      });
      travelId = newTravel.id;
      resultTravel = newTravel;

      // Insert trip_destinations
      if (tripDestinationsInput.length > 0) {
        for (const destItem of tripDestinationsInput) {
          await database.get<TripDestination>("trip_destinations").create((d) => {
            d.travel.id = travelId;
            d.destination = destItem.destination;
            d.destinationData = destItem.destinationData ? JSON.stringify(destItem.destinationData) : null;
          });
        }
      }

      // Always create a default section
      await database.get<Section>("itinerary_sections").create((s) => {
        s.travel.id = newTravel.id;
        s.title = "Activities";
        s.isDefaultSection = true;
        s.sortOrder = "0";
        s.isOffline = true;
      });

      if (travelData.createSectionsBasedOnDates && travelData.startOrDepartureDate && travelData.endOrReturnDate) {
        const startDate = new Date(travelData.startOrDepartureDate);
        const endDate = new Date(travelData.endOrReturnDate);
        
        // Reset time to avoid daylight saving or timezone issues during diff
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const diffTime = endDate.getTime() - startDate.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) + 1; // +1 to include both start and end days

        for (let i = 0; i < diffDays; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);

          await database.get<Section>("itinerary_sections").create((s) => {
            s.travel.id = newTravel.id;
            s.title = `Day ${i + 1}`;
            s.description = currentDate.toLocaleDateString();
            s.startDate = currentDate;
            s.endDate = currentDate;
            s.sortOrder = String(i + 1);
            s.isOffline = true;
          });
        }
      }

      // Initialize trip settings with showSectionTabNavigation default
      await database.get<TripSetting>("trip_settings").create((setting) => {
        setting.travel.id = newTravel.id;
        setting.currency = "USD";
        setting.timezone = "UTC";
        setting.itineraryView = "narrow";
        setting.allowItemReordering = false;
        setting.showSectionTabNavigation = Boolean(travelData.createSectionsBasedOnDates);
      });
    }

    return resultTravel;
  });
};

export const saveSectionLocally = async (sectionData: any, id?: string) => {
  return await database.write(async () => {
    if (id) {
      const section = await database.get<Section>("itinerary_sections").find(id.toString());
      await section.update((s) => {
        Object.assign(s, {
          title: sectionData.title,
          description: sectionData.description,
          destination: sectionData.destination,
          startDate: sectionData.startDate ? new Date(sectionData.startDate) : null,
          endDate: sectionData.endDate ? new Date(sectionData.endDate) : null,
          budget: sectionData.budget,
          notes: sectionData.notes,
          isOffline: true,
          sortOrder: sectionData.sortOrder,
          isDefaultSection: !!sectionData.isDefaultSection,
          isCollapsed: !!sectionData.isCollapsed,
        });
      });
      return section;
    } else {
      return await database.get<Section>("itinerary_sections").create((s) => {
        if (sectionData.travelId) {
          s.travel.id = sectionData.travelId.toString();
        }
        Object.assign(s, {
          title: sectionData.title,
          description: sectionData.description,
          destination: sectionData.destination,
          startDate: sectionData.startDate ? new Date(sectionData.startDate) : null,
          endDate: sectionData.endDate ? new Date(sectionData.endDate) : null,
          budget: sectionData.budget,
          notes: sectionData.notes,
          isOffline: true,
          sortOrder: sectionData.sortOrder,
          isDefaultSection: !!sectionData.isDefaultSection,
          isCollapsed: !!sectionData.isCollapsed,
        });
      });
    }
  });
};

export const updateSectionActivitiesDatesLocally = async (sectionId: string, newStartDate?: Date | string | null) => {
  if (!sectionId) return;
  return await database.write(async () => {
    const activities = await database
      .get<Activity>("itinerary_activities")
      .query(Q.where("section_id", sectionId.toString()))
      .fetch();

    const formattedDate = newStartDate ? new Date(newStartDate) : null;

    for (const act of activities) {
      await act.update((a) => {
        a.startDate = formattedDate;
        if (formattedDate) {
          a.endDate = formattedDate;
        } else {
          a.endDate = null;
        }
      });
    }
    return activities;
  });
};

export const saveActivityLocally = async (activityData: any, id?: string) => {
  return await database.write(async () => {
    let activity;
    if (id) {
      activity = await database.get<Activity>("itinerary_activities").find(id.toString());
      await activity.update((a) => {
        if (activityData.sectionId) {
          a.section.id = activityData.sectionId.toString();
        }
        Object.assign(a, {
          title: activityData.title,
          description: activityData.description,
          destination: activityData.destination,
          destinationData: JSON.stringify(activityData.destinationData),
          startDate: activityData.startDate ? new Date(activityData.startDate) : null,
          endDate: activityData.endDate ? new Date(activityData.endDate) : null,
          budget: activityData.budget,
          notes: activityData.notes,
          isOffline: true,
          sortOrder: activityData.sortOrder,
          type: activityData.type,
          planType: activityData.planType ?? null,
          website: activityData.website ?? null,
          bookingReference: activityData.bookingReference ?? null,
          contactName: activityData.contactName ?? null,
          contactNumber: activityData.contactNumber ?? null,
          contactEmail: activityData.contactEmail ?? null,
          priority: activityData.priority ?? null,
          secondaryType: JSON.stringify(activityData.secondaryType),
          images: JSON.stringify(activityData.images),
          isDone: activityData.isDone || false,
          isDeleted: false,
          isDefaultSection: activityData.isDefaultSection,
          attachments: JSON.stringify(activityData.attachments || []),
          customTags: activityData.customTags ? (Array.isArray(activityData.customTags) ? JSON.stringify(activityData.customTags) : String(activityData.customTags)) : null,
        });
      });
    } else {
      activity = await database.get<Activity>("itinerary_activities").create((a) => {
        if (activityData.sectionId) {
          a.section.id = activityData.sectionId.toString();
        }
        Object.assign(a, {
          title: activityData.title,
          description: activityData.description,
          destination: activityData.destination,
          destinationData: JSON.stringify(activityData.destinationData),
          startDate: activityData.startDate ? new Date(activityData.startDate) : null,
          endDate: activityData.endDate ? new Date(activityData.endDate) : null,
          budget: activityData.budget,
          notes: activityData.notes,
          isOffline: true,
          sortOrder: activityData.sortOrder,
          type: activityData.type,
          planType: activityData.planType ?? null,
          website: activityData.website ?? null,
          bookingReference: activityData.bookingReference ?? null,
          contactName: activityData.contactName ?? null,
          contactNumber: activityData.contactNumber ?? null,
          contactEmail: activityData.contactEmail ?? null,
          priority: activityData.priority ?? null,
          secondaryType: JSON.stringify(activityData.secondaryType),
          images: JSON.stringify(activityData.images),
          isDone: activityData.isDone || false,
          attachments: JSON.stringify(activityData.attachments || []),
          customTags: activityData.customTags ? (Array.isArray(activityData.customTags) ? JSON.stringify(activityData.customTags) : String(activityData.customTags)) : null,
        });
      });
    }

    // Save associated flight details
    if (activityData.type === TripPlanType.flight && activityData.flightDetails) {
      const flightDetailsCollection = database.get<FlightDetails>("flight_details");
      const existingDetails = await flightDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((f) => {
          Object.assign(f, {
            departureAirport: activityData.flightDetails.departureAirport,
            arrivalAirport: activityData.flightDetails.arrivalAirport,
            departureDate: sanitizeDate(activityData.flightDetails.departureDate),
            arrivalDate: sanitizeDate(activityData.flightDetails.arrivalDate),
            flightNumber: activityData.flightDetails.flightNumber,
            airline: activityData.flightDetails.airline,
            gate: activityData.flightDetails.gate,
            terminal: activityData.flightDetails.terminal,
            seatNumber: activityData.flightDetails.seatNumber,
            bookingReference: activityData.flightDetails.bookingReference,
            price: activityData.flightDetails.price != null ? Number(activityData.flightDetails.price) : null,
          });
        });
      } else {
        await flightDetailsCollection.create((f) => {
          f.activity.id = activity.id;
          Object.assign(f, {
            departureAirport: activityData.flightDetails.departureAirport,
            arrivalAirport: activityData.flightDetails.arrivalAirport,
            departureDate: sanitizeDate(activityData.flightDetails.departureDate),
            arrivalDate: sanitizeDate(activityData.flightDetails.arrivalDate),
            flightNumber: activityData.flightDetails.flightNumber,
            airline: activityData.flightDetails.airline,
            gate: activityData.flightDetails.gate,
            terminal: activityData.flightDetails.terminal,
            seatNumber: activityData.flightDetails.seatNumber,
            bookingReference: activityData.flightDetails.bookingReference,
            price: activityData.flightDetails.price != null ? Number(activityData.flightDetails.price) : null,
          });
        });
      }
    }

    // Save associated accomodation details
    if (activityData.type === TripPlanType.stay && activityData.accomodationDetails) {
      const accomodationDetailsCollection = database.get<AccomodationDetails>("accomodation_details");
      const existingDetails = await accomodationDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((f) => {
          Object.assign(f, {
            accomodationName: activityData.accomodationDetails.accomodationName,
            address: activityData.accomodationDetails.address,
            destinationAddressData: activityData.accomodationDetails.destinationAddressData
              ? JSON.stringify(activityData.accomodationDetails.destinationAddressData)
              : null,
            subType: activityData.accomodationDetails.subType || null,
            checkinDateTime: sanitizeDate(activityData.accomodationDetails.checkinDateTime),
            checkoutDateTime: sanitizeDate(activityData.accomodationDetails.checkoutDateTime),
            websiteAddress: activityData.accomodationDetails.websiteAddress,
            bookingReference: activityData.accomodationDetails.bookingReference,
            bookingStatus: activityData.accomodationDetails.bookingStatus,
            contactNumber: activityData.accomodationDetails.contactNumber,
            emailAddress: activityData.accomodationDetails.emailAddress,
            contactName: activityData.accomodationDetails.contactName,
          });
        });
      } else {
        await accomodationDetailsCollection.create((f) => {
          f.activity.id = activity.id;
          Object.assign(f, {
            accomodationName: activityData.accomodationDetails.accomodationName,
            address: activityData.accomodationDetails.address,
            destinationAddressData: activityData.accomodationDetails.destinationAddressData
              ? JSON.stringify(activityData.accomodationDetails.destinationAddressData)
              : null,
            subType: activityData.accomodationDetails.subType || null,
            checkinDateTime: sanitizeDate(activityData.accomodationDetails.checkinDateTime),
            checkoutDateTime: sanitizeDate(activityData.accomodationDetails.checkoutDateTime),
            websiteAddress: activityData.accomodationDetails.websiteAddress,
            bookingReference: activityData.accomodationDetails.bookingReference,
            bookingStatus: activityData.accomodationDetails.bookingStatus,
            contactNumber: activityData.accomodationDetails.contactNumber,
            emailAddress: activityData.accomodationDetails.emailAddress,
            contactName: activityData.accomodationDetails.contactName,
          });
        });
      }
    }

    // Save associated sightseeing details
    if ((activityData.planType === ActivityType.sightseeing || (activityData.type as any) === ActivityType.sightseeing) && activityData.sightseeingDetails) {
      const sightseeingDetailsCollection = database.get<SightseeingDetails>("sightseeing_details");
      const existingDetails = await sightseeingDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((s) => {
          Object.assign(s, {
            attractionName: activityData.sightseeingDetails.attractionName,
            address: activityData.sightseeingDetails.address,
            destinationAddressData: activityData.sightseeingDetails.destinationAddressData
              ? JSON.stringify(activityData.sightseeingDetails.destinationAddressData)
              : null,
            entryFee: activityData.sightseeingDetails.entryFee,
            websiteAddress: activityData.sightseeingDetails.websiteAddress,
            bookingReference: activityData.sightseeingDetails.bookingReference,
            contactNumber: activityData.sightseeingDetails.contactNumber,
            emailAddress: activityData.sightseeingDetails.emailAddress,
          });
        });
      } else {
        await sightseeingDetailsCollection.create((s) => {
          s.activity.id = activity.id;
          Object.assign(s, {
            attractionName: activityData.sightseeingDetails.attractionName,
            address: activityData.sightseeingDetails.address,
            destinationAddressData: activityData.sightseeingDetails.destinationAddressData
              ? JSON.stringify(activityData.sightseeingDetails.destinationAddressData)
              : null,
            entryFee: activityData.sightseeingDetails.entryFee,
            websiteAddress: activityData.sightseeingDetails.websiteAddress,
            bookingReference: activityData.sightseeingDetails.bookingReference,
            contactNumber: activityData.sightseeingDetails.contactNumber,
            emailAddress: activityData.sightseeingDetails.emailAddress,
          });
        });
      }
    }

    // Save associated hike or camp details
    if (
      (activityData.planType === ActivityType.hike ||
        activityData.planType === ActivityType.camp ||
        (activityData.type as any) === ActivityType.hike ||
        (activityData.type as any) === ActivityType.camp) &&
      activityData.hikeOrCampDetails
    ) {
      const hikeOrCampDetailsCollection = database.get<HikeOrCampDetails>("hike_or_camp_details");
      const existingDetails = await hikeOrCampDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((h) => {
          Object.assign(h, {
            trailOrSiteName: activityData.hikeOrCampDetails.trailOrSiteName,
            address: activityData.hikeOrCampDetails.address,
            destinationAddressData: activityData.hikeOrCampDetails.destinationAddressData
              ? JSON.stringify(activityData.hikeOrCampDetails.destinationAddressData)
              : null,
            subType: activityData.hikeOrCampDetails.subType,
            estimatedDistanceKm: activityData.hikeOrCampDetails.estimatedDistanceKm,
            campsiteName: activityData.hikeOrCampDetails.campsiteName,
            permitRequired: activityData.hikeOrCampDetails.permitRequired,
            contactPerson: activityData.hikeOrCampDetails.contactPerson,
            contactNumber: activityData.hikeOrCampDetails.contactNumber,
            emailAddress: activityData.hikeOrCampDetails.emailAddress || null,
            websiteAddress: activityData.hikeOrCampDetails.websiteAddress,
            reservationLink: activityData.hikeOrCampDetails.reservationLink,
            checkinDateTime: activityData.hikeOrCampDetails.checkinDateTime ? new Date(activityData.hikeOrCampDetails.checkinDateTime) : null,
            checkoutDateTime: activityData.hikeOrCampDetails.checkoutDateTime ? new Date(activityData.hikeOrCampDetails.checkoutDateTime) : null,
          });
        });
      } else {
        await hikeOrCampDetailsCollection.create((h) => {
          h.activity.id = activity.id;
          Object.assign(h, {
            trailOrSiteName: activityData.hikeOrCampDetails.trailOrSiteName,
            address: activityData.hikeOrCampDetails.address,
            destinationAddressData: activityData.hikeOrCampDetails.destinationAddressData
              ? JSON.stringify(activityData.hikeOrCampDetails.destinationAddressData)
              : null,
            subType: activityData.hikeOrCampDetails.subType,
            estimatedDistanceKm: activityData.hikeOrCampDetails.estimatedDistanceKm,
            campsiteName: activityData.hikeOrCampDetails.campsiteName,
            permitRequired: activityData.hikeOrCampDetails.permitRequired,
            contactPerson: activityData.hikeOrCampDetails.contactPerson,
            contactNumber: activityData.hikeOrCampDetails.contactNumber,
            emailAddress: activityData.hikeOrCampDetails.emailAddress || null,
            websiteAddress: activityData.hikeOrCampDetails.websiteAddress,
            reservationLink: activityData.hikeOrCampDetails.reservationLink,
            checkinDateTime: activityData.hikeOrCampDetails.checkinDateTime ? new Date(activityData.hikeOrCampDetails.checkinDateTime) : null,
            checkoutDateTime: activityData.hikeOrCampDetails.checkoutDateTime ? new Date(activityData.hikeOrCampDetails.checkoutDateTime) : null,
          });
        });
      }
    }

    // Save associated cafe restaurant details
    if (
      (activityData.planType === ActivityType.restaurant ||
        activityData.planType === ActivityType.cafe ||
        (activityData.type as any) === ActivityType.restaurant ||
        (activityData.type as any) === ActivityType.cafe) &&
      activityData.cafeRestaurantDetails
    ) {
      const cafeRestaurantDetailsCollection = database.get<CafeRestaurantDetails>("cafe_restaurant_details");
      const existingDetails = await cafeRestaurantDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((c) => {
          Object.assign(c, {
            restaurantName: activityData.cafeRestaurantDetails.restaurantName,
            address: activityData.cafeRestaurantDetails.address,
            destinationAddressData: activityData.cafeRestaurantDetails.destinationAddressData
              ? JSON.stringify(activityData.cafeRestaurantDetails.destinationAddressData)
              : null,
            cuisine: activityData.cafeRestaurantDetails.cuisine,
            priceRange: activityData.cafeRestaurantDetails.priceRange,
            reservationLink: activityData.cafeRestaurantDetails.reservationLink,
            websiteAddress: activityData.cafeRestaurantDetails.websiteAddress,
            contactNumber: activityData.cafeRestaurantDetails.contactNumber,
          });
        });
      } else {
        await cafeRestaurantDetailsCollection.create((c) => {
          c.activity.id = activity.id;
          Object.assign(c, {
            restaurantName: activityData.cafeRestaurantDetails.restaurantName,
            address: activityData.cafeRestaurantDetails.address,
            destinationAddressData: activityData.cafeRestaurantDetails.destinationAddressData
              ? JSON.stringify(activityData.cafeRestaurantDetails.destinationAddressData)
              : null,
            cuisine: activityData.cafeRestaurantDetails.cuisine,
            priceRange: activityData.cafeRestaurantDetails.priceRange,
            reservationLink: activityData.cafeRestaurantDetails.reservationLink,
            websiteAddress: activityData.cafeRestaurantDetails.websiteAddress,
            contactNumber: activityData.cafeRestaurantDetails.contactNumber,
          });
        });
      }
    }

    // Save associated nature details
    if ((activityData.planType === ActivityType.nature || (activityData.type as any) === ActivityType.nature) && activityData.natureDetails) {
      const natureDetailsCollection = database.get<NatureDetails>("nature_details");
      const existingDetails = await natureDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((n) => {
          Object.assign(n, {
            spotName: activityData.natureDetails.spotName,
            address: activityData.natureDetails.address,
            destinationAddressData: activityData.natureDetails.destinationAddressData
              ? JSON.stringify(activityData.natureDetails.destinationAddressData)
              : null,
            subType: activityData.natureDetails.subType,
            entryFee: activityData.natureDetails.entryFee,
            websiteAddress: activityData.natureDetails.websiteAddress || null,
            contactName: activityData.natureDetails.contactName || null,
            contactNumber: activityData.natureDetails.contactNumber || null,
            emailAddress: activityData.natureDetails.emailAddress || null,
          });
        });
      } else {
        await natureDetailsCollection.create((n) => {
          n.activity.id = activity.id;
          Object.assign(n, {
            spotName: activityData.natureDetails.spotName,
            address: activityData.natureDetails.address,
            destinationAddressData: activityData.natureDetails.destinationAddressData
              ? JSON.stringify(activityData.natureDetails.destinationAddressData)
              : null,
            subType: activityData.natureDetails.subType,
            entryFee: activityData.natureDetails.entryFee,
            websiteAddress: activityData.natureDetails.websiteAddress || null,
            contactName: activityData.natureDetails.contactName || null,
            contactNumber: activityData.natureDetails.contactNumber || null,
            emailAddress: activityData.natureDetails.emailAddress || null,
          });
        });
      }
    }

    // Save associated shopping details
    if ((activityData.planType === ActivityType.shopping || (activityData.type as any) === ActivityType.shopping) && activityData.shoppingDetails) {
      const shoppingDetailsCollection = database.get<ShoppingDetails>("shopping_details");
      const existingDetails = await shoppingDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((s) => {
          Object.assign(s, {
            venueName: activityData.shoppingDetails.venueName,
            address: activityData.shoppingDetails.address,
            destinationAddressData: activityData.shoppingDetails.destinationAddressData
              ? JSON.stringify(activityData.shoppingDetails.destinationAddressData)
              : null,
            subType: activityData.shoppingDetails.subType,
            websiteAddress: activityData.shoppingDetails.websiteAddress,
            bookingReferenceOrLink: activityData.shoppingDetails.bookingReferenceOrLink,
            promoCodeOrLink: activityData.shoppingDetails.promoCodeOrLink,
            contactNumber: activityData.shoppingDetails.contactNumber,
            emailAddress: activityData.shoppingDetails.emailAddress,
          });
        });
      } else {
        await shoppingDetailsCollection.create((s) => {
          s.activity.id = activity.id;
          Object.assign(s, {
            venueName: activityData.shoppingDetails.venueName,
            address: activityData.shoppingDetails.address,
            destinationAddressData: activityData.shoppingDetails.destinationAddressData
              ? JSON.stringify(activityData.shoppingDetails.destinationAddressData)
              : null,
            subType: activityData.shoppingDetails.subType,
            websiteAddress: activityData.shoppingDetails.websiteAddress,
            bookingReferenceOrLink: activityData.shoppingDetails.bookingReferenceOrLink,
            promoCodeOrLink: activityData.shoppingDetails.promoCodeOrLink,
            contactNumber: activityData.shoppingDetails.contactNumber,
            emailAddress: activityData.shoppingDetails.emailAddress,
          });
        });
      }
    }

    // Save associated entertainment details
    if ((activityData.planType === ActivityType.entertainment || (activityData.type as any) === ActivityType.entertainment) && activityData.entertainmentDetails) {
      const entertainmentDetailsCollection = database.get<EntertainmentDetails>("entertainment_details");
      const existingDetails = await entertainmentDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((e) => {
          Object.assign(e, {
            venueName: activityData.entertainmentDetails.venueName,
            address: activityData.entertainmentDetails.address,
            destinationAddressData: activityData.entertainmentDetails.destinationAddressData
              ? JSON.stringify(activityData.entertainmentDetails.destinationAddressData)
              : null,
            subType: activityData.entertainmentDetails.subType,
            websiteAddress: activityData.entertainmentDetails.websiteAddress,
            ticketPrice: activityData.entertainmentDetails.ticketPrice,
            bookingReference: activityData.entertainmentDetails.bookingReference,
            contactName: activityData.entertainmentDetails.contactName || null,
            contactNumber: activityData.entertainmentDetails.contactNumber || null,
            emailAddress: activityData.entertainmentDetails.emailAddress || null,
          });
        });
      } else {
        await entertainmentDetailsCollection.create((e) => {
          e.activity.id = activity.id;
          Object.assign(e, {
            venueName: activityData.entertainmentDetails.venueName,
            address: activityData.entertainmentDetails.address,
            destinationAddressData: activityData.entertainmentDetails.destinationAddressData
              ? JSON.stringify(activityData.entertainmentDetails.destinationAddressData)
              : null,
            subType: activityData.entertainmentDetails.subType,
            websiteAddress: activityData.entertainmentDetails.websiteAddress,
            ticketPrice: activityData.entertainmentDetails.ticketPrice,
            bookingReference: activityData.entertainmentDetails.bookingReference,
            contactName: activityData.entertainmentDetails.contactName || null,
            contactNumber: activityData.entertainmentDetails.contactNumber || null,
            emailAddress: activityData.entertainmentDetails.emailAddress || null,
          });
        });
      }
    }

    // Save associated transportation details
    if (activityData.type === TripPlanType.transit && activityData.transportationDetails) {
      const transportationDetailsCollection = database.get<TransportationDetails>("transportation_details");
      const existingDetails = await transportationDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      const transportPayload = {
        mode: activityData.transportationDetails.mode || null,
        operatorProvider: activityData.transportationDetails.operatorProvider || null,
        pickupLocation: typeof activityData.transportationDetails.pickupLocation === "object" && activityData.transportationDetails.pickupLocation
          ? JSON.stringify(activityData.transportationDetails.pickupLocation)
          : activityData.transportationDetails.pickupLocation || null,
        dropoffLocation: typeof activityData.transportationDetails.dropoffLocation === "object" && activityData.transportationDetails.dropoffLocation
          ? JSON.stringify(activityData.transportationDetails.dropoffLocation)
          : activityData.transportationDetails.dropoffLocation || null,
        departureDateTime: sanitizeDate(activityData.transportationDetails.departureDateTime),
        arrivalDateTime: sanitizeDate(activityData.transportationDetails.arrivalDateTime),
        seatOrVehicleNumber: activityData.transportationDetails.seatOrVehicleNumber || null,
        bookingReference: activityData.transportationDetails.bookingReference || null,
        bookingStatus: activityData.transportationDetails.bookingStatus || null,
        price: activityData.transportationDetails.price || null,
        websiteAddress: activityData.transportationDetails.websiteAddress || null,
        contactNumber: activityData.transportationDetails.contactNumber || null,
        notes: activityData.transportationDetails.notes || null,
      };

      if (existingDetails.length > 0) {
        await existingDetails[0].update((t) => {
          Object.assign(t, transportPayload);
        });
      } else {
        await transportationDetailsCollection.create((t) => {
          t.activity.id = activity.id;
          Object.assign(t, transportPayload);
        });
      }
    }

    // Save associated walk details
    // if (activityData.type === ActivityType.walk && activityData.walkDetails) {
    //   const walkDetailsCollection = database.get<WalkDetails>("walk_details");
    //   const existingDetails = await walkDetailsCollection.query(
    //     Q.where("activity_id", activity.id)
    //   ).fetch();

    //   if (existingDetails.length > 0) {
    //     await existingDetails[0].update((w) => {
    //       Object.assign(w, {
    //         routeName: activityData.walkDetails.routeName,
    //         estimatedDistanceKm: activityData.walkDetails.estimatedDistanceKm,
    //         estimatedDuration: activityData.walkDetails.estimatedDuration,
    //       });
    //     });
    //   } else {
    //     await walkDetailsCollection.create((w) => {
    //       w.activity.id = activity.id;
    //       Object.assign(w, {
    //         routeName: activityData.walkDetails.routeName,
    //         estimatedDistanceKm: activityData.walkDetails.estimatedDistanceKm,
    //         estimatedDuration: activityData.walkDetails.estimatedDuration,
    //       });
    //     });
    //   }
    // }

    // Save associated preparation details
    if ((activityData.planType === ActivityType.preparation || (activityData.type as any) === ActivityType.preparation) && activityData.preparationDetails) {
      const preparationDetailsCollection = database.get<PreparationDetails>("preparation_details");
      const existingDetails = await preparationDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((p) => {
          Object.assign(p, {
            taskLabel: activityData.preparationDetails.taskLabel,
            deadlineDateTime: activityData.preparationDetails.deadlineDateTime ? new Date(activityData.preparationDetails.deadlineDateTime) : null,
            priority: activityData.preparationDetails.priority,
            notes: activityData.preparationDetails.notes,
          });
        });
      } else {
        await preparationDetailsCollection.create((p) => {
          p.activity.id = activity.id;
          Object.assign(p, {
            taskLabel: activityData.preparationDetails.taskLabel,
            deadlineDateTime: activityData.preparationDetails.deadlineDateTime ? new Date(activityData.preparationDetails.deadlineDateTime) : null,
            priority: activityData.preparationDetails.priority,
            notes: activityData.preparationDetails.notes,
          });
        });
      }
    }

    // Save associated rest details
    // if (activityData.type === ActivityType.rest && activityData.restDetails) {
    //   const restDetailsCollection = database.get<RestDetails>("rest_details");
    //   const existingDetails = await restDetailsCollection.query(
    //     Q.where("activity_id", activity.id)
    //   ).fetch();

    //   if (existingDetails.length > 0) {
    //     await existingDetails[0].update((r) => {
    //       Object.assign(r, {
    //         restLocationName: activityData.restDetails.restLocationName,
    //         restLocationType: activityData.restDetails.restLocationType,
    //       });
    //     });
    //   } else {
    //     await restDetailsCollection.create((r) => {
    //       r.activity.id = activity.id;
    //       Object.assign(r, {
    //         restLocationName: activityData.restDetails.restLocationName,
    //         restLocationType: activityData.restDetails.restLocationType,
    //       });
    //     });
    //   }
    // }

    // // Save associated motorcycle ride details
    // if (activityData.type === ActivityType.motorcycleRide && activityData.motorcycleRideDetails) {
    //   const motorcycleRideDetailsCollection = database.get<MotorcycleRideDetails>("motorcycle_ride_details");
    //   const existingDetails = await motorcycleRideDetailsCollection.query(
    //     Q.where("activity_id", activity.id)
    //   ).fetch();

    //   if (existingDetails.length > 0) {
    //     await existingDetails[0].update((m) => {
    //       Object.assign(m, {
    //         routeName: activityData.motorcycleRideDetails.routeName,
    //         startingPoint: activityData.motorcycleRideDetails.startingPoint,
    //         endingPoint: activityData.motorcycleRideDetails.endingPoint,
    //         estimatedDistanceKm: activityData.motorcycleRideDetails.estimatedDistanceKm,
    //         roadType: activityData.motorcycleRideDetails.roadType,
    //         bikeModel: activityData.motorcycleRideDetails.bikeModel,
    //         fuelStops: activityData.motorcycleRideDetails.fuelStops,
    //       });
    //     });
    //   } else {
    //     await motorcycleRideDetailsCollection.create((m) => {
    //       m.activity.id = activity.id;
    //       Object.assign(m, {
    //         routeName: activityData.motorcycleRideDetails.routeName,
    //         startingPoint: activityData.motorcycleRideDetails.startingPoint,
    //         endingPoint: activityData.motorcycleRideDetails.endingPoint,
    //         estimatedDistanceKm: activityData.motorcycleRideDetails.estimatedDistanceKm,
    //         roadType: activityData.motorcycleRideDetails.roadType,
    //         bikeModel: activityData.motorcycleRideDetails.bikeModel,
    //         fuelStops: activityData.motorcycleRideDetails.fuelStops,
    //       });
    //     });
    //   }
    // }

    // // Save associated meetup details
    // if (activityData.type === ActivityType.meetup && activityData.meetupDetails) {
    //   const meetupDetailsCollection = database.get<MeetupDetails>("meetup_details");
    //   const existingDetails = await meetupDetailsCollection.query(
    //     Q.where("activity_id", activity.id)
    //   ).fetch();

    //   if (existingDetails.length > 0) {
    //     await existingDetails[0].update((m) => {
    //       Object.assign(m, {
    //         venueName: activityData.meetupDetails.venueName,
    //         address: activityData.meetupDetails.address,
    //         destinationAddressData: activityData.meetupDetails.destinationAddressData
    //           ? JSON.stringify(activityData.meetupDetails.destinationAddressData)
    //           : null,
    //         hostOrOrganizer: activityData.meetupDetails.hostOrOrganizer,
    //         numberOfPeople: activityData.meetupDetails.numberOfPeople,
    //         meetupType: activityData.meetupDetails.meetupType,
    //         rsvpLink: activityData.meetupDetails.rsvpLink,
    //       });
    //     });
    //   } else {
    //     await meetupDetailsCollection.create((m) => {
    //       m.activity.id = activity.id;
    //       Object.assign(m, {
    //         venueName: activityData.meetupDetails.venueName,
    //         address: activityData.meetupDetails.address,
    //         destinationAddressData: activityData.meetupDetails.destinationAddressData
    //           ? JSON.stringify(activityData.meetupDetails.destinationAddressData)
    //           : null,
    //         hostOrOrganizer: activityData.meetupDetails.hostOrOrganizer,
    //         numberOfPeople: activityData.meetupDetails.numberOfPeople,
    //         meetupType: activityData.meetupDetails.meetupType,
    //         rsvpLink: activityData.meetupDetails.rsvpLink,
    //       });
    //     });
    //   }
    // }

    // Save associated ride rental details
    if (activityData.type === TripPlanType.rideRental && activityData.rideRentalDetails) {
      const rideRentalDetailsCollection = database.get<RideRentalDetails>("ride_rental_details");
      const existingDetails = await rideRentalDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      const rentalPayload = {
        providerName: activityData.rideRentalDetails.providerName,
        address: activityData.rideRentalDetails.address || null,
        destinationAddressData: activityData.rideRentalDetails.destinationAddressData
          ? JSON.stringify(activityData.rideRentalDetails.destinationAddressData)
          : null,
        vehicleType: activityData.rideRentalDetails.vehicleType || null,
        vehicleModel: activityData.rideRentalDetails.vehicleModel || null,
        pickupLocation: typeof activityData.rideRentalDetails.pickupLocation === "object" && activityData.rideRentalDetails.pickupLocation
          ? JSON.stringify(activityData.rideRentalDetails.pickupLocation)
          : activityData.rideRentalDetails.pickupLocation || null,
        dropoffLocation: typeof activityData.rideRentalDetails.dropoffLocation === "object" && activityData.rideRentalDetails.dropoffLocation
          ? JSON.stringify(activityData.rideRentalDetails.dropoffLocation)
          : activityData.rideRentalDetails.dropoffLocation || null,
        rentalStartDateTime: sanitizeDate(activityData.rideRentalDetails.rentalStartDateTime),
        rentalEndDateTime: sanitizeDate(activityData.rideRentalDetails.rentalEndDateTime),
        bookingReference: activityData.rideRentalDetails.bookingReference || null,
        bookingStatus: activityData.rideRentalDetails.bookingStatus || null,
        price: activityData.rideRentalDetails.price || null,
        websiteAddress: activityData.rideRentalDetails.websiteAddress || null,
        contactName: activityData.rideRentalDetails.contactName || null,
        contactNumber: activityData.rideRentalDetails.contactNumber || null,
        emailAddress: activityData.rideRentalDetails.emailAddress || null,
        notes: activityData.rideRentalDetails.notes || null,
      };

      if (existingDetails.length > 0) {
        await existingDetails[0].update((r) => {
          Object.assign(r, rentalPayload);
        });
      } else {
        await rideRentalDetailsCollection.create((r) => {
          r.activity.id = activity.id;
          Object.assign(r, rentalPayload);
        });
      }
    }

    return activity;
  });
};

export const fetchLocalItineraryActivity = async (id: string): Promise<any> => {
  try {
    const a = await database.get<Activity>("itinerary_activities").find(id);
    let travelId: string | undefined = undefined;
    try {
      const sectionRecord = await database.get<any>("itinerary_sections").find(a.section.id);
      travelId = sectionRecord.travel.id || undefined;
    } catch (err) {
      console.warn("Failed to find parent section for activity to fetch travelId:", err);
    }

    // Run all counts and detail fetches in parallel — no N+1 for a single activity
    const [
      notesCount,
      expensesCount,
      checklistCount,
      flightDetails,
      accomodationDetails,
      sightseeingDetails,
      hikeOrCampDetails,
      cafeRestaurantDetails,
      natureDetails,
      shoppingDetails,
      entertainmentDetails,
      transportationDetails,
      walkDetails,
      preparationDetails,
      restDetails,
      motorcycleRideDetails,
      meetupDetails,
      rideRentalDetails
    ] = await Promise.all([
      database.get("itinerary_notes").query(Q.where("activity_id", a.id)).fetchCount(),
      database.get("itinerary_expenses").query(Q.where("activity_id", a.id)).fetchCount(),
      database.get("checklist_items").query(Q.where("activity_id", a.id)).fetchCount(),
      fetchLocalFlightDetails(a.id),
      fetchLocalAccomodationDetails(a.id),
      fetchLocalSightseeingDetails(a.id),
      fetchLocalHikeOrCampDetails(a.id),
      fetchLocalCafeRestaurantDetails(a.id),
      fetchLocalNatureDetails(a.id),
      fetchLocalShoppingDetails(a.id),
      fetchLocalEntertainmentDetails(a.id),
      fetchLocalTransportationDetails(a.id),
      fetchLocalWalkDetails(a.id),
      fetchLocalPreparationDetails(a.id),
      fetchLocalRestDetails(a.id),
      fetchLocalMotorcycleRideDetails(a.id),
      fetchLocalMeetupDetails(a.id),
      fetchLocalRideRentalDetails(a.id),
    ]);

    return {
      id: a.id,
      sectionId: a.section.id,
      travelId,
      title: a.title,
      description: a.description,
      destination: a.destination,
      destinationData: safeJsonParse(a.destinationData, undefined),
      startDate: a.startDate,
      endDate: a.endDate,
      budget: a.budget,
      notes: a.notes,
      isOffline: a.isOffline,
      sortOrder: a.sortOrder,
      type: a.type,
      planType: a.planType ?? null,
      website: a.website ?? null,
      bookingReference: a.bookingReference ?? null,
      contactName: a.contactName ?? null,
      contactNumber: a.contactNumber ?? null,
      contactEmail: a.contactEmail ?? null,
      priority: a.priority ?? null,
      secondaryType: safeJsonParse(a.secondaryType, undefined),
      images: safeJsonParse(a.images, undefined),
      isDone: a.isDone,
      attachments: safeJsonParse(a.attachments, undefined),
      customTags: safeJsonParse(a.customTags, a.customTags ? [a.customTags] : undefined),
      notesCount,
      expensesCount,
      checklistCount,
      flightDetails,
      accomodationDetails,
      sightseeingDetails,
      hikeOrCampDetails,
      cafeRestaurantDetails,
      natureDetails,
      shoppingDetails,
      entertainmentDetails,
      transportationDetails,
      walkDetails,
      preparationDetails,
      restDetails,
      motorcycleRideDetails,
      meetupDetails,
      rideRentalDetails,
    };
  } catch (err) {
    throw new Error(`Itinerary Activity not found locally with ID: ${id}`);
  }
};

export const getAllActivitiesWithDestinationLocally = async (): Promise<any[]> => {
  const activities = await database.get<Activity>("itinerary_activities").query(
    Q.where("destination_data", Q.notEq(null))
  ).fetch();

  return activities.map((a) => ({
    id: a.id,
    travelId: (a as any).travelId,
    sectionId: (a as any).sectionId || a.section?.id,
    title: a.title,
    description: a.description,
    destination: a.destination,
    destinationData: safeJsonParse(a.destinationData, undefined),
    startDate: a.startDate,
    endDate: a.endDate,
    status: (a as any).status,
    isOffline: a.isOffline,
    type: a.type,
    isDone: a.isDone,
  }));
};

export const getAllActivitiesLocally = async (): Promise<any[]> => {
  const activities = await database.get<Activity>("itinerary_activities").query().fetch();

  return activities.map((a) => ({
    id: a.id,
    sectionId: a.section.id,
    title: a.title,
    description: a.description,
    destination: a.destination,
    destinationData: safeJsonParse(a.destinationData, undefined),
    startDate: a.startDate,
    endDate: a.endDate,
    isOffline: a.isOffline,
    type: a.type,
    isDone: a.isDone,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
};

/**
 * Reads all dependent records for an activity BEFORE entering a write block.
 * Returns them as plain arrays so the caller can batch-destroy them inside
 * a single database.write() transaction without mixing reads and writes.
 */
const collectActivityDependencies = async (activityId: string): Promise<any[]> => {
  const [
    expenses,
    notes,
    checklists,
    flights,
    accomodations,
    sightseeings,
    hikeOrCamps,
    cafeRestaurants,
    natures,
    shoppings,
    entertainments,
    transportations,
    walks,
    preparations,
    rests,
    motorcycles,
    meetups,
    rideRentals
  ] = await Promise.all([
    database.get<any>("itinerary_expenses").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("itinerary_notes").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("checklist_items").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("flight_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("accomodation_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("sightseeing_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("hike_or_camp_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("cafe_restaurant_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("nature_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("shopping_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("entertainment_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("transportation_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("walk_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("preparation_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("rest_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("motorcycle_ride_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("meetup_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("ride_rental_details").query(Q.where("activity_id", activityId)).fetch(),
  ]);
  return [
    ...expenses,
    ...notes,
    ...checklists,
    ...flights,
    ...accomodations,
    ...sightseeings,
    ...hikeOrCamps,
    ...cafeRestaurants,
    ...natures,
    ...shoppings,
    ...entertainments,
    ...transportations,
    ...walks,
    ...preparations,
    ...rests,
    ...motorcycles,
    ...meetups,
    ...rideRentals
  ];
};

/** Permanently deletes a locally-stored travel and all its sections/activities/expenses/notes/checklists. */
export const deleteTravelLocally = async (id: string): Promise<void> => {
  // ── Phase 1: Reads (outside write block) ──────────────────────────────────
  const travel = await database.get<Travel>("travels").find(id);
  const sections = await database.get<Section>("itinerary_sections").query(
    Q.where("travel_id", id)
  ).fetch();

  // Collect activities and all their dependent records before writing
  const activitiesBySectionId = new Map<string, Activity[]>();
  const dependenciesByActivityId = new Map<string, any[]>();

  for (const section of sections) {
    const activities = await database.get<Activity>("itinerary_activities").query(
      Q.where("section_id", section.id)
    ).fetch();
    activitiesBySectionId.set(section.id, activities);
    for (const activity of activities) {
      dependenciesByActivityId.set(activity.id, await collectActivityDependencies(activity.id));
    }
  }

  const tripDestinations = await database.get<TripDestination>("trip_destinations").query(
    Q.where("travel_id", id)
  ).fetch();

  // ── Phase 2: Writes (all batched in one transaction) ───────────────────────
  await database.write(async () => {
    for (const d of tripDestinations) {
      await d.destroyPermanently();
    }
    for (const section of sections) {
      const activities = activitiesBySectionId.get(section.id) ?? [];
      for (const activity of activities) {
        const deps = dependenciesByActivityId.get(activity.id) ?? [];
        for (const dep of deps) await dep.destroyPermanently();
        await activity.destroyPermanently();
      }
      await section.destroyPermanently();
    }
    await travel.destroyPermanently();
  });
};

/** Permanently deletes a locally-stored section and all its activities. */
export const deleteSectionLocally = async (id: string): Promise<void> => {
  // Phase 1: Reads
  const section = await database.get<Section>("itinerary_sections").find(id);
  const activities = await database.get<Activity>("itinerary_activities").query(
    Q.where("section_id", section.id)
  ).fetch();
  const dependenciesByActivityId = new Map<string, any[]>();
  for (const activity of activities) {
    dependenciesByActivityId.set(activity.id, await collectActivityDependencies(activity.id));
  }

  // Phase 2: Writes
  await database.write(async () => {
    for (const activity of activities) {
      const deps = dependenciesByActivityId.get(activity.id) ?? [];
      for (const dep of deps) await dep.destroyPermanently();
      await activity.destroyPermanently();
    }
    await section.destroyPermanently();
  });
};

/** Permanently deletes a locally-stored activity. */
export const deleteActivityLocally = async (id: string): Promise<void> => {
  // Phase 1: Reads (outside write block)
  const activity = await database.get<Activity>("itinerary_activities").find(id);
  const deps = await collectActivityDependencies(activity.id);

  // Phase 2: Writes (all batched atomically)
  await database.write(async () => {
    for (const dep of deps) await dep.destroyPermanently();
    await activity.destroyPermanently();
  });
};

/** Updates a locally-stored travel status. */
export const cancelTravelLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const travel = await database.get<Travel>("travels").find(id);
    await travel.update((t) => {
      t.status = TravelStatus.Cancelled;
    });
  });
};

/** Updates the status of a locally-stored travel to any TravelStatus value. */
export const updateTravelStatusLocally = async (id: string, status: number): Promise<void> => {
  await database.write(async () => {
    const travel = await database.get<Travel>("travels").find(id);
    await travel.update((t) => {
      t.status = status;
    });
  });
};

/** Sets a locally-stored travel to archived. */
export const archiveTravelLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const travel = await database.get<Travel>("travels").find(id);
    await travel.update((t) => {
      t.isArchived = true;
    });
  });
};
/** Unarchives a locally-stored travel. */
export const unarchiveTravelLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const travel = await database.get<Travel>("travels").find(id);
    await travel.update((t) => {
      t.isArchived = false;
    });
  });
};

export const updateActivitySortOrderLocally = async (id: string, newSortOrder: string, newSectionId?: string): Promise<void> => {
  await database.write(async () => {
    const activity = await database.get<Activity>("itinerary_activities").find(id);
    await activity.update((a) => {
      a.sortOrder = newSortOrder;
      if (newSectionId) {
        a.section.id = newSectionId;
      }
    });
  });
};

export const updateSectionSortOrderLocally = async (id: string, newSortOrder: string): Promise<void> => {
  await database.write(async () => {
    const section = await database.get<Section>("itinerary_sections").find(id);
    await section.update((s) => {
      s.sortOrder = newSortOrder;
    });
  });
};

export const seedDemoTravelData = async (): Promise<void> => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const endTrip = new Date(tomorrow);
  endTrip.setDate(tomorrow.getDate() + 2);
  endTrip.setHours(23, 59, 59, 999);

  const createDateTime = (dayOffset: number, hours: number, minutes = 0) => {
    const d = new Date(tomorrow);
    d.setDate(tomorrow.getDate() + dayOffset);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  await database.write(async () => {
    // 1. Create the travel plan (Tokyo, Japan)
    const newTravel = await database.get<Travel>("travels").create((t) => {
      Object.assign(t, {
        title: "🌸 Tokyo Explorer: 3-Day Highlights",
        description:
          "A curated 3-day adventure through Tokyo featuring historic temples, " +
          "culinary hotspots, digital art, and neon-lit districts.",
        destination: "Tokyo, Japan",
        destinationData: JSON.stringify({
          name: "Tokyo, Japan",
          address: "Tokyo, Japan",
          country: "Japan",
          countryCode: "JP",
          coordinates: { latitude: 35.6762, longitude: 139.6503 },
          latitude: 35.6762,
          longitude: 139.6503,
        }),
        startOrDepartureDate: tomorrow,
        endOrReturnDate: endTrip,
        status: TravelStatus.Upcoming,
        budget: "120000",
        notes:
          "• Pick up pocket Wi-Fi router at Haneda Airport T3.\n" +
          "• Add Suica or Pasmo IC card to Apple Wallet / Google Wallet for train transit.\n" +
          "• Carry JPY cash for temples, market stalls, and ramen ticket machines.\n" +
          "• Wear comfortable slip-on walking shoes (expect 15k-20k daily steps).",
        isOffline: true,
        isArchived: false,
        type: 1,
      });
    });

    // 2. Create Trip Destination & Settings
    await database.get<TripDestination>("trip_destinations").create((td) => {
      td.travel.id = newTravel.id;
      td.destination = "Tokyo, Japan";
      td.destinationData = JSON.stringify({
        name: "Tokyo, Japan",
        address: "Tokyo, Japan",
        country: "Japan",
        countryCode: "JP",
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        latitude: 35.6762,
        longitude: 139.6503,
      });
    });

    await database.get<TripSetting>("trip_settings").create((ts) => {
      ts.travel.id = newTravel.id;
      ts.currency = "JPY";
      ts.timezone = "Asia/Tokyo";
      ts.itineraryView = "day";
      ts.allowItemReordering = true;
      ts.showSectionTabNavigation = true;
    });

    // 3. Create 3 Day Sections
    const dayTitles = [
      "Day 1 - Arrival, Shinjuku & Shibuya Sky",
      "Day 2 - Historic Asakusa, Tsukiji & teamLab",
      "Day 3 - Meiji Shrine, Harajuku & Return Flight",
    ];

    const sections: Section[] = [];
    for (let i = 0; i < 3; i++) {
      const currentDate = new Date(tomorrow);
      currentDate.setDate(tomorrow.getDate() + i);

      const section = await database.get<Section>("itinerary_sections").create((s) => {
        s.travel.id = newTravel.id;
        s.title = dayTitles[i];
        s.description = currentDate.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        s.startDate = currentDate;
        s.endDate = currentDate;
        s.sortOrder = String(i + 1);
        s.isOffline = true;
      });
      sections.push(section);
    }

    // 4. Create Checklist Groups & Common Items (Packing List & Essentials)
    const packingGroup = await database.get<ChecklistGroup>("checklist_groups").create((g) => {
      g.travel.id = newTravel.id;
      g.title = "🎒 Packing List";
      g.description = "Essential clothing, footwear, and accessories to pack for Tokyo";
      g.sortOrder = "1";
      g.isOffline = true;
    });

    const essentialsGroup = await database.get<ChecklistGroup>("checklist_groups").create((g) => {
      g.travel.id = newTravel.id;
      g.title = "📋 Travel Essentials & Docs";
      g.description = "Passports, transit cards, connectivity, and ticket confirmations";
      g.sortOrder = "2";
      g.isOffline = true;
    });

    const packingItems = [
      { title: "Passport & Visit Japan Web immigration QR code", isDone: true },
      { title: "Comfortable slip-on walking shoes (15k-20k daily steps)", isDone: true },
      { title: "Universal Type-A plug adapter & 20,000mAh power bank", isDone: true },
      { title: "Compact coin purse (essential for 100¥ & 500¥ coins)", isDone: true },
      { title: "Small hand towel / handkerchief (public restrooms lack paper towels)", isDone: false },
      { title: "Weather-appropriate layers & light foldable umbrella", isDone: false },
      { title: "Prescription medications & mini first aid travel pouch", isDone: false },
      { title: "Foldable tote duffel bag for souvenirs and tax-free shopping", isDone: false },
    ];

    for (let p = 0; p < packingItems.length; p++) {
      await database.get<ChecklistItem>("checklist_items").create((ci) => {
        ci.travel.id = newTravel.id;
        ci.checklistGroup.id = packingGroup.id;
        ci.title = packingItems[p].title;
        ci.sortOrder = String(p + 1);
        ci.isDone = packingItems[p].isDone;
        ci.isOffline = true;
      });
    }

    const essentialsItems = [
      { title: "Reserve Pocket Wi-Fi router for terminal pickup at Haneda", isDone: true },
      { title: "Add digital Suica or Pasmo IC card to Apple/Google Wallet", isDone: true },
      { title: "Withdraw ¥30,000 - ¥50,000 JPY cash from 7-Bank ATM", isDone: false },
      { title: "Download offline Tokyo area map on Google Maps", isDone: true },
      { title: "Confirm Shibuya Sky & teamLab Planets timed entrance tickets", isDone: true },
      { title: "Save offline PDFs of hotel reservation and flight e-tickets", isDone: false },
    ];

    for (let e = 0; e < essentialsItems.length; e++) {
      await database.get<ChecklistItem>("checklist_items").create((ci) => {
        ci.travel.id = newTravel.id;
        ci.checklistGroup.id = essentialsGroup.id;
        ci.title = essentialsItems[e].title;
        ci.sortOrder = String(e + 1);
        ci.isDone = essentialsItems[e].isDone;
        ci.isOffline = true;
      });
    }

    // Ungrouped General Trip To-do's
    const generalItems = [
      { title: "Notify credit card bank of travel in Japan", isDone: true },
      { title: "Activate international carrier data roaming plan", isDone: true },
    ];

    for (let g = 0; g < generalItems.length; g++) {
      await database.get<ChecklistItem>("checklist_items").create((ci) => {
        ci.travel.id = newTravel.id;
        ci.title = generalItems[g].title;
        ci.sortOrder = String(g + 1);
        ci.isDone = generalItems[g].isDone;
        ci.isOffline = true;
      });
    }

    // ─── DAY 1 ACTIVITIES ───────────────────────────────────────────────

    // Day 1 Activity 1: Inbound Flight
    const flight1Start = createDateTime(0, 6, 0);
    const flight1End = createDateTime(0, 9, 30);
    const actFlight1 = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[0].id;
      Object.assign(a, {
        title: "✈️ Flight JL 078 to Tokyo Haneda (HND)",
        description: "Japan Airlines JL 078 - Direct flight arriving at Haneda Airport Terminal 3.",
        destination: "Tokyo Haneda Airport (HND), Terminal 3",
        destinationData: JSON.stringify({
          name: "Haneda Airport International Terminal 3",
          address: "Hanedakuko, Ota City, Tokyo 144-0041, Japan",
          coordinates: { latitude: 35.5494, longitude: 139.7798 },
          latitude: 35.5494,
          longitude: 139.7798,
          departureCoordinates: { latitude: 37.6188, longitude: -122.3758 },
          arrivalCoordinates: { latitude: 35.5494, longitude: 139.7798 },
        }),
        startDate: flight1Start,
        endDate: flight1End,
        budget: "45000",
        notes:
          "Clear immigration, collect baggage, pick up Pocket Wi-Fi at Ninja Wi-Fi counter (T3 2F), " +
          "and load Suica IC card at the Tokyo Monorail ticket gate.",
        isOffline: true,
        sortOrder: "1",
        type: TripPlanType.flight,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Flight", "JAL", "Inbound"]),
        website: "https://www.jal.co.jp/en/",
        bookingReference: "JAL-TK7892",
        contactName: "Japan Airlines Haneda Support",
        contactNumber: "+81 3-5460-0511",
        contactEmail: "support@jal.co.jp",
        priority: "High",
      });
    });

    await database.get<FlightDetails>("flight_details").create((f) => {
      f.activity.id = actFlight1.id;
      Object.assign(f, {
        departureAirport: "San Francisco International Airport (SFO)",
        arrivalAirport: "Tokyo Haneda Airport (HND)",
        departureDate: flight1Start,
        arrivalDate: flight1End,
        flightNumber: "JL 078",
        airline: "Japan Airlines",
        gate: "114",
        terminal: "Terminal 3",
        seatNumber: "23K",
        bookingReference: "JAL-TK7892",
        price: 45000,
      });
    });

    // Activity-specific checklist item
    await database.get<ChecklistItem>("checklist_items").create((ci) => {
      ci.travel.id = newTravel.id;
      ci.activity.id = actFlight1.id;
      ci.title = "Show Visit Japan Web customs QR code at Haneda electronic gate";
      ci.sortOrder = "1";
      ci.isDone = true;
      ci.isOffline = true;
    });

    // Day 1 Activity 2: Transit (Tokyo Monorail to Shinjuku)
    const transit1Start = createDateTime(0, 10, 15);
    const transit1End = createDateTime(0, 11, 0);
    const actTransit1 = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[0].id;
      Object.assign(a, {
        title: "🚝 Tokyo Monorail & Yamanote Line to Shinjuku",
        description:
          "Rapid Monorail from Haneda T3 to Hamamatsucho, transfer to JR Yamanote line to Shinjuku.",
        destination: "Hamamatsucho & Shinjuku Station",
        destinationData: JSON.stringify({
          name: "Haneda Airport Terminal 3 Station",
          address: "Hanedakuko, Ota City, Tokyo 144-0041, Japan",
          coordinates: { latitude: 35.5447, longitude: 139.7681 },
          latitude: 35.5447,
          longitude: 139.7681,
          pickupCoordinates: { latitude: 35.5447, longitude: 139.7681 },
          dropoffCoordinates: { latitude: 35.6909, longitude: 139.7003 },
          pickupLocation: {
            name: "Haneda Airport Terminal 3 Station",
            address: "Hanedakuko, Ota City, Tokyo",
          },
          dropoffLocation: {
            name: "JR Shinjuku Station (East Exit)",
            address: "Shinjuku City, Tokyo",
          },
        }),
        startDate: transit1Start,
        endDate: transit1End,
        budget: "650",
        notes: "Tap Suica card at gates. Board green Yamanote Line clockwise platform at Hamamatsucho.",
        isOffline: true,
        sortOrder: "2",
        type: TripPlanType.transit,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Transit", "Monorail", "JR"]),
        website: "https://www.tokyo-monorail.co.jp/english/",
        bookingReference: "SUICA-IC",
        contactNumber: "+81 3-3374-4062",
        priority: "Medium",
      });
    });

    await database.get<TransportationDetails>("transportation_details").create((td) => {
      td.activity.id = actTransit1.id;
      Object.assign(td, {
        mode: "Monorail & Train",
        operatorProvider: "Tokyo Monorail & JR East",
        pickupLocation: "Haneda Airport Terminal 3 Station",
        dropoffLocation: "JR Shinjuku Station (East Exit)",
        departureDateTime: transit1Start,
        arrivalDateTime: transit1End,
        seatOrVehicleNumber: "Haneda Express Rapid",
        bookingReference: "SUICA-IC",
        bookingStatus: "Confirmed",
        price: "650",
        websiteAddress: "https://www.tokyo-monorail.co.jp/english/",
        contactNumber: "+81 3-3374-4062",
        notes: "Fastest route into central Tokyo with scenic panoramic views of Tokyo Bay.",
      });
    });

    // Day 1 Activity 3: Stay Check-in (Hotel Gracery Shinjuku)
    const hotelCheckin = createDateTime(0, 14, 0);
    const hotelCheckinEnd = createDateTime(0, 14, 30);
    const hotelCheckout = createDateTime(2, 10, 0);
    const actHotel = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[0].id;
      Object.assign(a, {
        title: "🏨 Check-in at Hotel Gracery Shinjuku",
        description:
          "Modern hotel in Kabukicho featuring the iconic Godzilla Head terrace, " +
          "comfortable high-floor rooms, and prime location.",
        destination: "Hotel Gracery Shinjuku, Tokyo",
        destinationData: JSON.stringify({
          name: "Hotel Gracery Shinjuku",
          address: "1 Chome-19-1 Kabukicho, Shinjuku City, Tokyo 160-8466, Japan",
          coordinates: { latitude: 35.6953, longitude: 139.702 },
          latitude: 35.6953,
          longitude: 139.702,
        }),
        startDate: hotelCheckin,
        endDate: hotelCheckinEnd,
        budget: "48000",
        notes:
          "Drop off luggage if arriving before official 14:00 check-in. " +
          "Godzilla terrace on 8F open exclusively to hotel guests. 5-min walk to Shinjuku Station.",
        isOffline: true,
        sortOrder: "3",
        type: TripPlanType.stay,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Hotel", "Shinjuku", "Accommodation"]),
        website: "https://gracery.com/shinjuku/",
        bookingReference: "HGS-88204",
        contactName: "Front Desk Concierge",
        contactNumber: "+81 3-6833-1111",
        contactEmail: "shinjuku@gracery.com",
        priority: "High",
      });
    });

    await database.get<AccomodationDetails>("accomodation_details").create((ad) => {
      ad.activity.id = actHotel.id;
      Object.assign(ad, {
        accomodationName: "Hotel Gracery Shinjuku",
        address: "1 Chome-19-1 Kabukicho, Shinjuku City, Tokyo 160-8466, Japan",
        destinationAddressData: JSON.stringify({
          latitude: 35.6953,
          longitude: 139.702,
        }),
        subType: "Hotel",
        checkinDateTime: hotelCheckin,
        checkoutDateTime: hotelCheckout,
        websiteAddress: "https://gracery.com/shinjuku/",
        bookingReference: "HGS-88204",
        bookingStatus: "Confirmed",
        contactNumber: "+81 3-6833-1111",
        emailAddress: "shinjuku@gracery.com",
        contactName: "Front Desk Concierge",
      });
    });

    // Day 1 Activity 4: Restaurant (Ichiran Ramen Shinjuku)
    const dinner1Start = createDateTime(0, 15, 0);
    const dinner1End = createDateTime(0, 16, 0);
    const actDinner1 = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[0].id;
      Object.assign(a, {
        title: "🍜 Tonkotsu Ramen at Ichiran Shinjuku Chuo-Higashiguchi",
        description:
          "Classic solo-dining booth serving rich Hakata-style tonkotsu broth, " +
          "customizable firmness, and secret spicy red sauce.",
        destination: "Ichiran Shinjuku Chuo-Higashiguchi",
        destinationData: JSON.stringify({
          name: "Ichiran Shinjuku Chuo-Higashiguchi",
          address: "3 Chome-34-11 Shinjuku, Shinjuku City, Tokyo 160-0022, Japan",
          coordinates: { latitude: 35.6901, longitude: 139.7028 },
          latitude: 35.6901,
          longitude: 139.7028,
        }),
        startDate: dinner1Start,
        endDate: dinner1End,
        budget: "1600",
        notes:
          "Buy meal ticket at entrance vending machine. Fill custom order sheet: " +
          "rich broth, half-clove garlic, green onions, medium spicy red sauce.",
        isOffline: true,
        sortOrder: "4",
        type: TripPlanType.activity,
        planType: ActivityType.restaurant,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Food", "Ramen", "Shinjuku"]),
        website: "https://en.ichiran.com/shop/tokyo/shinjuku-chuo-higashiguchi/",
        contactNumber: "+81 3-3225-5518",
        priority: "Medium",
      });
    });

    await database.get<CafeRestaurantDetails>("cafe_restaurant_details").create((crd) => {
      crd.activity.id = actDinner1.id;
      Object.assign(crd, {
        restaurantName: "Ichiran Shinjuku Chuo-Higashiguchi",
        address: "3 Chome-34-11 Shinjuku, Shinjuku City, Tokyo 160-0022, Japan",
        destinationAddressData: JSON.stringify({
          latitude: 35.6901,
          longitude: 139.7028,
        }),
        cuisine: "Japanese Tonkotsu Ramen",
        priceRange: "¥1,000 - ¥2,000",
        reservationLink: "https://en.ichiran.com",
        websiteAddress: "https://en.ichiran.com/shop/tokyo/shinjuku-chuo-higashiguchi/",
        contactNumber: "+81 3-3225-5518",
      });
    });

    // Day 1 Activity 5: Sightseeing (Shibuya Sky Observation Deck)
    const sunsetStart = createDateTime(0, 17, 30);
    const sunsetEnd = createDateTime(0, 19, 30);
    const actSunset = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[0].id;
      Object.assign(a, {
        title: "🌆 Sunset at Shibuya Sky & Shibuya Crossing",
        description:
          "360-degree open-air rooftop observation deck atop Shibuya Scramble Square at 229m height, " +
          "overlooking the famous Scramble Crossing and Mount Fuji.",
        destination: "Shibuya Sky, Shibuya Scramble Square",
        destinationData: JSON.stringify({
          name: "Shibuya Sky",
          address: "2 Chome-24-12 Shibuya, Shibuya City, Tokyo 150-6145, Japan",
          coordinates: { latitude: 35.6585, longitude: 139.7023 },
          latitude: 35.6585,
          longitude: 139.7023,
        }),
        startDate: sunsetStart,
        endDate: sunsetEnd,
        budget: "2200",
        notes:
          "Timed admission slot: 17:40. Bags and loose hats must be stored in 46F lockers. " +
          "Cameras must have neck straps on the outdoor sky deck.",
        isOffline: true,
        sortOrder: "5",
        type: TripPlanType.activity,
        planType: ActivityType.sightseeing,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Sightseeing", "Shibuya", "Viewpoint"]),
        website: "https://www.shibuya-scramble-square.com/sky/",
        bookingReference: "SHIBSKY-90412",
        contactNumber: "+81 3-4221-0229",
        contactEmail: "info@shibuya-sky.jp",
        priority: "High",
      });
    });

    await database.get<SightseeingDetails>("sightseeing_details").create((sd) => {
      sd.activity.id = actSunset.id;
      Object.assign(sd, {
        attractionName: "Shibuya Sky Observation Deck",
        address: "2 Chome-24-12 Shibuya, Shibuya City, Tokyo 150-6145, Japan",
        destinationAddressData: JSON.stringify({
          latitude: 35.6585,
          longitude: 139.7023,
        }),
        entryFee: "¥2,200",
        websiteAddress: "https://www.shibuya-scramble-square.com/sky/",
        bookingReference: "SHIBSKY-90412",
        contactNumber: "+81 3-4221-0229",
        emailAddress: "info@shibuya-sky.jp",
      });
    });

    // ─── DAY 2 ACTIVITIES ───────────────────────────────────────────────

    // Day 2 Activity 1: Sightseeing (Senso-ji Temple & Asakusa)
    const templeStart = createDateTime(1, 8, 30);
    const templeEnd = createDateTime(1, 10, 30);
    const actTemple = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[1].id;
      Object.assign(a, {
        title: "⛩️ Senso-ji Temple & Nakamise Shopping Street",
        description:
          "Tokyo's oldest and most renowned Buddhist temple. Walk through the Kaminarimon Gate " +
          "and browse traditional craft and snack stalls along Nakamise-dori.",
        destination: "Senso-ji Temple, Asakusa",
        destinationData: JSON.stringify({
          name: "Senso-ji Temple",
          address: "2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan",
          coordinates: { latitude: 35.7148, longitude: 139.7967 },
          latitude: 35.7148,
          longitude: 139.7967,
        }),
        startDate: templeStart,
        endDate: templeEnd,
        budget: "1000",
        notes:
          "Arrive early before tour groups arrive. Draw an Omikuji fortune stick (100 JPY coin). " +
          "Try freshly baked Ningyo-yaki doll cakes and melon pan along Nakamise.",
        isOffline: true,
        sortOrder: "1",
        type: TripPlanType.activity,
        planType: ActivityType.sightseeing,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Culture", "Temple", "Asakusa"]),
        website: "https://www.senso-ji.jp/english/",
        contactNumber: "+81 3-3842-0181",
        contactEmail: "info@senso-ji.jp",
        priority: "High",
      });
    });

    await database.get<SightseeingDetails>("sightseeing_details").create((sd) => {
      sd.activity.id = actTemple.id;
      Object.assign(sd, {
        attractionName: "Senso-ji Temple & Kaminarimon",
        address: "2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan",
        destinationAddressData: JSON.stringify({
          latitude: 35.7148,
          longitude: 139.7967,
        }),
        entryFee: "Free admission",
        websiteAddress: "https://www.senso-ji.jp/english/",
        contactNumber: "+81 3-3842-0181",
        emailAddress: "info@senso-ji.jp",
      });
    });

    // Day 2 Activity 2: Restaurant (Tsukiji Outer Market)
    const sushiStart = createDateTime(1, 11, 15);
    const sushiEnd = createDateTime(1, 13, 0);
    const actSushi = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[1].id;
      Object.assign(a, {
        title: "🍣 Fresh Sushi & Street Food at Tsukiji Outer Market",
        description:
          "Vibrant food market packed with fresh sushi counters, grilled seafood skewers, " +
          "sweet rolled tamagoyaki omelets, and premium matcha tea.",
        destination: "Tsukiji Outer Market, Chuo City",
        destinationData: JSON.stringify({
          name: "Tsukiji Outer Market",
          address: "4 Chome-16-2 Tsukiji, Chuo City, Tokyo 104-0045, Japan",
          coordinates: { latitude: 35.6655, longitude: 139.7708 },
          latitude: 35.6655,
          longitude: 139.7708,
        }),
        startDate: sushiStart,
        endDate: sushiEnd,
        budget: "3500",
        notes:
          "Eat at designated stall tables or standing areas. " +
          "Must-try: Yamachou warm tamagoyaki (150 JPY) and fresh bluefin tuna nigiri bowl.",
        isOffline: true,
        sortOrder: "2",
        type: TripPlanType.activity,
        planType: ActivityType.restaurant,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Food", "Sushi", "Market"]),
        website: "https://www.tsukiji.or.jp/english/",
        contactNumber: "+81 3-3541-9444",
        priority: "High",
      });
    });

    await database.get<CafeRestaurantDetails>("cafe_restaurant_details").create((crd) => {
      crd.activity.id = actSushi.id;
      Object.assign(crd, {
        restaurantName: "Tsukiji Outer Market & Sushi Daiwa",
        address: "4 Chome-16-2 Tsukiji, Chuo City, Tokyo 104-0045, Japan",
        destinationAddressData: JSON.stringify({
          latitude: 35.6655,
          longitude: 139.7708,
        }),
        cuisine: "Fresh Sashimi, Sushi Donburi & Seafood",
        priceRange: "¥2,000 - ¥4,000",
        websiteAddress: "https://www.tsukiji.or.jp/english/",
        contactNumber: "+81 3-3541-9444",
      });
    });

    // Day 2 Activity 3: Entertainment (teamLab Planets TOKYO)
    const teamlabStart = createDateTime(1, 14, 0);
    const teamlabEnd = createDateTime(1, 16, 30);
    const actTeamlab = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[1].id;
      Object.assign(a, {
        title: "✨ teamLab Planets TOKYO Immersive Digital Art",
        description:
          "Renowned body-immersive digital museum where visitors walk barefoot through water, " +
          "crystal universes, and real hanging floating orchid gardens.",
        destination: "teamLab Planets TOKYO, Toyosu",
        destinationData: JSON.stringify({
          name: "teamLab Planets TOKYO",
          address: "6 Chome-1-16 Toyosu, Koto City, Tokyo 135-0061, Japan",
          coordinates: { latitude: 35.6491, longitude: 139.7898 },
          latitude: 35.6491,
          longitude: 139.7898,
        }),
        startDate: teamlabStart,
        endDate: teamlabEnd,
        budget: "3800",
        notes:
          "Timed admission slot: 14:00. Wear pants that easily roll up past knees (water depth ~30cm). " +
          "Free lockers provided on-site for shoes and bags.",
        isOffline: true,
        sortOrder: "3",
        type: TripPlanType.activity,
        planType: ActivityType.entertainment,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Art", "Museum", "teamLab"]),
        website: "https://planets.teamlab.art/tokyo/",
        bookingReference: "TLP-2026-X88",
        contactName: "teamLab Planets Visitor Services",
        contactNumber: "+81 3-3520-9977",
        contactEmail: "contact@planets.teamlab.art",
        priority: "High",
      });
    });

    await database.get<EntertainmentDetails>("entertainment_details").create((ed) => {
      ed.activity.id = actTeamlab.id;
      Object.assign(ed, {
        venueName: "teamLab Planets TOKYO",
        address: "6 Chome-1-16 Toyosu, Koto City, Tokyo 135-0061, Japan",
        destinationAddressData: JSON.stringify({
          latitude: 35.6491,
          longitude: 139.7898,
        }),
        subType: "Digital Art Museum",
        websiteAddress: "https://planets.teamlab.art/tokyo/",
        ticketPrice: "¥3,800",
        bookingReference: "TLP-2026-X88",
        contactName: "teamLab Planets Visitor Services",
        contactNumber: "+81 3-3520-9977",
        emailAddress: "contact@planets.teamlab.art",
      });
    });

    // Day 2 Activity 4: Shopping (Akihabara Electric Town)
    const akibaStart = createDateTime(1, 17, 30);
    const akibaEnd = createDateTime(1, 20, 0);
    const actAkiba = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[1].id;
      Object.assign(a, {
        title: "🎮 Gadget & Anime Shopping in Akihabara",
        description:
          "Explore multi-floor mega electronic stores, retro video game shops, " +
          "hobby complexes, and neon-drenched streets of Electric Town.",
        destination: "Akihabara Electric Town, Tokyo",
        destinationData: JSON.stringify({
          name: "Akihabara Electric Town",
          address: "1 Chome-1-1 Kanda Hanaoka-cho, Chiyoda City, Tokyo 101-0028, Japan",
          coordinates: { latitude: 35.6983, longitude: 139.7731 },
          latitude: 35.6983,
          longitude: 139.7731,
        }),
        startDate: akibaStart,
        endDate: akibaEnd,
        budget: "8000",
        notes:
          "Show passport for 10% tax-free discount on purchases over ¥5,000 at Yodobashi Camera, " +
          "Radio Kaikan, and Mandarake.",
        isOffline: true,
        sortOrder: "4",
        type: TripPlanType.activity,
        planType: ActivityType.shopping,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Shopping", "Gaming", "Akihabara"]),
        website: "https://www.yodobashi-akiba.com",
        bookingReference: "TAXFREE-JP",
        contactNumber: "+81 3-5209-1010",
        contactEmail: "info@yodobashi-akiba.com",
        priority: "Medium",
      });
    });

    await database.get<ShoppingDetails>("shopping_details").create((sd) => {
      sd.activity.id = actAkiba.id;
      Object.assign(sd, {
        venueName: "Yodobashi Akiba & Akihabara Radio Kaikan",
        address: "1 Chome-1-1 Kanda Hanaoka-cho, Chiyoda City, Tokyo 101-0028, Japan",
        destinationAddressData: JSON.stringify({
          latitude: 35.6983,
          longitude: 139.7731,
        }),
        subType: "Electronics & Anime Specialty",
        websiteAddress: "https://www.yodobashi-akiba.com",
        bookingReferenceOrLink: "TAXFREE-JP",
        promoCodeOrLink: "VISA-SPECIAL-5OFF",
        contactNumber: "+81 3-5209-1010",
        emailAddress: "info@yodobashi-akiba.com",
      });
    });

    // ─── DAY 3 ACTIVITIES ───────────────────────────────────────────────

    // Day 3 Activity 1: Stay Check-out (Hotel Gracery Shinjuku)
    const checkoutStart = createDateTime(2, 9, 30);
    const checkoutEnd = createDateTime(2, 10, 0);
    const actCheckout = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[2].id;
      Object.assign(a, {
        title: "🔑 Hotel Check-out & Luggage Storage",
        description:
          "Check out of Hotel Gracery Shinjuku, settle incidental room charges, " +
          "and leave bags with concierge until airport departure.",
        destination: "Hotel Gracery Shinjuku, Tokyo",
        destinationData: JSON.stringify({
          name: "Hotel Gracery Shinjuku",
          address: "1 Chome-19-1 Kabukicho, Shinjuku City, Tokyo 160-8466, Japan",
          coordinates: { latitude: 35.6953, longitude: 139.702 },
          latitude: 35.6953,
          longitude: 139.702,
        }),
        startDate: checkoutStart,
        endDate: checkoutEnd,
        budget: "0",
        notes:
          "Express checkout available via 8F automated kiosk. " +
          "Concierge will issue claim tag for luggage storage.",
        isOffline: true,
        sortOrder: "1",
        type: TripPlanType.stay,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Hotel", "Checkout"]),
        website: "https://gracery.com/shinjuku/",
        bookingReference: "HGS-88204",
        contactNumber: "+81 3-6833-1111",
        priority: "High",
      });
    });

    await database.get<AccomodationDetails>("accomodation_details").create((ad) => {
      ad.activity.id = actCheckout.id;
      Object.assign(ad, {
        accomodationName: "Hotel Gracery Shinjuku",
        address: "1 Chome-19-1 Kabukicho, Shinjuku City, Tokyo 160-8466, Japan",
        destinationAddressData: JSON.stringify({
          latitude: 35.6953,
          longitude: 139.702,
        }),
        subType: "Hotel",
        checkinDateTime: hotelCheckin,
        checkoutDateTime: checkoutEnd,
        websiteAddress: "https://gracery.com/shinjuku/",
        bookingReference: "HGS-88204",
        bookingStatus: "Confirmed",
        contactNumber: "+81 3-6833-1111",
        emailAddress: "shinjuku@gracery.com",
        contactName: "Front Desk Concierge",
      });
    });

    // Day 3 Activity 2: Nature / Walk (Meiji Jingu Shrine & Yoyogi Park)
    const shrineStart = createDateTime(2, 10, 30);
    const shrineEnd = createDateTime(2, 12, 30);
    const actShrine = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[2].id;
      Object.assign(a, {
        title: "🌲 Peaceful Forest Walk at Meiji Jingu Shrine",
        description:
          "Tranquil morning walk through 170 acres of evergreen sacred forest " +
          "surrounding Tokyo's grandest Shinto shrine.",
        destination: "Meiji Jingu Shrine, Shibuya",
        destinationData: JSON.stringify({
          name: "Meiji Jingu Shrine",
          address: "1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japan",
          coordinates: { latitude: 35.6764, longitude: 139.6993 },
          latitude: 35.6764,
          longitude: 139.6993,
        }),
        startDate: shrineStart,
        endDate: shrineEnd,
        budget: "500",
        notes:
          "Walk beneath the 1,500-year-old wooden Torii gate. " +
          "Photograph the wall of decorative sake barrels (Kazaridaru) and cleanse hands at Temizuya fountain.",
        isOffline: true,
        sortOrder: "2",
        type: TripPlanType.activity,
        planType: ActivityType.nature,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Nature", "Shrine", "Walk"]),
        website: "https://www.meijijingu.or.jp/en/",
        contactName: "Meiji Jingu Administration",
        contactNumber: "+81 3-3379-5511",
        contactEmail: "info@meijijingu.or.jp",
        priority: "Medium",
      });
    });

    await database.get<NatureDetails>("nature_details").create((nd) => {
      nd.activity.id = actShrine.id;
      Object.assign(nd, {
        spotName: "Meiji Jingu Sacred Forest & Shrine",
        address: "1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japan",
        destinationAddressData: JSON.stringify({
          latitude: 35.6764,
          longitude: 139.6993,
        }),
        subType: "Forest Shrine & Botanical Park",
        entryFee: "Free (¥500 for Inner Garden)",
        websiteAddress: "https://www.meijijingu.or.jp/en/",
        contactName: "Meiji Jingu Administration",
        contactNumber: "+81 3-3379-5511",
        emailAddress: "info@meijijingu.or.jp",
      });
    });

    // Day 3 Activity 3: Cafe (Matcha Sweets & Crepes in Harajuku)
    const cafeStart = createDateTime(2, 13, 0);
    const cafeEnd = createDateTime(2, 14, 15);
    const actCafe = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[2].id;
      Object.assign(a, {
        title: "🍵 Matcha Sweets & Crepes in Harajuku",
        description:
          "Stroll down Takeshita Street and treat yourself to hot Japanese crepes " +
          "and chilled ceremonial Uji matcha parfaits.",
        destination: "Takeshita Street & Marion Crepes, Harajuku",
        destinationData: JSON.stringify({
          name: "Marion Crepes Harajuku",
          address: "1 Chome-6-15 Jingumae, Shibuya City, Tokyo 150-0001, Japan",
          coordinates: { latitude: 35.6711, longitude: 139.7042 },
          latitude: 35.6711,
          longitude: 139.7042,
        }),
        startDate: cafeStart,
        endDate: cafeEnd,
        budget: "1200",
        notes:
          "Order at the street window. The Custard Strawberry Brownie crepe " +
          "and Nana's Green Tea iced matcha latte are classic Harajuku staples.",
        isOffline: true,
        sortOrder: "3",
        type: TripPlanType.activity,
        planType: ActivityType.cafe,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Cafe", "Dessert", "Matcha"]),
        website: "https://www.marion.co.jp",
        contactNumber: "+81 3-3401-7297",
        priority: "Low",
      });
    });

    await database.get<CafeRestaurantDetails>("cafe_restaurant_details").create((crd) => {
      crd.activity.id = actCafe.id;
      Object.assign(crd, {
        restaurantName: "Marion Crepes & Nana's Green Tea",
        address: "1 Chome-6-15 Jingumae, Shibuya City, Tokyo 150-0001, Japan",
        destinationAddressData: JSON.stringify({
          latitude: 35.6711,
          longitude: 139.7042,
        }),
        cuisine: "Japanese Crepes, Sweets & Matcha",
        priceRange: "¥600 - ¥1,500",
        websiteAddress: "https://www.marion.co.jp",
        contactNumber: "+81 3-3401-7297",
      });
    });

    // Day 3 Activity 4: Transit (Keikyu Airport Express to Haneda)
    const transit2Start = createDateTime(2, 15, 30);
    const transit2End = createDateTime(2, 16, 15);
    const actTransit2 = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[2].id;
      Object.assign(a, {
        title: "🚆 Keikyu Airport Express to Haneda Airport",
        description: "Direct rapid train service from Shinagawa Station to Haneda Airport Terminal 3.",
        destination: "Shinagawa to Haneda Airport Terminal 3",
        destinationData: JSON.stringify({
          name: "Shinagawa Station to Haneda Airport",
          address: "Shinagawa Station, Minato City, Tokyo 108-0074, Japan",
          coordinates: { latitude: 35.6284, longitude: 139.7387 },
          latitude: 35.6284,
          longitude: 139.7387,
          pickupCoordinates: { latitude: 35.6284, longitude: 139.7387 },
          dropoffCoordinates: { latitude: 35.5494, longitude: 139.7798 },
          pickupLocation: {
            name: "JR / Keikyu Shinagawa Station",
            address: "Minato City, Tokyo",
          },
          dropoffLocation: {
            name: "Haneda Airport Terminal 3 Station",
            address: "Ota City, Tokyo",
          },
        }),
        startDate: transit2Start,
        endDate: transit2End,
        budget: "450",
        notes: "Board Keikyu Airport Limited Express from Platform 1. Takes 15 minutes direct into Haneda T3.",
        isOffline: true,
        sortOrder: "4",
        type: TripPlanType.transit,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Transit", "Train", "Airport"]),
        website: "https://www.keikyu.co.jp/visit/taxifree/en/",
        bookingReference: "PASMO-KEIKYU",
        contactNumber: "+81 3-5789-8686",
        priority: "High",
      });
    });

    await database.get<TransportationDetails>("transportation_details").create((td) => {
      td.activity.id = actTransit2.id;
      Object.assign(td, {
        mode: "Airport Express Train",
        operatorProvider: "Keikyu Electric Railway",
        pickupLocation: "JR / Keikyu Shinagawa Station",
        dropoffLocation: "Haneda Airport Terminal 3 Station",
        departureDateTime: transit2Start,
        arrivalDateTime: transit2End,
        seatOrVehicleNumber: "Keikyu Airport Rapid Ltd Exp",
        bookingReference: "PASMO-KEIKYU",
        bookingStatus: "Confirmed",
        price: "450",
        websiteAddress: "https://www.keikyu.co.jp/visit/taxifree/en/",
        contactNumber: "+81 3-5789-8686",
        notes: "Arrive at Haneda Airport 3 hours prior to international departure.",
      });
    });

    // Day 3 Activity 5: Outbound Flight
    const flight2Start = createDateTime(2, 19, 45);
    const flight2End = createDateTime(2, 23, 30);
    const actFlight2 = await database.get<Activity>("itinerary_activities").create((a) => {
      a.section.id = sections[2].id;
      Object.assign(a, {
        title: "✈️ Flight JL 002 Return from Tokyo Haneda (HND)",
        description: "Japan Airlines JL 002 - Evening flight departing Haneda Airport Terminal 3 returning home.",
        destination: "Haneda Airport (HND) to San Francisco (SFO)",
        destinationData: JSON.stringify({
          name: "Haneda Airport International Terminal 3",
          address: "Hanedakuko, Ota City, Tokyo 144-0041, Japan",
          coordinates: { latitude: 35.5494, longitude: 139.7798 },
          latitude: 35.5494,
          longitude: 139.7798,
          departureCoordinates: { latitude: 35.5494, longitude: 139.7798 },
          arrivalCoordinates: { latitude: 37.6188, longitude: -122.3758 },
        }),
        startDate: flight2Start,
        endDate: flight2End,
        budget: "45000",
        notes:
          "Drop off pocket Wi-Fi router in Terminal 3 departures return box before security check. " +
          "Shop for souvenir sweets (Tokyo Banana, Shiroi Koibito) in 3F Edo Market.",
        isOffline: true,
        sortOrder: "5",
        type: TripPlanType.flight,
        secondaryType: JSON.stringify([]),
        images: JSON.stringify([]),
        isDone: false,
        attachments: JSON.stringify([]),
        customTags: JSON.stringify(["Flight", "JAL", "Return"]),
        website: "https://www.jal.co.jp/en/",
        bookingReference: "JAL-TK7893",
        contactName: "Japan Airlines Haneda Operations",
        contactNumber: "+81 3-5460-0511",
        priority: "High",
      });
    });

    await database.get<FlightDetails>("flight_details").create((f) => {
      f.activity.id = actFlight2.id;
      Object.assign(f, {
        departureAirport: "Tokyo Haneda Airport (HND)",
        arrivalAirport: "San Francisco International Airport (SFO)",
        departureDate: flight2Start,
        arrivalDate: flight2End,
        flightNumber: "JL 002",
        airline: "Japan Airlines",
        gate: "148",
        terminal: "Terminal 3",
        seatNumber: "23K",
        bookingReference: "JAL-TK7893",
        price: 45000,
      });
    });

    // 5. Create Sample Expenses & Etiquette Note
    await database.get<Expense>("itinerary_expenses").create((exp) => {
      exp.travel.id = newTravel.id;
      exp.activity.id = actFlight1.id;
      exp.title = "Pocket Wi-Fi 3-Day Unlimited Rental";
      exp.amount = 2800;
      exp.dateTime = flight1Start;
      exp.currency = "JPY";
      exp.category = "Transportation";
      exp.notes = "Picked up at Ninja Wi-Fi counter Haneda T3";
      exp.isOffline = true;
      exp.isIncludeInBill = true;
    });

    await database.get<Expense>("itinerary_expenses").create((exp) => {
      exp.travel.id = newTravel.id;
      exp.activity.id = actTransit1.id;
      exp.title = "Suica IC Card Initial Card & Rail Credit";
      exp.amount = 5000;
      exp.dateTime = transit1Start;
      exp.currency = "JPY";
      exp.category = "Transportation";
      exp.notes = "Loaded into digital wallet";
      exp.isOffline = true;
      exp.isIncludeInBill = true;
    });

    await database.get<Note>("itinerary_notes").create((n) => {
      n.travel.id = newTravel.id;
      n.title = "💡 Tokyo Travel Etiquette & Local Tips";
      n.content =
        "1. Escalator manners: Stand on the LEFT in Tokyo (walk on right).\n" +
        "2. No tipping anywhere in Japan: hospitality (omotenashi) is included in the bill.\n" +
        "3. Trash bins are rare: always carry a small plastic bag in your daypack for trash.\n" +
        "4. Remove shoes when entering fitting rooms, temples, and tatami restaurant booths.\n" +
        "5. Keep voice down and silence phones on trains and subways.";
      n.images = JSON.stringify([]);
      n.isOffline = true;
    });
  });
};

