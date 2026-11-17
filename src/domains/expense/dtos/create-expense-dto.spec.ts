import { describe, expect, it } from "vitest"
import { createExpenseSchema, ExpenseType } from "./create-expense.dto"

const base = {
	type: ExpenseType.RECURRING,
	budgetPeriodId: "7c1f0d3e-5b0a-4b8e-9a52-1f6a2c4d8e90",
	categoryId: "2a9d6e11-0c3b-4f57-8d1e-6b7f3a9c5e22",
	paymentTypeId: "9b2e4c60-3d1a-4f8e-8a77-0c5d2e1f3a44",
	description: "Netflix",
	amount: 20
}

describe("createExpenseSchema — monthsAlreadyPaid", () => {
	it("should accept monthsAlreadyPaid on recurring expenses", () => {
		const result = createExpenseSchema.safeParse({
			...base,
			monthsAlreadyPaid: 10
		})
		expect(result.success).toBe(true)
	})

	it("should reject a negative or fractional monthsAlreadyPaid", () => {
		expect(
			createExpenseSchema.safeParse({ ...base, monthsAlreadyPaid: -1 }).success
		).toBe(false)
		expect(
			createExpenseSchema.safeParse({ ...base, monthsAlreadyPaid: 1.5 }).success
		).toBe(false)
	})

	it("should strip monthsAlreadyPaid from other expense types", () => {
		const result = createExpenseSchema.safeParse({
			...base,
			type: ExpenseType.ONE_TIME,
			monthsAlreadyPaid: 3
		})
		expect(result.success).toBe(true)
		expect(result.data).not.toHaveProperty("monthsAlreadyPaid")
	})
})

describe("createExpenseSchema — future purchase dates", () => {
	const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
	const past = "2026-01-01"

	it("should reject a future purchasedAt", () => {
		const result = createExpenseSchema.safeParse({
			...base,
			purchasedAt: future
		})
		expect(result.success).toBe(false)
	})

	it("should accept a past purchasedAt", () => {
		const result = createExpenseSchema.safeParse({
			...base,
			purchasedAt: past
		})
		expect(result.success).toBe(true)
	})

	it("should reject a future firstPurchasedAt on installments", () => {
		const installment = {
			type: ExpenseType.INSTALLMENT,
			budgetPeriodId: base.budgetPeriodId,
			categoryId: base.categoryId,
			paymentTypeId: base.paymentTypeId,
			description: "TV",
			amountPerInstallment: 100,
			totalInstallments: 3,
			paymentIntervalDays: 30
		}
		expect(
			createExpenseSchema.safeParse({
				...installment,
				firstPurchasedAt: future
			}).success
		).toBe(false)
		expect(
			createExpenseSchema.safeParse({ ...installment, firstPurchasedAt: past })
				.success
		).toBe(true)
	})
})
