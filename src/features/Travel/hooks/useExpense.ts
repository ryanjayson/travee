import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ItineraryExpense } from "../types/TravelDto";
import { saveItineraryExpense, fetchItineraryExpenses, fetchItineraryExpensesByActivity } from "../../../services/travel/expenseService";

export const useItineraryExpenses = (travelId: string) => {
  return useQuery({
    queryKey: ["itineraryExpenses", travelId],
    queryFn: () => fetchItineraryExpenses(travelId),
    enabled: !!travelId,
  });
};

export const useSaveExpenseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseData: ItineraryExpense) => saveItineraryExpense(expenseData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itineraryExpenses", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      // Invalidate activity-scoped cache so the tab refreshes immediately
      if (variables.activityId) {
        queryClient.invalidateQueries({ queryKey: ["itineraryExpensesByActivity", variables.activityId] });
      }
    },
  });
};
export const useItineraryExpensesByActivity = (activityId: string) => {
  return useQuery({
    queryKey: ["itineraryExpensesByActivity", activityId],
    queryFn: () => fetchItineraryExpensesByActivity(activityId),
    enabled: !!activityId,
  });
};
