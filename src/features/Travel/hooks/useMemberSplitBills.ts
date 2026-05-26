import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MemberSplitBill } from "../types/TravelDto";
import { fetchMemberSplitBills, saveMemberSplitBill, saveManyMemberSplitBills } from "../../../services/travel/memberSplitBillService";

export const useMemberSplitBills = (travelId: string) => {
  return useQuery({
    queryKey: ["memberSplitBills", travelId],
    queryFn: () => fetchMemberSplitBills(travelId),
    enabled: !!travelId,
  });
};

export const useSaveMemberSplitBillMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (splitData: MemberSplitBill) => saveMemberSplitBill(splitData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["memberSplitBills", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
    },
  });
};

export const useSaveManyMemberSplitBillsMutation = (travelId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (splits: MemberSplitBill[]) => saveManyMemberSplitBills(splits),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberSplitBills", travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
    },
  });
};
