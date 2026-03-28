import {
	ConflictException,
	InternalServerErrorException,
	NotFoundException
} from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PaymentType } from "./entities/payment-type.entity"
import { PaymentTypeService } from "./payment-type.service"
import type { PaymentTypeRepository } from "./repositories/payment-type.repository"

const mockPaymentType: PaymentType = {
	id: "uuid-1",
	name: "Credit Card",
	hasStatement: true,
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: PaymentTypeRepository = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn()
}

describe("PaymentTypeService", () => {
	let service: PaymentTypeService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new PaymentTypeService(mockRepository)
	})

	describe("findAll", () => {
		it("should return all payment types", async () => {
			vi.mocked(mockRepository.findAll).mockResolvedValue([mockPaymentType])
			const result = await service.findAll()
			expect(result).toEqual([mockPaymentType])
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
		it("should return a payment type when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockPaymentType)
			const result = await service.findById("uuid-1")
			expect(result).toEqual(mockPaymentType)
			expect(mockRepository.findById).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when payment type not found", async () => {
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
		it("should create and return a payment type", async () => {
			const dto = { name: "Credit Card", hasStatement: true }
			vi.mocked(mockRepository.create).mockResolvedValue(mockPaymentType)
			const result = await service.create(dto)
			expect(result).toEqual(mockPaymentType)
			expect(mockRepository.create).toHaveBeenCalledWith(dto)
		})

		it("should propagate ConflictException when repository throws it (duplicate name)", async () => {
			vi.mocked(mockRepository.create).mockRejectedValue(
				new ConflictException(
					"A payment type named 'Credit Card' already exists"
				)
			)
			await expect(
				service.create({ name: "Credit Card", hasStatement: true })
			).rejects.toThrow(ConflictException)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.create).mockRejectedValue(new Error("DB down"))
			await expect(
				service.create({ name: "Credit Card", hasStatement: true })
			).rejects.toThrow(InternalServerErrorException)
		})
	})

	describe("update", () => {
		it("should update and return the payment type", async () => {
			const dto = { name: "Debit Card" }
			const updated = { ...mockPaymentType, name: "Debit Card" }
			vi.mocked(mockRepository.findById).mockResolvedValue(mockPaymentType)
			vi.mocked(mockRepository.update).mockResolvedValue(updated)
			const result = await service.update("uuid-1", dto)
			expect(result).toEqual(updated)
			expect(mockRepository.update).toHaveBeenCalledWith("uuid-1", dto)
		})

		it("should throw NotFoundException when payment type not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(
				service.update("uuid-missing", { name: "x" })
			).rejects.toThrow(NotFoundException)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockPaymentType)
			vi.mocked(mockRepository.update).mockRejectedValue(new Error("DB down"))
			await expect(service.update("uuid-1", { name: "x" })).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("delete", () => {
		it("should delete the payment type", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockPaymentType)
			vi.mocked(mockRepository.delete).mockResolvedValue(undefined)
			await service.delete("uuid-1")
			expect(mockRepository.delete).toHaveBeenCalledWith("uuid-1")
		})

		it("should throw NotFoundException when payment type not found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.delete("uuid-missing")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockPaymentType)
			vi.mocked(mockRepository.delete).mockRejectedValue(new Error("DB down"))
			await expect(service.delete("uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})
})
