import {
	InternalServerErrorException,
	NotFoundException,
	UnprocessableEntityException
} from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BudgetPeriodService } from "@/domains/budget-period/budget-period.service"
import type { Income } from "./entities/income.entity"
import { IncomeService } from "./income.service"
import type { IncomeRepository } from "./repositories/income.repository"

const mockIncome: Income = {
	id: "uuid-1",
	budgetPeriodId: "period-uuid-1",
	description: "Monthly salary",
	amount: 5000,
	isSalary: true,
	receivedDate: new Date("2026-04-01"),
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: IncomeRepository = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}

const mockBudgetPeriodService = {
	findById: vi.fn()
} as unknown as BudgetPeriodService

describe("IncomeService", () => {
	let service: IncomeService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new IncomeService(mockRepository, mockBudgetPeriodService)
	})

	describe("findAll", () => {
		it("should return all incomes", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockIncome])
			const result = await service.findAll()
			expect(result).toEqual([mockIncome])
			expect(mockRepository.findAll).toHaveBeenCalledWith(undefined)
		})

		it("should filter by budgetPeriodId when provided", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockIncome])
			const result = await service.findAll("period-uuid-1")
			expect(result).toEqual([mockIncome])
			expect(mockRepository.findAll).toHaveBeenCalledWith("period-uuid-1")
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findAll).mockRejectedValue(new Error("DB down"))
			await expect(service.findAll()).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("findById", () => {
		it("should return an income when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockIncome)
			const result = await service.findById("uuid-1")
			expect(result).toEqual(mockIncome)
			expect(mockRepository.findById).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when income not found", async () => {
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
		const dto = {
			budgetPeriodId: "period-uuid-1",
			description: "Monthly salary",
			amount: 5000,
			isSalary: true,
			receivedDate: "2026-04-01"
		}

		it("should create and return an income", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue({} as never)
			vi.mocked(mockRepository.create).mockResolvedValue(mockIncome)
			const result = await service.create(dto)
			expect(result).toEqual(mockIncome)
			expect(mockBudgetPeriodService.findById).toHaveBeenCalledWith(
				"period-uuid-1"
			)
			expect(mockRepository.create).toHaveBeenCalledWith(dto)
		})

		it("should throw NotFoundException when budget period not found", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockRejectedValue(
				new NotFoundException("Budget period with id period-uuid-1 not found")
			)
			await expect(service.create(dto)).rejects.toThrow(NotFoundException)
			expect(mockRepository.create).not.toHaveBeenCalled()
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue({} as never)
			vi.mocked(mockRepository.create).mockRejectedValue(new Error("DB down"))
			await expect(service.create(dto)).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("update", () => {
		it("should update and return the income when the budget period is in the current month", async () => {
			const dto = { description: "Updated salary", amount: 6000 }
			const updated = { ...mockIncome, ...dto }
			vi.mocked(mockRepository.findById).mockResolvedValue(mockIncome)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue({
				year: 2026,
				month: 4
			} as never)
			vi.mocked(mockRepository.update).mockResolvedValue(updated)
			const result = await service.update("uuid-1", dto)
			expect(result).toEqual(updated)
			expect(mockRepository.update).toHaveBeenCalledWith("uuid-1", dto)
		})

		it("should throw UnprocessableEntityException when the budget period is in a past month", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockIncome)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue({
				year: 2026,
				month: 3
			} as never)
			await expect(
				service.update("uuid-1", { description: "x" })
			).rejects.toThrow(UnprocessableEntityException)
			expect(mockRepository.update).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when income not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(
				service.update("uuid-missing", { description: "x" })
			).rejects.toThrow(NotFoundException)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockIncome)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue({
				year: 2026,
				month: 4
			} as never)
			vi.mocked(mockRepository.update).mockRejectedValue(new Error("DB down"))
			await expect(
				service.update("uuid-1", { description: "x" })
			).rejects.toThrow(InternalServerErrorException)
		})
	})

	describe("delete", () => {
		it("should delete the income when the budget period is in the current month", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockIncome)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue({
				year: 2026,
				month: 4
			} as never)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("uuid-1")
			expect(mockRepository.delete).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw UnprocessableEntityException when the budget period is in a past month", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockIncome)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue({
				year: 2026,
				month: 3
			} as never)
			await expect(service.delete("uuid-1")).rejects.toThrow(
				UnprocessableEntityException
			)
			expect(mockRepository.delete).not.toHaveBeenCalled()
		})

		it("should throw UnprocessableEntityException when the budget period is in a past year", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockIncome)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue({
				year: 2025,
				month: 12
			} as never)
			await expect(service.delete("uuid-1")).rejects.toThrow(
				UnprocessableEntityException
			)
			expect(mockRepository.delete).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when income not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("uuid-missing")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockIncome)
			vi.mocked(mockBudgetPeriodService.findById).mockResolvedValue({
				year: 2026,
				month: 4
			} as never)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
