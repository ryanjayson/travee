import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import OnboardingModal, {
  TRAVELER_TYPES,
  COUNTRIES,
  validateNickname,
} from "../OnboardingModal";
import { useUserProfile, useSaveProfile } from "../../hooks/useUserProfile";
import { seedTestNotifications } from "../../services/local/notificationService";
import { seedDemoTravelData } from "../../services/local/travelService";

jest.mock("../../hooks/useUserProfile", () => ({
  useUserProfile: jest.fn(),
  useSaveProfile: jest.fn(),
}));

jest.mock("../../services/local/notificationService", () => ({
  seedTestNotifications: jest.fn(),
}));

jest.mock("../../services/local/travelService", () => ({
  seedDemoTravelData: jest.fn(),
}));

jest.mock("../../services/local/securityService", () => ({
  isBiometricsSupported: jest.fn(async () => ({ hasHardware: true, isEnrolled: true })),
  authenticateWithBiometrics: jest.fn(async () => true),
  setPin: jest.fn(async () => {}),
  setPinEnabled: jest.fn(async () => {}),
  setBiometricsEnabled: jest.fn(async () => {}),
  clearPin: jest.fn(async () => {}),
}));

const mockSetAnalyticsOptOut = jest.fn();
jest.mock("../../services/analytics/posthogService", () => ({
  setAnalyticsOptOut: jest.fn((...args) => mockSetAnalyticsOptOut(...args)),
  isAnalyticsOptedOut: jest.fn(() => false),
}));

jest.mock("../../services/errorLogger", () => ({
  logger: {
    service: jest.fn(),
  },
}));

describe("OnboardingModal", () => {
  const mockOnClose = jest.fn();
  const mockSaveProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUserProfile as jest.Mock).mockReturnValue({
      data: { id: "user-1", nickname: "OldNick" },
    });
    (useSaveProfile as jest.Mock).mockReturnValue({
      mutate: mockSaveProfile,
    });
  });

  describe("Pure Helpers and Constants", () => {
    it("exports TRAVELER_TYPES with expected structure", () => {
      expect(TRAVELER_TYPES.length).toBeGreaterThan(0);
      expect(TRAVELER_TYPES[0]).toHaveProperty("id");
      expect(TRAVELER_TYPES[0]).toHaveProperty("label");
      expect(TRAVELER_TYPES[0]).toHaveProperty("emoji");
    });

    it("exports COUNTRIES list", () => {
      expect(COUNTRIES).toContain("Philippines");
      expect(COUNTRIES).toContain("United States");
      expect(COUNTRIES).toContain("Australia");
    });

    it("validates nicknames accurately", () => {
      expect(validateNickname("")).toBeNull();
      expect(validateNickname("abc")).toBe(
        "Nickname must be at least 5 characters"
      );
      expect(validateNickname("validNick")).toBeNull();
      expect(validateNickname("has space")).toBe("Spaces are not allowed");
      expect(validateNickname("a".repeat(21))).toBe(
        "Nickname cannot exceed 20 characters"
      );
    });
  });

  describe("Component Rendering and Step Flow", () => {
    it("renders welcome screen on step 1 when visible", async () => {
      const { getByText, getByLabelText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("travelled")).toBeTruthy();
        expect(getByText("Get Started")).toBeTruthy();
        expect(getByLabelText("Close onboarding")).toBeTruthy();
      });
    });

    it("closes modal when close button is pressed on step 1", async () => {
      const { getByLabelText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByLabelText("Close onboarding")).toBeTruthy();
      });

      fireEvent.press(getByLabelText("Close onboarding"));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("requires accepting Terms and Conditions on step 2 before proceeding", async () => {
      const { getByText, getByLabelText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // Step 1 -> Step 2
      fireEvent.press(getByText("Get Started"));
      expect(getByText("Terms and Conditions")).toBeTruthy();
      expect(
        getByText("You must accept the terms and conditions to proceed.")
      ).toBeTruthy();

      const nextBtn = getByText("Next");
      // Tapping Next while not accepted does not advance
      fireEvent.press(nextBtn);
      expect(getByText("Terms and Conditions")).toBeTruthy();

      // Check Terms checkbox
      const termsCheckbox = getByLabelText(
        "I have read and agree to the Terms and Conditions"
      );
      expect(termsCheckbox.props.accessibilityState.checked).toBe(false);

      fireEvent.press(termsCheckbox);
      expect(termsCheckbox.props.accessibilityState.checked).toBe(true);

      // Back button works on step 2
      const backBtn = getByLabelText("Go back");
      fireEvent.press(backBtn);
      expect(getByText("travelled")).toBeTruthy();
    });

    it("has Privacy & Analytics options set to true by default on step 3 and allows toggling", async () => {
      const { getByText, getByLabelText, queryByText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // Advance to Step 2 (Terms)
      fireEvent.press(getByText("Get Started"));
      const termsCheckbox = getByLabelText(
        "I have read and agree to the Terms and Conditions"
      );
      fireEvent.press(termsCheckbox);
      fireEvent.press(getByText("Next"));

      // Now on Step 3 (Privacy & Analytics)
      expect(getByText("Privacy & Analytics")).toBeTruthy();

      // Verify privacy policy checkbox is set to true by default
      const privacyCheckbox = getByLabelText(
        "I have read and agree to the Privacy Policy"
      );
      expect(privacyCheckbox.props.accessibilityState.checked).toBe(true);

      // Verify Share Usage Analytics switch is set to true by default
      const analyticsSwitch = getByLabelText("Share Usage Analytics");
      expect(analyticsSwitch.props.value).toBe(true);

      // Toggle analytics switch to false
      fireEvent(analyticsSwitch, "valueChange", false);
      expect(analyticsSwitch.props.value).toBe(false);

      // Toggle back to true
      fireEvent(analyticsSwitch, "valueChange", true);
      expect(analyticsSwitch.props.value).toBe(true);

      // Next button is enabled by default because privacy policy is pre-accepted
      const nextBtn = getByText("Next");

      // Unchecking privacy checkbox disables Next button and shows prompt
      fireEvent.press(privacyCheckbox);
      expect(privacyCheckbox.props.accessibilityState.checked).toBe(false);
      expect(
        getByText("You must accept the privacy policy to proceed.")
      ).toBeTruthy();

      // Pressing Next while unchecked does not advance
      fireEvent.press(nextBtn);
      expect(getByText("Privacy & Analytics")).toBeTruthy();

      // Re-checking privacy checkbox enables Next button
      fireEvent.press(privacyCheckbox);
      expect(privacyCheckbox.props.accessibilityState.checked).toBe(true);
      expect(
        queryByText("You must accept the privacy policy to proceed.")
      ).toBeNull();

      // Advancing goes to Step 4 (Nickname)
      fireEvent.press(nextBtn);
      expect(getByText("Choose your nickname")).toBeTruthy();
    });

    it("navigates through steps and validates nickname on step 4", async () => {
      const { getByText, getByPlaceholderText, getByLabelText, queryByText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // 1. Welcome -> 2. Terms
      fireEvent.press(getByText("Get Started"));
      fireEvent.press(
        getByLabelText("I have read and agree to the Terms and Conditions")
      );
      fireEvent.press(getByText("Next"));

      // 2. Terms -> 3. Privacy & Analytics (pre-checked)
      expect(getByText("Privacy & Analytics")).toBeTruthy();
      fireEvent.press(getByText("Next"));

      // 3. Privacy -> 4. Nickname
      expect(getByText("Choose your nickname")).toBeTruthy();

      // Next is disabled when nickname is empty
      const nextBtn = getByText("Next");
      fireEvent.press(nextBtn);
      expect(getByText("Choose your nickname")).toBeTruthy();

      // Enter invalid nickname with spaces
      const input = getByPlaceholderText("nickname");
      fireEvent.changeText(input, "bad name");
      expect(getByText("Spaces are not allowed")).toBeTruthy();

      // Enter valid nickname
      fireEvent.changeText(input, "traveler99");
      expect(queryByText("Spaces are not allowed")).toBeNull();

      // Step 4 -> Step 5 (Travel Style)
      fireEvent.press(nextBtn);
      expect(getByText("What's your travel style?")).toBeTruthy();

      // Back button works
      const backBtn = getByLabelText("Go back");
      fireEvent.press(backBtn);
      expect(getByText("Choose your nickname")).toBeTruthy();
    });

    it("advances to step 5 when hitting enter in nickname input", async () => {
      const { getByText, getByPlaceholderText, getByLabelText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // 1. Welcome -> 2. Terms -> 3. Privacy -> 4. Nickname
      fireEvent.press(getByText("Get Started"));
      fireEvent.press(
        getByLabelText("I have read and agree to the Terms and Conditions")
      );
      fireEvent.press(getByText("Next"));
      fireEvent.press(getByText("Next"));

      expect(getByText("Choose your nickname")).toBeTruthy();
      const input = getByPlaceholderText("nickname");

      // Invalid nickname: hitting enter does not advance
      fireEvent.changeText(input, "bad name");
      fireEvent(input, "submitEditing");
      expect(getByText("Choose your nickname")).toBeTruthy();

      // Valid nickname: hitting enter triggers next action to Step 5
      fireEvent.changeText(input, "globetrotter");
      fireEvent(input, "submitEditing");
      expect(getByText("What's your travel style?")).toBeTruthy();
    });

    it("toggles traveler styles on step 5", async () => {
      const { getByText, getByPlaceholderText, getByLabelText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // 1. Welcome -> 2. Terms -> 3. Privacy -> 4. Nickname -> 5. Style
      fireEvent.press(getByText("Get Started"));
      fireEvent.press(
        getByLabelText("I have read and agree to the Terms and Conditions")
      );
      fireEvent.press(getByText("Next"));
      fireEvent.press(getByText("Next"));

      fireEvent.changeText(getByPlaceholderText("nickname"), "globetrotter");
      fireEvent.press(getByText("Next"));

      expect(getByText("What's your travel style?")).toBeTruthy();
      const soloOption = getByText("Solo Traveler");
      fireEvent.press(soloOption);

      // Next to step 6 (Country)
      fireEvent.press(getByText("Next"));
      expect(getByText("Where are you from?")).toBeTruthy();
    });

    it("filters and selects countries on step 6", async () => {
      const { getByText, getByPlaceholderText, getByLabelText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // Advance through Step 1 to Step 6
      fireEvent.press(getByText("Get Started"));
      fireEvent.press(
        getByLabelText("I have read and agree to the Terms and Conditions")
      );
      fireEvent.press(getByText("Next"));
      fireEvent.press(getByText("Next"));

      fireEvent.changeText(getByPlaceholderText("nickname"), "explorer");
      fireEvent.press(getByText("Next"));
      fireEvent.press(getByText("Next"));

      expect(getByText("Where are you from?")).toBeTruthy();
      const searchInput = getByPlaceholderText("Search countries");
      fireEvent.changeText(searchInput, "Canada");
      expect(getByText("Canada")).toBeTruthy();
      fireEvent.press(getByText("Canada"));

      // Advance to step 7 (Demo Travel Plan)
      fireEvent.press(getByText("Next"));
      expect(getByText("Demo Travel Plan")).toBeTruthy();
    });

    it(
      "completes full onboarding flow from step 1 through step 8 and calls saveProfile",
      async () => {
      const { getByText, getByPlaceholderText, getByLabelText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // 1. Welcome -> 2. Terms
      fireEvent.press(getByText("Get Started"));
      expect(getByText("Terms and Conditions")).toBeTruthy();

      // 2. Terms -> 3. Privacy Policy
      fireEvent.press(
        getByLabelText("I have read and agree to the Terms and Conditions")
      );
      fireEvent.press(getByText("Next"));

      // 3. Privacy & Analytics -> 4. Nickname
      expect(getByText("Privacy & Analytics")).toBeTruthy();
      fireEvent.press(getByText("Next"));

      // 4. Nickname -> 5. Style
      expect(getByText("Choose your nickname")).toBeTruthy();
      fireEvent.changeText(getByPlaceholderText("nickname"), "nomad");
      fireEvent.press(getByText("Next"));

      // 5. Style -> 6. Country
      expect(getByText("What's your travel style?")).toBeTruthy();
      fireEvent.press(getByText("Adventure Seeker"));
      fireEvent.press(getByText("Next"));

      // 6. Country -> 7. Demo Data
      expect(getByText("Where are you from?")).toBeTruthy();
      fireEvent.press(getByText("Next"));

      // 7. Demo Data -> 8. Success
      expect(getByText("Demo Travel Plan")).toBeTruthy();
      fireEvent.press(getByText("Start the Adventure!"));

      // 8. Success Step
      expect(getByText("You're all set!")).toBeTruthy();

      // Verify profile saved with notifications disabled and seeding triggered
      await waitFor(
        () => {
          expect(mockSaveProfile).toHaveBeenCalledWith(
            expect.objectContaining({
              nickname: "nomad",
              username: "nomad",
              defaultCountry: "Philippines",
              travelStyle: "adventure",
              notificationsEnabled: false,
            })
          );
          expect(mockSetAnalyticsOptOut).toHaveBeenCalledWith(false);
          expect(seedDemoTravelData).toHaveBeenCalled();
          expect(seedTestNotifications).not.toHaveBeenCalled();
        },
        { timeout: 4500 }
      );
    });

    it("saves analytics opt-out when user toggles analytics off on step 3", async () => {
      const { getByText, getByPlaceholderText, getByLabelText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // 1. Welcome -> 2. Terms
      fireEvent.press(getByText("Get Started"));
      fireEvent.press(
        getByLabelText("I have read and agree to the Terms and Conditions")
      );
      fireEvent.press(getByText("Next"));

      // 2. Terms -> 3. Privacy & Analytics
      expect(getByText("Privacy & Analytics")).toBeTruthy();
      // Toggle off analytics
      const analyticsSwitch = getByLabelText("Share Usage Analytics");
      fireEvent(analyticsSwitch, "valueChange", false);
      fireEvent.press(getByText("Next"));

      // 3. Privacy -> 4. Nickname
      fireEvent.changeText(getByPlaceholderText("nickname"), "optoutuser");
      fireEvent.press(getByText("Next"));

      // Style -> Country -> Demo
      fireEvent.press(getByText("Solo Traveler"));
      fireEvent.press(getByText("Next"));
      fireEvent.press(getByText("Next"));

      // Demo -> Finish
      fireEvent.press(getByText("Start the Adventure!"));

      await waitFor(
        () => {
          expect(mockSetAnalyticsOptOut).toHaveBeenCalledWith(true);
        },
        { timeout: 4500 }
      );
    });
  });
});
