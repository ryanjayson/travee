import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfileLocally, saveProfileLocally } from "../services/local/profileService";
import { UserProfileDto } from "../types/UserProfileDto";
import { identifyUser } from "../services/analytics/posthogService";

const PROFILE_QUERY_KEY = ["userProfile"];

export const useUserProfile = () => {
  return useQuery<UserProfileDto | null, Error>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const profile = await getProfileLocally();
      if (profile) {
        const userId = profile.id || profile.username || profile.email || profile.nickname;
        if (userId) {
          identifyUser(userId, {
            nickname: profile.nickname,
            username: profile.username,
            email: profile.email,
            travelStyle: profile.travelStyle,
            accountType: profile.accountType,
            defaultCurrency: profile.defaultCurrency,
            defaultCountry: profile.defaultCountry,
          });
        }
      }
      return profile;
    },
  });
};

export const useSaveProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserProfileDto) => saveProfileLocally(data),
    onSuccess: (savedProfile) => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      const userId = savedProfile.id || savedProfile.username || savedProfile.email || savedProfile.nickname;
      if (userId) {
        identifyUser(userId, {
          nickname: savedProfile.nickname,
          username: savedProfile.username,
          email: savedProfile.email,
          travelStyle: savedProfile.travelStyle,
          accountType: savedProfile.accountType,
          defaultCurrency: savedProfile.defaultCurrency,
          defaultCountry: savedProfile.defaultCountry,
        });
      }
    },
  });
};
