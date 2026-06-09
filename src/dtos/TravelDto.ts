export interface Travel {
  id?: string;
  title: string;
  description?: string;
  destination?: string;
  startOrDepartureDate?: Date;
  endOrReturnDate?: Date;
  status?: TravelStatus;
  budget?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  itinerarySection?: ItinerarySection[];
  tripSetting?: TripSetting | null;
}

export interface ItinerarySection {
  id?: string;
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
  startOrDepartureDate?: Date;
  endOrReturnDate?: Date;
  budget?: string;
  notes?: string;
  status: number;
}

export interface UpdateTravelData {
  destination?: string;
  startOrDepartureDate?: string;
  endOrReturnDate?: string;
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

export interface TripSetting {
  id?: string;
  travelId: string;
  currency: string;
  timezone: string;
  itineraryView: "plain" | "compact" | "detailed";
  allowItemReordering: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
