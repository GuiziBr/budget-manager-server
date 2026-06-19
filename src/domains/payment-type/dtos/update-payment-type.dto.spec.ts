import { describe, expect, it } from "vitest"
import { updatePaymentTypeSchema } from "./update-payment-type.dto"

describe("updatePaymentTypeSchema", () => {
	it("should reject an empty body", () => {
		const result = updatePaymentTypeSchema.safeParse({})
		expect(result.success).toBe(false)
		expect(result.error?.issues[0]?.message).toBe(
			"At least one field must be provided"
		)
	})

	it("should accept a body with at least one field", () => {
		const result = updatePaymentTypeSchema.safeParse({ name: "Updated" })
		expect(result.success).toBe(true)
	})
})
