export enum IconSetProvider {
  material,
  ionic,
  feather,
}

export enum ActivityType {
  plan = 0,
  flight = 1,
  stay = 2, // checkin and checkout
  transit = 3, // ride, bike, boat, bus, taxi, train, ferry
  rideRental = 4, // RV, yatch, Motorbike, Motorcycle, car, bike
  tour = 5,
  // preparation = 6,
  // cafeRestaurant = 4, // food, eat, drink, snack, coffee, bar, lounge, pub
  //more
  // sightseeing = 10,
  // shopppingAndService = 6, // , spa, events, festivals, parties, show, tour guide, clothes_store, supermarket, convenience_store, atm, bank, pharmacy, gas_station
  // entertainmentAndRecreation = 7, //park, museum, gym, cinema, stadium, zoo, concert
  // nature = 5, // beach, mountain, lake, river, waterfall, forest, jungle, cave, desert, canyon, volcano
  // walk = 9, TODO: reenable for the future, do not enable yet
  // hikeOrCamp = 13, //mountain, forest, jungle, cave, desert, canyon, volcano, campground
  // rest = 12,
  // motorcycleRide = 14, // motorbike 
  // meetup = 15,
}

export enum ActivityPlanType {
  preparation = 1,
  restaurant = 2,
  cafeOrBar = 3, // food, eat, drink, snack, coffee, bar, lounge, pub
  sightseeing = 4,
  shoppingOrService = 5, // , spa, events, festivals, parties, show, tour guide, clothes_store, supermarket, convenience_store, atm, bank, pharmacy, gas_station
  entertainmentOrRecreation = 6, //park, museum, gym, cinema, stadium, zoo, concert
  nature = 7, // beach, mountain, lake, river, waterfall, forest, jungle, cave, desert, canyon, volcano
  hikeOrCamp = 9, //mountain, forest, jungle, cave, desert, canyon, volcano, campground
  rest = 10,
  motorcycleRide = 11, // motorbike 
  meetup = 12,
  walk = 8,
}

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
  none = 0,
  vacation = 13,
  roadtrip = 15,
  staycation = 21,
  family = 17,
  solo = 16,
  backpacking = 18,
  business = 14,
  hike = 3,
  camp = 2,
  event = 4,
  concert = 5,
  shopping = 8,
  cruise = 22,
  ride = 1,
  marathon = 6,
  workshop = 10,
  forum = 9,
  symposium = 11,
  colloquium = 12,
  motorcycleRide = 19,
  motoCamping = 20,
}

export function getActivityTypeLabel(type: ActivityType): string {
  switch (type) {
    case ActivityType.plan:
      return "Plan";
    case ActivityType.flight:
      return "Flight";
    case ActivityType.stay:
      return "Stay";
    // case ActivityType.cafeRestaurant:
    //   return "Cafe/Restaurant";
    // case ActivityType.nature:
    //   return "Nature";
    // case ActivityType.shopppingAndService:
    //   return "Shopping";
    // case ActivityType.entertainmentAndRecreation:
    //   return "Entertainment";
    // case ActivityType.walk:
    //   return "Walk";
    // case ActivityType.sightseeing:
    //   return "Sightseeing";
    // case ActivityType.preparation:
    //   return "Preparation";
    // case ActivityType.hikeOrCamp:
    //   return "Hike / Camp";
    case ActivityType.transit:
      return "Transit";
    case ActivityType.rideRental:
      return "Rental";
      case ActivityType.tour:
      return "Tour";
    default:
      return "Activity";
  }
}

export function getActivityPlanTypeLabel(type: ActivityPlanType): string {
  switch (type) {
    case ActivityPlanType.preparation:
      return "Preparation";
    case ActivityPlanType.restaurant:
      return "Restaurant";
    case ActivityPlanType.cafeOrBar:
      return "Cafe / Bar";
    case ActivityPlanType.sightseeing:
      return "Sightseeing";
    case ActivityPlanType.shoppingOrService:
      return "Shopping & Service";
    case ActivityPlanType.entertainmentOrRecreation:
      return "Entertainment & Recreation";
    case ActivityPlanType.nature:
      return "Nature";
    case ActivityPlanType.walk:
      return "Walk";
    case ActivityPlanType.hikeOrCamp:
      return "Hike / Camp";
    case ActivityPlanType.rest:
      return "Rest";
    case ActivityPlanType.motorcycleRide:
      return "Motorcycle Ride";
    case ActivityPlanType.meetup:
      return "Meetup";
    default:
      return "Plan";
  }
}


