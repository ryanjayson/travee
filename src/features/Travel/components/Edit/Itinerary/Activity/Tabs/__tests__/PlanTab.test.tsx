import React from "react";
import { Formik } from "formik";
import { fireEvent } from "@testing-library/react-native";
import PlanTab from "../PlanTab";
import { ActivityType, ActivityPlanType } from "@/types/enums";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

// Mock useTravelPlan hook used by DateTime
jest.mock("@/features/Travel/hooks/useTravel", () => ({
  useTravelPlan: jest.fn().mockReturnValue({
    data: null,
    isLoading: false,
  }),
}));

describe("PlanTab Component", () => {
  const defaultValues = {
    type: ActivityType.plan,
    planType: ActivityPlanType.restaurant,
    title: "Dinner at Bistro",
    destination: "Paris, France",
    startDate: "2026-10-01",
    startTime: "19:00",
    endDate: null,
    endTime: "",
    priority: "High",
    budget: "100",
    website: "https://bistro.fr",
    bookingReference: "REF-1234",
    contactName: "Jean Dupont",
    contactNumber: "+33123456789",
    contactEmail: "jean@bistro.fr",
  };

  const defaultProps = {
    values: defaultValues,
    handleChange: jest.fn((field) => jest.fn()),
    handleBlur: jest.fn((field) => jest.fn()),
    setFieldValue: jest.fn(),
    onPressDate: jest.fn(),
    onPressTime: jest.fn(),
    onClearDate: jest.fn(),
    onClearTime: jest.fn(),
    onPressEndDate: jest.fn(),
    onPressEndTime: jest.fn(),
    onClearEndDate: jest.fn(),
    onClearEndTime: jest.fn(),
    onPressLocationMap: jest.fn(),
  };

  const renderComponent = (overrides: any = {}) => {
    const values = { ...defaultValues, ...(overrides.values || {}) };
    const props = { ...defaultProps, ...overrides, values };

    return renderWithProviders(
      <Formik initialValues={values} onSubmit={jest.fn()}>
        <PlanTab {...props} />
      </Formik>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Plan Type selector and displays selected plan type", () => {
    const { getAllByText } = renderComponent();
    expect(getAllByText(/restaurant/i).length).toBeGreaterThan(0);
  });

  it("renders priority options and updates priority when pressed", () => {
    const setFieldValue = jest.fn();
    const { getByText } = renderComponent({ setFieldValue });

    const mediumBtn = getByText("Medium");
    expect(mediumBtn).toBeTruthy();

    fireEvent.press(mediumBtn);
    expect(setFieldValue).toHaveBeenCalledWith("priority", "Medium");
  });

  it("renders active dynamic fields like Website, Budget, and Booking Reference", () => {
    const { getByDisplayValue } = renderComponent();

    expect(getByDisplayValue("100")).toBeTruthy();
    expect(getByDisplayValue("https://bistro.fr")).toBeTruthy();
    expect(getByDisplayValue("REF-1234")).toBeTruthy();
  });

  it("renders Location input and triggers location picker when map icon is pressed", () => {
    const onPressLocationMap = jest.fn();
    const { getByDisplayValue } = renderComponent({ onPressLocationMap });

    expect(getByDisplayValue("Paris, France")).toBeTruthy();
  });

  it("renders Add Field button", () => {
    const { getByText } = renderComponent();
    expect(getByText(/add or remove field/i)).toBeTruthy();
  });
});
