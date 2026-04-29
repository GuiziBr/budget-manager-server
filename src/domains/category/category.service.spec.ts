import {
	ConflictException,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
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
	findAllWithBudgetEnvelope: vi.fn(),
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

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findAll).mockRejectedValue(new Error("DB down"))
			await expect(service.findAll()).rejects.toThrow(
				InternalServerErrorException
			)
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

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockRejectedValue(new Error("DB down"))
			await expect(service.findById("uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("findAllWithBudgetEnvelope", () => {
		it("should return only envelope categories", async () => {
			vi.mocked(mockRepository.findAllWithBudgetEnvelope).mockResolvedValue([
				mockCategory
			])
			const result = await service.findAllWithBudgetEnvelope()
			expect(result).toEqual([mockCategory])
			expect(mockRepository.findAllWithBudgetEnvelope).toHaveBeenCalledOnce()
		})

		it("should return an empty array when no envelope categories exist", async () => {
			vi.mocked(mockRepository.findAllWithBudgetEnvelope).mockResolvedValue([])
			const result = await service.findAllWithBudgetEnvelope()
			expect(result).toEqual([])
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findAllWithBudgetEnvelope).mockRejectedValue(
				new Error("DB down")
			)
			await expect(service.findAllWithBudgetEnvelope()).rejects.toThrow(
				InternalServerErrorException
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

		it("should propagate ConflictException when repository throws it (duplicate name)", async () => {
			vi.mocked(mockRepository.create).mockRejectedValue(
				new ConflictException("A category named 'Groceries' already exists")
			)
			await expect(
				service.create({ name: "Groceries", hasBudgetEnvelope: true })
			).rejects.toThrow(ConflictException)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.create).mockRejectedValue(new Error("DB down"))
			await expect(
				service.create({ name: "Groceries", hasBudgetEnvelope: true })
			).rejects.toThrow(InternalServerErrorException)
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

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockCategory)
			vi.mocked(mockRepository.update).mockRejectedValue(new Error("DB down"))
			await expect(service.update("uuid-1", { name: "x" })).rejects.toThrow(
				InternalServerErrorException
			)
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

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockCategory)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
