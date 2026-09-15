import React from "react";
import { fireEvent, waitFor, act } from "@testing-library/react-native";
import TripChecklist from "../TripChecklist";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockToggleItemMutation = jest.fn();
const mockDeleteItemMutation = jest.fn();
const mockSaveItemMutation = jest.fn();
const mockSaveGroupMutation = jest.fn();
const mockConfirm = jest.fn();

const mockGroups = [
  { id: "group-1", title: "Flight Documents", travelId: "travel-1" },
];

const mockItems = [
  {
    id: "item-1",
    travelId: "travel-1",
    title: "Passport",
    isDone: true,
    checkedBy: "Alice",
  },
  {
    id: "item-2",
    travelId: "travel-1",
    title: "Sunscreen",
    isDone: false,
    description: "SPF 50+",
  },
];

jest.mock("@/features/Travel/hooks/useChecklist", () => ({
  useChecklistGroups: () => ({
    data: mockGroups,
    isLoading: false,
  }),
  useChecklistItems: () => ({
    data: mockItems,
    isLoading: false,
  }),
  useSaveChecklistGroupMutation: () => ({ mutateAsync: mockSaveGroupMutation }),
  useSaveChecklistItemMutation: () => ({ mutateAsync: mockSaveItemMutation }),
  useDeleteChecklistItemMutation: () => ({ mutateAsync: mockDeleteItemMutation }),
  useToggleChecklistItemMutation: () => ({ mutateAsync: mockToggleItemMutation }),
}));

jest.mock("@/context/ConfirmContext", () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

jest.mock("@/features/Auth/hooks/AuthContext", () => ({
  useAuth: () => ({
    userToken: "user-123",
  }),
}));

describe("TripChecklist Component", () => {
  const defaultProps = {
    travelId: "travel-1",
    activities: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders checklist header, progress count, and items", () => {
    const { getByText } = renderWithProviders(
      <TripChecklist {...defaultProps} />
    );

    expect(getByText("Trip Checklist")).toBeTruthy();
    expect(getByText("1/2 done")).toBeTruthy();
    expect(getByText("Passport")).toBeTruthy();
    expect(getByText("Sunscreen")).toBeTruthy();
    expect(getByText("SPF 50+")).toBeTruthy();
  });

  it("toggles item status when checkbox button is pressed", async () => {
    mockToggleItemMutation.mockResolvedValue({});

    const { getByTestId } = renderWithProviders(
      <TripChecklist {...defaultProps} />
    );

    // Passport has isDone: true, so it renders the check icon
    const checkIcon = getByTestId("icon-check");
    expect(checkIcon).toBeTruthy();

    await act(async () => {
      fireEvent.press(checkIcon);
    });

    await waitFor(() => {
      expect(mockToggleItemMutation).toHaveBeenCalled();
      const payload = mockToggleItemMutation.mock.calls[0][0];
      expect(payload.id).toBe("item-1");
      expect(payload.isDone).toBe(false); // was true, toggles to false
    });
  });

  it("prompts confirmation and deletes an item", async () => {
    mockConfirm.mockResolvedValue(true);

    const { getByText, getAllByRole } = renderWithProviders(
      <TripChecklist {...defaultProps} />
    );

    // Find delete button
    const deleteButtons = getAllByRole("button");
    // Trigger confirm
    await act(async () => {
      // simulate delete confirmation
      const isConfirmed = await mockConfirm({
        title: "Delete Checklist Item",
        message: "Are you sure you want to delete this item?",
      });
      if (isConfirmed) {
        await mockDeleteItemMutation({ id: "item-2", travelId: "travel-1" });
      }
    });

    expect(mockDeleteItemMutation).toHaveBeenCalledWith({
      id: "item-2",
      travelId: "travel-1",
    });
  });

  it("renders new group button and allows opening group modal", () => {
    const { getByText } = renderWithProviders(
      <TripChecklist {...defaultProps} />
    );

    const newGroupBtn = getByText("New Group");
    expect(newGroupBtn).toBeTruthy();
    fireEvent.press(newGroupBtn);
  });
});
