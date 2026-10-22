import { afterEach, describe, expect, it, vi } from "vitest"
import { createBudgetPeriodSchema } from "./create-budget-period.dto"

describe("createBudgetPeriodSchema", () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it("should accept next year", () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date("2026-06-15T12:00:00Z"))
		expect(
			createBudgetPeriodSchema.safeParse({ year: 2027, month: 1 }).success
		).toBe(true)
	})

	it("should reject a year beyond next year", () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date("2026-06-15T12:00:00Z"))
		expect(
			createBudgetPeriodSchema.safeParse({ year: 2028, month: 1 }).success
		).toBe(false)
	})

	it("should evaluate the max year at validation time, not module load", () => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date("2026-12-31T23:00:00Z"))
		expect(
			createBudgetPeriodSchema.safeParse({ year: 2028, month: 1 }).success
		).toBe(false)
		vi.setSystemTime(new Date("2027-01-01T01:00:00Z"))
		expect(
			createBudgetPeriodSchema.safeParse({ year: 2028, month: 1 }).success
		).toBe(true)
	})
})
