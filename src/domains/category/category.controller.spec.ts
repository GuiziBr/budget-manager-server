import { beforeEach, describe, expect, it, vi } from "vitest"
import { CategoryController } from "./category.controller"
import type { CategoryService } from "./category.service"
import type { Category } from "./entities/category.entity"

const mockCategory: Category = {
	id: "uuid-1",
	name: "Groceries",
	hasBudgetEnvelope: true,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockService: CategoryService = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
} as unknown as CategoryService

describe("CategoryController", () => {
	let controller: CategoryController

	beforeEach(() => {
		vi.clearAllMocks()
		controller = new CategoryController(mockService)
	})

	describe("findAll", () => {
		it("should delegate to service.findAll", async () => {
			vi.mocked(mockService.findAll).mockResolvedValue([mockCategory])
			const result = await controller.findAll()
			expect(result).toEqual([mockCategory])
			expect(mockService.findAll).toHaveBeenCalledOnce()
		})
	})

	describe("findById", () => {
		it("should delegate to service.findById with the given id", async () => {
			vi.mocked(mockService.findById).mockResolvedValue(mockCategory)
			const result = await controller.findById("uuid-1")
			expect(result).toEqual(mockCategory)
			expect(mockService.findById).toHaveBeenCalledWith("uuid-1")
		})
	})

	describe("create", () => {
		it("should delegate to service.create with the dto", async () => {
			const dto = { name: "Groceries", hasBudgetEnvelope: true }
			vi.mocked(mockService.create).mockResolvedValue(mockCategory)
			const result = await controller.create(dto)
			expect(result).toEqual(mockCategory)
			expect(mockService.create).toHaveBeenCalledWith(dto)
		})
	})

	describe("update", () => {
		it("should delegate to service.update with id and dto", async () => {
			const dto = { name: "Food" }
			const updated = { ...mockCategory, name: "Food" }
			vi.mocked(mockService.update).mockResolvedValue(updated)
			const result = await controller.update("uuid-1", dto)
			expect(result).toEqual(updated)
			expect(mockService.update).toHaveBeenCalledWith("uuid-1", dto)
		})
	})

	describe("delete", () => {
		it("should delegate to service.delete with the given id", async () => {
			vi.mocked(mockService.delete).mockResolvedValue(undefined)
			await controller.delete("uuid-1")
			expect(mockService.delete).toHaveBeenCalledWith("uuid-1")
		})
	})
})
