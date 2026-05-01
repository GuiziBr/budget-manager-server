import {
	BadRequestException,
	InternalServerErrorException,
	NotFoundException,
	UnprocessableEntityException
} from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BudgetPeriodService } from "@/domains/budget-period/budget-period.service"
import type { CategoryService } from "@/domains/category/category.service"
import type { PaymentTypeService } from "@/domains/payment-type/payment-type.service"
import { ExpenseType } from "./dtos/create-expense.dto"
import type { Expense } from "./entities/expense.entity"
import { ExpenseService } from "./expense.service"
import type { ExpenseRepository } from "./repositories/expense.repository"

const currentPeriod = () => {
	const now = new Date()
	return {
		id: "period-uuid-current",
		year: now.getUTCFullYear(),
		month: now.getUTCMonth() + 1
	}
}

const previousPeriod = () => {
	const { year, month } = currentPeriod()
	const prev =
		month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
	return { id: "period-uuid-past", ...prev }
}

const mockExpense: Expense = {
	id: "expense-uuid-1",
	budgetPeriodId: "period-uuid-current",
	categoryId: "category-uuid-1",
	paymentTypeId: "payment-type-uuid-1",
	bankId: null,
	storeId: null,
	installmentGroupId: null,
	recurringExpenseId: null,
	description: "Groceries",
	installmentNumber: null,
	purchasedAt: new Date("2026-04-01"),
	dueAt: null,
	paidAt: null,
	amount: 150,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: ExpenseRepository = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	createWithRecurringTemplate: vi.fn(),
	createInstallmentExpenses: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}

const mockBudgetPeriodService = {
	findById: vi.fn(),
	findByYearAndMonth: vi.fn()
} as unknown as BudgetPeriodService

const mockCategoryService = {
	findById: vi.fn()
} as unknown as CategoryService

const mockPaymentTypeService = {
	findById: vi.fn()
} as unknown as PaymentTypeService

const mockPaymentTypeNoStatement = {
	id: "payment-type-uuid-1",
	hasStatement: false
}
const mockPaymentTypeWithStatement = {
	id: "payment-type-uuid-2",
	hasStatement: true
}

describe("ExpenseService", () => {
	let service: ExpenseService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new ExpenseService(
			mockRepository,
			mockBudgetPeriodService,
			mockCategoryService,
			mockPaymentTypeService
		)
	})

	describe("findAll", () => {
		it("should return paginated expenses", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue({
				data: [mockExpense],
				total: 1
			})
			const result = await service.findAll({})
			expect(result.data).toEqual([mockExpense])
			expect(result.total).toBe(1)
			expect(result.page).toBe(1)
			expect(result.limit).toBe(20)
		})

		it("should forward budgetPeriodId filter to repository", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue({
				data: [mockExpense],
				total: 1
			})
			await service.findAll({ budgetPeriodId: "period-uuid-1" })
			expect(mockRepository.findAll).toHaveBeenCalledWith(
				expect.objectContaining({ budgetPeriodId: "period-uuid-1" })
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findAll).mockRejectedValue(new Error("DB down"))
			await expect(service.findAll({})).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("findById", () => {
		it("should return the expense when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockExpense)
			const result = await service.findById("expense-uuid-1")
			expect(result).toEqual(mockExpense)
		})

		it("should throw NotFoundException when expense not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.findById("missing")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockRejectedValue(new Error("DB down"))
			await expect(service.findById("expense-uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("create — one-time", () => {
		const dto = {
			type: ExpenseType.ONE_TIME,
			budgetPeriodId: "period-uuid-current",
			categoryId: "category-uuid-1",
			paymentTypeId: "payment-type-uuid-1",
			description: "Groceries",
			amount: 150
		}

		it("should create and return a one-time expense", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeNoStatement as never
			)
			vi.mocked(mockRepository.create).mockResolvedValue(mockExpense)
			const result = await service.create(dto)
			expect(result).toEqual(mockExpense)
			expect(mockRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ description: "Groceries", amount: 150 })
			)
		})

		it("should throw NotFoundException when budget period not found", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockRejectedValue(
				new NotFoundException("not found")
			)
			await expect(service.create(dto)).rejects.toThrow(NotFoundException)
			expect(mockRepository.create).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when category not found", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockCategoryService.findById).mockRejectedValue(
				new NotFoundException("not found")
			)
			await expect(service.create(dto)).rejects.toThrow(NotFoundException)
			expect(mockRepository.create).not.toHaveBeenCalled()
		})

		it("should throw BadRequestException when paymentType.hasStatement and no bankId", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeWithStatement as never
			)
			await expect(
				service.create({ ...dto, paymentTypeId: "payment-type-uuid-2" })
			).rejects.toThrow(BadRequestException)
			expect(mockRepository.create).not.toHaveBeenCalled()
		})

		it("should succeed when paymentType.hasStatement and bankId is provided", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeWithStatement as never
			)
			vi.mocked(mockRepository.create).mockResolvedValue(mockExpense)
			const result = await service.create({
				...dto,
				paymentTypeId: "payment-type-uuid-2",
				bankId: "bank-uuid-1"
			})
			expect(result).toEqual(mockExpense)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeNoStatement as never
			)
			vi.mocked(mockRepository.create).mockRejectedValue(new Error("DB down"))
			await expect(service.create(dto)).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("create — recurring", () => {
		const dto = {
			type: ExpenseType.RECURRING,
			budgetPeriodId: "period-uuid-current",
			categoryId: "category-uuid-1",
			paymentTypeId: "payment-type-uuid-1",
			description: "Netflix",
			amount: 20
		}

		it("should call createWithRecurringTemplate with correct startedAt", async () => {
			const period = currentPeriod()
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				period as never
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeNoStatement as never
			)
			vi.mocked(mockRepository.createWithRecurringTemplate).mockResolvedValue(
				mockExpense
			)

			await service.create(dto)

			const expectedStartedAt = new Date(
				Date.UTC(period.year, period.month - 1, 1)
			)
			expect(mockRepository.createWithRecurringTemplate).toHaveBeenCalledWith(
				expect.objectContaining({ description: "Netflix", amount: 20 }),
				expect.objectContaining({ startedAt: expectedStartedAt })
			)
		})
	})

	describe("create — installment", () => {
		const dto = {
			type: ExpenseType.INSTALLMENT,
			budgetPeriodId: "period-uuid-current",
			categoryId: "category-uuid-1",
			paymentTypeId: "payment-type-uuid-1",
			description: "Laptop",
			amountPerInstallment: 200,
			totalInstallments: 3,
			paymentIntervalDays: 30,
			firstPurchasedAt: "2026-04-01"
		}

		it("should create installment expenses for existing periods and return first", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeNoStatement as never
			)
			vi.mocked(mockBudgetPeriodService.findByYearAndMonth)
				.mockResolvedValueOnce({ id: "period-1" } as never)
				.mockResolvedValueOnce({ id: "period-2" } as never)
				.mockResolvedValueOnce(null) // third period not yet created

			const firstExpense = { ...mockExpense, installmentNumber: 1 }
			const secondExpense = { ...mockExpense, installmentNumber: 2 }
			vi.mocked(mockRepository.createInstallmentExpenses).mockResolvedValue([
				firstExpense,
				secondExpense
			])

			const result = await service.create(dto)
			expect(result.installmentNumber).toBe(1)
			const call = vi.mocked(mockRepository.createInstallmentExpenses).mock
				.calls[0]
			expect(call[1]).toHaveLength(2)
		})

		it("should fall back to expenses[0] when no installment #1 is returned", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeNoStatement as never
			)
			vi.mocked(mockBudgetPeriodService.findByYearAndMonth).mockResolvedValue({
				id: "period-2"
			} as never)
			const secondExpense = { ...mockExpense, installmentNumber: 2 }
			vi.mocked(mockRepository.createInstallmentExpenses).mockResolvedValue([
				secondExpense
			])
			const result = await service.create(dto)
			expect(result.installmentNumber).toBe(2)
		})

		it("should throw BadRequestException when no due dates match existing periods", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeNoStatement as never
			)
			vi.mocked(mockBudgetPeriodService.findByYearAndMonth).mockResolvedValue(
				null
			)
			await expect(service.create(dto)).rejects.toThrow(BadRequestException)
			expect(mockRepository.createInstallmentExpenses).not.toHaveBeenCalled()
		})

		it("should pass purchasedAt only on first installment", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeNoStatement as never
			)
			vi.mocked(mockBudgetPeriodService.findByYearAndMonth)
				.mockResolvedValueOnce({ id: "period-1" } as never)
				.mockResolvedValueOnce({ id: "period-2" } as never)
				.mockResolvedValueOnce({ id: "period-3" } as never)

			vi.mocked(mockRepository.createInstallmentExpenses).mockResolvedValue([
				{ ...mockExpense, installmentNumber: 1 }
			])

			await service.create(dto)
			const expenseRows = vi.mocked(mockRepository.createInstallmentExpenses)
				.mock.calls[0][1]
			expect(expenseRows[0].purchasedAt).not.toBeNull()
			expect(expenseRows[1].purchasedAt).toBeNull()
			expect(expenseRows[2].purchasedAt).toBeNull()
		})
	})

	describe("update", () => {
		it("should update expense when period is current", async () => {
			const dto = { description: "Updated groceries" }
			vi.mocked(mockRepository.findById).mockResolvedValue(mockExpense)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockRepository.update).mockResolvedValue({
				...mockExpense,
				...dto
			})
			const result = await service.update("expense-uuid-1", dto)
			expect(result.description).toBe("Updated groceries")
			expect(mockRepository.update).toHaveBeenCalledWith("expense-uuid-1", dto)
		})

		it("should throw UnprocessableEntityException for past period", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockExpense)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				previousPeriod() as never
			)
			await expect(
				service.update("expense-uuid-1", { description: "x" })
			).rejects.toThrow(UnprocessableEntityException)
			expect(mockRepository.update).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when expense not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(
				service.update("missing", { description: "x" })
			).rejects.toThrow(NotFoundException)
		})

		it("should throw NotFoundException when updated categoryId does not exist", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockExpense)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockCategoryService.findById).mockRejectedValue(
				new NotFoundException("Category not found")
			)
			await expect(
				service.update("expense-uuid-1", { categoryId: "missing-uuid" })
			).rejects.toThrow(NotFoundException)
			expect(mockRepository.update).not.toHaveBeenCalled()
		})

		it("should throw BadRequestException when switching to statement payment type without bankId", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockExpense) // bankId: null
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeWithStatement as never
			)
			await expect(
				service.update("expense-uuid-1", {
					paymentTypeId: "payment-type-uuid-2"
				})
			).rejects.toThrow(BadRequestException)
			expect(mockRepository.update).not.toHaveBeenCalled()
		})

		it("should allow switching to statement payment type when expense already has bankId", async () => {
			const expenseWithBank = { ...mockExpense, bankId: "bank-uuid-1" }
			vi.mocked(mockRepository.findById).mockResolvedValue(expenseWithBank)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeWithStatement as never
			)
			vi.mocked(mockRepository.update).mockResolvedValue(expenseWithBank)
			await expect(
				service.update("expense-uuid-1", {
					paymentTypeId: "payment-type-uuid-2"
				})
			).resolves.toBeDefined()
			expect(mockRepository.update).toHaveBeenCalled()
		})

		it("should throw BadRequestException when clearing bankId on a statement-backed payment type", async () => {
			const expenseWithBank = {
				...mockExpense,
				paymentTypeId: "payment-type-uuid-2",
				bankId: "bank-uuid-1"
			}
			vi.mocked(mockRepository.findById).mockResolvedValue(expenseWithBank)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue(
				mockPaymentTypeWithStatement as never
			)
			await expect(
				service.update("expense-uuid-1", { bankId: null })
			).rejects.toThrow(BadRequestException)
			expect(mockRepository.update).not.toHaveBeenCalled()
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockExpense)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockRepository.update).mockRejectedValue(new Error("DB down"))
			await expect(
				service.update("expense-uuid-1", { description: "x" })
			).rejects.toThrow(InternalServerErrorException)
		})
	})

	describe("delete", () => {
		it("should delete expense when period is current", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockExpense)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("expense-uuid-1")
			expect(mockRepository.delete).toHaveBeenCalledWith("expense-uuid-1")
		})

		it("should throw UnprocessableEntityException for past period", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockExpense)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				previousPeriod() as never
			)
			await expect(service.delete("expense-uuid-1")).rejects.toThrow(
				UnprocessableEntityException
			)
			expect(mockRepository.delete).not.toHaveBeenCalled()
		})

		it("should throw UnprocessableEntityException for past year", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockExpense)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue({
				id: "period-old",
				year: currentPeriod().year - 1,
				month: 12
			} as never)
			await expect(service.delete("expense-uuid-1")).rejects.toThrow(
				UnprocessableEntityException
			)
		})

		it("should throw NotFoundException when expense not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("missing")).rejects.toThrow(NotFoundException)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockExpense)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue(
				currentPeriod() as never
			)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("expense-uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
