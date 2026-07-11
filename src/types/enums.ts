export enum IconSetProvider {
  material,
  ionic,
  feather,
}

export enum ActivityType {
  none = 0,
  flight = 1,
  accomodation = 3, // checkin and checkout
  cafeRestaurant = 4, // food, eat, drink, snack, coffee, bar, lounge, pub
  //more
  nature = 5, // beach, mountain, lake, river, waterfall, forest, jungle, cave, desert, canyon, volcano
  shopppingAndService = 6, // , spa, events, festivals, parties, show, tour guide, clothes_store, supermarket, convenience_store, atm, bank, pharmacy, gas_station
  entertainmentAndRecreation = 7, //park, museum, gym, cinema, stadium, zoo, concert
  // transportation = 8, // ride, bike, boat, bus, taxi, train, ferry
  walk = 9,
  sightseeing = 10,
  preparation = 11,
  // rest = 12,
  hikeOrCamp = 13, //mountain, forest, jungle, cave, desert, canyon, volcano, campground
  // motorcycleRide = 14, // motorbike 
  // meetup = 15,
  // rideRental = 16, // RV, yatch, Motorbike, Motorcycle, car, bike
}

export enum StatusType {
  travel = 1,
  account = 2,
}

export enum TravelStatus {
  Draft = 0,
  Upcoming = 1,
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
    case ActivityType.none:
      return "No type";
    case ActivityType.flight:
      return "Flight";
    case ActivityType.accomodation:
      return "Accommodation";
    case ActivityType.cafeRestaurant:
      return "Cafe/Restaurant";
    case ActivityType.nature:
      return "Nature";
    case ActivityType.shopppingAndService:
      return "Shopping";
    case ActivityType.entertainmentAndRecreation:
      return "Entertainment";
    case ActivityType.walk:
      return "Walk";
    case ActivityType.sightseeing:
      return "Sightseeing";
    case ActivityType.preparation:
      return "Preparation";
    case ActivityType.hikeOrCamp:
      return "Hike / Camp";
    default:
      return "Activity";
  }
}


