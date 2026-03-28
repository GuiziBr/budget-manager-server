import { beforeEach, describe, expect, it, vi } from "vitest"
import { BudgetPeriodController } from "./budget-period.controller"
import type { BudgetPeriodService } from "./budget-period.service"
import type { BudgetPeriod } from "./entities/budget-period.entity"

const mockBudgetPeriod: BudgetPeriod = {
	id: "uuid-1",
	year: 2026,
	month: 3,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockService: BudgetPeriodService = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	delete: vi.fn()
} as unknown as BudgetPeriodService

describe("BudgetPeriodController", () => {
	let controller: BudgetPeriodController

	beforeEach(() => {
		vi.clearAllMocks()
		controller = new BudgetPeriodController(mockService)
	})

	describe("findAll", () => {
		it("should delegate to service.findAll", async () => {
			vi.mocked(mockService.findAll).mockResolvedValue([mockBudgetPeriod])
			const result = await controller.findAll()
			expect(result).toEqual([mockBudgetPeriod])
			expect(mockService.findAll).toHaveBeenCalledOnce()
		})
	})

	describe("findById", () => {
		it("should delegate to service.findById with the given id", async () => {
			vi.mocked(mockService.findById).mockResolvedValue(mockBudgetPeriod)
			const result = await controller.findById("uuid-1")
			expect(result).toEqual(mockBudgetPeriod)
			expect(mockService.findById).toHaveBeenCalledWith("uuid-1")
		})
	})

	describe("create", () => {
		it("should delegate to service.create with the dto", async () => {
			const dto = { year: 2026, month: 3 }
			vi.mocked(mockService.create).mockResolvedValue(mockBudgetPeriod)
			const result = await controller.create(dto)
			expect(result).toEqual(mockBudgetPeriod)
			expect(mockService.create).toHaveBeenCalledWith(dto)
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
