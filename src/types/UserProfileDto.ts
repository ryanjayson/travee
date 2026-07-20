export enum AccountType {
  Free = 0,
  Premium = 1,
}

export type BackupFrequency = "weekly" | "monthly" | "quarterly";
export type BackupLocation = "local" | "google_drive";

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
  backupFrequency?: BackupFrequency;
  backupLocation?: BackupLocation;
  backupAutoEnabled?: boolean;
  lastBackedUpAt?: number | null;
  googleDriveAccount?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
