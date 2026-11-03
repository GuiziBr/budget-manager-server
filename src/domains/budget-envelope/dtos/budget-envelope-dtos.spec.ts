import { describe, expect, it } from "vitest"
import { createBudgetEnvelopeSchema } from "./create-budget-envelope.dto"
import { updateBudgetEnvelopeSchema } from "./update-budget-envelope.dto"

describe("budget envelope DTOs", () => {
	it("should reject read-only spend fields on create", () => {
		const result = createBudgetEnvelopeSchema.safeParse({
			budgetPeriodId: "7c1f0d3e-5b0a-4b8e-9a52-1f6a2c4d8e90",
			categoryId: "2a9d6e11-0c3b-4f57-8d1e-6b7f3a9c5e22",
			allocatedAmount: 300,
			spentAmount: 10
		})
		expect(result.success).toBe(false)
	})

	it("should reject read-only spend fields on update", () => {
		const result = updateBudgetEnvelopeSchema.safeParse({
			allocatedAmount: 300,
			spendUpdatedAt: new Date().toISOString()
		})
		expect(result.success).toBe(false)
	})

	it("should still accept valid bodies", () => {
		expect(
			updateBudgetEnvelopeSchema.safeParse({ allocatedAmount: 300 }).success
		).toBe(true)
	})
})
