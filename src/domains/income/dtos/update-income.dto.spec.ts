import { describe, expect, it } from "vitest"
import { updateIncomeSchema } from "./update-income.dto"

describe("updateIncomeSchema", () => {
	it("should reject an empty body", () => {
		const result = updateIncomeSchema.safeParse({})
		expect(result.success).toBe(false)
		expect(result.error?.issues[0]?.message).toBe(
			"At least one field must be provided"
		)
	})

	it("should accept a body with at least one field", () => {
		const result = updateIncomeSchema.safeParse({ description: "Updated" })
		expect(result.success).toBe(true)
	})
})
