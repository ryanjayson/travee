export interface ActivitySection {
  id: string;
  title: string;
  description: string;
  travelId: string;
  activities?: Activity[];
  isCollapsed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateActivitySectionData {
  title: string;
  description: string;
  travelId: string;
}

export interface UpdateActivitySectionData {
  title?: string;
  description?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  location?: string;
  sectionId?: string;
  travelId?: string;
  createdAt?: string;
  updatedAt?: string;
}
