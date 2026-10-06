import { CreateTripSchema } from "../index";

describe("CreateTripSchema Validation", () => {
  it("should validate a correct trip title", async () => {
    await expect(
      CreateTripSchema.validateAt("title", { title: "Summer in Japan" })
    ).resolves.toBe("Summer in Japan");
  });

  it("should reject an empty title", async () => {
    await expect(
      CreateTripSchema.validateAt("title", { title: "" })
    ).rejects.toThrow("Trip title is required");
  });

  it("should reject a title shorter than 3 characters", async () => {
    await expect(
      CreateTripSchema.validateAt("title", { title: "Ab" })
    ).rejects.toThrow("Trip title is too short, make it more descriptive");
  });

  it("should accept a title with exactly 3 characters", async () => {
    await expect(
      CreateTripSchema.validateAt("title", { title: "NYC" })
    ).resolves.toBe("NYC");
  });

  it("should accept a title with exactly 50 characters", async () => {
    const title = "A".repeat(50);
    await expect(
      CreateTripSchema.validateAt("title", { title })
    ).resolves.toBe(title);
  });

  it("should reject a title exceeding 50 characters", async () => {
    const title = "A".repeat(51);
    await expect(
      CreateTripSchema.validateAt("title", { title })
    ).rejects.toThrow("Trip title must be at most 50 characters");
  });
});
