import React from "react";
import { Formik } from "formik";
import { fireEvent } from "@testing-library/react-native";
import RideRentalTab from "../RideRentalTab";
import { ActivityType } from "@/types/enums";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

// Mock useTravelPlan hook used by DateTime
jest.mock("@/features/Travel/hooks/useTravel", () => ({
  useTravelPlan: jest.fn().mockReturnValue({
    data: null,
    isLoading: false,
  }),
}));

describe("RideRentalTab Component", () => {
  const defaultValues = {
    type: ActivityType.rideRental,
    startDate: "2026-10-01",
    startTime: "10:00",
    endDate: "2026-10-05",
    endTime: "10:00",
    rideRentalDetails: {
      vehicleType: "Car",
      vehicleModel: "Toyota RAV4",
      pickupLocation: { name: "Hertz Airport Office", city: "Tokyo", country: "Japan" },
      dropoffLocation: { name: "Hertz Shinjuku Office", city: "Tokyo", country: "Japan" },
      bookingReference: "RENT-4455",
      websiteAddress: "https://hertz.com",
      contactName: "Hertz Customer Service",
      contactNumber: "+81312345678",
      emailAddress: "tokyo@hertz.com",
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
        <RideRentalTab {...props} />
      </Formik>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Rental Details header, pickup/dropoff locations and rental period", () => {
    const { getByText } = renderComponent();

    expect(getByText(/rental details/i)).toBeTruthy();
    expect(getByText("Hertz Airport Office")).toBeTruthy();
    expect(getByText("Hertz Shinjuku Office")).toBeTruthy();
    expect(getByText(/rental period/i)).toBeTruthy();
  });

  it("triggers Google search for pickup and dropoff locations", () => {
    const onOpenGoogleSearch = jest.fn();
    const { getByLabelText } = renderComponent({ onOpenGoogleSearch });

    const pickupCard = getByLabelText(/pick-up location:/i);
    fireEvent.press(pickupCard);
    expect(onOpenGoogleSearch).toHaveBeenCalledWith("pickupLocation");

    const dropoffCard = getByLabelText(/drop-off location:/i);
    fireEvent.press(dropoffCard);
    expect(onOpenGoogleSearch).toHaveBeenCalledWith("dropoffLocation");
  });

  it("swaps pickup and dropoff locations when swap button is pressed", () => {
    const setFieldValue = jest.fn();
    const { getByLabelText } = renderComponent({ setFieldValue });

    const swapBtn = getByLabelText("Swap pick-up and drop-off locations");
    fireEvent.press(swapBtn);

    expect(setFieldValue).toHaveBeenCalledWith(
      "rideRentalDetails.pickupLocation",
      defaultValues.rideRentalDetails.dropoffLocation
    );
    expect(setFieldValue).toHaveBeenCalledWith(
      "rideRentalDetails.dropoffLocation",
      defaultValues.rideRentalDetails.pickupLocation
    );
  });

  it("copies pickup location to dropoff location when 'Same with Pickup Location' is pressed", () => {
    const setFieldValue = jest.fn();
    const { getByLabelText } = renderComponent({ setFieldValue });

    const sameBtn = getByLabelText("Same with Pickup Location");
    fireEvent.press(sameBtn);

    expect(setFieldValue).toHaveBeenCalledWith(
      "rideRentalDetails.dropoffLocation",
      defaultValues.rideRentalDetails.pickupLocation
    );
  });

  it("renders vehicle type chips and allows changing selection", () => {
    const setFieldValue = jest.fn();
    const { getByText } = renderComponent({ setFieldValue });

    const motorcycleChip = getByText("Motorcycle");
    expect(motorcycleChip).toBeTruthy();

    fireEvent.press(motorcycleChip);
    expect(setFieldValue).toHaveBeenCalledWith("rideRentalDetails.vehicleType", "Motorcycle");
  });

  it("renders vehicle details, booking reference and contact fields with text inputs", () => {
    const handleChangeText = jest.fn();
    const handleChange = jest.fn().mockReturnValue(handleChangeText);
    const { getByDisplayValue } = renderComponent({ handleChange });

    expect(getByDisplayValue("Toyota RAV4")).toBeTruthy();
    expect(getByDisplayValue("RENT-4455")).toBeTruthy();
    expect(getByDisplayValue("Hertz Customer Service")).toBeTruthy();
    expect(getByDisplayValue("+81312345678")).toBeTruthy();
    expect(getByDisplayValue("tokyo@hertz.com")).toBeTruthy();

    fireEvent.changeText(getByDisplayValue("Toyota RAV4"), "Honda CR-V");
    expect(handleChange).toHaveBeenCalledWith("rideRentalDetails.vehicleModel");
    expect(handleChangeText).toHaveBeenCalledWith("Honda CR-V");
  });
});
