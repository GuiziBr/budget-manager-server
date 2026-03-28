import {
	ConflictException,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
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
	findByYearAndMonth: vi.fn(),
	hasLinkedRecords: vi.fn(),
	create: vi.fn(),
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
		it("should create and return a budget period when no duplicate exists", async () => {
			const dto = { year: 2026, month: 3 }
			vi.mocked(mockRepository.findByYearAndMonth).mockResolvedValue(null)
			vi.mocked(mockRepository.create).mockResolvedValue(mockBudgetPeriod)
			const result = await service.create(dto)
			expect(result).toEqual(mockBudgetPeriod)
			expect(mockRepository.findByYearAndMonth).toHaveBeenCalledWith(2026, 3)
			expect(mockRepository.create).toHaveBeenCalledWith(dto)
		})

		it("should throw ConflictException when a period for the same year/month already exists", async () => {
			vi.mocked(mockRepository.findByYearAndMonth).mockResolvedValue(
				mockBudgetPeriod
			)
			await expect(service.create({ year: 2026, month: 3 })).rejects.toThrow(
				ConflictException
			)
			expect(mockRepository.create).not.toHaveBeenCalled()
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findByYearAndMonth).mockRejectedValue(
				new Error("DB down")
			)
			await expect(service.create({ year: 2026, month: 3 })).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("delete", () => {
		it("should delete the budget period when no linked records exist", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			vi.mocked(mockRepository.hasLinkedRecords).mockResolvedValue(false)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("uuid-1")
			expect(mockRepository.hasLinkedRecords).toHaveBeenCalledWith("uuid-1")
			expect(mockRepository.delete).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw ConflictException when the period has linked records", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			vi.mocked(mockRepository.hasLinkedRecords).mockResolvedValue(true)
			await expect(service.delete("uuid-1")).rejects.toThrow(ConflictException)
			expect(mockRepository.delete).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when budget period not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("uuid-missing")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockBudgetPeriod)
			vi.mocked(mockRepository.hasLinkedRecords).mockResolvedValue(false)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
