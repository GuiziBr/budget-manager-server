import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { BudgetPeriodService } from "./budget-period.service"
import type { BudgetPeriod } from "./entities/budget-period.entity"
import type { BudgetPeriodRepository } from "./repositories/budget-period.repository"

const mockBudgetPeriod: BudgetPeriod = {
	id: "uuid-1",
	year: 2026,
	month: 3,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: BudgetPeriodRepository = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}

describe("BudgetPeriodService", () => {
	let service: BudgetPeriodService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new BudgetPeriodService(mockRepository)
	})

	describe("findAll", () => {
		it("should return all budget periods", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockBudgetPeriod])
			const result = await service.findAll()
			expect(result).toEqual([mockBudgetPeriod])
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
		it("should return a budget period when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			const result = await service.findById("uuid-1")
			expect(result).toEqual(mockBudgetPeriod)
			expect(mockRepository.findById).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when budget period not found", async () => {
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
		it("should create and return a budget period", async () => {
			const dto = { year: 2026, month: 3 }
			vi.mocked(mockRepository.create).mockResolvedValue(mockBudgetPeriod)
			const result = await service.create(dto)
			expect(result).toEqual(mockBudgetPeriod)
			expect(mockRepository.create).toHaveBeenCalledWith(dto)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.create).mockRejectedValue(new Error("DB down"))
			await expect(service.create({ year: 2026, month: 3 })).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("update", () => {
		it("should update and return the budget period", async () => {
			const dto = { month: 4 }
			const updated = { ...mockBudgetPeriod, month: 4 }
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			vi.mocked(mockRepository.update).mockResolvedValue(updated)
			const result = await service.update("uuid-1", dto)
			expect(result).toEqual(updated)
			expect(mockRepository.update).toHaveBeenCalledWith("uuid-1", dto)
		})

		it("should throw NotFoundException when budget period not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(
				service.update("uuid-missing", { month: 4 })
			).rejects.toThrow(NotFoundException)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			vi.mocked(mockRepository.update).mockRejectedValue(new Error("DB down"))
			await expect(service.update("uuid-1", { month: 4 })).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("delete", () => {
		it("should delete the budget period", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("uuid-1")
			expect(mockRepository.delete).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when budget period not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("uuid-missing")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
