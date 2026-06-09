import { TripSetting } from "../../features/Travel/types/TravelDto";
import { saveTripSettingLocally, fetchLocalTripSetting, deleteTripSettingLocally } from "../local/tripSettingService";

export const saveTripSetting = async (settingData: TripSetting) => {
  return await saveTripSettingLocally(settingData);
};

export const fetchTripSetting = async (travelId: string) => {
  return await fetchLocalTripSetting(travelId);
};

export const deleteTripSetting = async (settingId: string) => {
  return await deleteTripSettingLocally(settingId);
};
