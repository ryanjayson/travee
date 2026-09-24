import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import ChecklistTab from "../ChecklistTab";
import ViewChecklistTab from "../../../../../View/Activity/Tabs/ChecklistTab";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockMutateToggle = jest.fn();
const mockMutateDelete = jest.fn();
const mockOpenChecklistModal = jest.fn();
const mockConfirm = jest.fn().mockResolvedValue(true);

jest.mock("@/features/Travel/hooks/useChecklist", () => ({
  useChecklistItems: jest.fn().mockReturnValue({
    data: [
      {
        id: "check-1",
        activityId: "act-1",
        travelId: "trip-1",
        title: "Pack sunscreen",
        description: "SPF 50+",
        isDone: false,
      },
      {
        id: "check-2",
        activityId: "act-1",
        travelId: "trip-1",
        title: "Bring passport",
        isDone: true,
      },
    ],
    refetch: jest.fn(),
    isLoading: false,
  }),
  useChecklistItemsByActivity: jest.fn().mockReturnValue({
    data: [],
    refetch: jest.fn(),
    isLoading: false,
  }),
  useDeleteChecklistItemMutation: () => ({
    mutateAsync: mockMutateDelete,
  }),
  useToggleChecklistItemMutation: () => ({
    mutateAsync: mockMutateToggle,
  }),
}));

jest.mock("@/context/TravelContext", () => ({
  useTravelContext: () => ({
    openChecklistModal: mockOpenChecklistModal,
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

describe("ChecklistTab Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockActivity = {
    id: "act-1",
    travelId: "trip-1",
    title: "Beach Day",
  } as any;

  it("renders checklist items for the given activity in Edit tab", () => {
    const { getByText, getByLabelText } = renderWithProviders(
      <ChecklistTab
        activityId="act-1"
        travelId="trip-1"
        itineraryActivity={mockActivity}
        isScrollable={false}
      />
    );

    expect(getByText("Add To-Do item")).toBeTruthy();
    expect(getByText("Pack sunscreen")).toBeTruthy();
    expect(getByText("SPF 50+")).toBeTruthy();
    expect(getByText("Bring passport")).toBeTruthy();
  });

  it("handles toggling checklist item status", async () => {
    const { getByLabelText } = renderWithProviders(
      <ChecklistTab
        activityId="act-1"
        travelId="trip-1"
        itineraryActivity={mockActivity}
      />
    );

    const toggleButton = getByLabelText('Mark Pack sunscreen as complete');
    fireEvent.press(toggleButton);

    await waitFor(() => {
      expect(mockMutateToggle).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "check-1",
          isDone: true,
          travelId: "trip-1",
          activityId: "act-1",
        })
      );
    });
  });

  it("handles opening the modal to add a new checklist item", () => {
    const { getByText } = renderWithProviders(
      <ChecklistTab
        activityId="act-1"
        travelId="trip-1"
        itineraryActivity={mockActivity}
      />
    );

    const addButton = getByText("Add To-Do item");
    fireEvent.press(addButton);

    expect(mockOpenChecklistModal).toHaveBeenCalledWith(
      null,
      [mockActivity],
      "trip-1"
    );
  });

  it("handles removing a checklist item with confirmation", async () => {
    const { getAllByLabelText } = renderWithProviders(
      <ChecklistTab
        activityId="act-1"
        travelId="trip-1"
        itineraryActivity={mockActivity}
      />
    );

    const removeButtons = getAllByLabelText("Remove checklist item");
    fireEvent.press(removeButtons[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockMutateDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "check-1",
          travelId: "trip-1",
          activityId: "act-1",
        })
      );
    });
  });

  it("renders correctly in View Activity tab", () => {
    const { getByText } = renderWithProviders(
      <ViewChecklistTab
        activityId="act-1"
        itineraryActivity={mockActivity}
      />
    );

    expect(getByText("Add To-Do item")).toBeTruthy();
    expect(getByText("Pack sunscreen")).toBeTruthy();
  });
});
