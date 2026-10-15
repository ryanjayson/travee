import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useExchangeRate } from "../useExchangeRate";
import * as currencyUtils from "../../utils/currencyUtils";

let activeQueryClient: QueryClient;

const createWrapper = () => {
  activeQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={activeQueryClient}>{children}</QueryClientProvider>
  );
};

describe("useExchangeRate hook", () => {
  afterEach(() => {
    activeQueryClient?.clear();
    jest.restoreAllMocks();
  });

  it("suppresses exchange rate block when trip is in the same country", () => {
    const profile: any = {
      defaultCountry: "Philippines",
      defaultCurrency: "PHP",
    };
    const trip: any = {
      destination: "Boracay, Philippines",
      destinationData: { country: "Philippines" },
    };

    const { result } = renderHook(
      () => useExchangeRate({ profile, trip }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isSameCountry).toBe(true);
    expect(result.current.shouldShow).toBe(false);
  });

  it("suppresses exchange rate block when user currency matches visiting currency", () => {
    const profile: any = {
      defaultCountry: "United States",
      defaultCurrency: "USD",
    };
    const trip: any = {
      destination: "Ecuador",
      destinationData: { country: "Ecuador" },
      tripSetting: { currency: "USD" },
    };

    const { result } = renderHook(
      () => useExchangeRate({ profile, trip, tripSettingCurrency: "USD" }),
      { wrapper: createWrapper() }
    );

    expect(result.current.shouldShow).toBe(false);
  });

  it("lazily fetches exchange rate and shows block when visiting a different country", async () => {
    jest.spyOn(currencyUtils, "fetchExchangeRate").mockResolvedValueOnce(153.2);

    const profile: any = {
      defaultCountry: "United States",
      defaultCurrency: "USD",
    };
    const trip: any = {
      destination: "Tokyo, Japan",
      destinationData: { country: "Japan" },
    };

    const { result } = renderHook(
      () => useExchangeRate({ profile, trip }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isSameCountry).toBe(false);
    expect(result.current.userCurrency).toBe("USD");
    expect(result.current.visitingCurrency).toBe("JPY");

    await waitFor(() => {
      expect(result.current.rate).toBe(153.2);
      expect(result.current.formattedRate).toBe("153");
      expect(result.current.shouldShow).toBe(true);
    });
  });

  it("suppresses exchange rate block when network fails or offline", async () => {
    jest.spyOn(currencyUtils, "fetchExchangeRate").mockRejectedValueOnce(new Error("Offline"));

    const profile: any = {
      defaultCountry: "Philippines",
      defaultCurrency: "PHP",
    };
    const trip: any = {
      destination: "London, United Kingdom",
      destinationData: { country: "United Kingdom" },
    };

    const { result } = renderHook(
      () => useExchangeRate({ profile, trip }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.shouldShow).toBe(false);
    });
  });
});
