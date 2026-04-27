import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ItineraryNote } from "../types/TravelDto";
import { saveItineraryNote, fetchItineraryNotes, deleteItineraryNote } from "../../../services/travel/noteService";

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
    },
  });
};

export const useDeleteNoteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, travelId }: { noteId: string; travelId: string }) =>
      deleteItineraryNote(noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itineraryNotes", variables.travelId] });
    },
  });
};
