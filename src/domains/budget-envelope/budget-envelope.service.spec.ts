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
import type { EnvelopeSpendRepository } from "./repositories/envelope-spend.repository"

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

const mockSpendRepository: EnvelopeSpendRepository = {
	findByMonth: vi.fn()
}

const spentCategoryAmounts = new Map([["category-uuid", 245.18]])

describe("BudgetEnvelopeService", () => {
	let service: BudgetEnvelopeService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new BudgetEnvelopeService(
			mockRepository,
			mockBudgetPeriodService,
			mockCategoryService,
			mockSpendRepository
		)
		vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
			mockBudgetPeriod
		)
		vi.mocked(mockSpendRepository.findByMonth).mockResolvedValue(
			spentCategoryAmounts
		)
	})

	describe("findAll", () => {
		it("should return all envelopes", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockEnvelope])
			const result = await service.findAll()
			expect(result).toEqual([
				{
					...mockEnvelope,
					spentAmount: 245.18,
					spendUpdatedAt: expect.any(Date)
				}
			])
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
			expect(result).toEqual({
				...mockEnvelope,
				spentAmount: 245.18,
				spendUpdatedAt: expect.any(Date)
			})
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

	describe("envelope spend", () => {
		const parkingEnvelope: BudgetEnvelope = {
			...mockEnvelope,
			id: "envelope-parking-uuid",
			categoryId: "category-parking-uuid"
		}

		it("should return 0 when the category is missing from the response", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([parkingEnvelope])
			const [result] = await service.findAll("period-uuid")
			expect(result.spentAmount).toBe(0)
			expect(result.spendUpdatedAt).toBeInstanceOf(Date)
		})

		it("should clamp a negative spend at 0", async () => {
			vi.mocked(mockSpendRepository.findByMonth).mockResolvedValue(
				new Map([["category-uuid", -12.5]])
			)
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockEnvelope])
			const [result] = await service.findAll("period-uuid")
			expect(result.spentAmount).toBe(0)
		})

		it("should call the spend API once for many envelopes of one period", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([
				mockEnvelope,
				parkingEnvelope
			])
			const result = await service.findAll("period-uuid")
			expect(result.map((e) => e.spentAmount)).toEqual([245.18, 0])
			expect(mockSpendRepository.findByMonth).toHaveBeenCalledTimes(1)
			expect(mockSpendRepository.findByMonth).toHaveBeenCalledWith(
				currentYear,
				currentMonth
			)
		})

		it("should call the spend API once per distinct period", async () => {
			const otherPeriodEnvelope: BudgetEnvelope = {
				...mockEnvelope,
				id: "envelope-other-uuid",
				budgetPeriodId: "period-past-uuid"
			}
			vi.mocked(mockBudgetPeriodService.findById).mockImplementation(
				async (id: string) =>
					id === "period-past-uuid" ? pastBudgetPeriod : mockBudgetPeriod
			)
			vi.mocked(mockRepository.findAll).mockResolvedValue([
				mockEnvelope,
				otherPeriodEnvelope
			])
			await service.findAll()
			expect(mockSpendRepository.findByMonth).toHaveBeenCalledTimes(2)
			expect(mockSpendRepository.findByMonth).toHaveBeenCalledWith(2020, 1)
		})

		it("should return null spend and keep the allocation when the API fails", async () => {
			vi.mocked(mockSpendRepository.findByMonth).mockRejectedValue(
				new Error("timeout")
			)
			vi.mocked(mockRepository.findAll).mockResolvedValue([
				mockEnvelope,
				parkingEnvelope
			])
			const result = await service.findAll("period-uuid")
			expect(result).toHaveLength(2)
			for (const envelope of result) {
				expect(envelope.spentAmount).toBeNull()
				expect(envelope.spendUpdatedAt).toBeNull()
				expect(envelope.allocatedAmount).toBe(500)
			}
		})

		it("should not cache a failed call", async () => {
			vi.mocked(mockSpendRepository.findByMonth)
				.mockRejectedValueOnce(new Error("timeout"))
				.mockResolvedValueOnce(spentCategoryAmounts)
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockEnvelope])
			const [first] = await service.findAll("period-uuid")
			const [second] = await service.findAll("period-uuid")
			expect(first.spentAmount).toBeNull()
			expect(second.spentAmount).toBe(245.18)
		})

		it("should reuse the cached spend of an open period within the TTL", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockEnvelope])
			await service.findAll("period-uuid")
			await service.findAll("period-uuid")
			expect(mockSpendRepository.findByMonth).toHaveBeenCalledTimes(1)
		})

		it("should refetch the spend of an open period after the TTL", async () => {
			vi.useFakeTimers()
			try {
				vi.mocked(mockRepository.findAll).mockResolvedValue([mockEnvelope])
				await service.findAll("period-uuid")
				vi.advanceTimersByTime(61_000)
				await service.findAll("period-uuid")
				expect(mockSpendRepository.findByMonth).toHaveBeenCalledTimes(2)
			} finally {
				vi.useRealTimers()
			}
		})

		it("should cache the spend of a past period forever", async () => {
			vi.useFakeTimers()
			try {
				vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
					pastBudgetPeriod
				)
				vi.mocked(mockRepository.findAll).mockResolvedValue([mockEnvelope])
				await service.findAll("period-past-uuid")
				vi.advanceTimersByTime(24 * 60 * 60 * 1000)
				await service.findAll("period-past-uuid")
				expect(mockSpendRepository.findByMonth).toHaveBeenCalledTimes(1)
			} finally {
				vi.useRealTimers()
			}
		})

		it("should return a future period spend (not 0 by default)", async () => {
			const futurePeriod: BudgetPeriod = {
				...mockBudgetPeriod,
				id: "period-future-uuid",
				year: currentYear + 1
			}
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				futurePeriod
			)
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockEnvelope])
			const [result] = await service.findAll("period-future-uuid")
			expect(result.spentAmount).toBe(245.18)
			expect(mockSpendRepository.findByMonth).toHaveBeenCalledWith(
				currentYear + 1,
				currentMonth
			)
		})

		it("should not call the spend API on update or delete", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockEnvelope)
			vi.mocked(mockRepository.update).mockResolvedValue(mockEnvelope)
			await service.update("envelope-uuid", { allocatedAmount: 600 })
			await service.delete("envelope-uuid")
			expect(mockSpendRepository.findByMonth).not.toHaveBeenCalled()
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
			expect(result).toEqual({
				...mockEnvelope,
				spentAmount: 245.18,
				spendUpdatedAt: expect.any(Date)
			})
			expect(mockRepository.create).toHaveBeenCalledWith(dto)
		})

		it("should throw UnprocessableEntityException when period is in the past", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				pastBudgetPeriod
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue(mockCategory)
			await expect(
				service.create({
					budgetPeriodId: "period-past-uuid",
					categoryId: "category-uuid",
					allocatedAmount: 100
				})
			).rejects.toThrow(UnprocessableEntityException)
			expect(mockRepository.create).not.toHaveBeenCalled()
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
