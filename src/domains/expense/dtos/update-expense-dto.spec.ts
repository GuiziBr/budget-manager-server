import { describe, expect, it } from "vitest"
import { updateExpenseSchema } from "./update-expense.dto"

describe("updateExpenseSchema — purchasedAt", () => {
	it("should reject a future purchasedAt", () => {
		const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
		expect(updateExpenseSchema.safeParse({ purchasedAt: future }).success).toBe(
			false
		)
	})

	it("should accept a past purchasedAt", () => {
		expect(
			updateExpenseSchema.safeParse({ purchasedAt: "2026-01-01" }).success
		).toBe(true)
	})

	it("should accept null purchasedAt", () => {
		expect(updateExpenseSchema.safeParse({ purchasedAt: null }).success).toBe(
			true
		)
	})
})
