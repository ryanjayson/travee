import { database } from "../../db";
import UserProfile from "../../db/models/UserProfile";
import { UserProfileDto, AccountType } from "../../types/UserProfileDto";

const toDto = (p: UserProfile): UserProfileDto => ({
  id: p.id,
  username: p.username ?? undefined,
  nickname: p.nickname ?? undefined,
  travelStyle: p.travelStyle ?? undefined,
  email: p.email ?? undefined,
  avatarUrl: p.avatarUrl ?? undefined,
  defaultCurrency: p.defaultCurrency ?? undefined,
  defaultCountry: p.defaultCountry ?? undefined,
  accountType: (p.accountType as AccountType) ?? AccountType.Free,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

/** Fetches the single local user profile (returns first record or null). */
export const getProfileLocally = async (): Promise<UserProfileDto | null> => {
  const profiles = await database.get<UserProfile>("user_profiles").query().fetch();
  if (profiles.length === 0) return null;
  return toDto(profiles[0]);
};

/** Saves or updates the local user profile (upsert — only one profile record). */
export const saveProfileLocally = async (data: UserProfileDto): Promise<UserProfileDto> => {
  const profiles = await database.get<UserProfile>("user_profiles").query().fetch();

  return await database.write(async () => {
    if (profiles.length > 0) {
      const existing = profiles[0];
      await existing.update((p) => {
        if (data.username !== undefined) p.username = data.username ?? null;
        if (data.nickname !== undefined) p.nickname = data.nickname ?? null;
        if (data.travelStyle !== undefined) p.travelStyle = data.travelStyle ?? null;
        if (data.email !== undefined) p.email = data.email ?? null;
        if (data.avatarUrl !== undefined) p.avatarUrl = data.avatarUrl ?? null;
        if (data.defaultCurrency !== undefined) p.defaultCurrency = data.defaultCurrency ?? null;
        if (data.defaultCountry !== undefined) p.defaultCountry = data.defaultCountry ?? null;
        if (data.accountType !== undefined) p.accountType = data.accountType!;
      });

      // Safeguard: Delete any duplicate profiles if they somehow exist
      if (profiles.length > 1) {
        for (let i = 1; i < profiles.length; i++) {
          await profiles[i].destroyPermanently();
        }
      }

      return toDto(existing);
    } else {
      const created = await database.get<UserProfile>("user_profiles").create((p) => {
        p.username = data.username ?? null;
        p.nickname = data.nickname ?? null;
        p.travelStyle = data.travelStyle ?? null;
        p.email = data.email ?? null;
        p.avatarUrl = data.avatarUrl ?? null;
        p.defaultCurrency = data.defaultCurrency ?? "PHP";
        p.defaultCountry = data.defaultCountry ?? "Philippines";
        p.accountType = data.accountType ?? AccountType.Free;
      });
      return toDto(created);
    }
  });
};
