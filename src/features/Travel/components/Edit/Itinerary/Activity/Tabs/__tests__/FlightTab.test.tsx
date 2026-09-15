import React from "react";
import { Formik } from "formik";
import { fireEvent } from "@testing-library/react-native";
import FlightTab from "../FlightTab";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

describe("FlightTab Component", () => {
  const defaultValues = {
    flightDetails: {
      departureAirport: "JFK - John F. Kennedy International Airport",
      arrivalAirport: "LHR - London Heathrow Airport",
      departureDate: new Date("2026-10-01T08:00:00Z"),
      arrivalDate: new Date("2026-10-01T20:00:00Z"),
      airline: "British Airways",
      flightNumber: "BA178",
      gate: "B22",
      terminal: "7",
      seatNumber: "14A",
      bookingReference: "BA-998877",
    },
  };

  const defaultProps = {
    values: defaultValues,
    handleChange: jest.fn((field) => jest.fn()),
    handleBlur: jest.fn((field) => jest.fn()),
    setFieldValue: jest.fn(),
    openFlightModal: jest.fn(),
    setShowFlightDatePickerFor: jest.fn(),
    formatFlightDateTime: jest.fn((date) => "Thu, Oct 1, 08:00"),
    handleFlightSelect: jest.fn(),
    onOpenAirportLookup: jest.fn(),
    showArrivalPrefillNotice: false,
  };

  const renderComponent = (overrides: any = {}) => {
    const values = { ...defaultValues, ...(overrides.values || {}) };
    const props = { ...defaultProps, ...overrides, values };

    return renderWithProviders(
      <Formik initialValues={values} onSubmit={jest.fn()}>
        <FlightTab {...props} />
      </Formik>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders departure and arrival airports with parsed codes", () => {
    const { getByText } = renderComponent();

    expect(getByText("JFK")).toBeTruthy();
    expect(getByText("LHR")).toBeTruthy();
    expect(getByText("John F. Kennedy International Airport")).toBeTruthy();
    expect(getByText("London Heathrow Airport")).toBeTruthy();
  });

  it("triggers airport lookup callbacks for departure and arrival", () => {
    const onOpenAirportLookup = jest.fn();
    const { getByLabelText } = renderComponent({ onOpenAirportLookup });

    const depButton = getByLabelText(/^departure airport:/i);
    fireEvent.press(depButton);
    expect(onOpenAirportLookup).toHaveBeenCalledWith("departure");

    const arrButton = getByLabelText(/^arrival airport:/i);
    fireEvent.press(arrButton);
    expect(onOpenAirportLookup).toHaveBeenCalledWith("arrival");
  });

  it("swaps departure and arrival airports when swap button is pressed", () => {
    const setFieldValue = jest.fn();
    const { getByLabelText } = renderComponent({ setFieldValue });

    const swapButton = getByLabelText("Swap departure and arrival airports");
    fireEvent.press(swapButton);

    expect(setFieldValue).toHaveBeenCalledWith(
      "flightDetails.departureAirport",
      "LHR - London Heathrow Airport"
    );
    expect(setFieldValue).toHaveBeenCalledWith(
      "flightDetails.arrivalAirport",
      "JFK - John F. Kennedy International Airport"
    );
  });

  it("opens date picker when departure or arrival date fields are pressed", () => {
    const setShowFlightDatePickerFor = jest.fn();
    const { getByLabelText } = renderComponent({ setShowFlightDatePickerFor });

    const depDateInput = getByLabelText("Open selector for Departure Date & Time");
    fireEvent.press(depDateInput);
    expect(setShowFlightDatePickerFor).toHaveBeenCalledWith("departureDate");

    const arrDateInput = getByLabelText("Open selector for Arrival Date & Time");
    fireEvent.press(arrDateInput);
    expect(setShowFlightDatePickerFor).toHaveBeenCalledWith("arrivalDate");
  });

  it("renders booking details inputs and allows editing", () => {
    const handleChangeText = jest.fn();
    const handleChange = jest.fn().mockReturnValue(handleChangeText);
    const { getByDisplayValue } = renderComponent({ handleChange });

    expect(getByDisplayValue("British Airways")).toBeTruthy();
    expect(getByDisplayValue("BA178")).toBeTruthy();
    expect(getByDisplayValue("B22")).toBeTruthy();
    expect(getByDisplayValue("7")).toBeTruthy();
    expect(getByDisplayValue("14A")).toBeTruthy();
    expect(getByDisplayValue("BA-998877")).toBeTruthy();

    fireEvent.changeText(getByDisplayValue("BA178"), "BA179");
    expect(handleChange).toHaveBeenCalledWith("flightDetails.flightNumber");
    expect(handleChangeText).toHaveBeenCalledWith("BA179");
  });

  it("displays arrival prefill notice when showArrivalPrefillNotice is true", () => {
    const { getByText } = renderComponent({ showArrivalPrefillNotice: true });
    expect(
      getByText(/Please check the actual date of your flight arrival/i)
    ).toBeTruthy();
  });
});
