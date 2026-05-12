import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProfileLocally, saveProfileLocally } from "../services/local/profileService";
import { UserProfileDto } from "../types/UserProfileDto";

const PROFILE_QUERY_KEY = ["userProfile"];

export const useUserProfile = () => {
  return useQuery<UserProfileDto | null, Error>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      return await getProfileLocally();
    },
  });
};

export const useSaveProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserProfileDto) => saveProfileLocally(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
  });
};
