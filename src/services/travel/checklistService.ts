import { ChecklistGroup, ChecklistItem } from "../../features/Travel/types/TravelDto";
import {
  saveChecklistGroupLocally,
  fetchLocalChecklistGroups,
  deleteChecklistGroupLocally,
  saveChecklistItemLocally,
  fetchLocalChecklistItems,
  deleteChecklistItemLocally,
  toggleChecklistItemLocally,
} from "../local/checklistService";

// ─── Groups ─────────────────────────────────────────────────────────────────

export const saveChecklistGroup = async (data: ChecklistGroup) => {
  return await saveChecklistGroupLocally(data);
};

export const fetchChecklistGroups = async (travelId: string) => {
  return await fetchLocalChecklistGroups(travelId);
};

export const deleteChecklistGroup = async (id: string) => {
  return await deleteChecklistGroupLocally(id);
};

// ─── Items ───────────────────────────────────────────────────────────────────

export const saveChecklistItem = async (data: ChecklistItem) => {
  return await saveChecklistItemLocally(data);
};

export const fetchChecklistItems = async (travelId: string) => {
  return await fetchLocalChecklistItems(travelId);
};

export const deleteChecklistItem = async (id: string) => {
  return await deleteChecklistItemLocally(id);
};

export const toggleChecklistItem = async (id: string, isDone: boolean, userId: string) => {
  return await toggleChecklistItemLocally(id, isDone, userId);
};
