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
      queryClient.invalidateQueries({ queryKey: ["travel"] });
      queryClient.invalidateQueries({ queryKey: ["travels"] });
      queryClient.invalidateQueries({ queryKey: ["checklistItemsByActivity"] });
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
    mutationFn: ({ id, travelId, activityId }: { id: string; travelId: string; activityId?: string }) => deleteChecklistItem(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistItems", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      queryClient.invalidateQueries({ queryKey: ["travel"] });
      queryClient.invalidateQueries({ queryKey: ["travels"] });
      queryClient.invalidateQueries({ queryKey: ["checklistItemsByActivity"] });
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
    mutationFn: ({ id, isDone, userId, travelId, activityId }: { id: string; isDone: boolean; userId: string; travelId: string; activityId?: string }) =>
      toggleChecklistItem(id, isDone, userId),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["checklistItems", variables.travelId] });
      if (variables.activityId) {
        await queryClient.cancelQueries({ queryKey: ["checklistItemsByActivity", variables.activityId] });
      }

      // Snapshot the previous values
      const previousItems = queryClient.getQueryData<ChecklistItem[]>(["checklistItems", variables.travelId]);
      const previousActivityItems = variables.activityId
        ? queryClient.getQueryData<ChecklistItem[]>(["checklistItemsByActivity", variables.activityId])
        : null;

      // Optimistically update the checklistItems list
      queryClient.setQueryData<ChecklistItem[]>(["checklistItems", variables.travelId], (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === variables.id ? { ...item, isDone: variables.isDone } : item
        );
      });

      // Optimistically update the checklistItemsByActivity list
      if (variables.activityId) {
        queryClient.setQueryData<ChecklistItem[]>(["checklistItemsByActivity", variables.activityId], (old) => {
          if (!old) return old;
          return old.map((item) =>
            item.id === variables.id ? { ...item, isDone: variables.isDone } : item
          );
        });
      }

      return { previousItems, previousActivityItems };
    },
    onError: (error: Error, variables, context) => {
      console.error("Toggle Checklist Item Error:", error);
      // Rollback to previous values
      if (context?.previousItems) {
        queryClient.setQueryData(["checklistItems", variables.travelId], context.previousItems);
      }
      if (context?.previousActivityItems && variables.activityId) {
        queryClient.setQueryData(["checklistItemsByActivity", variables.activityId], context.previousActivityItems);
      }
      showToast({
        type: "error",
        message: error.message || "Failed to update task status.",
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistItems", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
      queryClient.invalidateQueries({ queryKey: ["travel"] });
      queryClient.invalidateQueries({ queryKey: ["travels"] });
      queryClient.invalidateQueries({ queryKey: ["checklistItemsByActivity"] });
      showToast({
        type: "success",
        message: variables.isDone ? "Task marked as completed!" : "Task marked as uncompleted.",
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
