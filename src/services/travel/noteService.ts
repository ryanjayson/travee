import { ItineraryNote } from "../../features/Travel/types/TravelDto";
import { saveNoteLocally, fetchLocalNotes, deleteNoteLocally } from "../local/noteService";

export const saveItineraryNote = async (noteData: ItineraryNote) => {
  return await saveNoteLocally(noteData);
};

export const fetchItineraryNotes = async (travelId: string) => {
  return await fetchLocalNotes(travelId);
};

export const deleteItineraryNote = async (noteId: string) => {
  return await deleteNoteLocally(noteId);
};
