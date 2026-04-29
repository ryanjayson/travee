import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChecklistGroup, ChecklistItem } from "../types/TravelDto";
import {
  saveChecklistGroup,
  fetchChecklistGroups,
  deleteChecklistGroup,
  saveChecklistItem,
  fetchChecklistItems,
  deleteChecklistItem,
  toggleChecklistItem,
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
  return useMutation({
    mutationFn: (data: ChecklistGroup) => saveChecklistGroup(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistGroups", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
    },
  });
};

export const useDeleteChecklistGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, travelId }: { id: string; travelId: string }) => deleteChecklistGroup(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistGroups", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
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
  return useMutation({
    mutationFn: (data: ChecklistItem) => saveChecklistItem(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistItems", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
    },
  });
};

export const useDeleteChecklistItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, travelId }: { id: string; travelId: string }) => deleteChecklistItem(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistItems", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
    },
  });
};

export const useToggleChecklistItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isDone, userId, travelId }: { id: string; isDone: boolean; userId: string; travelId: string }) =>
      toggleChecklistItem(id, isDone, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checklistItems", variables.travelId] });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
    },
  });
};
