import { describe, expect, it } from "vitest"
import { updateStoreSchema } from "./update-store.dto"

describe("updateStoreSchema", () => {
	it("should reject an empty body", () => {
		const result = updateStoreSchema.safeParse({})
		expect(result.success).toBe(false)
		expect(result.error?.issues[0]?.message).toBe(
			"At least one field must be provided"
		)
	})

	it("should accept a body with at least one field", () => {
		const result = updateStoreSchema.safeParse({ name: "Updated" })
		expect(result.success).toBe(true)
	})
})
