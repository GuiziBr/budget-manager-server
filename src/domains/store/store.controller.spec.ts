import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Store } from "./entities/store.entity"
import { StoreController } from "./store.controller"
import type { StoreService } from "./store.service"

const mockStore: Store = {
	id: "uuid-1",
	name: "Mercado Livre",
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockService: StoreService = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
} as unknown as StoreService

describe("StoreController", () => {
	let controller: StoreController

	beforeEach(() => {
		vi.clearAllMocks()
		controller = new StoreController(mockService)
	})

	describe("findAll", () => {
		it("should delegate to service.findAll", async () => {
			vi.mocked(mockService.findAll).mockResolvedValue([mockStore])
			const result = await controller.findAll()
			expect(result).toEqual([mockStore])
			expect(mockService.findAll).toHaveBeenCalledOnce()
		})
	})

	describe("findById", () => {
		it("should delegate to service.findById with the given id", async () => {
			vi.mocked(mockService.findById).mockResolvedValue(mockStore)
			const result = await controller.findById("uuid-1")
			expect(result).toEqual(mockStore)
			expect(mockService.findById).toHaveBeenCalledWith("uuid-1")
		})
	})

	describe("create", () => {
		it("should delegate to service.create with the dto", async () => {
			const dto = { name: "Mercado Livre" }
			vi.mocked(mockService.create).mockResolvedValue(mockStore)
			const result = await controller.create(dto)
			expect(result).toEqual(mockStore)
			expect(mockService.create).toHaveBeenCalledWith(dto)
		})
	})

	describe("update", () => {
		it("should delegate to service.update with id and dto", async () => {
			const dto = { name: "Amazon" }
			const updated = { ...mockStore, name: "Amazon" }
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
