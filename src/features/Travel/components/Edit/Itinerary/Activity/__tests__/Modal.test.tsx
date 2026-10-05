import React from "react";
import { fireEvent } from "@testing-library/react-native";
import ActivityModal from "../Modal";
import { TripPlanType } from "@/types/enums";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("../../Activity", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");
  return ({
    itineraryActivity,
    onDirtyChange,
    onSwitchToAddMode,
  }: any) => (
    <View testID="mock-edit-activity">
      <Text testID="activity-id-text">{itineraryActivity?.id || "no-id"}</Text>
      <Text testID="activity-title-text">{itineraryActivity?.title || "no-title"}</Text>
      <TouchableOpacity
        testID="make-dirty-btn"
        onPress={() => onDirtyChange?.(true)}
      >
        <Text>Make Dirty</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="child-switch-add-btn"
        onPress={() => onSwitchToAddMode?.()}
      >
        <Text>Switch Add</Text>
      </TouchableOpacity>
    </View>
  );
});

jest.mock("@/features/Travel/hooks/useActivity", () => ({
  useItineraryActivity: () => ({
    data: null,
    refetch: jest.fn(),
  }),
}));

jest.mock("@/features/Travel/hooks/useTravel", () => ({
  useTravelPlan: () => ({
    data: {
      itinerarySection: [],
    },
  }),
}));

jest.mock("@/context/ConfirmContext", () => ({
  useConfirm: () => ({
    confirm: jest.fn().mockResolvedValue(true),
  }),
}));

describe("ActivityModal - handleAddNewActivityPress & Delete Button Placement", () => {
  const existingActivity = {
    id: "act-456",
    title: "Visit Arc de Triomphe",
    type: TripPlanType.activity,
    sectionId: "sec-1",
  } as any;

  it("renders in Edit mode without header delete button, and shows Add icon", () => {
    const { getByText, queryByLabelText, getByLabelText } = renderWithProviders(
      <ActivityModal
        visible={true}
        onClose={jest.fn()}
        itineraryActivity={existingActivity}
        travelId="travel-1"
      />
    );

    expect(getByText("Edit Activity")).toBeTruthy();
    expect(getByText("Save")).toBeTruthy();
    expect(getByText("act-456")).toBeTruthy();

    // Delete icon button should NOT exist in header
    expect(queryByLabelText("Delete activity")).toBeNull();

    // Header add icon should exist
    expect(getByLabelText("Switch to add activity")).toBeTruthy();
  });

  it("switches to Add mode when handleAddNewActivityPress is triggered", () => {
    const { getByText, getByLabelText, queryByLabelText } = renderWithProviders(
      <ActivityModal
        visible={true}
        onClose={jest.fn()}
        itineraryActivity={existingActivity}
        travelId="travel-1"
      />
    );

    // Press '+' in header
    fireEvent.press(getByLabelText("Switch to add activity"));

    // Modal title should update to Add Activity
    expect(getByText("Add Activity")).toBeTruthy();
    expect(getByText("Add")).toBeTruthy();

    // Child component should receive null/no-id activity
    expect(getByText("no-id")).toBeTruthy();

    // Header add icon should disappear in add mode
    expect(queryByLabelText("Switch to add activity")).toBeNull();
  });

  it("shows unsaved changes dialog if form is dirty when clicking add new", () => {
    const { getByText, getByLabelText, getByTestId } = renderWithProviders(
      <ActivityModal
        visible={true}
        onClose={jest.fn()}
        itineraryActivity={existingActivity}
        travelId="travel-1"
      />
    );

    // Make form dirty
    fireEvent.press(getByTestId("make-dirty-btn"));

    // Press '+' in header
    fireEvent.press(getByLabelText("Switch to add activity"));

    // Unsaved changes dialog should show
    expect(getByText("Unsaved Changes")).toBeTruthy();
    expect(
      getByText(
        "You have unsaved changes. Do you want to save them before adding a new activity?"
      )
    ).toBeTruthy();

    // Press Discard
    fireEvent.press(getByLabelText("Discard changes"));

    // Should now switch to Add Activity mode
    expect(getByText("Add Activity")).toBeTruthy();
    expect(getByText("no-id")).toBeTruthy();
  });
});
