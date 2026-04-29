import { beforeEach, describe, expect, it, vi } from "vitest"
import { BudgetEnvelopeController } from "./budget-envelope.controller"
import type { BudgetEnvelopeService } from "./budget-envelope.service"
import type { BudgetEnvelope } from "./entities/budget-envelope.entity"

const mockEnvelope: BudgetEnvelope = {
	id: "envelope-uuid",
	budgetPeriodId: "period-uuid",
	categoryId: "category-uuid",
	allocatedAmount: 500,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockService: BudgetEnvelopeService = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
} as unknown as BudgetEnvelopeService

describe("BudgetEnvelopeController", () => {
	let controller: BudgetEnvelopeController

	beforeEach(() => {
		vi.clearAllMocks()
		controller = new BudgetEnvelopeController(mockService)
	})

	describe("findAll", () => {
		it("should delegate to service.findAll without filter", async () => {
			vi.mocked(mockService.findAll).mockResolvedValue([mockEnvelope])
			const result = await controller.findAll()
			expect(result).toEqual([mockEnvelope])
			expect(mockService.findAll).toHaveBeenCalledWith(undefined)
		})

		it("should delegate to service.findAll with budgetPeriodId", async () => {
			vi.mocked(mockService.findAll).mockResolvedValue([mockEnvelope])
			await controller.findAll("period-uuid")
			expect(mockService.findAll).toHaveBeenCalledWith("period-uuid")
		})
	})

	describe("findById", () => {
		it("should delegate to service.findById with the given id", async () => {
			vi.mocked(mockService.findById).mockResolvedValue(mockEnvelope)
			const result = await controller.findById("envelope-uuid")
			expect(result).toEqual(mockEnvelope)
			expect(mockService.findById).toHaveBeenCalledWith("envelope-uuid")
		})
	})

	describe("create", () => {
		it("should delegate to service.create with the dto", async () => {
			const dto = {
				budgetPeriodId: "period-uuid",
				categoryId: "category-uuid",
				allocatedAmount: 500
			}
			vi.mocked(mockService.create).mockResolvedValue(mockEnvelope)
			const result = await controller.create(dto)
			expect(result).toEqual(mockEnvelope)
			expect(mockService.create).toHaveBeenCalledWith(dto)
		})
	})

	describe("update", () => {
		it("should delegate to service.update with id and dto", async () => {
			const updated = { ...mockEnvelope, allocatedAmount: 600 }
			vi.mocked(mockService.update).mockResolvedValue(updated)
			const result = await controller.update("envelope-uuid", {
				allocatedAmount: 600
			})
			expect(result).toEqual(updated)
			expect(mockService.update).toHaveBeenCalledWith("envelope-uuid", {
				allocatedAmount: 600
			})
		})
	})

	describe("delete", () => {
		it("should delegate to service.delete with the given id", async () => {
			vi.mocked(mockService.delete).mockResolvedValue(undefined)
			await controller.delete("envelope-uuid")
			expect(mockService.delete).toHaveBeenCalledWith("envelope-uuid")
		})
	})
})
