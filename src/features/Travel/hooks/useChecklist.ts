import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../context/ToastContext";
import { ChecklistGroup, ChecklistItem } from "../types/TravelDto";
import {
  saveChecklistGroup,
  fetchChecklistGroups,
  deleteChecklistGroup,
  saveChecklistItem,
  fetchChecklistItems,
  deleteChecklistItem,
  toggleChecklistItem,
  fetchChecklistItemsByActivity,
} from "../../../services/travel/checklistService";

// ─── Groups ─────────────────────────────────────────────────────────────────

export const useChecklistGroups = (travelId: string) =>
  useQuery({
    queryKey: ["checklistGroups", travelId],
    queryFn: () => fetchChecklistGroups(travelId),
    enabled: !!travelId,
  });

export const useSaveChecklistGroupMutation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: ChecklistGroup) => saveChecklistGroup(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistGroups", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      showToast({
        type: "success",
        message: variables.id ? "Checklist group updated!" : "Checklist group created!",
      });
    },
    onError: (error: Error) => {
      console.error("Save Checklist Group Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to save checklist group.",
      });
    },
  });
};

export const useDeleteChecklistGroupMutation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ id, travelId }: { id: string; travelId: string }) => deleteChecklistGroup(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistGroups", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      showToast({
        type: "success",
        message: "Checklist group deleted.",
      });
    },
    onError: (error: Error) => {
      console.error("Delete Checklist Group Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to delete checklist group.",
      });
    },
  });
};

// ─── Items ───────────────────────────────────────────────────────────────────

export const useChecklistItems = (travelId: string) =>
  useQuery({
    queryKey: ["checklistItems", travelId],
    queryFn: () => fetchChecklistItems(travelId),
    enabled: !!travelId,
  });

export const useSaveChecklistItemMutation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: ChecklistItem) => saveChecklistItem(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistItems", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      showToast({
        type: "success",
        message: variables.id ? "Task updated successfully!" : "Task saved successfully!",
      });
    },
    onError: (error: Error) => {
      console.error("Save Checklist Item Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to save checklist item.",
      });
    },
  });
};

export const useDeleteChecklistItemMutation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ id, travelId }: { id: string; travelId: string }) => deleteChecklistItem(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistItems", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      showToast({
        type: "success",
        message: "Task deleted successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Delete Checklist Item Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to delete checklist item.",
      });
    },
  });
};

export const useToggleChecklistItemMutation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ id, isDone, userId, travelId }: { id: string; isDone: boolean; userId: string; travelId: string }) =>
      toggleChecklistItem(id, isDone, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistItems", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      showToast({
        type: "success",
        message: variables.isDone ? "Task marked as completed!" : "Task marked as uncompleted.",
      });
    },
    onError: (error: Error) => {
      console.error("Toggle Checklist Item Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to update task status.",
      });
    },
  });
};
export const useChecklistItemsByActivity = (activityId: string) => {
  return useQuery({
    queryKey: ["checklistItemsByActivity", activityId],
    queryFn: () => fetchChecklistItemsByActivity(activityId),
    enabled: !!activityId,
  });
};
