import React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import FilesTab from "../FilesTab";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockMutateUpdate = jest.fn();
const mockConfirm = jest.fn().mockResolvedValue(true);

jest.mock("@/features/Travel/hooks/useActivity", () => ({
  useUpdateActivityMutation: () => ({
    mutateAsync: mockMutateUpdate,
    isPending: false,
  }),
}));

jest.mock("@/context/ConfirmContext", () => ({
  useConfirm: () => ({
    confirm: mockConfirm,
  }),
}));

describe("FilesTab Component - Image Grid Delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockActivity = {
    id: "act-1",
    travelId: "trip-1",
    title: "Scuba Diving",
    images: [
      { url: "https://example.com/photo1.jpg", title: "Photo 1" },
      { url: "https://example.com/photo2.jpg", title: "Photo 2" },
    ],
    attachments: [],
  } as any;

  it("renders delete button on image items", () => {
    const { getAllByLabelText } = renderWithProviders(
      <FilesTab itineraryActivity={mockActivity} />
    );

    const deleteButtons = getAllByLabelText("Delete image");
    expect(deleteButtons.length).toBe(2);
  });

  it("prompts for validation/confirmation and deletes image when Yes is clicked", async () => {
    mockConfirm.mockResolvedValueOnce(true);

    const { getAllByLabelText } = renderWithProviders(
      <FilesTab itineraryActivity={mockActivity} />
    );

    const deleteButtons = getAllByLabelText("Delete image");
    fireEvent.press(deleteButtons[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith({
        title: "Delete Image",
        message: "Are you sure you want to delete this image?",
        confirmText: "Yes",
        cancelText: "No",
        type: "danger",
      });

      expect(mockMutateUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "act-1",
          images: [{ url: "https://example.com/photo2.jpg", title: "Photo 2" }],
        })
      );
    });
  });

  it("does not delete image when confirmation is cancelled", async () => {
    mockConfirm.mockResolvedValueOnce(false);

    const { getAllByLabelText } = renderWithProviders(
      <FilesTab itineraryActivity={mockActivity} />
    );

    const deleteButtons = getAllByLabelText("Delete image");
    fireEvent.press(deleteButtons[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockMutateUpdate).not.toHaveBeenCalled();
    });
  });

  it("prompts for validation and deletes attachment when Yes is clicked", async () => {
    mockConfirm.mockResolvedValueOnce(true);

    const activityWithAttachments = {
      ...mockActivity,
      attachments: [
        { name: "Tickets.pdf", url: "https://example.com/tickets.pdf", size: 1024 },
        { name: "Guide.pdf", url: "https://example.com/guide.pdf", size: 2048 },
      ],
    };

    const { getByText, getAllByLabelText } = renderWithProviders(
      <FilesTab itineraryActivity={activityWithAttachments} />
    );

    // Switch to Attachments subtab
    const attachmentsTab = getByText("Attachments (2)");
    fireEvent.press(attachmentsTab);

    await waitFor(() => {
      expect(getByText("Tickets.pdf")).toBeTruthy();
    });

    const deleteButtons = getAllByLabelText(/Delete file/);
    expect(deleteButtons.length).toBe(2);

    fireEvent.press(deleteButtons[0]);

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith({
        title: "Delete File",
        message: 'Are you sure you want to delete "Tickets.pdf"?',
        confirmText: "Yes",
        cancelText: "No",
        type: "danger",
      });

      expect(mockMutateUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            { name: "Guide.pdf", url: "https://example.com/guide.pdf", size: 2048 },
          ],
        })
      );
    });
  });
});
