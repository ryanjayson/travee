import { database } from "../../db";
import { Q } from "@nozbe/watermelondb";
import Travel from "../../db/models/Travel";
import Section from "../../db/models/Section";
import Activity from "../../db/models/Activity";
import FlightDetails from "../../db/models/FlightDetails";

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

export const getTravelsLocally = async (): Promise<any[]> => {
  const offlineTravels = await database.get<Travel>("travels").query(
    Q.where("is_offline", true)
  ).fetch();

  return offlineTravels.map((t) => ({
    id: t.id, // Note: WatermelonDB uses string IDs, but DTO expects number/string
    title: t.title,
    description: t.description,
    destination: t.destination,
    destinationData: t.destinationData ? JSON.parse(t.destinationData) : undefined,
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
    const t = await database.get<Travel>("travels").find(id.toString());
    const travelDto = {
      id: t.id,
      title: t.title,
      description: t.description,
      destination: t.destination,
      destinationData: t.destinationData ? JSON.parse(t.destinationData) : undefined,
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
      Q.where("travel_id", id.toString()),
      Q.sortBy("is_default_section", Q.desc),
      Q.sortBy("sort_order", Q.asc)
    ).fetch();

    const itinerarySection = await Promise.all(sections.map(async (s) => {
      const activities = await database.get<Activity>("itinerary_activities").query(
        Q.where("section_id", s.id),
        Q.sortBy("sort_order", Q.asc)
      ).fetch();

      const itineraryActivity = await Promise.all(activities.map(async (a) => {
        const notesCount = await database.get("itinerary_notes").query(Q.where("activity_id", a.id)).fetchCount();
        const expensesCount = await database.get("itinerary_expenses").query(Q.where("activity_id", a.id)).fetchCount();
        const checklistCount = await database.get("checklist_items").query(Q.where("activity_id", a.id)).fetchCount();
        const flightDetails = await fetchLocalFlightDetails(a.id);

        return {
          id: a.id,
          sectionId: s.id,
          title: a.title,
          description: a.description,
          destination: a.destination,
          destinationData: a.destinationData ? JSON.parse(a.destinationData) : undefined,
          startDate: a.startDate,
          endDate: a.endDate,
          budget: a.budget,
          notes: a.notes,
          isOffline: a.isOffline,
          sortOrder: a.sortOrder,
          type: a.type,
          secondaryType: a.secondaryType ? JSON.parse(a.secondaryType) : undefined,
          images: a.images ? JSON.parse(a.images) : undefined,
          isDone: a.isDone,
          attachments: a.attachments ? JSON.parse(a.attachments) : undefined,
          notesCount,
          expensesCount,
          checklistCount,
          flightDetails,
        };
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
    if (activityData.type === 1 && activityData.flightDetails) {
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

    return activity;
  });
};

export const fetchLocalItineraryActivity = async (id: string): Promise<any> => {
  try {
    const a = await database.get<Activity>("itinerary_activities").find(id);
    const notesCount = await database.get("itinerary_notes").query(Q.where("activity_id", a.id)).fetchCount();
    const expensesCount = await database.get("itinerary_expenses").query(Q.where("activity_id", a.id)).fetchCount();
    const checklistCount = await database.get("checklist_items").query(Q.where("activity_id", a.id)).fetchCount();
    const flightDetails = await fetchLocalFlightDetails(a.id);

    return {
      id: a.id,
      sectionId: a.section.id,
      title: a.title,
      description: a.description,
      destination: a.destination,
      destinationData: a.destinationData ? JSON.parse(a.destinationData) : undefined,
      startDate: a.startDate,
      endDate: a.endDate,
      budget: a.budget,
      notes: a.notes,
      isOffline: a.isOffline,
      sortOrder: a.sortOrder,
      type: a.type,
      secondaryType: a.secondaryType ? JSON.parse(a.secondaryType) : undefined,
      images: a.images ? JSON.parse(a.images) : undefined,
      isDone: a.isDone,
      attachments: a.attachments ? JSON.parse(a.attachments) : undefined,
      notesCount,
      expensesCount,
      checklistCount,
      flightDetails,
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
    destinationData: a.destinationData ? JSON.parse(a.destinationData) : undefined,
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
    // travelId: a.travelId,
    sectionId: a.section.id,
    title: a.title,
    description: a.description,
    destination: a.destination,
    destinationData: a.destinationData ? JSON.parse(a.destinationData) : undefined,
    startDate: a.startDate,
    endDate: a.endDate,
    // status: a.status,
    isOffline: a.isOffline,
    type: a.type,
    isDone: a.isDone,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
};

/** Permanently deletes a locally-stored travel and all its sections/activities/expenses/notes/checklists. */
export const deleteTravelLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const travel = await database.get<Travel>("travels").find(id);

    // Delete all activities belonging to this travel's sections
    const sections = await database.get<Section>("itinerary_sections").query(
      Q.where("travel_id", id)
    ).fetch();

    for (const section of sections) {
      const activities = await database.get<Activity>("itinerary_activities").query(
        Q.where("section_id", section.id)
      ).fetch();
      for (const activity of activities) {
        // Delete expenses, notes, checklists for this activity
        const expenses = await database.get<any>("itinerary_expenses").query(Q.where("activity_id", activity.id)).fetch();
        for (const exp of expenses) await exp.destroyPermanently();
        
        const notes = await database.get<any>("itinerary_notes").query(Q.where("activity_id", activity.id)).fetch();
        for (const note of notes) await note.destroyPermanently();
        
        const checklists = await database.get<any>("checklist_items").query(Q.where("activity_id", activity.id)).fetch();
        for (const cl of checklists) await cl.destroyPermanently();

        await activity.destroyPermanently();
      }
      await section.destroyPermanently();
    }

    await travel.destroyPermanently();
  });
};

/** Permanently deletes a locally-stored section and all its activities. */
export const deleteSectionLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const section = await database.get<Section>("itinerary_sections").find(id);
    
    const activities = await database.get<Activity>("itinerary_activities").query(
      Q.where("section_id", section.id)
    ).fetch();
    for (const activity of activities) {
      const expenses = await database.get<any>("itinerary_expenses").query(Q.where("activity_id", activity.id)).fetch();
      for (const exp of expenses) await exp.destroyPermanently();
      
      const notes = await database.get<any>("itinerary_notes").query(Q.where("activity_id", activity.id)).fetch();
      for (const note of notes) await note.destroyPermanently();
      
      const checklists = await database.get<any>("checklist_items").query(Q.where("activity_id", activity.id)).fetch();
      for (const cl of checklists) await cl.destroyPermanently();

      await activity.destroyPermanently();
    }
    await section.destroyPermanently();
  });
};

/** Permanently deletes a locally-stored activity. */
export const deleteActivityLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const activity = await database.get<Activity>("itinerary_activities").find(id);
    
    const expenses = await database.get<any>("itinerary_expenses").query(Q.where("activity_id", activity.id)).fetch();
    for (const exp of expenses) await exp.destroyPermanently();
    
    const notes = await database.get<any>("itinerary_notes").query(Q.where("activity_id", activity.id)).fetch();
    for (const note of notes) await note.destroyPermanently();
    
    const checklists = await database.get<any>("checklist_items").query(Q.where("activity_id", activity.id)).fetch();
    for (const cl of checklists) await cl.destroyPermanently();

    await activity.destroyPermanently();
  });
};

/** Updates a locally-stored travel status. */
export const cancelTravelLocally = async (id: string): Promise<void> => {
  await database.write(async () => {
    const travel = await database.get<Travel>("travels").find(id);
    await travel.update((t) => {
      t.status = 5; // TravelStatus.Cancelled
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
