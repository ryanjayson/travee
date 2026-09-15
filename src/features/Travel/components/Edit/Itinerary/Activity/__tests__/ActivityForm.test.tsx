import React from "react";
import { fireEvent, waitFor, act } from "@testing-library/react-native";
import EditActivity from "../index";
import { ActivityType, ActivityPlanType } from "@/types/enums";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockMutateAsync = jest.fn();
const mockDeleteActivityMutation = jest.fn();
const mockShowToast = jest.fn();
const mockConfirm = jest.fn();
const mockRefetchTravelPlan = jest.fn();

jest.mock("@/features/Travel/hooks/useActivity", () => ({
  useUpdateActivityMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useDeleteActivityMutation: () => ({
    mutate: mockDeleteActivityMutation,
    mutateAsync: jest.fn(),
  }),
  useItineraryActivity: () => ({
    data: null,
    isLoading: false,
  }),
}));

jest.mock("@/features/Travel/hooks/useTravel", () => ({
  useTravelPlan: () => ({
    data: {
      id: "travel-1",
      startDate: "2026-10-01",
      endDate: "2026-10-10",
      itinerarySection: [
        {
          id: "section-1",
          title: "Day 1",
          itineraryActivity: [],
        },
      ],
    },
    refetch: jest.fn(),
  }),
}));

jest.mock("@/features/Travel/hooks/useChecklist", () => ({
  useChecklistItems: () => ({
    data: [],
    refetch: jest.fn(),
  }),
  useSaveChecklistItemMutation: () => ({ mutateAsync: jest.fn() }),
  useDeleteChecklistItemMutation: () => ({ mutateAsync: jest.fn() }),
  useToggleChecklistItemMutation: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock("@/services/local/travelService", () => ({
  fetchLocalItineraryActivity: jest.fn().mockResolvedValue({
    id: "activity-new-1",
    title: "Louvre Museum Visit",
  }),
}));

jest.mock("@/features/Travel/hooks/useSection", () => ({
  useUpdateSectionMutation: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock("@/context/TravelContext", () => ({
  useTravelContext: () => ({
    refetchTravelPlan: mockRefetchTravelPlan,
  }),
}));

jest.mock("@/context/ToastContext", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

jest.mock("@/context/ConfirmContext", () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

jest.mock("@/features/Auth/hooks/AuthContext", () => ({
  useAuth: () => ({
    userToken: "test-user-id",
  }),
}));

jest.mock("@/hooks/useLexicographicSort", () => ({
  useLexicographicSort: () => ({
    generateSortOrder: jest.fn().mockReturnValue("a0"),
  }),
}));

describe("ActivityForm (EditActivity) Integration", () => {
  const defaultProps = {
    itineraryActivity: null,
    initialType: ActivityType.plan,
    onClose: jest.fn(),
    onOpenSectionModal: jest.fn(),
    onOpenPrimaryTypeModal: jest.fn(),
    itinerarySectionId: "section-1",
    travelId: "travel-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ id: "activity-new-1" });
  });

  it("renders new activity form with Plan tab by default and requires title", async () => {
    const onSubmitRef = { current: null as (() => void) | null };
    const { getByPlaceholderText, findByText } = renderWithProviders(
      <EditActivity {...defaultProps} onSubmitRef={onSubmitRef} />
    );

    expect(getByPlaceholderText("e.g. Museum Visit")).toBeTruthy();

    // Trigger submit with empty title
    await act(async () => {
      onSubmitRef.current?.();
    });

    const errorMsg = await findByText(/activity title is required/i);
    expect(errorMsg).toBeTruthy();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it("submits valid Plan activity with correctly structured payload", async () => {
    const onSubmitRef = { current: null as (() => void) | null };
    const { getByPlaceholderText } = renderWithProviders(
      <EditActivity {...defaultProps} onSubmitRef={onSubmitRef} />
    );

    const titleInput = getByPlaceholderText("e.g. Museum Visit");
    fireEvent.changeText(titleInput, "Louvre Museum Visit");

    await act(async () => {
      onSubmitRef.current?.();
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
      const payload = mockMutateAsync.mock.calls[0][0];
      expect(payload.title).toBe("Louvre Museum Visit");
      expect(payload.type).toBe(ActivityType.plan);
      expect(payload.travelId).toBe("travel-1");
      expect(payload.sectionId).toBe("section-1");
    });
  });

  it("hydrates existing activity fields in edit mode", () => {
    const existingActivity: any = {
      id: "activity-existing-1",
      sectionId: "section-1",
      travelId: "travel-1",
      title: "Flight to Tokyo",
      description: "Non-stop flight on ANA",
      type: ActivityType.flight,
      flightDetails: {
        departureAirport: "LAX - Los Angeles International Airport",
        arrivalAirport: "HND - Tokyo Haneda Airport",
        flightNumber: "NH105",
        airline: "ANA",
        gate: "152",
        terminal: "B",
        seatNumber: "22A",
        bookingReference: "ANA-8899",
      },
    };

    const { getByDisplayValue, getByText } = renderWithProviders(
      <EditActivity
        {...defaultProps}
        itineraryActivity={existingActivity}
        initialType={ActivityType.flight}
      />
    );

    expect(getByDisplayValue("Flight to Tokyo")).toBeTruthy();
    expect(getByDisplayValue("ANA")).toBeTruthy();
    expect(getByDisplayValue("NH105")).toBeTruthy();
    expect(getByText("LAX")).toBeTruthy();
    expect(getByText("HND")).toBeTruthy();
  });

  it("renders Stay tab when initialType is stay", () => {
    const { getByText } = renderWithProviders(
      <EditActivity {...defaultProps} initialType={ActivityType.stay} />
    );

    expect(getByText(/stay details/i)).toBeTruthy();
    expect(getByText(/check-in date & time/i)).toBeTruthy();
  });

  it("renders Rental tab when initialType is rideRental", () => {
    const { getByText } = renderWithProviders(
      <EditActivity {...defaultProps} initialType={ActivityType.rideRental} />
    );

    expect(getByText(/rental details/i)).toBeTruthy();
    expect(getByText(/pick-up & drop-off location/i)).toBeTruthy();
  });

  it("renders Transit tab when initialType is transit", () => {
    const { getByText } = renderWithProviders(
      <EditActivity {...defaultProps} initialType={ActivityType.transit} />
    );

    expect(getByText(/transit details/i)).toBeTruthy();
  });
});
