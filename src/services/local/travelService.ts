import { database } from "../../db";
import { Q } from "@nozbe/watermelondb";
import Travel from "../../db/models/Travel";
import Section from "../../db/models/Section";
import Activity from "../../db/models/Activity";
import FlightDetails from "../../db/models/FlightDetails";
import AccomodationDetails from "../../db/models/AccomodationDetails";
import SightseeingDetails from "../../db/models/SightseeingDetails";
import HikeOrCampDetails from "../../db/models/HikeOrCampDetails";
import { ActivityType, TravelStatus } from "../../types/enums";
import { safeJsonParse } from "../../utils/safeJsonParse";

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
        checkinDateTime: a.checkinDateTime,
        checkoutDateTime: a.checkoutDateTime,
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
        departureDate: f.departureDate,
        arrivalDate: f.arrivalDate,
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
        entryFee: s.entryFee,
        websiteAddress: s.websiteAddress,
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
      };
    }
    return null;
  } catch (err) {
    console.error("Error fetching local hike or camp details:", err);
    return null;
  }
};


export const getTravelsLocally = async (): Promise<any[]> => {
  const offlineTravels = await database.get<Travel>("travels").query(
    Q.where("is_offline", true)
  ).fetch();

  return offlineTravels.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    destination: t.destination,
    destinationData: safeJsonParse(t.destinationData, undefined),
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
    const travelDto = {
      id: t.id,
      title: t.title,
      description: t.description,
      destination: t.destination,
      destinationData: safeJsonParse(t.destinationData, undefined),
      startOrDepartureDate: t.startOrDepartureDate,
      endOrReturnDate: t.endOrReturnDate,
      status: t.status,
      budget: t.budget,
      notes: t.notes,
      isOffline: t.isOffline,
      isArchived: t.isArchived,
      type: t.type,
    };

    const sections = await database.get<Section>("itinerary_sections").query(
      Q.where("travel_id", travelId),
      Q.sortBy("is_default_section", Q.desc),
      Q.sortBy("sort_order", Q.asc)
    ).fetch();

    // ── Bulk-fetch all activity-level related records for this travel ──────────
    // This replaces the N+1 pattern (5 queries × N activities) with 5 flat
    // queries total. Each result is reduced into a Map keyed by activity_id
    // so lookups below are O(1).
    const [allNotes, allExpenses, allChecklists, allFlights, allAccomodations, allSightseeings, allHikeOrCamps] =
      await Promise.all([
        database.get("itinerary_notes").query(Q.where("travel_id", travelId)).fetch(),
        database.get("itinerary_expenses").query(Q.where("travel_id", travelId)).fetch(),
        database.get("checklist_items").query(Q.where("travel_id", travelId)).fetch(),
        database.get<FlightDetails>("flight_details").query().fetch(),
        database.get<AccomodationDetails>("accomodation_details").query().fetch(),
        database.get<SightseeingDetails>("sightseeing_details").query().fetch(),
        database.get<HikeOrCampDetails>("hike_or_camp_details").query().fetch(),
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
          departureDate: f.departureDate,
          arrivalDate: f.arrivalDate,
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
          checkinDateTime: a.checkinDateTime,
          checkoutDateTime: a.checkoutDateTime,
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
          entryFee: s.entryFee,
          websiteAddress: s.websiteAddress,
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
    // ─────────────────────────────────────────────────────────────────────────

    const itinerarySection = await Promise.all(sections.map(async (s) => {
      const activities = await database.get<Activity>("itinerary_activities").query(
        Q.where("section_id", s.id),
        Q.sortBy("sort_order", Q.asc)
      ).fetch();

      const itineraryActivity = activities.map((a) => ({
        id: a.id,
        sectionId: s.id,
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
        secondaryType: safeJsonParse(a.secondaryType, undefined),
        images: safeJsonParse(a.images, undefined),
        isDone: a.isDone,
        attachments: safeJsonParse(a.attachments, undefined),
        notesCount: notesCountMap.get(a.id) ?? 0,
        expensesCount: expensesCountMap.get(a.id) ?? 0,
        checklistCount: checklistCountMap.get(a.id) ?? 0,
        flightDetails: flightDetailsMap.get(a.id) ?? null,
        accomodationDetails: accomodationDetailsMap.get(a.id) ?? null,
        sightseeingDetails: sightseeingDetailsMap.get(a.id) ?? null,
        hikeOrCampDetails: hikeOrCampDetailsMap.get(a.id) ?? null,
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
        travelId: t.id,
        itineraryActivity,
      };
    }));

    return {
      travel: travelDto,
      itinerarySection,
    };
  } catch (err) {
    throw new Error(`Travel Plan not found locally with ID: ${id}`);
  }
};

export const saveTravelLocally = async (travelData: any, id?: string) => {
  return await database.write(async () => {
    if (id) {
      const travel = await database.get<Travel>("travels").find(id.toString());
      await travel.update((t) => {
        Object.assign(t, {
          title: travelData.title,
          description: travelData.description,
          destination: travelData.destination,
          destinationData: JSON.stringify(travelData.destinationData),
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
      return travel;
    } else {
      const newTravel = await database.get<Travel>("travels").create((t) => {
        Object.assign(t, {
          title: travelData.title,
          description: travelData.description,
          destination: travelData.destination,
          destinationData: JSON.stringify(travelData.destinationData),
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

      return newTravel;
    }
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

export const saveActivityLocally = async (activityData: any, id?: string) => {
  return await database.write(async () => {
    let activity;
    if (id) {
      activity = await database.get<Activity>("itinerary_activities").find(id.toString());
      await activity.update((a) => {
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
          secondaryType: JSON.stringify(activityData.secondaryType),
          images: JSON.stringify(activityData.images),
          isDone: activityData.isDone || false,
          isDeleted: false,
          isDefaultSection: activityData.isDefaultSection,
          attachments: JSON.stringify(activityData.attachments || []),
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
          secondaryType: JSON.stringify(activityData.secondaryType),
          images: JSON.stringify(activityData.images),
          isDone: activityData.isDone || false,
          attachments: JSON.stringify(activityData.attachments || []),
        });
      });
    }

    // Save associated flight details
    if (activityData.type === ActivityType.flight && activityData.flightDetails) {
      const flightDetailsCollection = database.get<FlightDetails>("flight_details");
      const existingDetails = await flightDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((f) => {
          Object.assign(f, {
            departureAirport: activityData.flightDetails.departureAirport,
            arrivalAirport: activityData.flightDetails.arrivalAirport,
            departureDate: activityData.flightDetails.departureDate ? new Date(activityData.flightDetails.departureDate) : new Date(),
            arrivalDate: activityData.flightDetails.arrivalDate ? new Date(activityData.flightDetails.arrivalDate) : null,
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
            departureDate: activityData.flightDetails.departureDate ? new Date(activityData.flightDetails.departureDate) : new Date(),
            arrivalDate: activityData.flightDetails.arrivalDate ? new Date(activityData.flightDetails.arrivalDate) : null,
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
    if (activityData.type === ActivityType.accomodation && activityData.accomodationDetails) {
      const accomodationDetailsCollection = database.get<AccomodationDetails>("accomodation_details");
      const existingDetails = await accomodationDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((f) => {
          Object.assign(f, {
            accomodationName: activityData.accomodationDetails.accomodationName,
            address: activityData.accomodationDetails.address,
            checkinDateTime: activityData.accomodationDetails.checkinDateTime ? new Date(activityData.accomodationDetails.checkinDateTime) : new Date(),
            checkoutDateTime: activityData.accomodationDetails.checkoutDateTime ? new Date(activityData.accomodationDetails.checkoutDateTime) : null,
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
            checkinDateTime: activityData.accomodationDetails.checkinDateTime ? new Date(activityData.accomodationDetails.checkinDateTime) : new Date(),
            checkoutDateTime: activityData.accomodationDetails.checkoutDateTime ? new Date(activityData.accomodationDetails.checkoutDateTime) : null,
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
    if (activityData.type === ActivityType.sightseeing && activityData.sightseeingDetails) {
      const sightseeingDetailsCollection = database.get<SightseeingDetails>("sightseeing_details");
      const existingDetails = await sightseeingDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((s) => {
          Object.assign(s, {
            attractionName: activityData.sightseeingDetails.attractionName,
            address: activityData.sightseeingDetails.address,
            entryFee: activityData.sightseeingDetails.entryFee,
            websiteAddress: activityData.sightseeingDetails.websiteAddress,
          });
        });
      } else {
        await sightseeingDetailsCollection.create((s) => {
          s.activity.id = activity.id;
          Object.assign(s, {
            attractionName: activityData.sightseeingDetails.attractionName,
            address: activityData.sightseeingDetails.address,
            entryFee: activityData.sightseeingDetails.entryFee,
            websiteAddress: activityData.sightseeingDetails.websiteAddress,
          });
        });
      }
    }

    // Save associated hike or camp details
    if (activityData.type === ActivityType.hikeOrCamp && activityData.hikeOrCampDetails) {
      const hikeOrCampDetailsCollection = database.get<HikeOrCampDetails>("hike_or_camp_details");
      const existingDetails = await hikeOrCampDetailsCollection.query(
        Q.where("activity_id", activity.id)
      ).fetch();

      if (existingDetails.length > 0) {
        await existingDetails[0].update((h) => {
          Object.assign(h, {
            trailOrSiteName: activityData.hikeOrCampDetails.trailOrSiteName,
            address: activityData.hikeOrCampDetails.address,
            subType: activityData.hikeOrCampDetails.subType,
            estimatedDistanceKm: activityData.hikeOrCampDetails.estimatedDistanceKm,
            campsiteName: activityData.hikeOrCampDetails.campsiteName,
            permitRequired: activityData.hikeOrCampDetails.permitRequired,
            contactPerson: activityData.hikeOrCampDetails.contactPerson,
            contactNumber: activityData.hikeOrCampDetails.contactNumber,
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
            subType: activityData.hikeOrCampDetails.subType,
            estimatedDistanceKm: activityData.hikeOrCampDetails.estimatedDistanceKm,
            campsiteName: activityData.hikeOrCampDetails.campsiteName,
            permitRequired: activityData.hikeOrCampDetails.permitRequired,
            contactPerson: activityData.hikeOrCampDetails.contactPerson,
            contactNumber: activityData.hikeOrCampDetails.contactNumber,
            websiteAddress: activityData.hikeOrCampDetails.websiteAddress,
            reservationLink: activityData.hikeOrCampDetails.reservationLink,
            checkinDateTime: activityData.hikeOrCampDetails.checkinDateTime ? new Date(activityData.hikeOrCampDetails.checkinDateTime) : null,
            checkoutDateTime: activityData.hikeOrCampDetails.checkoutDateTime ? new Date(activityData.hikeOrCampDetails.checkoutDateTime) : null,
          });
        });
      }
    }

    return activity;
  });
};

export const fetchLocalItineraryActivity = async (id: string): Promise<any> => {
  try {
    const a = await database.get<Activity>("itinerary_activities").find(id);
    // Run all counts and detail fetches in parallel — no N+1 for a single activity
    const [notesCount, expensesCount, checklistCount, flightDetails, accomodationDetails, sightseeingDetails, hikeOrCampDetails] =
      await Promise.all([
        database.get("itinerary_notes").query(Q.where("activity_id", a.id)).fetchCount(),
        database.get("itinerary_expenses").query(Q.where("activity_id", a.id)).fetchCount(),
        database.get("checklist_items").query(Q.where("activity_id", a.id)).fetchCount(),
        fetchLocalFlightDetails(a.id),
        fetchLocalAccomodationDetails(a.id),
        fetchLocalSightseeingDetails(a.id),
        fetchLocalHikeOrCampDetails(a.id),
      ]);

    return {
      id: a.id,
      sectionId: a.section.id,
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
      secondaryType: safeJsonParse(a.secondaryType, undefined),
      images: safeJsonParse(a.images, undefined),
      isDone: a.isDone,
      attachments: safeJsonParse(a.attachments, undefined),
      notesCount,
      expensesCount,
      checklistCount,
      flightDetails,
      accomodationDetails,
      sightseeingDetails,
      hikeOrCampDetails,
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
  const [expenses, notes, checklists, flights, accomodations, sightseeings, hikeOrCamps] = await Promise.all([
    database.get<any>("itinerary_expenses").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("itinerary_notes").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("checklist_items").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("flight_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("accomodation_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("sightseeing_details").query(Q.where("activity_id", activityId)).fetch(),
    database.get<any>("hike_or_camp_details").query(Q.where("activity_id", activityId)).fetch(),
  ]);
  return [...expenses, ...notes, ...checklists, ...flights, ...accomodations, ...sightseeings, ...hikeOrCamps];
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

  // ── Phase 2: Writes (all batched in one transaction) ───────────────────────
  await database.write(async () => {
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
