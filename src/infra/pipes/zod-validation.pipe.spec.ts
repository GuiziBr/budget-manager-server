import { BadRequestException } from "@nestjs/common"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { ZodValidationPipe } from "./zod-validation.pipe"

const schema = z.object({
	name: z.string().min(1),
	age: z.number().int().positive()
})

describe("ZodValidationPipe", () => {
	it("should return the parsed value when valid", () => {
		const pipe = new ZodValidationPipe(schema)
		const result = pipe.transform({ name: "Alice", age: 30 })
		expect(result).toEqual({ name: "Alice", age: 30 })
	})

	it("should throw BadRequestException when value is invalid", () => {
		const pipe = new ZodValidationPipe(schema)
		expect(() => pipe.transform({ name: "", age: -1 })).toThrow(
			BadRequestException
		)
	})

	it("should throw BadRequestException when required fields are missing", () => {
		const pipe = new ZodValidationPipe(schema)
		expect(() => pipe.transform({})).toThrow(BadRequestException)
	})

	it("should strip unknown fields from the output", () => {
		const pipe = new ZodValidationPipe(schema)
		const result = pipe.transform({ name: "Alice", age: 30, extra: "ignored" })
		expect(result).not.toHaveProperty("extra")
	})

	it("should work with a primitive schema", () => {
		const pipe = new ZodValidationPipe(z.uuid())
		const id = "123e4567-e89b-12d3-a456-426614174000"
		expect(pipe.transform(id)).toBe(id)
	})

	it("should throw BadRequestException for invalid primitive", () => {
		const pipe = new ZodValidationPipe(z.uuid())
		expect(() => pipe.transform("not-a-uuid")).toThrow(BadRequestException)
	})
})
