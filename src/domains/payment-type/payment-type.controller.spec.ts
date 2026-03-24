import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PaymentType } from "./entities/payment-type.entity"
import { PaymentTypeController } from "./payment-type.controller"
import type { PaymentTypeService } from "./payment-type.service"

const mockPaymentType: PaymentType = {
	id: "uuid-1",
	name: "Credit Card",
	hasStatement: true,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockService: PaymentTypeService = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
} as unknown as PaymentTypeService

describe("PaymentTypeController", () => {
	let controller: PaymentTypeController

	beforeEach(() => {
		vi.clearAllMocks()
		controller = new PaymentTypeController(mockService)
	})

	describe("findAll", () => {
		it("should delegate to service.findAll", async () => {
			vi.mocked(mockService.findAll).mockResolvedValue([mockPaymentType])
			const result = await controller.findAll()
			expect(result).toEqual([mockPaymentType])
			expect(mockService.findAll).toHaveBeenCalledOnce()
		})
	})

	describe("findById", () => {
		it("should delegate to service.findById with the given id", async () => {
			vi.mocked(mockService.findById).mockResolvedValue(mockPaymentType)
			const result = await controller.findById("uuid-1")
			expect(result).toEqual(mockPaymentType)
			expect(mockService.findById).toHaveBeenCalledWith("uuid-1")
		})
	})

	describe("create", () => {
		it("should delegate to service.create with the dto", async () => {
			const dto = { name: "Credit Card", hasStatement: true }
			vi.mocked(mockService.create).mockResolvedValue(mockPaymentType)
			const result = await controller.create(dto)
			expect(result).toEqual(mockPaymentType)
			expect(mockService.create).toHaveBeenCalledWith(dto)
		})
	})

	describe("update", () => {
		it("should delegate to service.update with id and dto", async () => {
			const dto = { name: "Debit Card" }
			const updated = { ...mockPaymentType, name: "Debit Card" }
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
