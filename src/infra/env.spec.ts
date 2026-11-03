import { describe, expect, it } from "vitest"
import { envSchema } from "./env"

const validEnv = {
	DATABASE_URL: "postgresql://admin:admin@localhost:5432/db?schema=public",
	EXPENSE_API_URL: "http://host.docker.internal:3000",
	EXPENSE_API_KEY: "secret",
	EXPENSE_API_USER_ID: "7c1f0d3e-5b0a-4b8e-9a52-1f6a2c4d8e90"
}

describe("envSchema", () => {
	it("should accept a valid environment", () => {
		expect(envSchema.safeParse(validEnv).success).toBe(true)
	})

	it("should reject EXPENSE_API_URL without an http(s) scheme", () => {
		const result = envSchema.safeParse({
			...validEnv,
			EXPENSE_API_URL: "localhost:3000"
		})
		expect(result.success).toBe(false)
	})
})
