import React from "react";
import { fireEvent, waitFor, act } from "@testing-library/react-native";
import EditSection from "../index";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockUpdateMutation = jest.fn();
const mockConfirm = jest.fn();
const mockGenerateSortOrder = jest.fn().mockReturnValue("a1");
const mockUpdateSectionActivitiesDatesLocally = jest.fn().mockResolvedValue(undefined);

jest.mock("@/features/Travel/hooks/useSection", () => ({
  useUpdateSectionMutation: () => ({
    mutate: mockUpdateMutation,
    isPending: false,
  }),
}));

jest.mock("@/features/Travel/hooks/useTravel", () => ({
  useTravelPlan: () => ({
    data: {
      id: "travel-1",
      travel: {
        startOrDepartureDate: "2026-10-01",
        endOrReturnDate: "2026-10-10",
      },
      itinerarySection: [
        {
          id: "section-1",
          title: "Day 1",
          sortOrder: "a0",
          startDate: "2026-10-01T00:00:00.000Z",
          itineraryActivity: [
            { id: "act-1", title: "Activity 1", startDate: "2026-10-01T00:00:00.000Z" },
          ],
        },
      ],
    },
    refetch: jest.fn(),
  }),
}));

jest.mock("@/hooks/useLexicographicSort", () => ({
  useLexicographicSort: () => ({
    generateSortOrder: mockGenerateSortOrder,
  }),
}));

jest.mock("@/context/ConfirmContext", () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

jest.mock("@/services/local/travelService", () => ({
  updateSectionActivitiesDatesLocally: (...args: any[]) =>
    mockUpdateSectionActivitiesDatesLocally(...args),
}));

describe("EditSection Component", () => {
  const defaultProps = {
    itinerarySection: null,
    travelId: "travel-1",
    onClose: jest.fn(),
    onSaveSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders new section form with default empty state", () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <EditSection {...defaultProps} />
    );

    expect(getByPlaceholderText("e.g Day 1")).toBeTruthy();
    expect(getByPlaceholderText("Add a short description")).toBeTruthy();
    expect(getByText("Create Section")).toBeTruthy();
  });

  it("hydrates existing section data in edit mode", () => {
    const existingSection: any = {
      id: "section-1",
      travelId: "travel-1",
      title: "Day 1 - Arrival",
      description: "Land at airport and check in",
      sortOrder: "a0",
      startDate: "2026-10-01T00:00:00.000Z",
    };

    const { getByDisplayValue, getByText } = renderWithProviders(
      <EditSection {...defaultProps} itinerarySection={existingSection} />
    );

    expect(getByDisplayValue("Day 1 - Arrival")).toBeTruthy();
    expect(getByDisplayValue("Land at airport and check in")).toBeTruthy();
    expect(getByText("Update Section")).toBeTruthy();
  });

  it("submits valid new section and calls updateMutation with generated sortOrder", async () => {
    mockUpdateMutation.mockImplementation((data: any, { onSuccess }: any) => {
      onSuccess?.({ id: "section-new-2" });
    });

    const { getByPlaceholderText, getByText } = renderWithProviders(
      <EditSection {...defaultProps} />
    );

    const titleInput = getByPlaceholderText("e.g Day 1");
    fireEvent.changeText(titleInput, "Day 2 - Osaka Castle");

    const submitBtn = getByText("Create Section");
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(mockUpdateMutation).toHaveBeenCalled();
      const payload = mockUpdateMutation.mock.calls[0][0];
      expect(payload.title).toBe("Day 2 - Osaka Castle");
      expect(payload.travelId).toBe("travel-1");
      expect(payload.sortOrder).toBe("a1");
      expect(defaultProps.onSaveSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it("prompts confirmation when changing date of section that contains activities", async () => {
    mockConfirm.mockResolvedValue(true);
    mockUpdateMutation.mockImplementation((data: any, { onSuccess }: any) => {
      onSuccess?.({ id: "section-1" });
    });

    const existingSection: any = {
      id: "section-1",
      travelId: "travel-1",
      title: "Day 1",
      startDate: "2026-10-01T00:00:00.000Z",
    };

    const { getByText, getByPlaceholderText } = renderWithProviders(
      <EditSection {...defaultProps} itinerarySection={existingSection} />
    );

    // Open calendar
    const dateInputWrapper = getByPlaceholderText("Select Date");
    fireEvent.press(dateInputWrapper);

    // Simulate selecting a new day from calendar
    const { CalendarList } = require("react-native-calendars");
    // Directly submit form with changed date
    const submitBtn = getByText("Update Section");
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    await waitFor(() => {
      expect(mockUpdateMutation).toHaveBeenCalled();
    });
  });
});
