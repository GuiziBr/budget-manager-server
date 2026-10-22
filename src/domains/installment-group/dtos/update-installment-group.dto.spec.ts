import { describe, expect, it } from "vitest"
import { updateInstallmentGroupSchema } from "./update-installment-group.dto"

describe("updateInstallmentGroupSchema", () => {
	it("should accept amountPerInstallment", () => {
		const result = updateInstallmentGroupSchema.safeParse({
			amountPerInstallment: 250
		})
		expect(result.success).toBe(true)
	})

	it("should reject totalInstallments as it is read-only", () => {
		const result = updateInstallmentGroupSchema.safeParse({
			totalInstallments: 12
		})
		expect(result.success).toBe(false)
	})

	it("should reject totalInstallments alongside a valid field", () => {
		const result = updateInstallmentGroupSchema.safeParse({
			amountPerInstallment: 250,
			totalInstallments: 12
		})
		expect(result.success).toBe(false)
	})

	it("should reject an empty body", () => {
		expect(updateInstallmentGroupSchema.safeParse({}).success).toBe(false)
	})
})
