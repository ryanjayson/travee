export enum AccountType {
  Free = 0,
  Premium = 1,
}

export interface UserProfileDto {
  id?: string;
  username?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  defaultCurrency?: string;
  defaultCountry?: string;
  accountType?: AccountType;
  createdAt?: Date;
  updatedAt?: Date;
}
