import { describe, expect, it } from "vitest"
import {
	EXPENSE_SORT_FIELDS,
	expenseSortByQuerySchema
} from "@/domains/expense/dtos/expense-query.dto"

describe("expenseSortByQuerySchema", () => {
	it.each(EXPENSE_SORT_FIELDS)("should accept %s", (field) => {
		expect(expenseSortByQuerySchema.safeParse(field).success).toBe(true)
	})

	it("should accept the category and payment type name keys", () => {
		expect(EXPENSE_SORT_FIELDS).toContain("categoryName")
		expect(EXPENSE_SORT_FIELDS).toContain("paymentTypeName")
	})

	it("should accept undefined", () => {
		expect(expenseSortByQuerySchema.safeParse(undefined).success).toBe(true)
	})

	it.each(["invalid", "category", "categoryId", ""])(
		"should reject %s",
		(value) => {
			expect(expenseSortByQuerySchema.safeParse(value).success).toBe(false)
		}
	)
})
