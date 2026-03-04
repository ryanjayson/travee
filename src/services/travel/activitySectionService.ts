import {
  Activity,
  ActivitySection,
  CreateActivitySectionData,
  UpdateActivitySectionData,
} from "../../dtos/ItineraryDto";
// API base URL
const API_BASE_URL = "http://192.168.254.126:33548/api";

// Helper function to make HTTP requests
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log("ActivitySection API: URL ", url);

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
    console.error("ActivitySection API Request failed:", error);
    throw error;
  }
};

class ActivitySectionService {
  // Get complete itinerary data for a travel
  async getItineraryByTravelId(travelId: string): Promise<{
    sections: ActivitySection[];
    activities: Activity[];
  }> {
    try {
      console.log(
        `ActivitySection API: Fetching complete itinerary for travel ${travelId}...`
      );

      // Get sections for the travel
      const sections = await this.getSectionsByTravelId(travelId);

      // Get activities for each section
      const sectionsWithActivities = await Promise.all(
        sections.map(async (section) => {
          try {
            const activities = await this.getActivitiesBySectionId(section.id);
            return {
              ...section,
              activities,
            };
          } catch (error) {
            console.warn(
              `Failed to fetch activities for section ${section.id}:`,
              error
            );
            return {
              ...section,
              activities: [],
            };
          }
        })
      );

      // Get general activities (not in any section)
      const generalActivities = await makeRequest(
        `/travels/${travelId}/activities`
      ).catch(() => []);

      return {
        sections: sectionsWithActivities,
        activities: generalActivities,
      };
    } catch (error) {
      console.error(
        `ActivitySection API Error: Failed to fetch itinerary for travel ${travelId}`,
        error
      );
      throw new Error(`Failed to fetch itinerary for travel ${travelId}`);
    }
  }

  // Get all sections for a travel
  async getSectionsByTravelId(travelId: string): Promise<ActivitySection[]> {
    try {
      console.log(
        `ActivitySection API: Fetching sections for travel ${travelId}...`
      );
      const sections = await makeRequest(`/travels/${travelId}/sections`);
      return sections;
    } catch (error) {
      console.error(
        `ActivitySection API Error: Failed to fetch sections for travel ${travelId}`,
        error
      );
      throw new Error(`Failed to fetch sections for travel ${travelId}`);
    }
  }

  // Get section by ID
  async getSectionById(sectionId: string): Promise<ActivitySection | null> {
    try {
      console.log(`ActivitySection API: Fetching section ${sectionId}...`);
      const section = await makeRequest(`/activitySections/${sectionId}`);
      return section;
    } catch (error) {
      console.error(
        `ActivitySection API Error: Failed to fetch section ${sectionId}`,
        error
      );
      throw new Error(`Failed to fetch section ${sectionId}`);
    }
  }

  // Create new section
  async createSection(
    sectionData: CreateActivitySectionData
  ): Promise<ActivitySection> {
    try {
      console.log("ActivitySection API: Creating new section...", sectionData);
      const newSection = await makeRequest(`/activitySections`, {
        method: "POST",
        body: JSON.stringify({
          title: sectionData.title,
          description: sectionData.description,
          startDate: "2025-08-10",
          endDate: "2025-08-10",
          travelId: sectionData.travelId,
          status: 1,
          notes: "notes",
        }),
      });
      return newSection;
    } catch (error) {
      console.error(
        "ActivitySection API Error: Failed to create section",
        error
      );
      throw new Error("Failed to create section");
    }
  }

  // Update section
  async updateSection(
    sectionId: string,
    sectionData: UpdateActivitySectionData
  ): Promise<ActivitySection> {
    try {
      console.log(
        `ActivitySection API: Updating section ${sectionId}...`,
        sectionData
      );
      const updatedSection = await makeRequest(`/sections/${sectionId}`, {
        method: "PUT",
        body: JSON.stringify(sectionData),
      });
      return updatedSection;
    } catch (error) {
      console.error(
        `ActivitySection API Error: Failed to update section ${sectionId}`,
        error
      );
      throw new Error(`Failed to update section ${sectionId}`);
    }
  }

  // Delete section
  async deleteSection(sectionId: string): Promise<void> {
    try {
      console.log(`ActivitySection API: Deleting section ${sectionId}...`);
      await makeRequest(`/sections/${sectionId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(
        `ActivitySection API Error: Failed to delete section ${sectionId}`,
        error
      );
      throw new Error(`Failed to delete section ${sectionId}`);
    }
  }

  // Get activities for a section
  async getActivitiesBySectionId(sectionId: string): Promise<Activity[]> {
    try {
      console.log(
        `ActivitySection API: Fetching activities for section ${sectionId}...`
      );
      const activities = await makeRequest(
        `/activitySections/${sectionId}/activities`
      );
      return activities;
    } catch (error) {
      console.error(
        `ActivitySection API Error: Failed to fetch activities for section ${sectionId}`,
        error
      );
      throw new Error(`Failed to fetch activities for section ${sectionId}`);
    }
  }

  // Create activity in section
  async createActivity(
    sectionId: string,
    activityData: {
      title: string;
      description: string;
      location?: string;
    }
  ): Promise<Activity> {
    try {
      console.log(
        `ActivitySection API: Creating activity in section ${sectionId}...`,
        activityData
      );
      const newActivity = await makeRequest(
        `/sections/${sectionId}/activities`,
        {
          method: "POST",
          body: JSON.stringify(activityData),
        }
      );
      return newActivity;
    } catch (error) {
      console.error(
        `ActivitySection API Error: Failed to create activity in section ${sectionId}`,
        error
      );
      throw new Error(`Failed to create activity in section ${sectionId}`);
    }
  }

  // Update activity
  async updateActivity(
    activityId: string,
    activityData: {
      title?: string;
      description?: string;
      location?: string;
    }
  ): Promise<Activity> {
    try {
      console.log(
        `ActivitySection API: Updating activity ${activityId}...`,
        activityData
      );
      const updatedActivity = await makeRequest(`/activities/${activityId}`, {
        method: "PUT",
        body: JSON.stringify(activityData),
      });
      return updatedActivity;
    } catch (error) {
      console.error(
        `ActivitySection API Error: Failed to update activity ${activityId}`,
        error
      );
      throw new Error(`Failed to update activity ${activityId}`);
    }
  }

  // Delete activity
  async deleteActivity(activityId: string): Promise<void> {
    try {
      console.log(`ActivitySection API: Deleting activity ${activityId}...`);
      await makeRequest(`/activities/${activityId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error(
        `ActivitySection API Error: Failed to delete activity ${activityId}`,
        error
      );
      throw new Error(`Failed to delete activity ${activityId}`);
    }
  }
}

// Export singleton instance
export const activitySectionService = new ActivitySectionService();
