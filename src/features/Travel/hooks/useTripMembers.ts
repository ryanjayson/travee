import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../context/ToastContext";
import { TripMember } from "../types/TravelDto";
import { fetchTripMembers, saveTripMember, deleteTripMember } from "../../../services/travel/tripMemberService";

export const useTripMembers = (travelId: string) => {
  return useQuery({
    queryKey: ["tripMembers", travelId],
    queryFn: () => fetchTripMembers(travelId),
    enabled: !!travelId,
  });
};

export const useSaveTripMemberMutation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (memberData: TripMember) => saveTripMember(memberData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tripMembers", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      showToast({
        type: "success",
        message: variables.id ? "Member updated successfully!" : "Member added successfully!",
      });
    },
    onError: (error: Error) => {
      console.error("Save Member Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to save member.",
      });
    },
  });
};

export const useDeleteTripMemberMutation = (travelId: string) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteTripMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tripMembers", travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      showToast({
        type: "success",
        message: "Member removed from trip.",
      });
    },
    onError: (error: Error) => {
      console.error("Delete Member Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to remove member.",
      });
    },
  });
};
