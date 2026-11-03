import { describe, expect, it } from "vitest"
import { calculateMonthsRunning } from "./months-running"

const startedAt = new Date(Date.UTC(2026, 0, 1))

describe("calculateMonthsRunning", () => {
	it("should be 1 in the starting month", () => {
		expect(
			calculateMonthsRunning(
				{ monthsAlreadyPaid: 0, startedAt },
				{ year: 2026, month: 1 }
			)
		).toBe(1)
	})

	it("should count calendar months inclusive (Jan to Nov = 11)", () => {
		expect(
			calculateMonthsRunning(
				{ monthsAlreadyPaid: 0, startedAt },
				{ year: 2026, month: 11 }
			)
		).toBe(11)
	})

	it("should add months already paid", () => {
		expect(
			calculateMonthsRunning(
				{ monthsAlreadyPaid: 10, startedAt },
				{ year: 2026, month: 11 }
			)
		).toBe(21)
	})

	it("should cross year boundaries", () => {
		expect(
			calculateMonthsRunning(
				{ monthsAlreadyPaid: 0, startedAt },
				{ year: 2027, month: 2 }
			)
		).toBe(14)
	})

	it("should never go below 1 for periods before the start", () => {
		expect(
			calculateMonthsRunning(
				{ monthsAlreadyPaid: 0, startedAt },
				{ year: 2025, month: 6 }
			)
		).toBe(1)
	})
})
