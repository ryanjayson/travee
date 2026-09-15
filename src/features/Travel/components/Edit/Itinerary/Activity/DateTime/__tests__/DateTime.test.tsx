import React from "react";
import { Formik } from "formik";
import { fireEvent } from "@testing-library/react-native";
import DateTime from "../index";
import { ActivityType } from "@/types/enums";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

// Mock useTravelPlan hook
jest.mock("@/features/Travel/hooks/useTravel", () => ({
  useTravelPlan: jest.fn().mockReturnValue({
    data: null,
    isLoading: false,
  }),
}));

describe("DateTime Component", () => {
  const defaultProps = {
    activityType: ActivityType.plan,
    startDate: "2026-10-01",
    startTime: "10:00",
    endDate: null,
    endTime: "",
    onPressDate: jest.fn(),
    onPressTime: jest.fn(),
    onClearDate: jest.fn(),
    onClearTime: jest.fn(),
    onPressEndDate: jest.fn(),
    onPressEndTime: jest.fn(),
    onClearEndDate: jest.fn(),
    onClearEndTime: jest.fn(),
  };

  const renderComponent = (props = {}) => {
    const mergedProps = { ...defaultProps, ...props };
    return renderWithProviders(
      <Formik
        initialValues={{
          type: mergedProps.activityType,
          startDate: mergedProps.startDate,
          startTime: mergedProps.startTime,
          endDate: mergedProps.endDate,
          endTime: mergedProps.endTime,
        }}
        onSubmit={jest.fn()}
      >
        <DateTime {...mergedProps} />
      </Formik>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders start date and start time correctly", () => {
    const { getByText, getByLabelText } = renderComponent();

    expect(getByText("2026-10-01")).toBeTruthy();
    expect(getByText("10:00")).toBeTruthy();
    expect(getByLabelText("Select date")).toBeTruthy();
    expect(getByLabelText("Select time")).toBeTruthy();
  });

  it("calls onPressDate and onPressTime when date/time buttons are clicked", () => {
    const onPressDate = jest.fn();
    const onPressTime = jest.fn();
    const { getByLabelText } = renderComponent({ onPressDate, onPressTime });

    fireEvent.press(getByLabelText("Select date"));
    expect(onPressDate).toHaveBeenCalledTimes(1);

    fireEvent.press(getByLabelText("Select time"));
    expect(onPressTime).toHaveBeenCalledTimes(1);
  });

  it("calls onClearDate and onClearTime when clear icons are pressed", () => {
    const onClearDate = jest.fn();
    const onClearTime = jest.fn();
    const { getByLabelText } = renderComponent({ onClearDate, onClearTime });

    fireEvent.press(getByLabelText("Clear date"));
    expect(onClearDate).toHaveBeenCalledTimes(1);

    fireEvent.press(getByLabelText("Clear time"));
    expect(onClearTime).toHaveBeenCalledTimes(1);
  });

  it("shows end date inputs automatically for inherently ranged activities (stay)", () => {
    const { getByText } = renderComponent({
      activityType: ActivityType.stay,
      startDate: "2026-10-01",
      endDate: "2026-10-05",
    });

    expect(getByText("Check-In Date & Time")).toBeTruthy();
    expect(getByText("2026-10-05")).toBeTruthy();
  });

  it("reveals end date & time when 'Add End Date & Time' is clicked", () => {
    const { getByText, queryByLabelText, getByLabelText } = renderComponent({
      activityType: ActivityType.plan,
      endDate: null,
    });

    const addBtn = getByText(/add end date & time/i);
    expect(addBtn).toBeTruthy();

    fireEvent.press(addBtn);

    // End date selection button should now be visible
    expect(getByLabelText("Select end date")).toBeTruthy();
  });
});
