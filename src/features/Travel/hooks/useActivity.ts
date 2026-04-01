import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@env";
import {
  ItinerarySection,
  ItineraryActivity,
  TravelPlan,
} from "../types/TravelDto";
import { postRequestOptions } from "../../../utils/apiUtils";
import { fetchItineraryActivity } from "../../../services/api/itinerary";
import { ApiResponse } from "../../../types/api";
import { UpdateSortVariables } from "../types/ActivityDto";

const ACTIVITY_ENDPOINT = `${API_BASE_URL}/itineraryActivity`;
const ITINERARY_QUERY_KEY = ["itineraryActivity"];
export const TRAVELS_QUERY_KEY = ["itineraryActivity", "id"];
const SELECTED_TRAVEL_PLAN_QUERY_KEY = ["selectedTravelPlan"];

type MutationVariables = ItineraryActivity;
type MutationData = ApiResponse<ItineraryActivity>;
type MutationError = Error;
type DeleteVariables = {
  sectionId: number;
  activityId: number;
};

export const useUpdateActivityMutation = () => {
  const queryClient = useQueryClient();

  const updateActivityMutation = useMutation<
    MutationData,
    MutationError,
    MutationVariables
  >({
    mutationFn: async (activity) => {
      const options = postRequestOptions("");
      const response = await fetch(ACTIVITY_ENDPOINT, {
        method: activity.id && activity.id > 0 ? "PUT" : "POST",
        headers: options.headers,
        body: JSON.stringify(activity),
      });

      if (!response.ok) {
        if (response.status !== 204) {
          const errorBody = await response.json();
          throw new Error(
            errorBody.message || "Failed to update itinerary section.",
          );
        }
      }

      if (response.status === 204) {
        return;
      }
      return response.json();
    },
    onSuccess: (data: MutationData, variables: MutationVariables) => {
      //TODO: might separatte POST and PUT for clarity
      queryClient.setQueryData(
        ["selectedTravelPlan"],
        (oldData: TravelPlan | undefined) => {
          if (!oldData) return undefined;
          const sections = oldData.itinerarySection || [];

          const sectionIndex = sections.findIndex(
            (s) => s.id === variables.sectionId,
          );

          let newSections: typeof oldData.itinerarySection;

          if (sectionIndex > -1) {
            newSections = sections.map((s, index) => {
              // Update target section
              if (index === sectionIndex) {
                let newActivities: typeof s.itineraryActivity;
                const activities = s.itineraryActivity || [];
                const activityIndex = activities.findIndex(
                  (activity) => activity.id === variables.id,
                );

                if (activityIndex > -1) {
                  newActivities = activities.map((activity, idx) => {
                    if (idx === activityIndex) {
                      return {
                        ...activity,
                        ...variables,
                      };
                    }
                    return activity;
                  });
                } else {
                  const activityId = data.data?.id || variables.id;
                  const addedActivity = {
                    ...variables,
                    id: activityId,
                  };
                  newActivities = [...activities, addedActivity];
                }

                return {
                  ...s,
                  itineraryActivity: newActivities,
                };
              }

              // Remove from source section (if moved cross-section)
              if (s.itineraryActivity?.some((a) => a.id === variables.id)) {
                return {
                  ...s,
                  itineraryActivity: s.itineraryActivity.filter((a) => a.id !== variables.id),
                };
              }

              return s;
            });
          }
          return {
            ...oldData,
            itinerarySection: newSections,
          };
        },
      );
    },
    // 6. Keep error handling concise
    onError: (error) => {
      // Log the error for development/monitoring
      console.error("Section Update Error:", error);
      // Optional: Add Toast/Alert here to notify the user
    },
  });

  return updateActivityMutation;
};

export const useDeleteActivityMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: DeleteVariables): Promise<void> => {
      const options = postRequestOptions("");

      const response = await fetch(
        `${ACTIVITY_ENDPOINT}/${variables.activityId}`,
        {
          method: "DELETE", // Use the DELETE method
          headers: options.headers,
        },
      );

      if (!response.ok) {
        // Handle error response (e.g., 404 Not Found, 403 Forbidden)
        let errorMessage = `Failed to delete section ${variables.activityId}. Status: ${response.status}`;

        // Only try to parse JSON if status is not 204 (No Content)
        if (response.status !== 204) {
          try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorMessage;
          } catch (e) {
            // If it fails to parse JSON, use the generic message
          }
        }
        throw new Error(errorMessage);
      }
      // Success (204 No Content): return nothing
      return;
    },
    onSuccess: (data: void, variables: DeleteVariables) => {
      queryClient.setQueryData(
        ["selectedTravelPlan"],
        (oldData: TravelPlan | undefined) => {
          if (!oldData) return undefined;
          const sections = oldData.itinerarySection || [];

          const sectionIndex = sections.findIndex(
            (s) => s.id === variables.sectionId,
          );

          let newSections: typeof oldData.itinerarySection;

          if (sectionIndex > -1) {
            newSections = sections.map((s, index) => {
              if (index === sectionIndex) {
                let newActivities: typeof s.itineraryActivity;

                const activities = s.itineraryActivity || [];

                // const activityIndex = activities.findIndex(
                //   (activity) => activity.id === variables.activityId
                // );

                // if (activityIndex > -1) {
                // }
                newActivities = activities.filter(
                  (activity) => activity.id != variables.activityId,
                );

                return {
                  ...s,
                  itineraryActivity: newActivities,
                };
              }
              return s;
            });
          }
          return {
            ...oldData,
            itinerarySection: newSections,
          };
        },
      );
    },

    // --- C. Cleanup (Runs after success or failure) ---
    onSettled: (data, error, variables) => {
      // Invalidate the main query to force a refetch if needed,
      // though setQueryData usually makes this unnecessary for UI consistency.
      // queryClient.invalidateQueries({ queryKey: travelQueryKey });
    },
  });
};

export const useItineraryActivity = (activityId: number) => {
  return useQuery<ItineraryActivity, Error>({
    queryKey: [ITINERARY_QUERY_KEY, activityId],
    queryFn: () => fetchItineraryActivity(activityId),
    enabled: !!activityId,
  });
};

export const useUpdateActivitySortOrderMutation = () => {
  return useMutation({
    mutationFn: async (variables: UpdateSortVariables): Promise<void> => {
      const options = postRequestOptions("");

      console.log("VAR", variables);
      const response = await fetch(`${ACTIVITY_ENDPOINT}/move`, {
        method: "POST",
        headers: options.headers,
        body: JSON.stringify(variables),
      });

      if (!response.ok) {
        if (response.status !== 204) {
          const errorBody = await response.json();
          throw new Error(
            errorBody.message || "Failed to update itinerary section.",
          );
        }
      }

      if (response.status === 204) {
        return;
      }
      return response.json();
    },
    onSuccess: (
      data: void, // data is void/undefined since we expect 204
      variables: UpdateSortVariables,
    ) => {
      // queryClient.setQueryData<TravelPlan | undefined>(
      //   SELECTED_TRAVEL_PLAN_QUERY_KEY,
      //   (oldData) => {
      //     if (!oldData) return oldData;

      //     // Filter out the deleted section by ID
      //     const newSections = oldData.itinerarySection?.filter(
      //       (s) => s.id !== variables.sectionId,
      //     );

      //     // Return the new TravelPlan object
      //     return {
      //       ...oldData,
      //       itinerarySection: newSections,
      //     };
      //   },
      // );

      console.log(`Successfully deleted section ID: ${variables.id}`);
    },
    onSettled: (data, error, variables) => {},
  });
};
