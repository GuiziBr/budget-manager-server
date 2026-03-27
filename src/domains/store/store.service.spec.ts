import {
	ConflictException,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Store } from "./entities/store.entity"
import type { StoreRepository } from "./repositories/store.repository"
import { StoreService } from "./store.service"

const mockStore: Store = {
	id: "uuid-1",
	name: "Mercado Livre",
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: StoreRepository = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}

describe("StoreService", () => {
	let service: StoreService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new StoreService(mockRepository)
	})

	describe("findAll", () => {
		it("should return all stores", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockStore])
			const result = await service.findAll()
			expect(result).toEqual([mockStore])
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
		it("should return a store when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockStore)
			const result = await service.findById("uuid-1")
			expect(result).toEqual(mockStore)
			expect(mockRepository.findById).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when store not found", async () => {
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
		it("should create and return a store", async () => {
			const dto = { name: "Mercado Livre" }
			vi.mocked(mockRepository.create).mockResolvedValue(mockStore)
			const result = await service.create(dto)
			expect(result).toEqual(mockStore)
			expect(mockRepository.create).toHaveBeenCalledWith(dto)
		})

		it("should propagate ConflictException when repository throws it (duplicate name)", async () => {
			vi.mocked(mockRepository.create).mockRejectedValue(
				new ConflictException("A store named 'Mercado Livre' already exists")
			)
			await expect(service.create({ name: "Mercado Livre" })).rejects.toThrow(
				ConflictException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.create).mockRejectedValue(new Error("DB down"))
			await expect(service.create({ name: "Mercado Livre" })).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("update", () => {
		it("should update and return the store", async () => {
			const dto = { name: "Amazon" }
			const updated = { ...mockStore, name: "Amazon" }
			vi.mocked(mockRepository.findById).mockResolvedValue(mockStore)
			vi.mocked(mockRepository.update).mockResolvedValue(updated)
			const result = await service.update("uuid-1", dto)
			expect(result).toEqual(updated)
			expect(mockRepository.update).toHaveBeenCalledWith("uuid-1", dto)
		})

		it("should throw NotFoundException when store not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(
				service.update("uuid-missing", { name: "x" })
			).rejects.toThrow(NotFoundException)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockStore)
			vi.mocked(mockRepository.update).mockRejectedValue(new Error("DB down"))
			await expect(service.update("uuid-1", { name: "x" })).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("delete", () => {
		it("should delete the store", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockStore)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("uuid-1")
			expect(mockRepository.delete).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when store not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("uuid-missing")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockStore)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
