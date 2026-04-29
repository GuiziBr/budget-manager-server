import {
	ConflictException,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CategoryService } from "@/domains/category/category.service"
import type { Category } from "@/domains/category/entities/category.entity"
import type { RecurringExpense } from "@/domains/recurring-expense/entities/recurring-expense.entity"
import type { RecurringExpenseService } from "@/domains/recurring-expense/recurring-expense.service"
import { BudgetPeriodService } from "./budget-period.service"
import type { BudgetPeriod } from "./entities/budget-period.entity"
import type { BudgetPeriodRepository } from "./repositories/budget-period.repository"

const mockBudgetPeriod: BudgetPeriod = {
	id: "uuid-1",
	year: 2026,
	month: 3,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRecurringExpense: RecurringExpense = {
	id: "re-uuid",
	categoryId: "cat-uuid",
	paymentTypeId: "pt-uuid",
	bankId: null,
	storeId: null,
	description: "Netflix",
	amount: 15.99,
	startedAt: new Date(),
	cancelledAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockEnvelopeCategory: Category = {
	id: "cat-uuid",
	name: "Grocery",
	hasBudgetEnvelope: true,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: BudgetPeriodRepository = {
	findAll: vi.fn(),
	findById: vi.fn(),
	findByYearAndMonth: vi.fn(),
	hasLinkedRecords: vi.fn(),
	openPeriod: vi.fn(),
	delete: vi.fn()
}

const mockRecurringExpenseService: RecurringExpenseService = {
	findActiveForPeriod: vi.fn()
} as unknown as RecurringExpenseService

const mockCategoryService: CategoryService = {
	findAllWithBudgetEnvelope: vi.fn()
} as unknown as CategoryService

describe("BudgetPeriodService", () => {
	let service: BudgetPeriodService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new BudgetPeriodService(
			mockRepository,
			mockRecurringExpenseService,
			mockCategoryService
		)
	})

	describe("findAll", () => {
		it("should return all budget periods", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockBudgetPeriod])
			const result = await service.findAll()
			expect(result).toEqual([mockBudgetPeriod])
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
		it("should return a budget period when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			const result = await service.findById("uuid-1")
			expect(result).toEqual(mockBudgetPeriod)
			expect(mockRepository.findById).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when budget period not found", async () => {
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

	describe("create", () => {
		it("should open a budget period gathering recurring and envelope data", async () => {
			const dto = { year: 2026, month: 3 }
			vi.mocked(mockRepository.findByYearAndMonth).mockResolvedValue(null)
			vi.mocked(
				mockRecurringExpenseService.findActiveForPeriod
			).mockResolvedValue([mockRecurringExpense])
			vi.mocked(
				mockCategoryService.findAllWithBudgetEnvelope
			).mockResolvedValue([mockEnvelopeCategory])
			vi.mocked(mockRepository.openPeriod).mockResolvedValue(mockBudgetPeriod)

			const result = await service.create(dto)

			expect(result).toEqual(mockBudgetPeriod)
			expect(mockRepository.findByYearAndMonth).toHaveBeenCalledWith(2026, 3)
			expect(
				mockRecurringExpenseService.findActiveForPeriod
			).toHaveBeenCalledWith(2026, 3)
			expect(
				mockCategoryService.findAllWithBudgetEnvelope
			).toHaveBeenCalledOnce()
			expect(mockRepository.openPeriod).toHaveBeenCalledWith(
				dto,
				[
					{
						recurringExpenseId: mockRecurringExpense.id,
						categoryId: mockRecurringExpense.categoryId,
						paymentTypeId: mockRecurringExpense.paymentTypeId,
						bankId: mockRecurringExpense.bankId,
						storeId: mockRecurringExpense.storeId,
						description: mockRecurringExpense.description,
						amount: mockRecurringExpense.amount
					}
				],
				[
					{
						categoryId: mockEnvelopeCategory.id,
						allocatedAmount: expect.any(Number)
					}
				]
			)
		})

		it("should use 0 as allocatedAmount for categories not in the constants file", async () => {
			const dto = { year: 2026, month: 3 }
			const unknownCategory: Category = {
				...mockEnvelopeCategory,
				name: "Unknown Category"
			}
			vi.mocked(mockRepository.findByYearAndMonth).mockResolvedValue(null)
			vi.mocked(
				mockRecurringExpenseService.findActiveForPeriod
			).mockResolvedValue([])
			vi.mocked(
				mockCategoryService.findAllWithBudgetEnvelope
			).mockResolvedValue([unknownCategory])
			vi.mocked(mockRepository.openPeriod).mockResolvedValue(mockBudgetPeriod)

			await service.create(dto)

			expect(mockRepository.openPeriod).toHaveBeenCalledWith(
				dto,
				[],
				[{ categoryId: unknownCategory.id, allocatedAmount: 0 }]
			)
		})

		it("should throw ConflictException when a period for the same year/month already exists", async () => {
			vi.mocked(mockRepository.findByYearAndMonth).mockResolvedValue(
				mockBudgetPeriod
			)
			await expect(service.create({ year: 2026, month: 3 })).rejects.toThrow(
				ConflictException
			)
			expect(mockRepository.openPeriod).not.toHaveBeenCalled()
		})

		it("should throw InternalServerErrorException when recurring expense service fails", async () => {
			vi.mocked(mockRepository.findByYearAndMonth).mockResolvedValue(null)
			vi.mocked(
				mockRecurringExpenseService.findActiveForPeriod
			).mockRejectedValue(new Error("Service down"))
			vi.mocked(
				mockCategoryService.findAllWithBudgetEnvelope
			).mockResolvedValue([])
			await expect(service.create({ year: 2026, month: 3 })).rejects.toThrow(
				InternalServerErrorException
			)
			expect(mockRepository.openPeriod).not.toHaveBeenCalled()
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findByYearAndMonth).mockRejectedValue(
				new Error("DB down")
			)
			await expect(service.create({ year: 2026, month: 3 })).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("findByYearAndMonth", () => {
		it("should return the budget period when found", async () => {
			vi.mocked(mockRepository.findByYearAndMonth).mockResolvedValue(
				mockBudgetPeriod
			)
			const result = await service.findByYearAndMonth(2026, 3)
			expect(result).toEqual(mockBudgetPeriod)
			expect(mockRepository.findByYearAndMonth).toHaveBeenCalledWith(2026, 3)
		})

		it("should return null when no period exists for that year/month", async () => {
			vi.mocked(mockRepository.findByYearAndMonth).mockResolvedValue(null)
			const result = await service.findByYearAndMonth(2026, 3)
			expect(result).toBeNull()
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findByYearAndMonth).mockRejectedValue(
				new Error("DB down")
			)
			await expect(service.findByYearAndMonth(2026, 3)).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("delete", () => {
		it("should delete the budget period when no linked records exist", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			vi.mocked(mockRepository.hasLinkedRecords).mockResolvedValue(false)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("uuid-1")
			expect(mockRepository.hasLinkedRecords).toHaveBeenCalledWith("uuid-1")
			expect(mockRepository.delete).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw ConflictException when the period has linked records", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			vi.mocked(mockRepository.hasLinkedRecords).mockResolvedValue(true)
			await expect(service.delete("uuid-1")).rejects.toThrow(ConflictException)
			expect(mockRepository.delete).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when budget period not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("uuid-missing")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			vi.mocked(mockRepository.hasLinkedRecords).mockResolvedValue(false)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
