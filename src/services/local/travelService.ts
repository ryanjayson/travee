import { database } from "../../db";
import { Q } from "@nozbe/watermelondb";
import Travel from "../../db/models/Travel";
import Section from "../../db/models/Section";
import Activity from "../../db/models/Activity";

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
    };

    const sections = await database.get<Section>("itinerary_sections").query(
      Q.where("travel_id", id.toString())
    ).fetch();

    const itinerarySection = await Promise.all(sections.map(async (s) => {
      const activities = await database.get<Activity>("itinerary_activities").query(
        Q.where("section_id", s.id)
      ).fetch();

      const itineraryActivity = activities.map((a) => ({
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
        });
      });
      return travel;
    } else {
      return await database.get<Travel>("travels").create((t) => {
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
        });
      });
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
    if (id) {
      const activity = await database.get<Activity>("itinerary_activities").find(id.toString());
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
        });
      });
      return activity;
    } else {
      return await database.get<Activity>("itinerary_activities").create((a) => {
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
        });
      });
    }
  });
};

export const fetchLocalItineraryActivity = async (id: string): Promise<any> => {
  try {
    const a = await database.get<Activity>("itinerary_activities").find(id);
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
    };
  } catch (err) {
    throw new Error(`Itinerary Activity not found locally with ID: ${id}`);
  }
};
