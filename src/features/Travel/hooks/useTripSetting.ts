import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTripSetting, saveTripSetting } from "../../../services/travel/tripSettingService";
import { TripSetting } from "../types/TravelDto";
import { useToast } from "../../../context/ToastContext";
import { useTravelContext } from "../../../context/TravelContext";

export const TRIP_SETTING_QUERY_KEY = ["tripSetting"];

export const useTripSetting = (travelId: string) => {
  return useQuery<TripSetting | null, Error>({
    queryKey: [...TRIP_SETTING_QUERY_KEY, travelId],
    queryFn: async () => {
      if (!travelId) return null;
      return await fetchTripSetting(travelId);
    },
    enabled: !!travelId,
  });
};

export const useUpdateTripSetting = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { selectedTravelPlan, selectTravelPlan } = useTravelContext();

  return useMutation<any, Error, TripSetting>({
    mutationFn: async (settingData) => {
      return await saveTripSetting(settingData);
    },
    onSuccess: (res, variables) => {
      // Invalidate target query caches to trigger instant UI refresh
      queryClient.invalidateQueries({
        queryKey: [...TRIP_SETTING_QUERY_KEY, variables.travelId],
      });
      queryClient.invalidateQueries({
        queryKey: ["selectedTravelPlan", variables.travelId],
      });

      // Synchronize travelContext if selected plan matches
      if (selectedTravelPlan && selectedTravelPlan.id === variables.travelId) {
        selectTravelPlan({
          ...selectedTravelPlan,
          tripSetting: {
            ...variables,
            id: res?.id || variables.id,
          },
        });
      }
    },
    onError: (error) => {
      console.error("Trip Setting Mutation Error:", error);
      showToast({
        type: "error",
        message: error.message || "Failed to save trip display settings.",
      });
    },
  });
};
