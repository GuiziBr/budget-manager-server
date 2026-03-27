import { beforeEach, describe, expect, it, vi } from "vitest"
import { BankController } from "./bank.controller"
import type { BankService } from "./bank.service"
import type { Bank } from "./entities/bank.entity"

const mockBank: Bank = {
	id: "uuid-1",
	name: "Nubank",
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockService: BankService = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
} as unknown as BankService

describe("BankController", () => {
	let controller: BankController

	beforeEach(() => {
		vi.clearAllMocks()
		controller = new BankController(mockService)
	})

	describe("findAll", () => {
		it("should delegate to service.findAll", async () => {
			vi.mocked(mockService.findAll).mockResolvedValue([mockBank])
			const result = await controller.findAll()
			expect(result).toEqual([mockBank])
			expect(mockService.findAll).toHaveBeenCalledOnce()
		})
	})

	describe("findById", () => {
		it("should delegate to service.findById with the given id", async () => {
			vi.mocked(mockService.findById).mockResolvedValue(mockBank)
			const result = await controller.findById("uuid-1")
			expect(result).toEqual(mockBank)
			expect(mockService.findById).toHaveBeenCalledWith("uuid-1")
		})
	})

	describe("create", () => {
		it("should delegate to service.create with the dto", async () => {
			const dto = { name: "Nubank" }
			vi.mocked(mockService.create).mockResolvedValue(mockBank)
			const result = await controller.create(dto)
			expect(result).toEqual(mockBank)
			expect(mockService.create).toHaveBeenCalledWith(dto)
		})
	})

	describe("update", () => {
		it("should delegate to service.update with id and dto", async () => {
			const dto = { name: "Itaú" }
			const updated = { ...mockBank, name: "Itaú" }
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
