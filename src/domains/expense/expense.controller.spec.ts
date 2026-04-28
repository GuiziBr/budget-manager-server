import { beforeEach, describe, expect, it, vi } from "vitest"
import { ExpenseType } from "./dtos/create-expense.dto"
import type { Expense } from "./entities/expense.entity"
import { ExpenseController } from "./expense.controller"
import type { ExpenseService } from "./expense.service"

const mockExpense: Expense = {
	id: "expense-uuid-1",
	budgetPeriodId: "period-uuid-1",
	categoryId: "category-uuid-1",
	paymentTypeId: "payment-type-uuid-1",
	bankId: null,
	storeId: null,
	installmentGroupId: null,
	recurringExpenseId: null,
	description: "Groceries",
	installmentNumber: null,
	purchaseDate: new Date("2026-04-01"),
	dueDate: null,
	paidDate: null,
	amount: 150,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockService: ExpenseService = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
} as unknown as ExpenseService

describe("ExpenseController", () => {
	let controller: ExpenseController

	beforeEach(() => {
		vi.clearAllMocks()
		controller = new ExpenseController(mockService)
	})

	describe("findAll", () => {
		it("should delegate to service.findAll with filters", async () => {
			const response = { data: [mockExpense], total: 1, page: 1, limit: 20 }
			vi.mocked(mockService.findAll).mockResolvedValue(response)
			const result = await controller.findAll("period-uuid-1", 1, 20)
			expect(result).toEqual(response)
			expect(mockService.findAll).toHaveBeenCalledWith({
				budgetPeriodId: "period-uuid-1",
				page: 1,
				limit: 20
			})
		})

		it("should delegate with undefined filters when not provided", async () => {
			const response = { data: [], total: 0, page: 1, limit: 20 }
			vi.mocked(mockService.findAll).mockResolvedValue(response)
			await controller.findAll()
			expect(mockService.findAll).toHaveBeenCalledWith({
				budgetPeriodId: undefined,
				page: undefined,
				limit: undefined
			})
		})
	})

	describe("findById", () => {
		it("should delegate to service.findById", async () => {
			vi.mocked(mockService.findById).mockResolvedValue(mockExpense)
			const result = await controller.findById("expense-uuid-1")
			expect(result).toEqual(mockExpense)
			expect(mockService.findById).toHaveBeenCalledWith("expense-uuid-1")
		})
	})

	describe("create", () => {
		it("should delegate to service.create", async () => {
			const dto = {
				type: ExpenseType.ONE_TIME,
				budgetPeriodId: "period-uuid-1",
				categoryId: "category-uuid-1",
				paymentTypeId: "payment-type-uuid-1",
				description: "Groceries",
				amount: 150
			}
			vi.mocked(mockService.create).mockResolvedValue(mockExpense)
			const result = await controller.create(dto)
			expect(result).toEqual(mockExpense)
			expect(mockService.create).toHaveBeenCalledWith(dto)
		})
	})

	describe("update", () => {
		it("should delegate to service.update", async () => {
			const dto = { description: "Updated groceries" }
			vi.mocked(mockService.update).mockResolvedValue({
				...mockExpense,
				...dto
			})
			const result = await controller.update("expense-uuid-1", dto)
			expect(result.description).toBe("Updated groceries")
			expect(mockService.update).toHaveBeenCalledWith("expense-uuid-1", dto)
		})
	})

	describe("delete", () => {
		it("should delegate to service.delete", async () => {
			vi.mocked(mockService.delete).mockResolvedValue(undefined)
			await controller.delete("expense-uuid-1")
			expect(mockService.delete).toHaveBeenCalledWith("expense-uuid-1")
		})
	})
})
