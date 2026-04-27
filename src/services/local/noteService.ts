import { database } from "../../db";
import Note from "../../db/models/Note";
import { ItineraryNote } from "../../features/Travel/types/TravelDto";
import { Q } from "@nozbe/watermelondb";

export const saveNoteLocally = async (noteData: ItineraryNote): Promise<Note> => {
  return await database.write(async () => {
    if (noteData.id) {
      const note = await database.get<Note>("itinerary_notes").find(noteData.id);
      return await note.update((record) => {
        record.title = noteData.title;
        record.content = noteData.content || null;
        record.images = noteData.images ? JSON.stringify(noteData.images) : null;
        record.userId = noteData.userId || null;
        record.isOffline = true;
        // @ts-ignore
        record.travel.id = noteData.travelId;
        // @ts-ignore
        record.activity.id = noteData.activityId || null;
      });
    } else {
      return await database.get<Note>("itinerary_notes").create((record) => {
        record.title = noteData.title;
        record.content = noteData.content || null;
        record.images = noteData.images ? JSON.stringify(noteData.images) : null;
        record.userId = noteData.userId || null;
        record.isOffline = true;
        // @ts-ignore
        record.travel.id = noteData.travelId;
        if (noteData.activityId) {
          // @ts-ignore
          record.activity.id = noteData.activityId;
        }
      });
    }
  });
};

export const fetchLocalNotes = async (travelId: string): Promise<ItineraryNote[]> => {
  const notes = await database
    .get<Note>("itinerary_notes")
    .query(Q.where("travel_id", travelId))
    .fetch();

  return notes.map((n) => ({
    id: n.id,
    travelId: travelId,
    activityId: n.activity?.id,
    title: n.title,
    content: n.content || undefined,
    images: n.images ? JSON.parse(n.images) : [],
    userId: n.userId || undefined,
    isOffline: n.isOffline,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }));
};

export const deleteNoteLocally = async (noteId: string): Promise<void> => {
  await database.write(async () => {
    const note = await database.get<Note>("itinerary_notes").find(noteId);
    await note.destroyPermanently();
  });
};
