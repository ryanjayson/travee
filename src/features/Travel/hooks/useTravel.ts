import { API_BASE_URL } from "@env";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../context/ToastContext";
import {
  fetchTravel
} from "../../../services/api/travel";
import { archiveTravelLocally, cancelTravelLocally, deleteTravelLocally, getTravelPlanLocally, getTravelsLocally, saveTravelLocally, unarchiveTravelLocally } from "../../../services/local/travelService";
import { postRequestOptions } from "../../../utils/apiUtils";
import { CreateTravelData, Travel, TravelPlan } from "../types/TravelDto";
import { TravelStatus } from "../../../types/enums";
import { fetchWithTimeout } from "../../../utils/fetchWithTimeout";

const TRAVEL_ENDPOINT = `${API_BASE_URL}/travel`;
const TRAVEL_QUERY_KEY = ["travel"];
export const TRAVELS_QUERY_KEY = ["travels", "currentUser"];

interface MutationResult {
  data: any;
  isSuccess: boolean;
  errorMessage?: string;
}

type MutationData = MutationResult;
type MutationError = Error;

export const useUpdateTravel = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const updateTravelMutation = useMutation<
    MutationData,
    MutationError,
    { id?: string; data: CreateTravelData }
  >({
    mutationFn: async ({ id, data }) => {

      if (data.isOffline) { // Forced true as per user request on v1
        try {
          const localTravel = await saveTravelLocally(data, id);
          return { data: localTravel, isSuccess: true };
        } catch (err) {
          console.error("Local Save Error:", err);
          throw new Error("Failed to save travel locally.");
        }
      }

      const options = postRequestOptions("");
      const url = id ? `${TRAVEL_ENDPOINT}/${id}` : TRAVEL_ENDPOINT;
      const method = id ? "PUT" : "POST";

      console.log(`${method} PAYLOAD to ${url}`, JSON.stringify(data));
      const response = await fetchWithTimeout(url, {
        method: method,
        headers: options.headers,
        body: JSON.stringify({ ...data, isOffline: true }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || `Failed to ${id ? "Update" : "Create"} Travel`);
      }
      return response.json();
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({
        queryKey: TRAVEL_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: ["selectedTravelPlan"],
      });

      const updatedId = variables.id || res?.data?.id || (res as any)?.id;
      if (updatedId) {
        queryClient.invalidateQueries({
          queryKey: [TRAVEL_QUERY_KEY, updatedId],
        });
        queryClient.invalidateQueries({
          queryKey: ["selectedTravelPlan", updatedId],
        });
      }

      showToast({
        type: "success",
        message: variables.id ? "Trip updated successfully!" : "Trip created successfully!",
      });
    },
    onError: (error) => {
      console.error("Travel Mutation Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to save trip.",
      });
    },
  });

  return updateTravelMutation;
};

/**
 * Custom hook to fetch a travel itinerary by ID using React Query.
 * @param travelId The ID of the travel itinerary to fetch.
 */
export const useTravel = (travelId: string) => {
  return useQuery<Travel, Error>({
    queryKey: [TRAVEL_QUERY_KEY, travelId],
    queryFn: async () => {
      if (isNaN(Number(travelId))) {
        // Purely string IDs belong exclusively to local WatermelonDB creations
        const localData = await getTravelPlanLocally(travelId);
        return localData.travel;
      }
      try {
        return await fetchTravel(travelId);
      } catch (apiError) {
        console.warn("API fetch failed, attempting local fallback.");
        const localData = await getTravelPlanLocally(travelId);
        return localData.travel;
      }
    },
    enabled: !!travelId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTravelPlan = (travelId: string) => {
  return useQuery<TravelPlan, Error>({
    queryKey: ["selectedTravelPlan", travelId],
    queryFn: async () => {
      // If it's a string, it generated locally and offline
      if (travelId) {
        return await getTravelPlanLocally(travelId);
      }
      
      try {
        // NOTE: This will not work as right now it will support offline first
        // return await fetchTravelPlan(travelId);
      } catch (err) {
        console.warn("API fetch failed for travel plan, falling back to local database", err);
        return await getTravelPlanLocally(travelId);
      }
    },
    enabled: !!travelId,
  });
};

export const useTravels = () => {
  // The hook expects to return an array of Travel objects
  return useQuery<Travel[], Error>({
    queryKey: TRAVELS_QUERY_KEY,
    queryFn: async () => {
      let apiTravels: Travel[] = [];

      //This line is for fetching from server
      // try {
      //   apiTravels = await fetchTravels();
      // } catch (err) {
      //   console.warn("Failed to fetch travels from API, falling back to local only", err);
      // }

      const localTravels = await getTravelsLocally();

      // Merge local and API travels.
      // Prioritize local offline travels to appear at the top, or simply concatenate.
      // If we implement sync later, we should filter duplicates here based on ID matching.
      return [...localTravels, ...apiTravels];
    },
    // Configuration: Data is stale quickly since the list changes frequently
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useDeleteTravel = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await deleteTravelLocally(id);
    },
    onSuccess: (_, id) => {
      // 1. Update the list cache
      queryClient.setQueryData<Travel[]>(TRAVELS_QUERY_KEY, (old) => {
        if (!old) return old;
        return old.filter(t => String(t.id) !== String(id));
      });
      // 2. Remove the specific travel caches
      queryClient.removeQueries({ queryKey: ["selectedTravelPlan", id] });
      queryClient.removeQueries({ queryKey: [TRAVEL_QUERY_KEY, id] });
      // 3. Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: TRAVELS_QUERY_KEY });

      showToast({
        type: "success",
        message: "Trip deleted successfully!",
      });
    },
    onError: (error) => {
      console.error("Delete Travel Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to delete trip.",
      });
    },
  });
};

export const useCancelTravel = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await cancelTravelLocally(id);
    },
    onSuccess: (_, id) => {
      // 1. Update the list cache
      queryClient.setQueryData<Travel[]>(TRAVELS_QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map(t => String(t.id) === String(id) ? { ...t, status: TravelStatus.Cancelled } : t);
      });
      // 2. Update specific travel caches
      queryClient.setQueryData<TravelPlan>(["selectedTravelPlan", id], (old) => {
        if (!old) return old;
        return { ...old, travel: { ...old.travel, status: TravelStatus.Cancelled } };
      });
      queryClient.setQueryData<Travel>([TRAVEL_QUERY_KEY, id], (old) => {
        if (!old) return old;
        return { ...old, status: TravelStatus.Cancelled };
      });
      // 3. Invalidate
      queryClient.invalidateQueries({ queryKey: TRAVELS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan", id] });
      queryClient.invalidateQueries({ queryKey: [TRAVEL_QUERY_KEY, id] });

      showToast({
        type: "success",
        message: "Trip cancelled successfully!",
      });
    },
    onError: (error) => {
      console.error("Cancel Travel Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to cancel trip.",
      });
    },
  });
};

export const useArchiveTravel = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await archiveTravelLocally(id);
    },
    onSuccess: (_, id) => {
      // 1. Update the list cache
      queryClient.setQueryData<Travel[]>(TRAVELS_QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map(t => String(t.id) === String(id) ? { ...t, isArchived: true, status: TravelStatus.Archieved } : t);
      });
      // 2. Update specific travel caches
      queryClient.setQueryData<TravelPlan>(["selectedTravelPlan", id], (old) => {
        if (!old) return old;
        return { ...old, travel: { ...old.travel, isArchived: true, status: TravelStatus.Archieved } };
      });
      queryClient.setQueryData<Travel>([TRAVEL_QUERY_KEY, id], (old) => {
        if (!old) return old;
        return { ...old, isArchived: true, status: TravelStatus.Archieved };
      });
      // 3. Invalidate
      queryClient.invalidateQueries({ queryKey: TRAVELS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan", id] });
      queryClient.invalidateQueries({ queryKey: [TRAVEL_QUERY_KEY, id] });

      showToast({
        type: "success",
        message: "Trip archived successfully!",
      });
    },
    onError: (error) => {
      console.error("Archive Travel Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to archive trip.",
      });
    },
  });
};

export const useUnarchiveTravel = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await unarchiveTravelLocally(id);
    },
    onSuccess: (_, id) => {
      // 1. Update the list cache
      queryClient.setQueryData<Travel[]>(TRAVELS_QUERY_KEY, (old) => {
        if (!old) return old;
        return old.map(t => String(t.id) === String(id) ? { ...t, isArchived: false, status: t.status === TravelStatus.Archieved ? TravelStatus.Draft : t.status } : t);
      });
      // 2. Update specific travel caches
      queryClient.setQueryData<TravelPlan>(["selectedTravelPlan", id], (old) => {
        if (!old) return old;
        return { ...old, travel: { ...old.travel, isArchived: false, status: old.travel.status === TravelStatus.Archieved ? TravelStatus.Draft : old.travel.status } };
      });
      queryClient.setQueryData<Travel>([TRAVEL_QUERY_KEY, id], (old) => {
        if (!old) return old;
        return { ...old, isArchived: false, status: old.status === TravelStatus.Archieved ? TravelStatus.Draft : old.status };
      });
      // 3. Invalidate
      queryClient.invalidateQueries({ queryKey: TRAVELS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan", id] });
      queryClient.invalidateQueries({ queryKey: [TRAVEL_QUERY_KEY, id] });

      showToast({
        type: "success",
        message: "Trip unarchived successfully!",
      });
    },
    onError: (error) => {
      console.error("Unarchive Travel Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to unarchive trip.",
      });
    },
  });
};

