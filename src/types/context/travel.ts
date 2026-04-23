export interface TravelPlanDetail {
  id: string;
  title: string;
}

export interface TravelContextType {
  selectedTravelPlan: TravelPlanDetail | null;
  selectTravelPlan: (travelData: TravelPlanDetail) => void;
  clearTravelPlan: () => void;
}
