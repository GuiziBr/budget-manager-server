import { beforeEach, describe, expect, it, vi } from "vitest"
import type { RecurringExpense } from "./entities/recurring-expense.entity"
import { RecurringExpenseController } from "./recurring-expense.controller"
import type { RecurringExpenseService } from "./recurring-expense.service"

const mockRecurringExpense: RecurringExpense = {
	id: "uuid-1",
	categoryId: "cat-uuid-1",
	paymentTypeId: "pt-uuid-1",
	bankId: "bank-uuid-1",
	storeId: null,
	description: "Netflix",
	amount: 17.99,
	startedAt: new Date("2026-04-01"),
	cancelledAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockService: RecurringExpenseService = {
	findAll: vi.fn(),
	findById: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
} as unknown as RecurringExpenseService

describe("RecurringExpenseController", () => {
	let controller: RecurringExpenseController

	beforeEach(() => {
		vi.clearAllMocks()
		controller = new RecurringExpenseController(mockService)
	})

	describe("findAll", () => {
		it("should delegate to service.findAll", async () => {
			vi.mocked(mockService.findAll).mockResolvedValue([mockRecurringExpense])
			const result = await controller.findAll()
			expect(result).toEqual([mockRecurringExpense])
			expect(mockService.findAll).toHaveBeenCalledOnce()
		})
	})

	describe("findById", () => {
		it("should delegate to service.findById with the given id", async () => {
			vi.mocked(mockService.findById).mockResolvedValue(mockRecurringExpense)
			const result = await controller.findById("uuid-1")
			expect(result).toEqual(mockRecurringExpense)
			expect(mockService.findById).toHaveBeenCalledWith("uuid-1")
		})
	})

	describe("update", () => {
		it("should delegate to service.update with id and dto", async () => {
			const dto = { description: "Netflix Premium", amount: 22.99 }
			const updated = { ...mockRecurringExpense, ...dto }
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
