export enum IconSetProvider {
  material,
  ionic,
  feather,
}

export enum ActivityType {
  none = 0,
  flight = 1,
  checkIn = 2,
  checkOut = 3,
  taxi = 4,
  cafe = 5,
  food = 6,
  walk = 7,
  sightseeing = 8,
  shopping = 9,
  preparation = 10,
  ride = 11,
  rest = 12,
  bus = 13,
  train = 14,
  ferry = 15,
  hike = 16,
  museum = 17,
  beach = 18,
  sports = 19,
  spa = 20,
  meetup = 21,
  photography = 22,
  concert = 23,
  nightOut = 24,
  bike = 25,
  borderCrossing = 26,
}

export enum StatusType {
  travel = 1,
  account = 2,
}

export enum TravelStatus {
  Draft = 0,
  Upcoming = 1,
  Ongoing = 2,
  Completed = 3,
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
