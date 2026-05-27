import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../context/ToastContext";
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
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (noteData: ItineraryNote) => saveItineraryNote(noteData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itineraryNotes", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      // Invalidate activity-scoped cache so the tab refreshes immediately
      if (variables.activityId) {
        queryClient.invalidateQueries({ queryKey: ["itineraryNotesByActivity", variables.activityId] });
      }
      showToast({
        type: "success",
        message: variables.id ? "Note updated successfully!" : "Note saved successfully!",
      });
    },
    onError: (error: Error) => {
      console.error("Save Note Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to save note.",
      });
    },
  });
};

export const useDeleteNoteMutation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ noteId, travelId }: { noteId: string; travelId: string; activityId?: string }) =>
      deleteItineraryNote(noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itineraryNotes", variables.travelId] });
      if (variables.activityId) {
        queryClient.invalidateQueries({ queryKey: ["itineraryNotesByActivity", variables.activityId] });
      }
      showToast({
        type: "success",
        message: "Note deleted successfully!",
      });
    },
    onError: (error: Error) => {
      console.error("Delete Note Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to delete note.",
      });
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
