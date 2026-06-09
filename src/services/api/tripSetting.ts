import { API_BASE_URL } from "@env";
import { TripSetting } from "../../features/Travel/types/TravelDto";
import fetcher from "../../hooks/useApi";

const SETTINGS_ENDPOINT = `${API_BASE_URL}/tripSettings`;

export const fetchTripSetting = async (travelId: string): Promise<TripSetting> => {
  const url = `${SETTINGS_ENDPOINT}/${travelId}`;
  try {
    return await fetcher<TripSetting>(url);
  } catch (error) {
    // Return a default settings template locally
    return {
      travelId,
      currency: "PHP",
      timezone: "Asia/Manila",
      itineraryView: "detailed",
      allowItemReordering: true,
    };
  }
};

export const saveTripSetting = async (settingData: TripSetting): Promise<TripSetting> => {
  const url = `${SETTINGS_ENDPOINT}`;
  try {
    return await fetcher<TripSetting>(url, {
      method: "POST",
      body: JSON.stringify(settingData),
    });
  } catch (error) {
    return settingData;
  }
};
