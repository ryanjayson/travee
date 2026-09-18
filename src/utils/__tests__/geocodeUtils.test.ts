import { geocodeAddress, clearGeocodeCache } from "../geocodeUtils";

describe("geocodeUtils - geocodeAddress", () => {
  beforeEach(() => {
    clearGeocodeCache();
    jest.clearAllMocks();
  });

  it("returns null for empty or null address strings", async () => {
    expect(await geocodeAddress(null)).toBeNull();
    expect(await geocodeAddress("")).toBeNull();
    expect(await geocodeAddress("   ")).toBeNull();
  });

  it("resolves airport codes instantly using pre-computed airport map", async () => {
    const result = await geocodeAddress("HND");
    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(35.5494, 2);
    expect(result?.longitude).toBeCloseTo(139.7798, 2);
    expect(result?.name).toContain("Haneda");
  });

  it("geocodes address via Google Geocoding API when available", async () => {
    const mockGoogleResponse = {
      status: "OK",
      results: [
        {
          formatted_address: "Tokyo Station, 1 Chome Marunouchi, Chiyoda City, Tokyo, Japan",
          geometry: {
            location: {
              lat: 35.6812,
              lng: 139.7671,
            },
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockGoogleResponse,
    });

    const result = await geocodeAddress("Tokyo Station");
    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(35.6812, 4);
    expect(result?.longitude).toBeCloseTo(139.7671, 4);
    expect(result?.formattedAddress).toContain("Tokyo Station");
  });

  it("falls back to Nominatim when Google API fails", async () => {
    // 1. Google fails
    // 2. Nominatim succeeds
    const mockNominatimResponse = [
      {
        lat: "34.9859",
        lon: "135.7588",
        name: "Kyoto Station",
        display_name: "Kyoto Station, Shimogyo Ward, Kyoto, Japan",
      },
    ];

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (String(url).includes("nominatim")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockNominatimResponse,
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
      });
    });

    const result = await geocodeAddress("Kyoto Station");
    expect(result).not.toBeNull();
    expect(result?.latitude).toBeCloseTo(34.9859, 4);
    expect(result?.longitude).toBeCloseTo(135.7588, 4);
  });

  it("caches resolved results to prevent repeated network calls", async () => {
    const mockGoogleResponse = {
      status: "OK",
      results: [
        {
          formatted_address: "Osaka Station, Osaka, Japan",
          geometry: {
            location: {
              lat: 34.7024,
              lng: 135.4959,
            },
          },
        },
      ],
    };

    const fetchSpy = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockGoogleResponse,
    });
    global.fetch = fetchSpy;

    const first = await geocodeAddress("Osaka Station");
    const second = await geocodeAddress("Osaka Station");

    expect(first).toEqual(second);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
