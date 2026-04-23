import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@env";
import { CreateTravelData, Travel, TravelPlan } from "../types/TravelDto";
import { postRequestOptions } from "../../../utils/apiUtils";
import {
  fetchTravels,
  fetchTravel,
  fetchTravelPlan,
} from "../../../services/api/travel";
import { saveTravelLocally, getTravelsLocally, getTravelPlanLocally } from "../../../services/local/travelService";

const TRAVEL_ENDPOINT = `${API_BASE_URL}/travel`;
const TRAVEL_QUERY_KEY = ["travel"];
export const TRAVELS_QUERY_KEY = ["travels", "currentUser"];

interface MutationResult {
  data: any;
  isSuccess: boolean;
  errorMessage?: string;
}

type MutationVariables = CreateTravelData;
type MutationData = MutationResult;
type MutationError = Error;

export const useUpdateTravel = () => {
  const queryClient = useQueryClient();

  const updateTravelMutation = useMutation<
    MutationData,
    MutationError,
    { id?: string; data: CreateTravelData | UpdateTravelData }
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
      const response = await fetch(url, {
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: TRAVEL_QUERY_KEY,
      });
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: [TRAVEL_QUERY_KEY, variables.id],
        });
      }
    },
    onError: (error) => {
      console.error("Travel Mutation Error:", error);
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
        return await fetchTravelPlan(travelId);
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
      try {
        apiTravels = await fetchTravels();
      } catch (err) {
        console.warn("Failed to fetch travels from API, falling back to local only", err);
      }

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
