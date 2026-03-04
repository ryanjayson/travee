// TravelContext.js
import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  FC,
  ReactNode,
  useContext,
} from "react";
import { TravelPlanDetail, TravelContextType } from "../types/context/travel";

const initialContextValue: TravelContextType = {
  selectedTravelPlan: null,
  selectTravelPlan: () => {}, // placeholder function
  clearTravelPlan: () => {}, // placeholder function
};

// Create the typed Context
export const TravelContext =
  createContext<TravelContextType>(initialContextValue);

// Define the props for the Provider (it only takes children)
interface TravelProviderProps {
  children: ReactNode; // A standard type for children in React
}

// Create the Provider component using the FC (Function Component) type
export const TravelProvider: FC<TravelProviderProps> = ({ children }) => {
  // Ensure useState is typed correctly
  const [selectedTravelPlan, setSelectedTravelPlan] =
    useState<TravelPlanDetail | null>(null);

  // Use useCallback and apply types to the function arguments
  const selectTravelPlan = useCallback((travelData: TravelPlanDetail) => {
    setSelectedTravelPlan(travelData);
  }, []);

  const clearTravelPlan = useCallback(() => {
    setSelectedTravelPlan(null);
  }, []);

  // Use useMemo and apply the context type to the value
  const contextValue = useMemo<TravelContextType>(
    () => ({
      selectedTravelPlan,
      selectTravelPlan,
      clearTravelPlan,
    }),
    [selectedTravelPlan, selectTravelPlan, clearTravelPlan]
  );

  return (
    <TravelContext.Provider value={contextValue}>
      {children}
    </TravelContext.Provider>
  );
};

export const useTravelContext = (): TravelContextType => {
  const context = useContext(TravelContext);

  if (context === initialContextValue) {
    // Check if the context value is the initial/default placeholder
    throw new Error("useTravel must be used within a TravelProvider");
  }

  return context;
};
