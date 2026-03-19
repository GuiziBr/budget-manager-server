import { NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CategoryService } from "./category.service"
import type { Category } from "./entities/category.entity"
import type { CategoryRepository } from "./repositories/category.repository"

const mockCategory: Category = {
	id: "uuid-1",
	name: "Groceries",
	hasBudgetEnvelope: true,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: CategoryRepository = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}

describe("CategoryService", () => {
	let service: CategoryService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new CategoryService(mockRepository)
	})

	describe("findAll", () => {
		it("should return all categories", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockCategory])
			const result = await service.findAll()
			expect(result).toEqual([mockCategory])
			expect(mockRepository.findAll).toHaveBeenCalledOnce()
		})
	})

	describe("findById", () => {
		it("should return a category when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockCategory)
			const result = await service.findById("uuid-1")
			expect(result).toEqual(mockCategory)
			expect(mockRepository.findById).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when category not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.findById("uuid-missing")).rejects.toThrow(
				NotFoundException
			)
		})
	})

	describe("create", () => {
		it("should create and return a category", async () => {
			const dto = { name: "Groceries", hasBudgetEnvelope: true }
			vi.mocked(mockRepository.create).mockResolvedValue(mockCategory)
			const result = await service.create(dto)
			expect(result).toEqual(mockCategory)
			expect(mockRepository.create).toHaveBeenCalledWith(dto)
		})
	})

	describe("update", () => {
		it("should update and return the category", async () => {
			const dto = { name: "Food" }
			const updated = { ...mockCategory, name: "Food" }
			vi.mocked(mockRepository.findById).mockResolvedValue(mockCategory)
			vi.mocked(mockRepository.update).mockResolvedValue(updated)
			const result = await service.update("uuid-1", dto)
			expect(result).toEqual(updated)
			expect(mockRepository.update).toHaveBeenCalledWith("uuid-1", dto)
		})

		it("should throw NotFoundException when category not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(
				service.update("uuid-missing", { name: "x" })
			).rejects.toThrow(NotFoundException)
		})
	})

	describe("delete", () => {
		it("should delete the category", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockCategory)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("uuid-1")
			expect(mockRepository.delete).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when category not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("uuid-missing")).rejects.toThrow(
				NotFoundException
			)
		})
	})
})
