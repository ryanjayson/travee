import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

  return useMutation({
    mutationFn: (memberData: TripMember) => saveTripMember(memberData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tripMembers", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
    },
  });
};

export const useDeleteTripMemberMutation = (travelId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTripMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tripMembers", travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
    },
  });
};
