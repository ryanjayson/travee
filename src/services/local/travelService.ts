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
    startDate: t.startDate,
    endDate: t.endDate,
    status: t.status,
    budget: t.budget,
    notes: t.notes,
    isOffline: t.isOffline,
  }));
};

export const saveTravelLocally = async (travelData: any, id?: number) => {
  return await database.write(async () => {
    if (id) {
      const travel = await database.get<Travel>("travels").find(id.toString());
      await travel.update((t) => {
        Object.assign(t, {
          title: travelData.title,
          description: travelData.description,
          destination: travelData.destination,
          destinationData: JSON.stringify(travelData.destinationData),
          startDate: travelData.startDate ? new Date(travelData.startDate) : null,
          endDate: travelData.endDate ? new Date(travelData.endDate) : null,
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
          startDate: travelData.startDate ? new Date(travelData.startDate) : null,
          endDate: travelData.endDate ? new Date(travelData.endDate) : null,
          status: travelData.status,
          budget: travelData.budget,
          notes: travelData.notes,
          isOffline: true,
        });
      });
    }
  });
};

export const saveSectionLocally = async (sectionData: any, id?: number) => {
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
          s._raw.set("travel_id", sectionData.travelId.toString());
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

export const saveActivityLocally = async (activityData: any, id?: number) => {
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
        });
      });
      return activity;
    } else {
      return await database.get<Activity>("itinerary_activities").create((a) => {
        if (activityData.sectionId) {
          a._raw.set("section_id", activityData.sectionId.toString());
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
        });
      });
    }
  });
};
