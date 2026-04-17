export interface Activity {
  id: string;
  title: string;
  description: string;
  location?: string;
  sectionId?: string;
  travelId?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  status?: 'planned' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateActivityData {
  title: string;
  description: string;
  location?: string;
  sectionId?: string;
  travelId?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  status?: 'planned' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface UpdateActivityData {
  title?: string;
  description?: string;
  location?: string;
  sectionId?: string;
  travelId?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
  status?: 'planned' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
}

// API base URL
const API_BASE_URL = 'http://192.168.254.107:33548/api';

// Helper function to make HTTP requests
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('Activity API: URL ', url);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
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
    console.error('Activity API Request failed:', error);
    throw error;
  }
};

class ActivityService {
  // Get all activities for a travel
  async getActivitiesByTravelId(travelId: string): Promise<Activity[]> {
    try {
      console.log(`Activity API: Fetching activities for travel ${travelId}...`);
      const activities = await makeRequest(`/travels/${travelId}/activity`);
      console.log('LOG TABLE: ',activities);

      return activities;
    } catch (error) {
      console.error(`Activity API Error: Failed to fetch activities for travel ${travelId}`, error);
      throw new Error(`Failed to fetch activities for travel ${travelId}`);
    }
  }

  // Get activities for a specific section
  async getActivitiesBySectionId(sectionId: string): Promise<Activity[]> {
    try {
      console.log(`Activity API: Fetching activities for section ${sectionId}...`);
      const activities = await makeRequest(`/activitySections /${sectionId}/activity`);
      return activities;
    } catch (error) {
      console.error(`Activity API Error: Failed to fetch activities for section ${sectionId}`, error);
      throw new Error(`Failed to fetch activities for section ${sectionId}`);
    }
  }

  // Get activity by ID
  async getActivityById(activityId: string): Promise<Activity | null> {
    try {
      console.log(`Activity API: Fetching activity ${activityId}...`);
      const activity = await makeRequest(`/activity/${activityId}`);
      return activity;
    } catch (error) {
      console.error(`Activity API Error: Failed to fetch activity ${activityId}`, error);
      throw new Error(`Failed to fetch activity ${activityId}`);
    }
  }

  // Create new activity
  async createActivity(activityData: CreateActivityData): Promise<Activity> {
    try {
      console.log('Activity API: Creating new activity...', activityData);
      
      const endpoint = '/activity';
    
      
      const newActivity = await makeRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(activityData),
      });
      return newActivity;
    } catch (error) {
      console.error('Activity API Error: Failed to create activity', error);
      throw new Error('Failed to create activity');
    }
  }

  // Update activity
  async updateActivity(activityId: string, activityData: UpdateActivityData): Promise<Activity> {
    try {
      console.log(`Activity API: Updating activity ${activityId}...`, activityData);
      const updatedActivity = await makeRequest(`/activity/${activityId}`, {
        method: 'PUT',
        body: JSON.stringify(activityData),
      });
      return updatedActivity;
    } catch (error) {
      console.error(`Activity API Error: Failed to update activity ${activityId}`, error);
      throw new Error(`Failed to update activity ${activityId}`);
    }
  }

  // Delete activity
  async deleteActivity(activityId: string): Promise<void> {
    try {
      console.log(`Activity API: Deleting activity ${activityId}...`);
      await makeRequest(`/activity/${activityId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`Activity API Error: Failed to delete activity ${activityId}`, error);
      throw new Error(`Failed to delete activity ${activityId}`);
    }
  }

  // Move activity to different section
  async moveActivityToSection(activityId: string, sectionId: string): Promise<Activity> {
    try {
      console.log(`Activity API: Moving activity ${activityId} to section ${sectionId}...`);
      const movedActivity = await makeRequest(`/activity/${activityId}/move`, {
        method: 'PUT',
        body: JSON.stringify({ sectionId }),
      });
      return movedActivity;
    } catch (error) {
      console.error(`Activity API Error: Failed to move activity ${activityId}`, error);
      throw new Error(`Failed to move activity ${activityId}`);
    }
  }

  // Update activity status
  async updateActivityStatus(activityId: string, status: 'planned' | 'completed' | 'cancelled'): Promise<Activity> {
    try {
      console.log(`Activity API: Updating activity ${activityId} status to ${status}...`);
      const updatedActivity = await makeRequest(`/activity/${activityId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return updatedActivity;
    } catch (error) {
      console.error(`Activity API Error: Failed to update activity ${activityId} status`, error);
      throw new Error(`Failed to update activity ${activityId} status`);
    }
  }

  // Get activities by date range
  async getActivitiesByDateRange(travelId: string, startDate: string, endDate: string): Promise<Activity[]> {
    try {
      console.log(`Activity API: Fetching activities for travel ${travelId} from ${startDate} to ${endDate}...`);
      const activities = await makeRequest(`/travels/${travelId}/activity?startDate=${startDate}&endDate=${endDate}`);
      return activities;
    } catch (error) {
      console.error(`Activity API Error: Failed to fetch activities by date range`, error);
      throw new Error(`Failed to fetch activities by date range`);
    }
  }

  // Get activities by status
  async getActivitiesByStatus(travelId: string, status: 'planned' | 'completed' | 'cancelled'): Promise<Activity[]> {
    try {
      console.log(`Activity API: Fetching activities for travel ${travelId} with status ${status}...`);
      const activities = await makeRequest(`/travels/${travelId}/activity?status=${status}`);
      return activities;
    } catch (error) {
      console.error(`Activity API Error: Failed to fetch activities by status`, error);
      throw new Error(`Failed to fetch activities by status`);
    }
  }

  // Search activities
  async searchActivities(travelId: string, query: string): Promise<Activity[]> {
    try {
      console.log(`Activity API: Searching activities for travel ${travelId} with query "${query}"...`);
      const activities = await makeRequest(`/travels/${travelId}/activity?search=${encodeURIComponent(query)}`);
      return activities;
    } catch (error) {
      console.error(`Activity API Error: Failed to search activities`, error);
      throw new Error(`Failed to search activities`);
    }
  }

  // Bulk update activities
  async bulkUpdateActivities(activityIds: string[], updates: UpdateActivityData): Promise<Activity[]> {
    try {
      console.log(`Activity API: Bulk updating ${activityIds.length} activities...`);
      const updatedActivities = await makeRequest('/activity/bulk-update', {
        method: 'PUT',
        body: JSON.stringify({ activityIds, updates }),
      });
      return updatedActivities;
    } catch (error) {
      console.error(`Activity API Error: Failed to bulk update activities`, error);
      throw new Error(`Failed to bulk update activities`);
    }
  }

  // Get activity statistics
  async getActivityStats(travelId: string): Promise<{
    total: number;
    planned: number;
    completed: number;
    cancelled: number;
    byPriority: { low: number; medium: number; high: number };
  }> {
    try {
      console.log(`Activity API: Fetching activity statistics for travel ${travelId}...`);
      const stats = await makeRequest(`/travels/${travelId}/activity/stats`);
      return stats;
    } catch (error) {
      console.error(`Activity API Error: Failed to fetch activity statistics`, error);
      throw new Error(`Failed to fetch activity statistics`);
    }
  }
}

// Export singleton instance
export const activityService = new ActivityService(); 