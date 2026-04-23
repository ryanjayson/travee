import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@env";
import { ItinerarySection } from "../types/TravelDto"; // Assuming Itinerary is needed for caching
import { postRequestOptions } from "../../../utils/apiUtils";
import { Travel } from "../../../dtos/TravelDto";
import { TravelPlan } from "../types/TravelDto";
import { ApiResponse } from "../../../types/api";
import { saveSectionLocally } from "../../../services/local/travelService";

// 1. Define the API endpoint constant for clarity and reuse
const ACTIVITY_SECTIONS_ENDPOINT = `${API_BASE_URL}/itinerarySection`;
const ITINERARY_SECTION_QUERY_KEY = ["itinerarySection"];
const SELECTED_TRAVEL_PLAN_QUERY_KEY = ["selectedTravelPlan"];

export type UpdateSectionSortVariables = {
  id: string;
  prevSortOrder?: string;
  nextSortOrder?: string;
};

// -------------------------------------------------------------
// 3. Define Types for the Mutation
// We assume the mutation returns the updated section (ItinerarySection)
// and takes the section data as its variables.
type MutationVariables = ItinerarySection;
type MutationData = ApiResponse<ItinerarySection>;
type MutationError = Error; // Standard Error object
type DeleteVariables = {
  sectionId: string;
};

// -------------------------------------------------------------

export const useUpdateSectionMutation = () => {
  const queryClient = useQueryClient();

  const updateSectionMutation = useMutation<
    MutationData,
    MutationError,
    MutationVariables
  >({
    mutationFn: async (section) => {
      // Offline-first check: Detect alphanumeric WatermelonDB string IDs or inherited offline status
      const hasStringId = section.id && isNaN(Number(section.id));
      if (section.isOffline || hasStringId) {
        try {
          const localSectionId = section.id ? section.id : undefined;
          const localSection = await saveSectionLocally(section, localSectionId);
          return { data: localSection, isSuccess: true };
        } catch (err) {
          console.error("Local Save Error (Section):", err);
          throw new Error("Failed to save section locally.");
        }
      }

      const options = postRequestOptions("");

      const response = await fetch(ACTIVITY_SECTIONS_ENDPOINT, {
        method: section.id ? "PUT" : "POST",
        headers: options.headers,
        body: JSON.stringify({ ...section, isOffline: true }),
      });

      if (!response.ok) {
        if (response.status !== 204) {
          const errorBody = await response.json();
          throw new Error(
            errorBody.message || "Failed to update itinerary section.",
          );
        }
      }

      // If status is 204, return nothing (void)
      if (response.status === 204) {
        return;
      }

      return response.json();

      // const result = await response.json();
      // return result as ApiResponse<ItinerarySection>;
      // return result as ItinerarySection;
    },

    // 5. Implement robust cache invalidation
    onSuccess: (data: MutationData, variables: MutationVariables) => {
      console.log("data", data);
      console.log("var", variables);

      // Invalidate the broader itinerary query key to refetch the entire trip data
      queryClient.invalidateQueries({
        queryKey: ["travel"],
      });

      // Example: Manual update for a specific section within a trip // Optional: Manual update for better UI speed (if you have the full itinerary key)
      // queryClient.setQueryData(
      //   ["travel"],
      //   (oldData: TravelPlan | undefined) => {
      //     if (!oldData) return oldData;
      //     // Logic to find the section and replace it with updatedSection
      //     return {
      //       ...oldData,
      //       sections: oldData.itinerarySection?.map((s) =>
      //         s.id === updatedSection.id ? updatedSection : s
      //       ),
      //     };
      //   }
      // );
      // if (updatedSection.isSuccess == false || updatedSection.data == null) {
      //   return;
      // }

      // const travelPlanData = queryClient.getQueryData<TravelPlan>([
      //   "selectedTravelPlan",
      // ]);
      // console.log("selectedTravelPlan:", travelPlanData);

      // const _updatedSection = updatedSection?.data;

      // //MANUAL INVALIDATION or ADDING/UPDATTING THE QUERY OBJECT CACHE
      const sectionId = data.data?.id || variables.id; // Use server ID, fallback to client ID

      queryClient.setQueryData(
        SELECTED_TRAVEL_PLAN_QUERY_KEY,
        (oldData: TravelPlan | undefined) => {
          if (!oldData) return undefined;
          const sections = oldData.itinerarySection || [];

          const sectionIndex = sections.findIndex((s) => s.id === sectionId);

          let newSections: typeof oldData.itinerarySection;

          if (sectionIndex > -1) {
            newSections = sections.map((s, index) => {
              // Check if the current section is the one we need to update
              if (index === sectionIndex) {
                // Correct way: Return a brand new object that merges the old properties (s)
                // with the new properties (from variables).
                return {
                  ...s, // Spread the original properties of the section
                  title: variables.title, // Override the 'title' property with the new value
                  // Add other properties you want to update from 'variables' here, e.g.:
                  // date: variables.date,
                };
              }
              // If it's not the target section, return the original object unchanged
              return s;
            });
          } else {
            const addedSection = {
              ...variables, // 1. Spread all properties from the input variables
              id: sectionId, // 2. Explicitly add the new 'id' property, sourced from the API response
              isDefaultSection: false,
              itineraryActivity: [],
            };

            newSections = [...sections, addedSection];
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

  return updateSectionMutation;
};

export const useDeleteSectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // --- A. Define the Mutation Function ---
    mutationFn: async (variables: DeleteVariables): Promise<void> => {
      // Returns void because DELETE often returns 204 No Content
      const options = postRequestOptions(""); // Assume this provides headers/auth

      const response = await fetch(
        `${ACTIVITY_SECTIONS_ENDPOINT}/${variables.sectionId}`,
        {
          method: "DELETE", // Use the DELETE method
          headers: options.headers,
        },
      );

      if (!response.ok) {
        // Handle error response (e.g., 404 Not Found, 403 Forbidden)
        let errorMessage = `Failed to delete section ${variables.sectionId}. Status: ${response.status}`;

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

    // --- B. Handle Cache Update on Success ---
    onSuccess: (
      data: void, // data is void/undefined since we expect 204
      variables: DeleteVariables,
    ) => {
      // Use the sectionId from 'variables' to remove the item from the cache

      queryClient.setQueryData<TravelPlan | undefined>(
        SELECTED_TRAVEL_PLAN_QUERY_KEY,
        (oldData) => {
          if (!oldData) return oldData;

          // Filter out the deleted section by ID
          const newSections = oldData.itinerarySection?.filter(
            (s) => s.id !== variables.sectionId,
          );

          // Return the new TravelPlan object
          return {
            ...oldData,
            itinerarySection: newSections,
          };
        },
      );

      console.log(`Successfully deleted section ID: ${variables.sectionId}`);

      // OPTIONAL: Also remove the specific query for the deleted section if it existed
      queryClient.removeQueries({ queryKey: ["section", variables.sectionId] });
    },

    // --- C. Cleanup (Runs after success or failure) ---
    onSettled: (data, error, variables) => {
      // Invalidate the main query to force a refetch if needed,
      // though setQueryData usually makes this unnecessary for UI consistency.
      // queryClient.invalidateQueries({ queryKey: travelQueryKey });
    },
  });
};

export const useUpdateSectionSortOrderMutation = () => {
  return useMutation({
    mutationFn: async (variables: UpdateSectionSortVariables): Promise<void> => {
      const options = postRequestOptions("");

      console.log("SECTION_VAR", variables);
      const response = await fetch(`${ACTIVITY_SECTIONS_ENDPOINT}/move`, {
        method: "POST",
        headers: options.headers,
        body: JSON.stringify(variables),
      });

      if (!response.ok) {
        if (response.status !== 204) {
          const errorBody = await response.json();
          throw new Error(
            errorBody.message || "Failed to update section sort order.",
          );
        }
      }

      if (response.status === 204) {
        return;
      }
      return response.json();
    },
    onSuccess: (
      data: void,
      variables: UpdateSectionSortVariables,
    ) => {
      // Invalidate or update query cache if needed. Since LexoRank is evaluated implicitly on array order on the UI instantly, we can rely securely on the local `setSections` mapping for visual smoothness, and optionally invalidate the primary query.
      // queryClient.invalidateQueries({ queryKey: ["selectedTravelPlan"] });
    },
  });
};
