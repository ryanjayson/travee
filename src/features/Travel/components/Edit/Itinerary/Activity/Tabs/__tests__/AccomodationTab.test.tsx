import React from "react";
import { Formik } from "formik";
import { fireEvent } from "@testing-library/react-native";
import { Linking } from "react-native";
import AccomodationTab from "../AccomodationTab";
import { ActivityType } from "@/types/enums";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

// Mock useTravelPlan hook used by DateTime
jest.mock("@/features/Travel/hooks/useTravel", () => ({
  useTravelPlan: jest.fn().mockReturnValue({
    data: null,
    isLoading: false,
  }),
}));

describe("AccomodationTab Component", () => {
  const defaultValues = {
    type: ActivityType.stay,
    startDate: "2026-10-01",
    startTime: "15:00",
    endDate: "2026-10-05",
    endTime: "11:00",
    accomodationDetails: {
      subType: "Hotel",
      websiteAddress: "https://grandhotel.com",
      bookingReference: "HOTEL-9988",
      contactName: "Concierge Desk",
      contactNumber: "+1234567890",
      emailAddress: "frontdesk@grandhotel.com",
    },
  };

  const defaultProps = {
    values: defaultValues,
    handleChange: jest.fn((field) => jest.fn()),
    handleBlur: jest.fn((field) => jest.fn()),
    setFieldValue: jest.fn(),
    setShowAccomodationDatePickerFor: jest.fn(),
    formatAccomodationDateTime: jest.fn(),
    onOpenPoiModal: jest.fn(),
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
        <AccomodationTab {...props} />
      </Formik>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Stay Details header and Check-in / Check-out dates", () => {
    const { getByText } = renderComponent();

    expect(getByText(/stay details/i)).toBeTruthy();
    expect(getByText(/check-in date & time/i)).toBeTruthy();
    expect(getByText("2026-10-01")).toBeTruthy();
    expect(getByText("2026-10-05")).toBeTruthy();
  });

  it("renders accommodation subtypes and toggles selection", () => {
    const setFieldValue = jest.fn();
    const { getByText } = renderComponent({ setFieldValue });

    const resortOption = getByText("Resort");
    expect(resortOption).toBeTruthy();

    fireEvent.press(resortOption);
    expect(setFieldValue).toHaveBeenCalledWith("accomodationDetails.subType", "Resort");

    const hotelOption = getByText("Hotel");
    fireEvent.press(hotelOption);
    expect(setFieldValue).toHaveBeenCalledWith("accomodationDetails.subType", null);
  });

  it("renders booking details inputs and responds to text changes", () => {
    const handleChangeText = jest.fn();
    const handleChange = jest.fn().mockReturnValue(handleChangeText);
    const { getByDisplayValue } = renderComponent({ handleChange });

    expect(getByDisplayValue("https://grandhotel.com")).toBeTruthy();
    expect(getByDisplayValue("HOTEL-9988")).toBeTruthy();

    fireEvent.changeText(getByDisplayValue("HOTEL-9988"), "HOTEL-5555");
    expect(handleChange).toHaveBeenCalledWith("accomodationDetails.bookingReference");
    expect(handleChangeText).toHaveBeenCalledWith("HOTEL-5555");
  });

  it("renders contact info inputs", () => {
    const { getByDisplayValue } = renderComponent();

    expect(getByDisplayValue("Concierge Desk")).toBeTruthy();
    expect(getByDisplayValue("+1234567890")).toBeTruthy();
    expect(getByDisplayValue("frontdesk@grandhotel.com")).toBeTruthy();
  });

  it("opens website URL when open icon button is pressed", () => {
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(true as any);
    const { getByText } = renderComponent();

    const openBtn = getByText("open");
    fireEvent.press(openBtn);

    expect(openURLSpy).toHaveBeenCalledWith("https://grandhotel.com");
    openURLSpy.mockRestore();
  });
});
