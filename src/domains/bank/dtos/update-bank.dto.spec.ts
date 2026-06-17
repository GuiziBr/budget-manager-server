import { describe, expect, it } from "vitest"
import { updateBankSchema } from "./update-bank.dto"

describe("updateBankSchema", () => {
	it("should reject an empty body", () => {
		const result = updateBankSchema.safeParse({})
		expect(result.success).toBe(false)
		expect(result.error?.issues[0]?.message).toBe(
			"At least one field must be provided"
		)
	})

	it("should accept a body with at least one field", () => {
		const result = updateBankSchema.safeParse({ name: "Updated" })
		expect(result.success).toBe(true)
	})
})
