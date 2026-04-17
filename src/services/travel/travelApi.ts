import {
  Travel,
  TravelStatus,
  CreateTravelData,
  UpdateTravelData,
} from "../../features/Travel/types/TravelDto";
import { ActivitySection } from "../../dtos/ItineraryDto";

// API base URL
const API_BASE_URL = "http://192.168.254.107:33548/api/travels";

// Helper function to make HTTP requests
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log("API: URL ", url);

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
};

class TravelService {
  // Get all travels
  async getTravels(): Promise<Travel[]> {
    try {
      console.log("API: Fetching travels...");
      const travels = await makeRequest("");
      return travels;
    } catch (error) {
      console.error("API Error: Failed to fetch travels", error);
      throw new Error("Failed to fetch travels");
    }
  }

  // Get travel itinerary
  async getTravelItinerary(travelId: number): Promise<ActivitySection[]> {
    try {
      const itineraries = await makeRequest(`/${travelId}/sections`);
      console.log(`API: Fetched travel itinerary...`, itineraries);
      return itineraries;
    } catch (error) {
      console.error(
        `ActivitySection API Error: Failed to fetch itinerary for travel ${travelId}`,
        error
      );
      throw new Error(`Failed to fetch itinerary for travel ${travelId}`);
    }
  }

  // Get travels by status
  async getTravelsByStatus(statuses: TravelStatus[]): Promise<Travel[]> {
    try {
      const travels = await makeRequest(`?status=${statuses.join(",")}`);
      console.log(`API: Fetched ${statuses.length} travels...`, travels);

      return travels;
    } catch (error) {
      console.error(`API Error: Failed to fetch travels`, error);
      throw new Error(`Failed to fetch travels`);
    }
  }

  // Get travel by ID
  async getTravelById(id: string): Promise<Travel | null> {
    try {
      console.log(`API: Fetching travel ${id}...`);
      const travel = await makeRequest(`/${id}`);
      return travel;
    } catch (error) {
      console.error(`API Error: Failed to fetch travel ${id}`, error);
      throw new Error(`Failed to fetch travel ${id}`);
    }
  }

  // Create new travel
  async createTravel(travelData: CreateTravelData): Promise<Travel> {
    try {
      console.log("API: Creating new travel...", travelData);

      // var _travel = {
      //   title : 'Japan 2025',
      //   destination : 1,
      //   description : 'Jap Winter',
      //   notes : 'This is notes'
      // }

      const newTravel = await makeRequest("", {
        method: "POST",
        body: JSON.stringify(travelData),
      });
      return newTravel;
    } catch (error) {
      console.error("API Error: Failed to create travel", error);
      throw new Error("Failed to create travel");
    }
  }

  // Update travel
  async updateTravel(
    id: string,
    travelData: UpdateTravelData
  ): Promise<Travel> {
    try {
      console.log(`API: Updating travel ${id}...`, travelData);
      const updatedTravel = await makeRequest(`/${id}`, {
        method: "PUT",
        body: JSON.stringify(travelData),
      });
      return updatedTravel;
    } catch (error) {
      console.error(`API Error: Failed to update travel ${id}`, error);
      throw new Error(`Failed to update travel ${id}`);
    }
  }

  // Delete travel
  async deleteTravel(id: string): Promise<void> {
    try {
      console.log(`API: Deleting travel ${id}...`);
      await makeRequest(`/${id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(`API Error: Failed to delete travel ${id}`, error);
      throw new Error(`Failed to delete travel ${id}`);
    }
  }

  // Search travels
  async searchTravels(query: string): Promise<Travel[]> {
    try {
      console.log(`API: Searching travels with query "${query}"...`);
      const travels = await makeRequest(`?search=${encodeURIComponent(query)}`);
      return travels;
    } catch (error) {
      console.error("API Error: Failed to search travels", error);
      throw new Error("Failed to search travels");
    }
  }

  // Get travel statistics
  async getTravelStats(): Promise<{
    total: number;
    upcoming: number;
    past: number;
    totalBudget: number;
  }> {
    try {
      console.log("API: Fetching travel statistics...");
      const stats = await makeRequest("/stats");
      return stats;
    } catch (error) {
      console.error("API Error: Failed to fetch travel statistics", error);
      throw new Error("Failed to fetch travel statistics");
    }
  }
}

// Export singleton instance
export const travelService = new TravelService();
