import type { ConfigService } from "@nestjs/config"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Env } from "@/infra/env"
import { ExpenseServerEnvelopeSpendRepository } from "./expense-server-envelope-spend.repository"

const config = {
	get: vi.fn((key: string) => {
		const values: Record<string, string> = {
			EXPENSE_API_URL: "http://expense.test",
			EXPENSE_API_KEY: "secret",
			EXPENSE_API_USER_ID: "7c1f0d3e-5b0a-4b8e-9a52-1f6a2c4d8e90"
		}
		return values[key]
	})
} as unknown as ConfigService<Env, true>

describe("ExpenseServerEnvelopeSpendRepository", () => {
	let repository: ExpenseServerEnvelopeSpendRepository
	const fetchMock = vi.fn()

	beforeEach(() => {
		vi.stubGlobal("fetch", fetchMock)
		repository = new ExpenseServerEnvelopeSpendRepository(config)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
		vi.clearAllMocks()
	})

	it("calls the balance endpoint with api key and user id", async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify([]), { status: 200 })
		)

		await repository.findByMonth(2026, 11)

		const [url, init] = fetchMock.mock.calls[0]
		expect(String(url)).toBe(
			"http://expense.test/balance/envelopes/2026/11?userId=7c1f0d3e-5b0a-4b8e-9a52-1f6a2c4d8e90"
		)
		expect(init.headers).toEqual({ "x-api-key": "secret" })
		expect(init.signal).toBeInstanceOf(AbortSignal)
	})

	it("maps cents to currency units keyed by category id", async () => {
		fetchMock.mockResolvedValue(
			new Response(
				JSON.stringify([
					{ id: "cat-1", description: "Groceries", total: 24518 },
					{ id: "cat-2", description: "Fun", total: 0 }
				]),
				{ status: 200 }
			)
		)

		const result = await repository.findByMonth(2026, 11)

		expect(result.get("cat-1")).toBe(245.18)
		expect(result.get("cat-2")).toBe(0)
	})

	it("throws on a non-2xx response", async () => {
		fetchMock.mockResolvedValue(new Response("nope", { status: 500 }))

		await expect(repository.findByMonth(2026, 11)).rejects.toThrow("status 500")
	})

	it("throws on an unexpected payload", async () => {
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ foo: "bar" }), { status: 200 })
		)

		await expect(repository.findByMonth(2026, 11)).rejects.toThrow()
	})

	it("propagates network errors", async () => {
		fetchMock.mockRejectedValue(new Error("timeout"))

		await expect(repository.findByMonth(2026, 11)).rejects.toThrow("timeout")
	})
})
