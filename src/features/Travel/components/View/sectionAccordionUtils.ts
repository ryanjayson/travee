import { LayoutAnimation } from "react-native";
import { ItineraryActivity } from "../../../Travel/types/TravelDto";

export type ViewMode = "plain" | "narrow" | "expanded";
export type ItineraryView = "plain" | "compact" | "detailed";

export const toViewMode = (itineraryView?: string): ViewMode => {
  switch (itineraryView) {
    case "plain":
      return "plain";
    case "compact":
      return "narrow";
    case "detailed":
    default:
      return "expanded";
  }
};

export const toItineraryView = (viewMode: ViewMode): ItineraryView => {
  switch (viewMode) {
    case "plain":
      return "plain";
    case "narrow":
      return "compact";
    case "expanded":
    default:
      return "detailed";
  }
};

export const isValidStartDate = (dateVal: unknown): boolean => {
  if (dateVal === null || dateVal === undefined || dateVal === "") return false;
  if (typeof dateVal === "number" && dateVal <= 0) return false;
  const d = new Date(dateVal as string | number);
  return !isNaN(d.getTime());
};

export const slowSpringAnimation = {
  duration: 1000,
  create: {
    type: LayoutAnimation.Types.spring,
    property: LayoutAnimation.Properties.opacity,
    springDamping: 0.2,
  },
  update: {
    type: LayoutAnimation.Types.spring,
    springDamping: 0.2,
  },
  delete: {
    type: LayoutAnimation.Types.spring,
    property: LayoutAnimation.Properties.opacity,
    springDamping: 0.2,
  },
};

export const sortActivities = (activities?: ItineraryActivity[]) => {
  if (!activities) return [];
  return [...activities].sort((a, b) =>
    (a.sortOrder || "").localeCompare(b.sortOrder || "")
  );
};
