import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Income } from "./entities/income.entity"
import { IncomeController } from "./income.controller"
import type { IncomeService } from "./income.service"

const mockIncome: Income = {
	id: "uuid-1",
	budgetPeriodId: "period-uuid-1",
	description: "Monthly salary",
	amount: 5000,
	isSalary: true,
	receivedAt: new Date("2026-04-01"),
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockService: IncomeService = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
} as unknown as IncomeService

describe("IncomeController", () => {
	let controller: IncomeController

	beforeEach(() => {
		vi.clearAllMocks()
		controller = new IncomeController(mockService)
	})

	describe("findAll", () => {
		it("should delegate to service.findAll without filter", async () => {
			vi.mocked(mockService.findAll).mockResolvedValue([mockIncome])
			const result = await controller.findAll()
			expect(result).toEqual([mockIncome])
			expect(mockService.findAll).toHaveBeenCalledWith(undefined)
		})

		it("should delegate to service.findAll with budgetPeriodId filter", async () => {
			vi.mocked(mockService.findAll).mockResolvedValue([mockIncome])
			const result = await controller.findAll("period-uuid-1")
			expect(result).toEqual([mockIncome])
			expect(mockService.findAll).toHaveBeenCalledWith("period-uuid-1")
		})
	})

	describe("findById", () => {
		it("should delegate to service.findById with the given id", async () => {
			vi.mocked(mockService.findById).mockResolvedValue(mockIncome)
			const result = await controller.findById("uuid-1")
			expect(result).toEqual(mockIncome)
			expect(mockService.findById).toHaveBeenCalledWith("uuid-1")
		})
	})

	describe("create", () => {
		it("should delegate to service.create with the dto", async () => {
			const dto = {
				budgetPeriodId: "period-uuid-1",
				description: "Monthly salary",
				amount: 5000,
				isSalary: true,
				receivedAt: "2026-04-01"
			}
			vi.mocked(mockService.create).mockResolvedValue(mockIncome)
			const result = await controller.create(dto)
			expect(result).toEqual(mockIncome)
			expect(mockService.create).toHaveBeenCalledWith(dto)
		})
	})

	describe("update", () => {
		it("should delegate to service.update with id and dto", async () => {
			const dto = { description: "Updated salary", amount: 6000 }
			const updated = { ...mockIncome, ...dto }
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
