import { ItineraryExpense } from "../../features/Travel/types/TravelDto";
import { saveExpenseLocally, fetchLocalExpenses } from "../local/expenseService";

export const saveItineraryExpense = async (expenseData: ItineraryExpense) => {
    // For now, always save locally first
    return await saveExpenseLocally(expenseData);
};

export const fetchItineraryExpenses = async (travelId: string) => {
    return await fetchLocalExpenses(travelId);
};
