import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "../../../context/ToastContext";
import { API_BASE_URL } from "@env";
import {
  ItinerarySection,
  ItineraryActivity,
  TravelPlan,
} from "../types/TravelDto";
import { postRequestOptions } from "../../../utils/apiUtils";
import { fetchItineraryActivity } from "../../../services/api/itinerary";
import { ApiResponse } from "../../../types/api";
import { saveActivityLocally, saveSectionLocally, fetchLocalItineraryActivity, getAllActivitiesWithDestinationLocally, deleteActivityLocally, getAllActivitiesLocally, getTravelPlanLocally } from "../../../services/local/travelService";
import { UpdateSortVariables } from "../types/ActivityDto";
import { fetchWithTimeout } from "../../../utils/fetchWithTimeout";
import { useTravelContext } from "../../../context/TravelContext";
import { TravelPlanDetail } from "../../../types/context/travel";

const ACTIVITY_ENDPOINT = `${API_BASE_URL}/itineraryActivity`;
const ITINERARY_QUERY_KEY = ["itineraryActivity"];
export const TRAVELS_QUERY_KEY = ["itineraryActivity", "id"];
const SELECTED_TRAVEL_PLAN_QUERY_KEY = ["selectedTravelPlan"];

type MutationVariables = ItineraryActivity;
type MutationData = ApiResponse<ItineraryActivity>;
type MutationError = Error;
type DeleteVariables = {
  sectionId: string;
  activityId: string;
  travelId?: string;
};

export const useUpdateActivityMutation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { selectedTravelPlan, selectTravelPlan } = useTravelContext();

  const updateActivityMutation = useMutation<
    MutationData,
    MutationError,
    MutationVariables
  >({
    mutationFn: async (activity) => {
      // Offline-first check: Detect alphanumeric WatermelonDB string IDs or inherited offline status
      if (activity.isOffline) {
        try {
          const localActivityId = activity.id ? activity.id : undefined;
          
          if (!activity.sectionId || activity.sectionId === "") {
             const defaultSection = await saveSectionLocally({
                title: "Activities",
                isDefaultSection: true,
                travelId: activity.travelId,
                sortOrder: "0",
             });
             activity.sectionId = defaultSection.id;
          }

          const localActivity = await saveActivityLocally(activity, localActivityId);
          return { data: localActivity, isSuccess: true };
        } catch (err) {
          console.error("Local Save Error (Activity):", err);
          throw new Error("Failed to save activity locally.");
        }
      }

      const options = postRequestOptions("");
      const response = await fetchWithTimeout(ACTIVITY_ENDPOINT, {
        method: activity.id ? "PUT" : "POST",
        headers: options.headers,
        body: JSON.stringify({ ...activity, isOffline: true }),
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
      // Invalidate broader queries to trigger refetch instantly on save
      queryClient.invalidateQueries({
        queryKey: ["travel"],
      });

      if (variables.travelId) {
        queryClient.invalidateQueries({
          queryKey: ["travel", variables.travelId],
        });

        queryClient.invalidateQueries({
          queryKey: ["selectedTravelPlan", variables.travelId],
        });

        getTravelPlanLocally(variables.travelId).then((localPlan) => {
          if (localPlan?.travel && selectedTravelPlan && String(selectedTravelPlan.id) === String(variables.travelId)) {
            selectTravelPlan({
              ...selectedTravelPlan,
              ...localPlan.travel,
              id: variables.travelId,
            });
          }
        }).catch((err) => console.warn("Failed to update travelContext on activity save:", err));
      }

      queryClient.invalidateQueries({
        queryKey: ["selectedTravelPlan"],
      });

      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: [ITINERARY_QUERY_KEY, variables.id],
        });
      }
      showToast({
        type: "success",
        message: variables.id ? "Activity updated successfully!" : "Activity created successfully!",
      });
      
      // Optimistically/synchronously update query cache for instant UI rendering
      if (variables.travelId) {
        queryClient.setQueryData<TravelPlan | undefined>(
          ["selectedTravelPlan", variables.travelId],
          (oldData) => {
            if (!oldData) return undefined;
            const sections = oldData.itinerarySection || [];
            const activityId = variables.id || data?.data?.id;

            if (!activityId) return oldData;

            // 1. Remove the activity if it exists in any section (handles edits, moved sections)
            let updatedSections = sections.map((s) => {
              if (s.itineraryActivity) {
                return {
                  ...s,
                  itineraryActivity: s.itineraryActivity.filter((a) => a.id !== activityId),
                };
              }
              return s;
            });

            // 2. Insert/append the activity to the target section
            const targetSectionId = variables.sectionId || "";
            const targetSectionIndex = updatedSections.findIndex((s) => s.id === targetSectionId);

            if (targetSectionIndex > -1) {
              const updatedActivity = {
                ...variables,
                id: activityId,
              };

              updatedSections = updatedSections.map((s, index) => {
                if (index === targetSectionIndex) {
                  return {
                    ...s,
                    itineraryActivity: [...(s.itineraryActivity || []), updatedActivity],
                  };
                }
                return s;
              });
            }

            return {
              ...oldData,
              itinerarySection: updatedSections,
            };
          }
        );
      }

      if (variables.id) {
        queryClient.setQueryData<ItineraryActivity | undefined>(
          [ITINERARY_QUERY_KEY, variables.id],
          (oldData) => {
            if (!oldData) return undefined;
            return {
              ...oldData,
              ...variables,
            };
          }
        );
      }
    },
    // 6. Keep error handling concise
    onError: (error) => {
      // Log the error for development/monitoring
      console.error("Section Update Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to save activity.",
      });
    },
  });

  return updateActivityMutation;
};

export const useDeleteActivityMutation = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { selectedTravelPlan, selectTravelPlan } = useTravelContext();

  return useMutation({
    mutationFn: async (variables: DeleteVariables): Promise<void> => {
      const hasStringId = variables.activityId && isNaN(Number(variables.activityId));
      if (hasStringId) {
        try {
          await deleteActivityLocally(variables.activityId);
          return;
        } catch (err) {
          console.error("Local Delete Error (Activity):", err);
          throw new Error("Failed to delete activity locally.");
        }
      }

      const options = postRequestOptions("");

      const response = await fetchWithTimeout(
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
      queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });

      if (variables.travelId) {
        queryClient.invalidateQueries({
          queryKey: ["travel", variables.travelId],
        });

        queryClient.invalidateQueries({
          queryKey: ["selectedTravelPlan", variables.travelId],
        });

        getTravelPlanLocally(variables.travelId).then((localPlan) => {
          if (localPlan?.travel && selectedTravelPlan && String(selectedTravelPlan.id) === String(variables.travelId)) {
            selectTravelPlan({
              ...selectedTravelPlan,
              ...localPlan.travel,
              id: variables.travelId,
            });
          }
        }).catch((err) => console.warn("Failed to update travelContext on activity delete:", err));

        // Optimistically/synchronously update query cache for instant UI rendering
        queryClient.setQueryData<TravelPlan | undefined>(
          ["selectedTravelPlan", variables.travelId],
          (oldData) => {
            if (!oldData) return undefined;
            const sections = oldData.itinerarySection || [];
            const updatedSections = sections.map((s) => {
              if (s.id === variables.sectionId && s.itineraryActivity) {
                return {
                  ...s,
                  itineraryActivity: s.itineraryActivity.filter((a) => a.id !== variables.activityId),
                };
              }
              return s;
            });
            return {
              ...oldData,
              itinerarySection: updatedSections,
            };
          }
        );
      }

      showToast({
        type: "success",
        message: "Activity deleted successfully!",
      });
    },
    onError: (error: Error) => {
      console.error("Activity Delete Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to delete activity.",
      });
    },

    // --- C. Cleanup (Runs after success or failure) ---
    onSettled: (data, error, variables) => {
      // Invalidate the main query to force a refetch if needed,
      // though setQueryData usually makes this unnecessary for UI consistency.
      // queryClient.invalidateQueries({ queryKey: travelQueryKey });
    },
  });
};

export const useItineraryActivity = (activityId: string) => {
  return useQuery<ItineraryActivity, Error>({
    queryKey: [ITINERARY_QUERY_KEY, activityId],
    queryFn: async () => {
       try {
         const isLocalId = activityId && isNaN(Number(activityId));
         if (isLocalId) {
             return await fetchLocalItineraryActivity(activityId);
         }
         return await fetchItineraryActivity(activityId);
       } catch (err) {
         return await fetchLocalItineraryActivity(activityId);
       }
    },
    enabled: !!activityId,
  });
};

export const useUpdateActivitySortOrderMutation = () => {
  
  return useMutation({
    mutationFn: async (variables: UpdateSortVariables): Promise<void> => {
      const options = postRequestOptions("");

      const response = await fetchWithTimeout(`${ACTIVITY_ENDPOINT}/move`, {
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

      console.log(`Successfully updated order: ${variables.id}`);
    },
    onSettled: (data, error, variables) => {},
  });
};

export const useAllActivitiesWithDestination = () => {
  return useQuery<ItineraryActivity[], Error>({
    queryKey: ["allActivitiesWithDestination"],
    queryFn: async () => {
      try {
        return await getAllActivitiesWithDestinationLocally();
      } catch (err) {
        console.error("Failed to fetch all activities with destination", err);
        return [];
      }
    },
  });
};

export const useAllActivities = () => {
  return useQuery<ItineraryActivity[], Error>({
    queryKey: ["allActivities"],
    queryFn: async () => {
      try {
        return await getAllActivitiesLocally();
      } catch (err) {
        console.error("Failed to fetch all activities", err);
        return [];
      }
    },
  });
};
