import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../context/ToastContext";
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
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (expenseData: ItineraryExpense) => saveItineraryExpense(expenseData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["itineraryExpenses", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      // Invalidate activity-scoped cache so the tab refreshes immediately
      if (variables.activityId) {
        queryClient.invalidateQueries({ queryKey: ["itineraryExpensesByActivity", variables.activityId] });
      }
      showToast({
        type: "success",
        message: variables.id ? "Expense updated successfully!" : "Expense saved successfully!",
      });
    },
    onError: (error: Error) => {
      console.error("Save Expense Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to save expense.",
      });
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
