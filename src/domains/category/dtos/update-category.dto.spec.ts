import { describe, expect, it } from "vitest"
import { updateCategorySchema } from "./update-category.dto"

describe("updateCategorySchema", () => {
	it("should reject an empty body", () => {
		const result = updateCategorySchema.safeParse({})
		expect(result.success).toBe(false)
		expect(result.error?.issues[0]?.message).toBe(
			"At least one field must be provided"
		)
	})

	it("should accept a body with at least one field", () => {
		const result = updateCategorySchema.safeParse({ name: "Updated" })
		expect(result.success).toBe(true)
	})
})
