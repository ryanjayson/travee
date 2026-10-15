import React from "react";
import { fireEvent, waitFor, act } from "@testing-library/react-native";
import SectionModal from "../Modal";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockSubmit = jest.fn();

jest.mock("../index", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({
    itinerarySection,
    onSubmitRef,
    onSubmittingChange,
    hideSubmitButton,
  }: any) => {
    React.useEffect(() => {
      if (onSubmitRef) {
        onSubmitRef.current = mockSubmit;
      }
    }, [onSubmitRef]);

    return (
      <View testID="mock-edit-section">
        <Text testID="section-id-text">
          {itinerarySection?.id || "no-id"}
        </Text>
        <Text testID="hide-submit-btn-text">
          {hideSubmitButton ? "hidden" : "visible"}
        </Text>
        <TouchableOpacity
          testID="trigger-submitting"
          onPress={() => onSubmittingChange?.(true)}
        >
          <Text>Submitting</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

const mockDeleteMutation = jest.fn();
jest.mock("@/features/Travel/hooks/useSection", () => ({
  useDeleteSectionMutation: () => ({
    mutate: mockDeleteMutation,
    isPending: false,
  }),
}));

const mockConfirm = jest.fn().mockResolvedValue(true);
jest.mock("@/context/ConfirmContext", () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

describe("SectionModal Component", () => {
  const mockOnClose = jest.fn();
  const mockOnSaveSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when visible is false", () => {
    const { queryByText } = renderWithProviders(
      <SectionModal
        visible={false}
        onClose={mockOnClose}
        itinerarySection={null}
        travelId="travel-1"
      />
    );

    expect(queryByText("Add Section")).toBeNull();
    expect(queryByText("Edit Section")).toBeNull();
  });

  it("renders Add Section mode with close button on left and Create button on right", () => {
    const { getByText, getByLabelText } = renderWithProviders(
      <SectionModal
        visible={true}
        onClose={mockOnClose}
        itinerarySection={null}
        travelId="travel-1"
        onSaveSuccess={mockOnSaveSuccess}
      />
    );

    // Title and close button
    expect(getByText("Add Section")).toBeTruthy();
    const closeBtn = getByLabelText("Close modal");
    expect(closeBtn).toBeTruthy();

    // Create button on right
    const createBtn = getByLabelText("Create section");
    expect(createBtn).toBeTruthy();
    expect(getByText("Create")).toBeTruthy();

    // Verify EditSection has hidden bottom button
    expect(getByText("hidden")).toBeTruthy();

    // Press Create button to trigger form submit
    fireEvent.press(createBtn);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("renders Edit Section mode with Update button, Delete button, and Add button", () => {
    const existingSection: any = {
      id: "sec-123",
      travelId: "travel-1",
      title: "Day 1",
    };

    const { getByText, getByLabelText } = renderWithProviders(
      <SectionModal
        visible={true}
        onClose={mockOnClose}
        itinerarySection={existingSection}
        travelId="travel-1"
      />
    );

    expect(getByText("Edit Section")).toBeTruthy();
    expect(getByText("sec-123")).toBeTruthy();

    // Close button beside title on left
    expect(getByLabelText("Close modal")).toBeTruthy();

    // Update button on right
    const updateBtn = getByLabelText("Update section");
    expect(updateBtn).toBeTruthy();
    expect(getByText("Update")).toBeTruthy();

    // Delete button on right
    expect(getByLabelText("Delete section")).toBeTruthy();

    // Press Update button to trigger form submit
    fireEvent.press(updateBtn);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });


  it("dismisses modal when close button on left is pressed", async () => {
    const { getByLabelText } = renderWithProviders(
      <SectionModal
        visible={true}
        onClose={mockOnClose}
        itinerarySection={null}
        travelId="travel-1"
      />
    );

    fireEvent.press(getByLabelText("Close modal"));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("dismisses modal when backdrop is pressed", async () => {
    const { getByLabelText } = renderWithProviders(
      <SectionModal
        visible={true}
        onClose={mockOnClose}
        itinerarySection={null}
        travelId="travel-1"
      />
    );

    fireEvent.press(getByLabelText("Dismiss section modal"));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles deleting section after user confirmation", async () => {
    const existingSection: any = {
      id: "sec-123",
      travelId: "travel-1",
      title: "Day 1",
    };

    const { getByLabelText } = renderWithProviders(
      <SectionModal
        visible={true}
        onClose={mockOnClose}
        itinerarySection={existingSection}
        travelId="travel-1"
      />
    );

    fireEvent.press(getByLabelText("Delete section"));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockDeleteMutation).toHaveBeenCalledWith({ sectionId: "sec-123" });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
