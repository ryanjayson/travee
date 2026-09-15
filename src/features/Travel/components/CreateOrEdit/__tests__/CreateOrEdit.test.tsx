import React from "react";
import { fireEvent, waitFor, act } from "@testing-library/react-native";
import CreateOrEdit, { CreateOrEditRef } from "../index";
import { TravelStatus, TripType } from "@/types/enums";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockMutate = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@/features/Travel/hooks/useTravel", () => ({
  useUpdateTravel: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useTravels: () => ({
    data: [],
  }),
}));

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

// Mock TripDestinationSearchBox to isolate from Google Places API
jest.mock("../TripDestinationSearchBox", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ onSelect, placeholder, disabled }: any) =>
      React.createElement(
        TouchableOpacity,
        {
          testID: "mock-destination-search-box",
          accessibilityLabel: "Select mock destination",
          disabled,
          onPress: () =>
            onSelect({
              destination: "Tokyo, Japan",
              destinationData: {
                coordinates: { latitude: 35.6762, longitude: 139.6503 },
              },
            }),
        },
        React.createElement(Text, null, placeholder || "Search place, city, or country")
      ),
  };
});

describe("CreateOrEdit (Trip Form) Component", () => {
  const defaultProps = {
    onClose: jest.fn(),
    onStatusChange: jest.fn(),
    mode: "create" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders create trip form with empty state and destination search", () => {
    const { getByText, getByTestId } = renderWithProviders(
      <CreateOrEdit {...defaultProps} />
    );

    expect(getByText(/where to go\?/i)).toBeTruthy();
    expect(getByText(/describe your trip/i)).toBeTruthy();
    expect(getByTestId("mock-destination-search-box")).toBeTruthy();
    expect(getByText("Create Trip")).toBeTruthy();
  });

  it("fails validation when submitting with too short title and no destination", async () => {
    const ref = React.createRef<CreateOrEditRef>();
    const { findByText } = renderWithProviders(
      <CreateOrEdit {...defaultProps} ref={ref} />
    );

    await act(async () => {
      ref.current?.submit();
    });

    const titleError = await findByText(/trip title is required/i);
    expect(titleError).toBeTruthy();
    const destError = await findByText(/add your destination/i);
    expect(destError).toBeTruthy();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("allows selecting a destination and removes it", async () => {
    const { getByTestId, getAllByText, queryByText, findByLabelText } = renderWithProviders(
      <CreateOrEdit {...defaultProps} />
    );

    const searchBox = getByTestId("mock-destination-search-box");
    fireEvent.press(searchBox);

    expect(getByTestId("mock-destination-search-box")).toBeTruthy();
    expect(getAllByText("Tokyo, Japan").length).toBeGreaterThan(0);

    const removeBtn = await findByLabelText("Remove Tokyo, Japan");
    fireEvent.press(removeBtn);

    expect(queryByText("Tokyo, Japan")).toBeNull();
  });

  it("selects and toggles trip purpose/type", () => {
    const { getByLabelText } = renderWithProviders(
      <CreateOrEdit {...defaultProps} />
    );

    const vacationBtn = getByLabelText("Select Vacation trip type");
    fireEvent.press(vacationBtn);

    const clearBtn = getByLabelText("Clear travel type");
    expect(clearBtn).toBeTruthy();

    fireEvent.press(clearBtn);
  });

  it("hydrates existing trip data in edit mode", () => {
    const mockTripData: any = {
      id: "travel-123",
      title: "Euro Trip 2026",
      description: "Visiting Paris and Rome",
      destination: "Paris, France",
      tripDestinations: [
        {
          destination: "Paris, France",
          destinationData: { coordinates: { latitude: 48.8566, longitude: 2.3522 } },
        },
      ],
      startOrDepartureDate: "2026-10-01T00:00:00.000Z",
      endOrReturnDate: "2026-10-10T00:00:00.000Z",
      budget: "3000",
      notes: "Remember travel insurance",
      type: TripType.vacation,
    };

    const { getByDisplayValue, getAllByText, getByText } = renderWithProviders(
      <CreateOrEdit {...defaultProps} mode="edit" tripData={mockTripData} />
    );

    expect(getByDisplayValue("Euro Trip 2026")).toBeTruthy();
    expect(getByDisplayValue("3000")).toBeTruthy();
    expect(getAllByText("Paris, France").length).toBeGreaterThan(0);
    expect(getByText("Update Changes")).toBeTruthy();
  });

  it("submits valid create form and triggers createTravel mutation", async () => {
    const onCreated = jest.fn();
    mockMutate.mockImplementation(({ data }: any, { onSuccess }: any) => {
      onSuccess?.({ id: "new-travel-456" });
    });

    const { getByTestId, getByDisplayValue, getByText } = renderWithProviders(
      <CreateOrEdit {...defaultProps} onCreated={onCreated} />
    );

    // 1. Add destination (auto-suggests "Tokyo Trip")
    const searchBox = getByTestId("mock-destination-search-box");
    fireEvent.press(searchBox);

    // 2. Title is set to "Tokyo Trip"
    expect(getByDisplayValue("Tokyo Trip")).toBeTruthy();

    // 3. Submit
    const submitBtn = getByText("Create Trip");
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
      const payload = mockMutate.mock.calls[0][0].data;
      expect(payload.title).toBe("Tokyo Trip");
      expect(payload.destination).toBe("Tokyo, Japan");
      expect(payload.isOffline).toBe(true);
      expect(onCreated).toHaveBeenCalledWith("new-travel-456");
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it("submits form via imperative ref", async () => {
    const ref = React.createRef<CreateOrEditRef>();
    mockMutate.mockImplementation(({ data }: any, { onSuccess }: any) => {
      onSuccess?.({ id: "new-travel-789" });
    });

    const { getByTestId, getByDisplayValue } = renderWithProviders(
      <CreateOrEdit {...defaultProps} ref={ref} />
    );

    const searchBox = getByTestId("mock-destination-search-box");
    fireEvent.press(searchBox);

    expect(getByDisplayValue("Tokyo Trip")).toBeTruthy();

    await act(async () => {
      ref.current?.submit();
    });

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});
