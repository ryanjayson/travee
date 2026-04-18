import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@env";
import { CreateTravelData, Travel, TravelPlan } from "../types/TravelDto";
import { postRequestOptions } from "../../../utils/apiUtils";
import {
  fetchTravelPlan,
  fetchTravels,
  fetchTravel,
} from "../../../services/api/travel";

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
    MutationVariables
  >({
    mutationFn: async (travel) => {
      const options = postRequestOptions("");
      console.log("PAYLOAD", JSON.stringify(travel));
      const response = await fetch(TRAVEL_ENDPOINT, {
        method: "POST",
        headers: options.headers,
        body: JSON.stringify(travel),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.message || `Failed to Create Travel`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: TRAVEL_QUERY_KEY,
      });
    },
    onError: (error) => {
      console.error("Travel Update Error:", error);
    },
  });

  return updateTravelMutation;
};

/**
 * Custom hook to fetch a travel itinerary by ID using React Query.
 * @param travelId The ID of the travel itinerary to fetch.
 */
export const useTravel = (travelId: number) => {
  return useQuery<Travel, Error>({
    // The query key is an array containing the base key and the dynamic ID
    queryKey: [TRAVEL_QUERY_KEY, travelId],

    // The queryFn must be passed a function that takes the ID
    queryFn: () => fetchTravel(travelId),

    // Only run the query if a valid travelId is provided (prevents unnecessary fetching)
    enabled: !!travelId,

    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
  });
};

export const useTravelPlan = (travelId: number) => {
  return useQuery<TravelPlan, Error>({
    queryKey: ["selectedTravelPlan"],
    queryFn: () => fetchTravelPlan(travelId),
    enabled: !!travelId,
    // staleTime: 5 * 60 * 1000,
  });
};

export const useTravels = () => {
  // The hook expects to return an array of Travel objects
  return useQuery<Travel[], Error>({
    queryKey: TRAVELS_QUERY_KEY,
    queryFn: fetchTravels,
    // Configuration: Data is stale quickly since the list changes frequently
    staleTime: 60 * 1000, // 1 minute
  });
};
