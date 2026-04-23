import { API_BASE_URL } from "@env"; // Assuming you set up environment variables
import { ItineraryActivity } from "../../features/Travel/types/TravelDto";
import fetcher from "../../hooks/useApi";

const ACTIVITY_ENDPOINT = `${API_BASE_URL}/itineraryActivity`;
const TRAVELS_LIST_ENDPOINT = `${API_BASE_URL}/travel/catalog`;

export const fetchItineraryActivity = async (
  activityId: string
): Promise<ItineraryActivity> => {
  // Implicitly return the awaited promise result
  const url = `${ACTIVITY_ENDPOINT}/${activityId}`;
  return fetcher<ItineraryActivity>(url);
};
