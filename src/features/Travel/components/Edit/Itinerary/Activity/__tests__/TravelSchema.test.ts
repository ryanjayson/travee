import { TravelSchema } from "../index";

describe("TravelSchema Validation", () => {
  it("should validate a correct activity title", async () => {
    const validData = { title: "Visit Eiffel Tower" };
    await expect(TravelSchema.validate(validData)).resolves.toEqual(validData);
  });

  it("should reject an empty title", async () => {
    const invalidData = { title: "" };
    await expect(TravelSchema.validate(invalidData)).rejects.toThrow(
      "Activity title is required"
    );
  });

  it("should reject a title shorter than 3 characters", async () => {
    const invalidData = { title: "Go" };
    await expect(TravelSchema.validate(invalidData)).rejects.toThrow(
      "Activity title is too short, make it more descriptive"
    );
  });

  it("should accept a title with exactly 3 characters", async () => {
    const validData = { title: "Spa" };
    await expect(TravelSchema.validate(validData)).resolves.toEqual(validData);
  });

  it("should accept a title with exactly 40 characters", async () => {
    const validData = { title: "A".repeat(40) };
    await expect(TravelSchema.validate(validData)).resolves.toEqual(validData);
  });

  it("should reject a title exceeding 40 characters", async () => {
    const invalidData = { title: "A".repeat(41) };
    await expect(TravelSchema.validate(invalidData)).rejects.toThrow(
      "Activity title must be at most 40 characters"
    );
  });
});
