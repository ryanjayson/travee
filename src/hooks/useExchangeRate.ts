import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getValidMapboxCountryCode } from "../utils/countryUtils";
import {
  fetchExchangeRate,
  formatExchangeRate,
  getCurrencyForCountry,
} from "../utils/currencyUtils";
import { UserProfileDto } from "../types/UserProfileDto";
import { Travel } from "../features/Travel/types/TravelDto";

interface UseExchangeRateParams {
  profile?: UserProfileDto | null;
  trip?: Travel | null;
  tripSettingCurrency?: string;
}

export interface UseExchangeRateResult {
  rate: number | null;
  formattedRate: string;
  isLoading: boolean;
  isError: boolean;
  userCurrency: string;
  visitingCurrency: string;
  isSameCountry: boolean;
  shouldShow: boolean;
}

/**
 * Custom hook to lazily fetch and cache the real-time exchange rate
 * between the user's home country currency and the trip destination currency.
 * Automatically handles same-country checks and offline/error suppression.
 */
export const useExchangeRate = ({
  profile,
  trip,
  tripSettingCurrency,
}: UseExchangeRateParams): UseExchangeRateResult => {
  // 1. Determine user country & currency
  const userCountry = profile?.defaultCountry || "Philippines";
  const userCountryCode = getValidMapboxCountryCode(userCountry);
  const userCurrency =
    profile?.defaultCurrency ||
    getCurrencyForCountry(userCountry) ||
    "PHP";

  // 2. Determine visiting country & currency
  const visitingCountry = useMemo(() => {
    if (!trip) return "";
    return (
      trip.destinationData?.country ||
      trip.tripDestinations?.[0]?.destinationData?.country ||
      (trip.destination
        ? trip.destination.split(",").map((p) => p.trim()).pop() || ""
        : "")
    );
  }, [trip]);

  const visitingCountryCode = getValidMapboxCountryCode(visitingCountry);

  const visitingCurrency = useMemo(() => {
    // If trip setting explicitly specifies a 3-letter currency code, respect it
    if (tripSettingCurrency && tripSettingCurrency.length === 3) {
      return tripSettingCurrency.toUpperCase();
    }
    if (trip?.tripSetting?.currency && trip.tripSetting.currency.length === 3) {
      return trip.tripSetting.currency.toUpperCase();
    }
    return getCurrencyForCountry(visitingCountry) || "";
  }, [tripSettingCurrency, trip?.tripSetting?.currency, visitingCountry]);

  // 3. Same country & currency check
  const isSameCountry = useMemo(() => {
    if (!visitingCountry) return true;
    if (userCountryCode && visitingCountryCode) {
      return userCountryCode === visitingCountryCode;
    }
    return (
      userCountry.trim().toLowerCase() === visitingCountry.trim().toLowerCase()
    );
  }, [userCountry, userCountryCode, visitingCountry, visitingCountryCode]);

  // 4. Lazy fetch exchange rate via React Query
  const isQueryEnabled =
    !isSameCountry &&
    !!userCurrency &&
    !!visitingCurrency &&
    userCurrency !== visitingCurrency;

  const { data: rate, isLoading, isError } = useQuery({
    queryKey: ["exchangeRate", userCurrency, visitingCurrency],
    queryFn: () => fetchExchangeRate(userCurrency, visitingCurrency),
    enabled: isQueryEnabled,
    staleTime: 1000 * 60 * 60, // 1 hour cache
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: false, // Fail fast if offline without repeating requests
  });

  const resolvedRate = rate ?? null;
  const formattedRate = resolvedRate ? formatExchangeRate(resolvedRate) : "--";

  // If same country, offline/error, or rate is unavailable, do not show the block
  const shouldShow =
    !isSameCountry &&
    isQueryEnabled &&
    !isError &&
    (isLoading || resolvedRate !== null);

  return {
    rate: resolvedRate,
    formattedRate,
    isLoading,
    isError,
    userCurrency,
    visitingCurrency,
    isSameCountry,
    shouldShow,
  };
};
