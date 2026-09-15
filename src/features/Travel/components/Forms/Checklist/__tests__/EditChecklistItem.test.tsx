import React from "react";
import { fireEvent, waitFor, act } from "@testing-library/react-native";
import EditChecklistItem from "../index";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockSaveItemMutation = jest.fn();

jest.mock("@/features/Travel/hooks/useChecklist", () => ({
  useSaveChecklistItemMutation: () => ({
    mutateAsync: mockSaveItemMutation,
    isPending: false,
  }),
}));

jest.mock("@/features/Auth/hooks/AuthContext", () => ({
  useAuth: () => ({
    userToken: "user-123",
  }),
}));

describe("EditChecklistItem Component", () => {
  const defaultProps = {
    travelId: "travel-1",
    checklistItem: null,
    activities: [],
    onClose: jest.fn(),
    onOpenNewGroupModal: jest.fn(),
    selectedContext: null,
    onSelectContext: jest.fn(),
    onOpenContextModal: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders new checklist item form with default state", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <EditChecklistItem {...defaultProps} />
    );

    expect(getByPlaceholderText("e.g. Pack Passport")).toBeTruthy();
    expect(getByPlaceholderText("Add a description")).toBeTruthy();
    expect(getByText("Add another item after saved")).toBeTruthy();
    expect(getByText("Add Item")).toBeTruthy();
  });

  it("hydrates existing checklist item data in edit mode", () => {
    const existingItem: any = {
      id: "item-1",
      travelId: "travel-1",
      title: "Buy Travel Insurance",
      description: "Coverage for medical & baggage",
      isDone: false,
    };

    const { getByDisplayValue, getByText, queryByText } = renderWithProviders(
      <EditChecklistItem {...defaultProps} checklistItem={existingItem} />
    );

    expect(getByDisplayValue("Buy Travel Insurance")).toBeTruthy();
    expect(getByDisplayValue("Coverage for medical & baggage")).toBeTruthy();
    expect(getByText("Save Changes")).toBeTruthy();
    // "Keep adding" checkbox should not appear when editing existing item
    expect(queryByText("Add another item after saved")).toBeNull();
  });

  it("submits new item and keeps form open when 'keepAdding' is checked", async () => {
    mockSaveItemMutation.mockResolvedValue({ id: "item-new-1" });

    const { getByPlaceholderText, getByText, getByDisplayValue } = renderWithProviders(
      <EditChecklistItem {...defaultProps} />
    );

    const titleInput = getByPlaceholderText("e.g. Pack Passport");
    fireEvent.changeText(titleInput, "Book Airport Taxi");

    const descInput = getByPlaceholderText("Add a description");
    fireEvent.changeText(descInput, "Morning 6 AM pickup");

    const submitBtn = getByText("Add Item");
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(mockSaveItemMutation).toHaveBeenCalled();
      const payload = mockSaveItemMutation.mock.calls[0][0];
      expect(payload.title).toBe("Book Airport Taxi");
      expect(payload.description).toBe("Morning 6 AM pickup");
      expect(payload.travelId).toBe("travel-1");
      expect(payload.isDone).toBe(false);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  it("submits item and closes form when 'keepAdding' is unchecked or in edit mode", async () => {
    mockSaveItemMutation.mockResolvedValue({ id: "item-new-2" });

    const { getByPlaceholderText, getByText, getByLabelText } = renderWithProviders(
      <EditChecklistItem {...defaultProps} />
    );

    // Uncheck "keep adding"
    const keepAddingCheckbox = getByLabelText("Keep adding checklist items");
    fireEvent.press(keepAddingCheckbox);

    const titleInput = getByPlaceholderText("e.g. Pack Passport");
    fireEvent.changeText(titleInput, "Exchange Yen Currency");

    const submitBtn = getByText("Add Item");
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(mockSaveItemMutation).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it("assigns item to selected group context", async () => {
    mockSaveItemMutation.mockResolvedValue({ id: "item-new-3" });

    const groupContext: any = {
      id: "group-docs",
      label: "Documents",
      type: "group",
    };

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <EditChecklistItem {...defaultProps} selectedContext={groupContext} />
    );

    expect(getByText("Documents")).toBeTruthy();

    const titleInput = getByPlaceholderText("e.g. Pack Passport");
    fireEvent.changeText(titleInput, "Print Boarding Pass");

    const submitBtn = getByText("Add Item");
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(mockSaveItemMutation).toHaveBeenCalled();
      const payload = mockSaveItemMutation.mock.calls[0][0];
      expect(payload.checklistGroupId).toBe("group-docs");
      expect(payload.activityId).toBeUndefined();
    });
  });

  it("triggers context modal when assignment selector is pressed", () => {
    const { getByText } = renderWithProviders(
      <EditChecklistItem {...defaultProps} />
    );

    const selector = getByText("Assign to group or activity");
    fireEvent.press(selector);

    expect(defaultProps.onOpenContextModal).toHaveBeenCalled();
  });
});
