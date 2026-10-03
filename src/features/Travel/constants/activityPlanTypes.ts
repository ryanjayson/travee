import { ActivityType } from "../../../types/enums";

export interface PlanTypeItem {
  type: ActivityType;
  key: string;
  label: string;
  subtext: string;
  iconName: string;
  color: string;
}

/**
 * Palette Rules for ActivityPlanTypes:
 * 1. Must never collide or repeat with TripPlanType (activityIcons) colors:
 *    - Activity: #c10003
 *    - Flight: #2196F3
 *    - Stay: #a659ee
 *    - Transit: #02899a
 *    - Tour: #429862
 *    - Rental: #384690
 * 2. Every ActivityType must have a unique color (no repeats).
 * 3. Colors are light, pleasant, and conceptually related to each activity type.
 */
export const ACTIVITY_PLAN_TYPES: PlanTypeItem[] = [
  {
    type: ActivityType.cafe,
    key: "cafe",
    label: "Cafe",
    subtext: "Coffee, drinks, snacks, cafes, lounges, and bars",
    iconName: "local-cafe",
    color: "#B56F3B", // Warm caramel latte / roasted coffee
  },
  {
    type: ActivityType.restaurant,
    key: "restaurant",
    label: "Restaurant",
    subtext: "Dining, meals, and food spots",
    iconName: "restaurant",
    color: "#E76F51", // Warm terracotta / appetizing coral dining
  },
  {
    type: ActivityType.sightseeing,
    key: "sightseeing",
    label: "Sightseeing",
    subtext: "Landmarks, attractions, and photo spots",
    iconName: "photo-camera",
    color: "#F59E0B", // Sunny amber gold / landmarks
  },
  {
    type: ActivityType.entertainment,
    key: "entertainment",
    label: "Entertainment",
    subtext: "Museums, parks, shows, cinema, and sports",
    iconName: "local-play",
    color: "#A855F7", // Fun vibrant purple / shows & nightlife
  },
  {
    type: ActivityType.shopping,
    key: "shopping",
    label: "Shopping",
    subtext: "Markets, stores, spas, banks, and essentials",
    iconName: "shopping-bag",
    color: "#EC4899", // Soft rose / boutique pink
  },
  {
    type: ActivityType.nature,
    key: "nature",
    label: "Nature",
    subtext: "Beaches, lakes, parks, and natural wonders",
    iconName: "terrain",
    color: "#10B981", // Light emerald / fresh greenery
  },
  {
    type: ActivityType.hike,
    key: "hike",
    label: "Hike",
    subtext: "Hiking trails, trekking, and mountain paths",
    iconName: "hiking",
    color: "#52B788", // Fresh alpine sage / trail green
  },
  {
    type: ActivityType.camp,
    key: "camp",
    label: "Camp",
    subtext: "Camping, outdoor tents, and campfires",
    iconName: "night-shelter",
    color: "#D97706", // Warm amber campfire / outdoor canvas
  },
  {
    type: ActivityType.walk,
    key: "walk",
    label: "Walk",
    subtext: "City strolls, walking tours, and exploration",
    iconName: "directions-walk",
    color: "#84CC16", // Breezy lime pear / casual stroll
  },
  {
    type: ActivityType.rest,
    key: "rest",
    label: "Rest",
    subtext: "Relaxation, downtime, and rest",
    iconName: "hotel",
    color: "#8DA4C4", // Soft powder slate / calm relaxation
  },
  {
    type: ActivityType.ride,
    key: "ride",
    label: "Ride",
    subtext: "Motorbike, Biking, and scenic rides",
    iconName: "directions-bike",
    color: "#0284C7", // Bright scenic azure / open road
  },
  {
    type: ActivityType.meetup,
    key: "meetup",
    label: "Meetup",
    subtext: "Gatherings, meetups, and socializing",
    iconName: "people",
    color: "#14B8A6", // Friendly seafoam teal / socializing
  },
  {
    type: ActivityType.preparation,
    key: "preparation",
    label: "Preparation",
    subtext: "Packing, checklists, and pre-trip tasks",
    iconName: "build",
    color: "#64748B", // Cool steel slate / checklist & tools
  },
];

export const getActivityPlanTypeConfig = (
  type?: ActivityType | string | number | null
): PlanTypeItem | undefined => {
  if (type == null) return undefined;
  return ACTIVITY_PLAN_TYPES.find(
    (p) => p.type === type || p.key === type || String(p.type) === String(type)
  );
};

export const getActivityPlanTypeColor = (
  type?: ActivityType | string | number | null,
  fallbackColor = "#c10003"
): string => {
  const config = getActivityPlanTypeConfig(type);
  return config?.color ?? fallbackColor;
};
