import {
	BadRequestException,
	InternalServerErrorException,
	NotFoundException,
	UnprocessableEntityException
} from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BudgetPeriodService } from "@/domains/budget-period/budget-period.service"
import type { BudgetPeriod } from "@/domains/budget-period/entities/budget-period.entity"
import type { CategoryService } from "@/domains/category/category.service"
import type { Category } from "@/domains/category/entities/category.entity"
import { BudgetEnvelopeService } from "./budget-envelope.service"
import type { BudgetEnvelope } from "./entities/budget-envelope.entity"
import type { BudgetEnvelopeRepository } from "./repositories/budget-envelope.repository"

const now = new Date()
const currentYear = now.getUTCFullYear()
const currentMonth = now.getUTCMonth() + 1

const mockBudgetPeriod: BudgetPeriod = {
	id: "period-uuid",
	year: currentYear,
	month: currentMonth,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const pastBudgetPeriod: BudgetPeriod = {
	id: "period-past-uuid",
	year: 2020,
	month: 1,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockCategory: Category = {
	id: "category-uuid",
	name: "Grocery",
	hasBudgetEnvelope: true,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const nonEnvelopeCategory: Category = {
	...mockCategory,
	id: "category-no-envelope-uuid",
	name: "Other",
	hasBudgetEnvelope: false
}

const mockEnvelope: BudgetEnvelope = {
	id: "envelope-uuid",
	budgetPeriodId: "period-uuid",
	categoryId: "category-uuid",
	allocatedAmount: 500,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: BudgetEnvelopeRepository = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}

const mockBudgetPeriodService: BudgetPeriodService = {
	findById: vi.fn()
} as unknown as BudgetPeriodService

const mockCategoryService: CategoryService = {
	findById: vi.fn()
} as unknown as CategoryService

describe("BudgetEnvelopeService", () => {
	let service: BudgetEnvelopeService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new BudgetEnvelopeService(
			mockRepository,
			mockBudgetPeriodService,
			mockCategoryService
		)
	})

	describe("findAll", () => {
		it("should return all envelopes", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockEnvelope])
			const result = await service.findAll()
			expect(result).toEqual([mockEnvelope])
			expect(mockRepository.findAll).toHaveBeenCalledWith(undefined)
		})

		it("should filter by budgetPeriodId when provided", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockEnvelope])
			await service.findAll("period-uuid")
			expect(mockRepository.findAll).toHaveBeenCalledWith("period-uuid")
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findAll).mockRejectedValue(new Error("DB down"))
			await expect(service.findAll()).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("findById", () => {
		it("should return the envelope when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockEnvelope)
			const result = await service.findById("envelope-uuid")
			expect(result).toEqual(mockEnvelope)
		})

		it("should throw NotFoundException when not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.findById("missing-uuid")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockRejectedValue(new Error("DB down"))
			await expect(service.findById("envelope-uuid")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("create", () => {
		it("should create and return a budget envelope", async () => {
			const dto = {
				budgetPeriodId: "period-uuid",
				categoryId: "category-uuid",
				allocatedAmount: 500
			}
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				mockBudgetPeriod
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue(mockCategory)
			vi.mocked(mockRepository.create).mockResolvedValue(mockEnvelope)
			const result = await service.create(dto)
			expect(result).toEqual(mockEnvelope)
			expect(mockRepository.create).toHaveBeenCalledWith(dto)
		})

		it("should throw BadRequestException when category does not support envelopes", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				mockBudgetPeriod
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue(
				nonEnvelopeCategory
			)
			await expect(
				service.create({
					budgetPeriodId: "period-uuid",
					categoryId: "category-no-envelope-uuid",
					allocatedAmount: 100
				})
			).rejects.toThrow(BadRequestException)
			expect(mockRepository.create).not.toHaveBeenCalled()
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockRejectedValue(
				new Error("DB down")
			)
			await expect(
				service.create({
					budgetPeriodId: "period-uuid",
					categoryId: "category-uuid",
					allocatedAmount: 100
				})
			).rejects.toThrow(InternalServerErrorException)
		})
	})

	describe("update", () => {
		it("should update and return the envelope", async () => {
			const updated = { ...mockEnvelope, allocatedAmount: 600 }
			vi.mocked(mockRepository.findById).mockResolvedValue(mockEnvelope)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				mockBudgetPeriod
			)
			vi.mocked(mockRepository.update).mockResolvedValue(updated)
			const result = await service.update("envelope-uuid", {
				allocatedAmount: 600
			})
			expect(result).toEqual(updated)
		})

		it("should throw UnprocessableEntityException when period is in the past", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue({
				...mockEnvelope,
				budgetPeriodId: "period-past-uuid"
			})
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				pastBudgetPeriod
			)
			await expect(
				service.update("envelope-uuid", { allocatedAmount: 600 })
			).rejects.toThrow(UnprocessableEntityException)
			expect(mockRepository.update).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when envelope not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(
				service.update("missing-uuid", { allocatedAmount: 600 })
			).rejects.toThrow(NotFoundException)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockEnvelope)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				mockBudgetPeriod
			)
			vi.mocked(mockRepository.update).mockRejectedValue(new Error("DB down"))
			await expect(
				service.update("envelope-uuid", { allocatedAmount: 600 })
			).rejects.toThrow(InternalServerErrorException)
		})
	})

	describe("delete", () => {
		it("should delete the envelope", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockEnvelope)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				mockBudgetPeriod
			)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("envelope-uuid")
			expect(mockRepository.delete).toHaveBeenCalledWith("envelope-uuid")
		})

		it("should throw UnprocessableEntityException when period is in the past", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue({
				...mockEnvelope,
				budgetPeriodId: "period-past-uuid"
			})
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				pastBudgetPeriod
			)
			await expect(service.delete("envelope-uuid")).rejects.toThrow(
				UnprocessableEntityException
			)
			expect(mockRepository.delete).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when envelope not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("missing-uuid")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockEnvelope)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				mockBudgetPeriod
			)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("envelope-uuid")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
