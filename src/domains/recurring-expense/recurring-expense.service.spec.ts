import {
	BadRequestException,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BankService } from "@/domains/bank/bank.service"
import type { CategoryService } from "@/domains/category/category.service"
import type { PaymentTypeService } from "@/domains/payment-type/payment-type.service"
import type { StoreService } from "@/domains/store/store.service"
import type { RecurringExpense } from "./entities/recurring-expense.entity"
import { RecurringExpenseService } from "./recurring-expense.service"
import type { RecurringExpenseRepository } from "./repositories/recurring-expense.repository"

const mockRecurringExpense: RecurringExpense = {
	id: "uuid-1",
	categoryId: "cat-uuid-1",
	paymentTypeId: "pt-uuid-1",
	bankId: "bank-uuid-1",
	storeId: null,
	description: "Netflix",
	amount: 17.99,
	startedAt: new Date("2026-04-01"),
	cancelledAt: null,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: RecurringExpenseRepository = {
	findAll: vi.fn(),
	findById: vi.fn(),
	findActiveForPeriod: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}

const mockCategoryService = { findById: vi.fn() } as unknown as CategoryService
const mockPaymentTypeService = {
	findById: vi.fn()
} as unknown as PaymentTypeService
const mockBankService = { findById: vi.fn() } as unknown as BankService
const mockStoreService = { findById: vi.fn() } as unknown as StoreService

describe("RecurringExpenseService", () => {
	let service: RecurringExpenseService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new RecurringExpenseService(
			mockRepository,
			mockCategoryService,
			mockPaymentTypeService,
			mockBankService,
			mockStoreService
		)
	})

	describe("findAll", () => {
		it("should return all recurring expenses", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([
				mockRecurringExpense
			])
			const result = await service.findAll()
			expect(result).toEqual([mockRecurringExpense])
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
		it("should return a recurring expense when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockRecurringExpense)
			const result = await service.findById("uuid-1")
			expect(result).toEqual(mockRecurringExpense)
			expect(mockRepository.findById).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when not found", async () => {
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

	describe("findActiveForPeriod", () => {
		it("should return active recurring expenses for the given period", async () => {
			vi.mocked(mockRepository.findActiveForPeriod).mockResolvedValue([
				mockRecurringExpense
			])
			const result = await service.findActiveForPeriod(2026, 4)
			expect(result).toEqual([mockRecurringExpense])
			expect(mockRepository.findActiveForPeriod).toHaveBeenCalledWith(2026, 4)
		})

		it("should return an empty array when no active recurring expenses exist", async () => {
			vi.mocked(mockRepository.findActiveForPeriod).mockResolvedValue([])
			const result = await service.findActiveForPeriod(2026, 4)
			expect(result).toEqual([])
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findActiveForPeriod).mockRejectedValue(
				new Error("DB down")
			)
			await expect(service.findActiveForPeriod(2026, 4)).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("create", () => {
		const dto = {
			categoryId: "cat-uuid-1",
			paymentTypeId: "pt-uuid-1",
			bankId: "bank-uuid-1",
			storeId: null,
			description: "Netflix",
			amount: 17.99,
			startedAt: new Date("2026-04-01")
		}

		it("should create and return a recurring expense", async () => {
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue({} as never)
			vi.mocked(mockBankService.findById).mockResolvedValue({} as never)
			vi.mocked(mockRepository.create).mockResolvedValue(mockRecurringExpense)
			const result = await service.create(dto)
			expect(result).toEqual(mockRecurringExpense)
			expect(mockCategoryService.findById).toHaveBeenCalledWith("cat-uuid-1")
			expect(mockPaymentTypeService.findById).toHaveBeenCalledWith("pt-uuid-1")
			expect(mockBankService.findById).toHaveBeenCalledWith("bank-uuid-1")
			expect(mockStoreService.findById).not.toHaveBeenCalled()
		})

		it("should skip bankId validation when bankId is not provided", async () => {
			const dtoWithoutBank = { ...dto, bankId: undefined }
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue({} as never)
			vi.mocked(mockRepository.create).mockResolvedValue(mockRecurringExpense)
			await service.create(dtoWithoutBank)
			expect(mockBankService.findById).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when category not found", async () => {
			vi.mocked(mockCategoryService.findById).mockRejectedValue(
				new NotFoundException("Category not found")
			)
			await expect(service.create(dto)).rejects.toThrow(NotFoundException)
			expect(mockRepository.create).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when payment type not found", async () => {
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockRejectedValue(
				new NotFoundException("PaymentType not found")
			)
			await expect(service.create(dto)).rejects.toThrow(NotFoundException)
			expect(mockRepository.create).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when bank not found", async () => {
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue({} as never)
			vi.mocked(mockBankService.findById).mockRejectedValue(
				new NotFoundException("Bank not found")
			)
			await expect(service.create(dto)).rejects.toThrow(NotFoundException)
			expect(mockRepository.create).not.toHaveBeenCalled()
		})

		it("should validate storeId when provided", async () => {
			const dtoWithStore = { ...dto, storeId: "store-uuid-1" }
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue({} as never)
			vi.mocked(mockBankService.findById).mockResolvedValue({} as never)
			vi.mocked(mockStoreService.findById).mockResolvedValue({} as never)
			vi.mocked(mockRepository.create).mockResolvedValue(mockRecurringExpense)
			await service.create(dtoWithStore)
			expect(mockStoreService.findById).toHaveBeenCalledWith("store-uuid-1")
		})

		it("should throw NotFoundException when store not found", async () => {
			const dtoWithStore = { ...dto, storeId: "store-uuid-1" }
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue({} as never)
			vi.mocked(mockBankService.findById).mockResolvedValue({} as never)
			vi.mocked(mockStoreService.findById).mockRejectedValue(
				new NotFoundException("Store not found")
			)
			await expect(service.create(dtoWithStore)).rejects.toThrow(
				NotFoundException
			)
			expect(mockRepository.create).not.toHaveBeenCalled()
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockCategoryService.findById).mockResolvedValue({} as never)
			vi.mocked(mockPaymentTypeService.findById).mockResolvedValue({} as never)
			vi.mocked(mockBankService.findById).mockResolvedValue({} as never)
			vi.mocked(mockRepository.create).mockRejectedValue(new Error("DB down"))
			await expect(service.create(dto)).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("update", () => {
		it("should update and return the recurring expense", async () => {
			const dto = { description: "Netflix Premium", amount: 22.99 }
			const updated = { ...mockRecurringExpense, ...dto }
			vi.mocked(mockRepository.findById).mockResolvedValue(mockRecurringExpense)
			vi.mocked(mockRepository.update).mockResolvedValue(updated)
			const result = await service.update("uuid-1", dto)
			expect(result).toEqual(updated)
			expect(mockRepository.findById).toHaveBeenCalledWith("uuid-1")
			expect(mockRepository.update).toHaveBeenCalledWith("uuid-1", dto)
		})

		it("should accept a valid cancelledAt (current month or later)", async () => {
			const now = new Date()
			const cancelledAt = new Date(
				Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
			)
			const dto = { cancelledAt }
			const updated = { ...mockRecurringExpense, cancelledAt }
			vi.mocked(mockRepository.findById).mockResolvedValue(mockRecurringExpense)
			vi.mocked(mockRepository.update).mockResolvedValue(updated)
			const result = await service.update("uuid-1", dto)
			expect(result).toEqual(updated)
		})

		it("should throw BadRequestException when cancelledAt is in the past", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockRecurringExpense)
			await expect(
				service.update("uuid-1", { cancelledAt: new Date("2020-01-01") })
			).rejects.toThrow(BadRequestException)
			expect(mockRepository.update).not.toHaveBeenCalled()
		})

		it("should throw NotFoundException when recurring expense not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(
				service.update("uuid-missing", { description: "x" })
			).rejects.toThrow(NotFoundException)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockRecurringExpense)
			vi.mocked(mockRepository.update).mockRejectedValue(new Error("DB down"))
			await expect(
				service.update("uuid-1", { description: "x" })
			).rejects.toThrow(InternalServerErrorException)
		})
	})

	describe("delete", () => {
		it("should delete the recurring expense", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockRecurringExpense)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("uuid-1")
			expect(mockRepository.findById).toHaveBeenCalledWith("uuid-1")
			expect(mockRepository.delete).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("uuid-missing")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockRecurringExpense)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
