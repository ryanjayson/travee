import { API_BASE_URL } from "@env"; // Assuming you set up environment variables
import { Travel, TravelPlan } from "../../features/Travel/types/TravelDto";
import fetcher from "../../hooks/useApi";

const TRAVEL_ENDPOINT = `${API_BASE_URL}/travel`;
const TRAVELS_LIST_ENDPOINT = `${API_BASE_URL}/travel/catalog`;

/**
 * Fetches a single travel itinerary by its unique ID.
 * @param travelId The ID of the travel itinerary to fetch.
 * @returns A promise that resolves to the Travel object.
 */
export const fetchTravel = async (travelId: string): Promise<Travel> => {
  if (!travelId) {
    throw new Error("Travel ID is required for fetching a single itinerary.");
  }
  
  const url = `${TRAVEL_ENDPOINT}/${travelId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // NOTE: Include your Authorization header here for real-world apps
      // 'Authorization': `Bearer ${userToken}`,
    },
  });

  // Handle HTTP status codes (e.g., 404 Not Found, 500 Server Error)
  if (!response.ok) {
    // Attempt to read the error message from the response body if available
    const errorBody = await response
      .json()
      .catch(() => ({ message: `Error ${response.status}` }));

    throw new Error(
      errorBody.message ||
        `Failed to fetch travel itinerary (Status: ${response.status})`,
    );
  }

  console.log("DATA", JSON.stringify(response.json()));

  // Parse the JSON response and assert the return type
  return response.json() as Promise<Travel>;
};

/**
 * Fetches all travel itineraries belonging to the authenticated user.
 * @returns A promise that resolves to an array of Travel objects.
 */
export const fetchTravelsV1 = async (): Promise<Travel[]> => {
  // NOTE: In a real app, you must retrieve the user's authentication token (e.g., from AsyncStorage/Context)
  // and include it in the Authorization header.
  // const userToken = await retrieveAuthToken();
  // const userId = "12345123";
  // const urlWithId = `${TRAVELS_LIST_ENDPOINT}?userId=${userId}`;
  const response = await fetch(`${TRAVELS_LIST_ENDPOINT}?userId=12345`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      // 'Authorization': `Bearer ${userToken}`, // ⬅️ REQUIRED for user-specific data
    },
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: `Error ${response.status}` }));

    throw new Error(
      errorBody.message ||
        `Failed to fetch travel list (Status: ${response.status})`,
    );
  }

  // The API is expected to return an array of Travel objects
  return response.json() as Promise<Travel[]>;
};

export const fetchTravels = async (): Promise<Travel[]> => {
  // Implicitly return the awaited promise result
  return fetcher<Travel[]>(`${TRAVELS_LIST_ENDPOINT}?userId=12345`);
};

export const fetchTravelPlan = async (
  travelId: string,
): Promise<TravelPlan> => {
  // Implicitly return the awaited promise result
  const url = `${TRAVEL_ENDPOINT}/${travelId}`;
  return fetcher<TravelPlan>(url);
};
