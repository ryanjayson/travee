import React from "react";
import { Formik } from "formik";
import { fireEvent } from "@testing-library/react-native";
import TransportationTab from "../TransportationTab";
import { ActivityType } from "@/types/enums";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

// Mock useTravelPlan hook used by DateTime
jest.mock("@/features/Travel/hooks/useTravel", () => ({
  useTravelPlan: jest.fn().mockReturnValue({
    data: null,
    isLoading: false,
  }),
}));

describe("TransportationTab Component", () => {
  const defaultValues = {
    type: ActivityType.transit,
    startDate: "2026-10-01",
    startTime: "09:00",
    endDate: "2026-10-01",
    endTime: "12:00",
    transportationDetails: {
      mode: "Train",
      pickupLocation: { name: "Tokyo Station", city: "Tokyo", country: "Japan" },
      dropoffLocation: { name: "Kyoto Station", city: "Kyoto", country: "Japan" },
      seatOrVehicleNumber: "Car 5, Seat 12A",
      bookingReference: "SHINKANSEN-88",
      websiteAddress: "https://jr-central.co.jp",
      contactNumber: "+815020161603",
    },
  };

  const defaultProps = {
    values: defaultValues,
    handleChange: jest.fn((field) => jest.fn()),
    handleBlur: jest.fn((field) => jest.fn()),
    setFieldValue: jest.fn(),
    onOpenGoogleSearch: jest.fn(),
    onPressDate: jest.fn(),
    onPressTime: jest.fn(),
    onClearDate: jest.fn(),
    onClearTime: jest.fn(),
    onPressEndDate: jest.fn(),
    onPressEndTime: jest.fn(),
    onClearEndDate: jest.fn(),
    onClearEndTime: jest.fn(),
  };

  const renderComponent = (overrides: any = {}) => {
    const values = { ...defaultValues, ...(overrides.values || {}) };
    const props = { ...defaultProps, ...overrides, values };

    return renderWithProviders(
      <Formik initialValues={values} onSubmit={jest.fn()}>
        <TransportationTab {...props} />
      </Formik>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Transit Details header, locations, and departure date/time", () => {
    const { getByText } = renderComponent();

    expect(getByText(/transit details/i)).toBeTruthy();
    expect(getByText("Tokyo Station")).toBeTruthy();
    expect(getByText("Kyoto Station")).toBeTruthy();
    expect(getByText(/departure & arrival date & time/i)).toBeTruthy();
  });

  it("triggers Google search when departure or arrival location card is pressed", () => {
    const onOpenGoogleSearch = jest.fn();
    const { getByLabelText } = renderComponent({ onOpenGoogleSearch });

    const pickupCard = getByLabelText(/pickup location:/i);
    fireEvent.press(pickupCard);
    expect(onOpenGoogleSearch).toHaveBeenCalledWith("pickupLocation");

    const dropoffCard = getByLabelText(/drop-off location:/i);
    fireEvent.press(dropoffCard);
    expect(onOpenGoogleSearch).toHaveBeenCalledWith("dropoffLocation");
  });

  it("swaps pickup and drop-off locations when swap button is pressed", () => {
    const setFieldValue = jest.fn();
    const { getByLabelText } = renderComponent({ setFieldValue });

    const swapBtn = getByLabelText("Swap pickup and drop-off locations");
    fireEvent.press(swapBtn);

    expect(setFieldValue).toHaveBeenCalledWith(
      "transportationDetails.pickupLocation",
      defaultValues.transportationDetails.dropoffLocation
    );
    expect(setFieldValue).toHaveBeenCalledWith(
      "transportationDetails.dropoffLocation",
      defaultValues.transportationDetails.pickupLocation
    );
  });

  it("renders transit modes and allows selection toggle", () => {
    const setFieldValue = jest.fn();
    const { getByText } = renderComponent({ setFieldValue });

    const ferryOption = getByText("Ferry");
    expect(ferryOption).toBeTruthy();

    fireEvent.press(ferryOption);
    expect(setFieldValue).toHaveBeenCalledWith("transportationDetails.mode", "Ferry");
  });

  it("renders transit detail inputs and responds to text changes", () => {
    const handleChangeText = jest.fn();
    const handleChange = jest.fn().mockReturnValue(handleChangeText);
    const { getByDisplayValue } = renderComponent({ handleChange });

    expect(getByDisplayValue("Car 5, Seat 12A")).toBeTruthy();
    expect(getByDisplayValue("SHINKANSEN-88")).toBeTruthy();
    expect(getByDisplayValue("https://jr-central.co.jp")).toBeTruthy();
    expect(getByDisplayValue("+815020161603")).toBeTruthy();

    fireEvent.changeText(getByDisplayValue("Car 5, Seat 12A"), "Car 7, Seat 3B");
    expect(handleChange).toHaveBeenCalledWith("transportationDetails.seatOrVehicleNumber");
    expect(handleChangeText).toHaveBeenCalledWith("Car 7, Seat 3B");
  });
});
