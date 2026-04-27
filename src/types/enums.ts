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
  Print,
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
  Others = 8,
}
