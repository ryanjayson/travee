export enum IconSetProvider {
  material,
  ionic,
  feather,
}

export enum ActivityType {
  none,
  flight,
  checkIn,
  checkOut,
  taxi,
  cafe,
  food,
  walk,
  sightseeing,
  shopping,
  preparation,
  ride,
  rest,
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
