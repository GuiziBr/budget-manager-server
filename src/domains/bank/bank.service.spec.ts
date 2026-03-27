import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BankService } from "./bank.service"
import type { Bank } from "./entities/bank.entity"
import type { BankRepository } from "./repositories/bank.repository"

const mockBank: Bank = {
	id: "uuid-1",
	name: "Nubank",
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: BankRepository = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}

describe("BankService", () => {
	let service: BankService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new BankService(mockRepository)
	})

	describe("findAll", () => {
		it("should return all banks", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockBank])
			const result = await service.findAll()
			expect(result).toEqual([mockBank])
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
		it("should return a bank when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBank)
			const result = await service.findById("uuid-1")
			expect(result).toEqual(mockBank)
			expect(mockRepository.findById).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when bank not found", async () => {
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
		it("should create and return a bank", async () => {
			const dto = { name: "Nubank" }
			vi.mocked(mockRepository.create).mockResolvedValue(mockBank)
			const result = await service.create(dto)
			expect(result).toEqual(mockBank)
			expect(mockRepository.create).toHaveBeenCalledWith(dto)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.create).mockRejectedValue(new Error("DB down"))
			await expect(service.create({ name: "Nubank" })).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("update", () => {
		it("should update and return the bank", async () => {
			const dto = { name: "Itaú" }
			const updated = { ...mockBank, name: "Itaú" }
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBank)
			vi.mocked(mockRepository.update).mockResolvedValue(updated)
			const result = await service.update("uuid-1", dto)
			expect(result).toEqual(updated)
			expect(mockRepository.update).toHaveBeenCalledWith("uuid-1", dto)
		})

		it("should throw NotFoundException when bank not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(
				service.update("uuid-missing", { name: "x" })
			).rejects.toThrow(NotFoundException)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBank)
			vi.mocked(mockRepository.update).mockRejectedValue(new Error("DB down"))
			await expect(service.update("uuid-1", { name: "x" })).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("delete", () => {
		it("should delete the bank", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBank)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("uuid-1")
			expect(mockRepository.delete).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when bank not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("uuid-missing")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBank)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
