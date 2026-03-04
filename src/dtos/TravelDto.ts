export interface Travel {
  id?: number;
  title: string;
  description?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  status?: TravelStatus;
  budget?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  itinerarySection?: ItinerarySection[];
}

export interface ItinerarySection {
  id?: number;
  title: string;
  description?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTravelData {
  title: string;
  description: string;
  destination: string;
  startDate?: Date;
  endDate?: Date;
  budget?: string;
  notes?: string;
  status: number;
}

export interface UpdateTravelData {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  notes?: string;
}

export enum TravelStatus {
    Draft = 0,
    Upcoming = 1,
    Completed = 2,
    Archieved = 3,
    Cancelled = 4
}

export interface UpdateTravelData {
    destination?: string;
    startDate?: string;
    endDate?: string;
    budget?: string;
    notes?: string;
  }
