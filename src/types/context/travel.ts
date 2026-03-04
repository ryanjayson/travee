export interface TravelPlanDetail {
  id: number;
  title: string;
}

export interface TravelContextType {
  selectedTravelPlan: TravelPlanDetail | null;
  selectTravelPlan: (travelData: TravelPlanDetail) => void;
  clearTravelPlan: () => void;
}
