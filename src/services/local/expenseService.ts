import { database } from "../../db";
import Expense from "../../db/models/Expense";
import { ItineraryExpense } from "../../features/Travel/types/TravelDto";
import { Q } from "@nozbe/watermelondb";

export const saveExpenseLocally = async (expenseData: ItineraryExpense): Promise<Expense> => {
  return await database.write(async () => {
    if (expenseData.id) {
      const expense = await database.get<Expense>("itinerary_expenses").find(expenseData.id);
      return await expense.update((record) => {
        record.title = expenseData.title;
        record.amount = expenseData.amount;
        record.dateTime = expenseData.dateTime;
        record.currency = expenseData.currency || null;
        record.category = expenseData.category || null;
        record.expenseCategory = expenseData.expenseCategory ?? null;
        record.userId = expenseData.userId || null;
        record.notes = expenseData.notes || null;
        record.isOffline = true;
        // @ts-ignore
        record.travel.id = expenseData.travelId;
        // @ts-ignore
        record.activity.id = expenseData.activityId || null;
      });
    } else {
      return await database.get<Expense>("itinerary_expenses").create((record) => {
        record.title = expenseData.title;
        record.amount = expenseData.amount;
        record.dateTime = expenseData.dateTime;
        record.currency = expenseData.currency || null;
        record.category = expenseData.category || null;
        record.expenseCategory = expenseData.expenseCategory ?? null;
        record.userId = expenseData.userId || null;
        record.notes = expenseData.notes || null;
        record.isOffline = true;
        // @ts-ignore
        record.travel.id = expenseData.travelId;
        if (expenseData.activityId) {
            // @ts-ignore
            record.activity.id = expenseData.activityId;
        }
      });
    }
  });
};

export const fetchLocalExpenses = async (travelId: string): Promise<ItineraryExpense[]> => {
  const expenses = await database
    .get<Expense>("itinerary_expenses")
    .query(Q.where("travel_id", travelId))
    .fetch();

  return expenses.map((e) => ({
    id: e.id,
    travelId: travelId,
    activityId: e.activity?.id,
    title: e.title,
    amount: e.amount,
    dateTime: e.dateTime,
    currency: e.currency || undefined,
    category: e.category || undefined,
    expenseCategory: e.expenseCategory || undefined,
    userId: e.userId || undefined,
    notes: e.notes || undefined,
    isOffline: e.isOffline,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }));
};
