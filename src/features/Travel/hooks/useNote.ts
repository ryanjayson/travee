import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ItineraryNote } from "../types/TravelDto";
import { saveItineraryNote, fetchItineraryNotes, deleteItineraryNote, fetchItineraryNotesByActivity } from "../../../services/travel/noteService";

export const useItineraryNotes = (travelId: string) => {
  return useQuery({
    queryKey: ["itineraryNotes", travelId],
    queryFn: () => fetchItineraryNotes(travelId),
    enabled: !!travelId,
  });
};

export const useSaveNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteData: ItineraryNote) => saveItineraryNote(noteData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itineraryNotes", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      // Invalidate activity-scoped cache so the tab refreshes immediately
      if (variables.activityId) {
        queryClient.invalidateQueries({ queryKey: ["itineraryNotesByActivity", variables.activityId] });
      }
    },
  });
};

export const useDeleteNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, travelId }: { noteId: string; travelId: string; activityId?: string }) =>
      deleteItineraryNote(noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itineraryNotes", variables.travelId] });
      if (variables.activityId) {
        queryClient.invalidateQueries({ queryKey: ["itineraryNotesByActivity", variables.activityId] });
      }
    },
  });
};
export const useItineraryNotesByActivity = (activityId: string) => {
  return useQuery({
    queryKey: ["itineraryNotesByActivity", activityId],
    queryFn: () => fetchItineraryNotesByActivity(activityId),
    enabled: !!activityId,
  });
};
