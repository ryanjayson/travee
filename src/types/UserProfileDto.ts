export enum AccountType {
  Free = 0,
  Premium = 1,
}

export interface UserProfileDto {
  id?: string;
  username?: string;
  nickname?: string;
  travelStyle?: string;
  email?: string;
  avatarUrl?: string;
  defaultCurrency?: string;
  defaultCountry?: string;
  accountType?: AccountType;
  notificationsEnabled?: boolean;
  notifyDaysBeforeTrip?: number;
  notifyHoursBeforeActivity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
