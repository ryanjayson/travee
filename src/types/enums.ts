export enum IconSetProvider {
  material,
  ionic,
  feather,
}

export enum TripPlanType {
  activity = 0,
  flight = 1,
  stay = 2, // checkin and checkout
  transit = 3, // ride, bike, boat, bus, taxi, train, ferry
  rideRental = 4, // RV, yatch, Motorbike, Motorcycle, car, bike
  tour = 5,
}

export enum ActivityType {
  cafe = 1, // food, eat, drink, snack, coffee, bar, lounge, pub
  restaurant = 2,
  sightseeing = 3,
  entertainment = 4, //park, museum, gym, cinema, stadium, zoo, concert
  shopping = 5, // , spa, events, festivals, parties, show, tour guide, clothes_store, supermarket, convenience_store, atm, bank, pharmacy, gas_station
  nature = 6, // beach, mountain, lake, river, waterfall, forest, jungle, cave, desert, canyon, volcano
  camp = 7, //mountain, forest, jungle, cave, desert, canyon, volcano, campground
  hike = 8, //mountain, forest, jungle, cave, desert, canyon, volcano, campground
  rest = 9,
  ride = 10, // motorbike, motorcycle, car, bike
  meetup = 11,
  walk = 12,
  preparation = 13,
}

// // Aliases for transition and backwards compatibility
// export { TripPlanType as PlanType };
// export { ActivityType as PlanActivityType, ActivityType as ActivityPlanType };

export enum StatusType {
  travel = 1,
  account = 2,
}

export enum TravelStatus {
  Draft = 0,
  Upcoming = 1,
  Travelling = 2,
  Ongoing = 2,
  Past = 3,
  Archieved = 4,
  Cancelled = 5,
}

export enum TravelMenuAction {
  EditTravel,
  Clone,
  Archive,
  Unarchive,
  Cancel,
  Delete,
}

export enum ExpenseCategory {
  None = 0,
  FoodAndDining = 1,
  Transportation = 2,
  Accommodation = 3,
  Shopping = 4,
  Entertainment = 5,
  Sightseeing = 6,
  HealthAndWellness = 7,
  VisasAndDocuments = 8,
  Gifts = 9,
  Insurance = 10,
  Emergency = 11,
  Subscriptions = 12,
  BankAndFees = 13,
  Communication = 14,
  Fuel = 15,
  Activities = 16,
  Laundry = 17,
  Others = 18,
}

export enum TripType {
  vacation = 1,
  weekendGetaway = 2,
  roadtrip = 3,
  beach = 4,
  staycation = 5,
  family = 6,
  solo = 7,
  honeymoon = 8,
  backpacking = 9,
  adventure = 10,
  foodTrip = 11,
  cultural = 12,
  hike = 13,
  camp = 14,
  business = 15,
  cruise = 16,
  wellness = 17,
  shopping = 18,
  festival = 19,
  concert = 20,
  photography = 21,
  diving = 22,
  winterSports = 23,
  pilgrimage = 24,
  event = 25,
  conference = 26,
  motorcycleRide = 27,
  motoCamping = 28,
  marathon = 29,
  workshop = 30,
  forum = 31,
  symposium = 32,
  colloquium = 33,
  none = 0,
}

export function getTripTypeLabel(type?: TripType | null): string {
  if (type == null) return "";
  switch (type) {
    case TripType.vacation:
      return "Vacation";
    case TripType.weekendGetaway:
      return "Weekend Getaway";
    case TripType.roadtrip:
      return "Road Trip";
    case TripType.beach:
      return "Beach";
    case TripType.staycation:
      return "Staycation";
    case TripType.family:
      return "Family";
    case TripType.solo:
      return "Solo";
    case TripType.honeymoon:
      return "Honeymoon";
    case TripType.backpacking:
      return "Backpacking";
    case TripType.adventure:
      return "Adventure";
    case TripType.foodTrip:
      return "Food Trip";
    case TripType.cultural:
      return "Cultural";
    case TripType.hike:
      return "Hike";
    case TripType.camp:
      return "Camp";
    case TripType.business:
      return "Business";
    case TripType.cruise:
      return "Cruise";
    case TripType.wellness:
      return "Wellness";
    case TripType.shopping:
      return "Shopping";
    case TripType.festival:
      return "Festival";
    case TripType.concert:
      return "Concert";
    case TripType.photography:
      return "Photography";
    case TripType.diving:
      return "Diving";
    case TripType.winterSports:
      return "Winter Sports";
    case TripType.pilgrimage:
      return "Pilgrimage";
    case TripType.event:
      return "Event";
    case TripType.conference:
      return "Conference";
    case TripType.motorcycleRide:
      return "Motorcycle Ride";
    case TripType.motoCamping:
      return "Moto Camping";
    case TripType.marathon:
      return "Marathon";
    case TripType.workshop:
      return "Workshop";
    case TripType.forum:
      return "Forum";
    case TripType.symposium:
      return "Symposium";
    case TripType.colloquium:
      return "Colloquium";
    case TripType.none:
    default:
      return "";
  }
}

export function getTripPlanTypeLabel(type: TripPlanType): string {
  switch (type) {
    case TripPlanType.activity:
      return "Activity";
    case TripPlanType.flight:
      return "Flight";
    case TripPlanType.stay:
      return "Stay";
    case TripPlanType.transit:
      return "Transit";
    case TripPlanType.rideRental:
      return "Rental";
    case TripPlanType.tour:
      return "Tour";
    default:
      return "Activity";
  }
}

export function getActivityTypeLabel(type: ActivityType): string {
  switch (type) {
    case ActivityType.preparation:
      return "Preparation";
    case ActivityType.restaurant:
      return "Restaurant";
    case ActivityType.cafe:
      return "Cafe";
    case ActivityType.sightseeing:
      return "Sightseeing";
    case ActivityType.shopping:
      return "Shopping";
    case ActivityType.entertainment:
      return "Entertainment";
    case ActivityType.nature:
      return "Nature";
    case ActivityType.walk:
      return "Walk";
    case ActivityType.camp:
      return "Camp";
    case ActivityType.hike:
      return "Hike";
    case ActivityType.rest:
      return "Rest";
    case ActivityType.ride:
      return "Ride";
    case ActivityType.meetup:
      return "Meetup";
    default:
      return "Plan";
  }
}

// Aliases for transition and backwards compatibility
export const getActivityPlanTypeLabel = getActivityTypeLabel;
export const getPlanTypeLabel = getTripPlanTypeLabel;


