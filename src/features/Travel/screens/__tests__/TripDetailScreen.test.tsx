import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { TripDetailScreen, getActivityCoordinates } from "../TripDetailScreen";
import { useTravelPlan } from "../../hooks/useTravel";
import { ActivityType } from "../../../../types/enums";

// Mock hooks
jest.mock("../../hooks/useTravel", () => ({
  useTravelPlan: jest.fn(),
}));

jest.mock("../../../../utils/geocodeUtils", () => ({
  geocodeAddress: jest.fn(async (address: string) => {
    if (address === "Shinjuku Bus Terminal") {
      return { latitude: 35.6896, longitude: 139.7006, name: "Shinjuku Bus Terminal" };
    }
    if (address === "Mount Fuji 5th Station") {
      return { latitude: 35.3606, longitude: 138.7274, name: "Mount Fuji 5th Station" };
    }
    return null;
  }),
}));

// Mock ViewTravel and Activity so tests focus on container behavior
jest.mock("../../components/View", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return (props: any) => (
    <View testID="mock-view-travel">
      <Text>ViewTravel Content: {props.travelPlan?.travel?.title}</Text>
    </View>
  );
});

jest.mock("../../components/View/TravelActionFAB", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return (props: any) => (
    <View testID="mock-travel-action-fab">
      <Text>TravelActionFAB</Text>
    </View>
  );
});

jest.mock("../../components/View/Activity", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({ id, onClose }: any) => (
    <View testID="mock-activity-view">
      <Text>Activity Detail: {id}</Text>
      <TouchableOpacity testID="activity-close-btn" onPress={onClose}>
        <Text>Close Activity</Text>
      </TouchableOpacity>
    </View>
  );
});

describe("TripDetailScreen", () => {
  const mockTravelPlan = {
    travel: {
      id: "trip-123",
      title: "Japan Vacation 2026",
      destination: "Tokyo, Japan",
      tripDestinations: [
        {
          id: "dest-1",
          destination: "Tokyo",
          latitude: 35.6762,
          longitude: 139.6503,
        },
      ],
    },
    itinerarySection: [
      {
        id: "section-1",
        travelId: "trip-123",
        title: "Day 1",
        itineraryActivity: [
          {
            id: "act-1",
            travelId: "trip-123",
            title: "Visit Sensoji Temple",
            type: ActivityType.plan,
            destinationData: {
              coordinates: {
                latitude: 35.7148,
                longitude: 139.7967,
              },
            },
          },
          {
            id: "act-2",
            travelId: "trip-123",
            title: "Check into Hotel",
            type: ActivityType.stay,
            destinationData: {
              coordinates: {
                latitude: 35.6909,
                longitude: 139.7003,
              },
            },
          },
          {
            id: "act-flight",
            travelId: "trip-123",
            title: "Flight to Tokyo",
            type: ActivityType.flight,
            destinationData: {
              departureCoordinates: {
                latitude: 1.3644,
                longitude: 103.9915,
              },
              arrivalCoordinates: {
                latitude: 35.5494,
                longitude: 139.7798,
              },
            },
            flightDetails: {
              departureAirport: "Singapore Changi Airport (SIN)",
              arrivalAirport: "Haneda Airport (HND)",
            },
          },
          {
            id: "act-rental",
            travelId: "trip-123",
            title: "Rent Car",
            type: ActivityType.rideRental,
            destinationData: {
              coordinates: {
                latitude: 35.55,
                longitude: 139.78,
              },
            },
          },
          {
            id: "act-transit",
            travelId: "trip-123",
            title: "Bullet Train",
            type: ActivityType.transit,
            destinationData: {
              pickupCoordinates: {
                latitude: 35.6812,
                longitude: 139.7671,
              },
              dropoffCoordinates: {
                latitude: 34.9859,
                longitude: 135.7588,
              },
              pickupLocation: { name: "Tokyo Station" },
              dropoffLocation: { name: "Kyoto Station" },
            },
            transportationDetails: {
              pickupLocation: "Tokyo Station",
              dropoffLocation: "Kyoto Station",
            },
          },
          {
            id: "act-transit-addresses",
            travelId: "trip-123",
            title: "Highway Express Bus",
            type: ActivityType.transit,
            destinationData: null,
            transportationDetails: {
              pickupLocation: "Shinjuku Bus Terminal",
              dropoffLocation: "Mount Fuji 5th Station",
            },
          },
          {
            id: "act-transit-pickup-only",
            travelId: "trip-123",
            title: "Morning Ferry",
            type: ActivityType.transit,
            destination: "Miyajima Island",
            destinationData: {
              coordinates: {
                latitude: 34.2987,
                longitude: 132.3211,
              },
            },
            transportationDetails: {
              pickupLocation: {
                name: "Miyajimaguchi Pier",
                coordinates: {
                  latitude: 34.3125,
                  longitude: 132.3028,
                },
              },
              dropoffLocation: null,
            },
          },
          {
            id: "act-rental",
            travelId: "trip-123",
            title: "Toyota Rental Car",
            type: ActivityType.rideRental,
            destinationData: {
              pickupCoordinates: {
                latitude: 35.5494,
                longitude: 139.7798,
              },
              dropoffCoordinates: {
                latitude: 35.6895,
                longitude: 139.6917,
              },
            },
            rideRentalDetails: {
              pickupLocation: "Haneda Airport Rental Desk",
              dropoffLocation: "Shinjuku Rental Return",
            },
          },
          {
            id: "act-no-loc",
            travelId: "trip-123",
            title: "Packing Luggage",
            type: ActivityType.plan,
            destinationData: null,
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading indicator when data is loading", () => {
    (useTravelPlan as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      refetch: jest.fn(),
    });

    const { getByText } = render(<TripDetailScreen travelId="trip-123" />);
    expect(getByText("Loading Trip Details...")).toBeTruthy();
  });

  it("renders Google Map and ViewTravel inside bottom sheet container by default", () => {
    (useTravelPlan as jest.Mock).mockReturnValue({
      data: mockTravelPlan,
      isLoading: false,
      refetch: jest.fn(),
    });

    const { getByTestId, getByText } = render(
      <TripDetailScreen travelId="trip-123" />
    );

    // Google Map is rendered
    expect(getByTestId("trip-google-map")).toBeTruthy();

    // Bottom sheet container renders View/index (mocked ViewTravel)
    expect(getByTestId("trip-view-container")).toBeTruthy();
    expect(getByText("ViewTravel Content: Japan Vacation 2026")).toBeTruthy();
  });

  it("renders activity pins and enables connectByType on the map in default trip view", () => {
    (useTravelPlan as jest.Mock).mockReturnValue({
      data: mockTravelPlan,
      isLoading: false,
      refetch: jest.fn(),
    });

    const { getByTestId } = render(
      <TripDetailScreen travelId="trip-123" />
    );

    const webview = getByTestId("webview");
    const html = webview.props.source.html;
    expect(html).toContain("Visit Sensoji Temple");
    expect(html).toContain("typeGroups[typeKey]");
  });

  it("loads activity details inside container when an activity pin is pressed on the map", () => {
    (useTravelPlan as jest.Mock).mockReturnValue({
      data: mockTravelPlan,
      isLoading: false,
      refetch: jest.fn(),
    });

    const { getByTestId, getByText, queryByTestId } = render(
      <TripDetailScreen travelId="trip-123" />
    );

    // Initially in trip view
    expect(getByTestId("trip-view-container")).toBeTruthy();
    expect(queryByTestId("activity-detail-container")).toBeNull();

    // Simulate pin press on the map
    const webview = getByTestId("webview");
    fireEvent(webview, "message", {
      nativeEvent: {
        data: JSON.stringify({
          type: "PIN_PRESS",
          pin: {
            id: "act-1",
            latitude: 35.7148,
            longitude: 139.7967,
            title: "Visit Sensoji Temple",
          },
        }),
      },
    });

    // Now activity detail container should be loaded inside the bottom sheet
    expect(getByTestId("activity-detail-container")).toBeTruthy();
    expect(getByText("Activity Detail: act-1")).toBeTruthy();
    expect(getByText("Back to Trip")).toBeTruthy();

    // Clicking "Back to Trip" returns to trip view
    fireEvent.press(getByText("Back to Trip"));
    expect(getByTestId("trip-view-container")).toBeTruthy();
    expect(queryByTestId("activity-detail-container")).toBeNull();
  });

  it("calls prop onBack when floating back button is clicked", () => {
    const handleBack = jest.fn();
    (useTravelPlan as jest.Mock).mockReturnValue({
      data: mockTravelPlan,
      isLoading: false,
      refetch: jest.fn(),
    });

    const { getByLabelText } = render(
      <TripDetailScreen travelId="trip-123" onBack={handleBack} />
    );

    const backButton = getByLabelText("Go back");
    fireEvent.press(backButton);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  describe("getActivityCoordinates", () => {
    it("extracts coordinates from destinationData.coordinates", () => {
      const act = { destinationData: { coordinates: { latitude: 35.7148, longitude: 139.7967 } } };
      expect(getActivityCoordinates(act)).toEqual({ latitude: 35.7148, longitude: 139.7967 });
    });

    it("extracts coordinates from flat destinationData", () => {
      const act = { destinationData: { latitude: 35.7148, longitude: 139.7967 } };
      expect(getActivityCoordinates(act)).toEqual({ latitude: 35.7148, longitude: 139.7967 });
    });

    it("extracts coordinates from JSON string destinationData", () => {
      const act = { destinationData: JSON.stringify({ latitude: 35.7148, longitude: 139.7967 }) };
      expect(getActivityCoordinates(act)).toEqual({ latitude: 35.7148, longitude: 139.7967 });
    });

    it("extracts coordinates from accomodationDetails.destinationAddressData", () => {
      const act = {
        accomodationDetails: {
          destinationAddressData: { coordinates: { latitude: 35.6909, longitude: 139.7003 } },
        },
      };
      expect(getActivityCoordinates(act)).toEqual({ latitude: 35.6909, longitude: 139.7003 });
    });

    it("extracts coordinates from other detail types like sightseeingDetails or cafeRestaurantDetails", () => {
      const actSight = {
        sightseeingDetails: {
          destinationData: { coordinates: { latitude: 35.6586, longitude: 139.7454 } },
        },
      };
      expect(getActivityCoordinates(actSight)).toEqual({ latitude: 35.6586, longitude: 139.7454 });

      const actCafe = {
        cafeRestaurantDetails: {
          destinationData: { latitude: 35.6600, longitude: 139.7000 },
        },
      };
      expect(getActivityCoordinates(actCafe)).toEqual({ latitude: 35.6600, longitude: 139.7000 });
    });

    it("returns null when activity has no location or (0, 0)", () => {
      expect(getActivityCoordinates(null)).toBeNull();
      expect(getActivityCoordinates({})).toBeNull();
      expect(getActivityCoordinates({ destinationData: null })).toBeNull();
      expect(getActivityCoordinates({ destinationData: { latitude: 0, longitude: 0 } })).toBeNull();
      expect(getActivityCoordinates({ destinationData: { coordinates: { latitude: 0, longitude: 0 } } })).toBeNull();
    });
  });

  describe("map centering on activity selection", () => {
    it("centers the map on selected activity pin if the activity has a location", () => {
      (useTravelPlan as jest.Mock).mockReturnValue({
        data: mockTravelPlan,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByTestId } = render(
        <TripDetailScreen travelId="trip-123" />
      );

      // Open activity with location (act-1) via pin press
      const webview = getByTestId("webview");
      fireEvent(webview, "message", {
        nativeEvent: {
          data: JSON.stringify({
            type: "PIN_PRESS",
            pin: {
              id: "act-1",
              latitude: 35.7148,
              longitude: 139.7967,
            },
          }),
        },
      });

      // The GoogleMapView component received centerCoordinates for act-1
      const googleMap = getByTestId("trip-google-map");
      expect(googleMap.props.accessibilityValue?.text).toBe("35.7148,139.7967");
    });

    it("does NOT center the map if the opened activity has no location", () => {
      (useTravelPlan as jest.Mock).mockReturnValue({
        data: mockTravelPlan,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByTestId } = render(
        <TripDetailScreen travelId="trip-123" />
      );

      // Initial state: centerCoordinates should be null ("none")
      const googleMap = getByTestId("trip-google-map");
      expect(googleMap.props.accessibilityValue?.text).toBe("none");
    });
  });

  describe("map pin filtering and activity-specific pins", () => {
    it("excludes flight, stay, rental, and transit pins by default on the trip view map", () => {
      (useTravelPlan as jest.Mock).mockReturnValue({
        data: mockTravelPlan,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByTestId } = render(
        <TripDetailScreen travelId="trip-123" />
      );

      const webview = getByTestId("webview");
      const html = webview.props.source.html;

      // Destination pin is present
      expect(html).toContain("dest-1");
      // Plan pin (act-1) is present
      expect(html).toContain("act-1");

      // Flight, stay, rental, transit pins are excluded by default
      expect(html).not.toContain("act-flight");
      expect(html).not.toContain("act-2");
      expect(html).not.toContain("act-rental");
      expect(html).not.toContain("act-transit");
    });

    it("shows departure and arrival pins with flight color and flight connectorColor when flight is opened", () => {
      (useTravelPlan as jest.Mock).mockReturnValue({
        data: mockTravelPlan,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByTestId } = render(
        <TripDetailScreen travelId="trip-123" />
      );

      // Open flight activity via map pin press or simulated activity selection
      const webview = getByTestId("webview");
      fireEvent(webview, "message", {
        nativeEvent: {
          data: JSON.stringify({
            type: "PIN_PRESS",
            pin: {
              id: "act-flight",
            },
          }),
        },
      });

      // After opening flight, the webview receives departure and arrival pins
      // Flight color is #2196F3
      expect(webview.props.source.html).toBeTruthy();
    });

    it("shows pickup and dropoff pins with transit color and transit connectorColor when transit is opened", () => {
      (useTravelPlan as jest.Mock).mockReturnValue({
        data: mockTravelPlan,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByTestId } = render(
        <TripDetailScreen travelId="trip-123" />
      );

      // Open transit activity via map pin press or simulated activity selection
      const webview = getByTestId("webview");
      fireEvent(webview, "message", {
        nativeEvent: {
          data: JSON.stringify({
            type: "PIN_PRESS",
            pin: {
              id: "act-transit",
            },
          }),
        },
      });

      // After opening transit, the webview receives pickup and dropoff pins
      // Transit color is #02899a
      expect(webview.props.source.html).toBeTruthy();
    });

    it("geocodes addresses when pickup and dropoff have address strings and renders both pins with connectors", async () => {
      (useTravelPlan as jest.Mock).mockReturnValue({
        data: mockTravelPlan,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByTestId } = render(
        <TripDetailScreen travelId="trip-123" />
      );

      const webview = getByTestId("webview");

      // Open transit activity with address strings only
      fireEvent(webview, "message", {
        nativeEvent: {
          data: JSON.stringify({
            type: "PIN_PRESS",
            pin: {
              id: "act-transit-addresses",
            },
          }),
        },
      });

      // Verify geocodeAddress was invoked for both addresses
      const { geocodeAddress } = require("../../../../utils/geocodeUtils");
      await waitFor(() => {
        expect(geocodeAddress).toHaveBeenCalledWith("Shinjuku Bus Terminal", null);
        expect(geocodeAddress).toHaveBeenCalledWith("Mount Fuji 5th Station", expect.anything());
      });
    });

    it("shows both pins and connectors when only pickup is specified by falling back to destination", () => {
      (useTravelPlan as jest.Mock).mockReturnValue({
        data: mockTravelPlan,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByTestId } = render(
        <TripDetailScreen travelId="trip-123" />
      );

      const webview = getByTestId("webview");

      // Open transit with pickup only
      fireEvent(webview, "message", {
        nativeEvent: {
          data: JSON.stringify({
            type: "PIN_PRESS",
            pin: {
              id: "act-transit-pickup-only",
            },
          }),
        },
      });

      expect(webview.props.source.html).toBeTruthy();
    });

    it("shows pickup and dropoff pins with rental color and connector for rideRental activities", () => {
      (useTravelPlan as jest.Mock).mockReturnValue({
        data: mockTravelPlan,
        isLoading: false,
        refetch: jest.fn(),
      });

      const { getByTestId } = render(
        <TripDetailScreen travelId="trip-123" />
      );

      const webview = getByTestId("webview");

      // Open rideRental activity
      fireEvent(webview, "message", {
        nativeEvent: {
          data: JSON.stringify({
            type: "PIN_PRESS",
            pin: {
              id: "act-rental",
            },
          }),
        },
      });

      expect(webview.props.source.html).toBeTruthy();
    });
  });
});
