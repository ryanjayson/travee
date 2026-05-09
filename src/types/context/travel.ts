export interface TravelPlanDetail {
  id: string;
  title: string;
  // startOrDepartureDate: Date | string | undefined;
  // endOrReturnDate: Date | string | undefined;
}

export interface TravelContextType {
  selectedTravelPlan: TravelPlanDetail | null;
  selectTravelPlan: (travelData: TravelPlanDetail) => void;
  clearTravelPlan: () => void;
}
