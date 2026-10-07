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
      expect(COUNTRIES).toContain("Japan");
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

    it("navigates through steps and validates nickname", async () => {
      const { getByText, getByPlaceholderText, getByLabelText, queryByText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // Step 1 -> Step 2
      fireEvent.press(getByText("Get Started"));
      expect(getByText("Choose your nickname")).toBeTruthy();

      // Step 2: Next is disabled when nickname is empty
      const nextBtn = getByText("Next");
      fireEvent.press(nextBtn);
      // Still on step 2
      expect(getByText("Choose your nickname")).toBeTruthy();

      // Enter invalid nickname with spaces
      const input = getByPlaceholderText("nickname");
      fireEvent.changeText(input, "bad name");
      expect(getByText("Spaces are not allowed")).toBeTruthy();

      // Enter valid nickname
      fireEvent.changeText(input, "traveler99");
      expect(queryByText("Spaces are not allowed")).toBeNull();

      // Step 2 -> Step 3
      fireEvent.press(nextBtn);
      expect(getByText("What's your travel style?")).toBeTruthy();

      // Back button works
      const backBtn = getByLabelText("Go back");
      fireEvent.press(backBtn);
      expect(getByText("Choose your nickname")).toBeTruthy();
    });

    it("advances to step 3 when hitting enter in nickname input", async () => {
      const { getByText, getByPlaceholderText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      fireEvent.press(getByText("Get Started"));
      const input = getByPlaceholderText("nickname");

      // Invalid nickname: hitting enter does not advance
      fireEvent.changeText(input, "bad name");
      fireEvent(input, "submitEditing");
      expect(getByText("Choose your nickname")).toBeTruthy();

      // Valid nickname: hitting enter triggers next action
      fireEvent.changeText(input, "globetrotter");
      fireEvent(input, "submitEditing");
      expect(getByText("What's your travel style?")).toBeTruthy();
    });

    it("toggles traveler styles on step 3", async () => {
      const { getByText, getByPlaceholderText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      fireEvent.press(getByText("Get Started"));
      fireEvent.changeText(getByPlaceholderText("nickname"), "globetrotter");
      fireEvent.press(getByText("Next"));

      expect(getByText("What's your travel style?")).toBeTruthy();
      const soloOption = getByText("Solo Traveler");
      fireEvent.press(soloOption);

      // Next to step 4
      fireEvent.press(getByText("Next"));
      expect(getByText("Where are you from?")).toBeTruthy();
    });

    it("filters and selects countries on step 4", async () => {
      const { getByText, getByPlaceholderText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // Advance to step 4
      fireEvent.press(getByText("Get Started"));
      fireEvent.changeText(getByPlaceholderText("nickname"), "explorer");
      fireEvent.press(getByText("Next"));
      fireEvent.press(getByText("Next"));

      expect(getByText("Where are you from?")).toBeTruthy();
      const searchInput = getByPlaceholderText("Search countries");
      fireEvent.changeText(searchInput, "Japan");
      expect(getByText("Japan")).toBeTruthy();
      fireEvent.press(getByText("Japan"));

      // Advance to step 5 (Demo Travel Plan)
      fireEvent.press(getByText("Next"));
      expect(getByText("Demo Travel Plan")).toBeTruthy();
    });

    it(
      "completes full onboarding flow from step 1 through step 6 and calls saveProfile",
      async () => {
      const { getByText, getByPlaceholderText } = render(
        <OnboardingModal visible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(getByText("Get Started")).toBeTruthy();
      });

      // 1. Welcome -> Nickname
      fireEvent.press(getByText("Get Started"));

      // 2. Nickname -> Style
      fireEvent.changeText(getByPlaceholderText("nickname"), "nomad");
      fireEvent.press(getByText("Next"));

      // 3. Style -> Country
      fireEvent.press(getByText("Adventure Seeker"));
      fireEvent.press(getByText("Next"));

      // 4. Country -> Demo Data
      fireEvent.press(getByText("Next"));

      // 5. Demo Data -> Success
      expect(getByText("Demo Travel Plan")).toBeTruthy();
      fireEvent.press(getByText("Start the Adventure!"));

      // 6. Success Step
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
          expect(seedDemoTravelData).toHaveBeenCalled();
          expect(seedTestNotifications).not.toHaveBeenCalled();
        },
        { timeout: 4500 }
      );
    });
  });
});
