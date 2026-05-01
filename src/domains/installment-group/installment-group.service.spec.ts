import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { InstallmentGroup } from "./entities/installment-group.entity"
import { InstallmentGroupService } from "./installment-group.service"
import type { InstallmentGroupRepository } from "./repositories/installment-group.repository"

const mockGroup: InstallmentGroup = {
	id: "group-uuid-1",
	description: "Laptop",
	amountPerInstallment: 200,
	totalInstallments: 3,
	paymentIntervalDays: 30,
	firstPurchasedAt: new Date("2026-04-01"),
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockRepository: InstallmentGroupRepository = {
	findById: vi.fn(),
	update: vi.fn()
} as unknown as InstallmentGroupRepository

describe("InstallmentGroupService", () => {
	let service: InstallmentGroupService

	beforeEach(() => {
		vi.clearAllMocks()
		service = new InstallmentGroupService(mockRepository)
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe("findById", () => {
		it("should return the group when found", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockGroup)
			const result = await service.findById("group-uuid-1")
			expect(result).toEqual(mockGroup)
			expect(mockRepository.findById).toHaveBeenCalledWith("group-uuid-1")
		})

		it("should throw NotFoundException when group does not exist", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(service.findById("group-uuid-1")).rejects.toThrow(
				NotFoundException
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockRejectedValue(
				new Error("db error")
			)
			await expect(service.findById("group-uuid-1")).rejects.toThrow(
				InternalServerErrorException
			)
		})
	})

	describe("update", () => {
		it("should throw NotFoundException when group does not exist", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(null)
			await expect(
				service.update("group-uuid-1", { amountPerInstallment: 250 })
			).rejects.toThrow(NotFoundException)
		})

		it("should update amountPerInstallment and pass current year/month", async () => {
			vi.setSystemTime(new Date("2026-04-15T12:00:00Z"))
			vi.mocked(mockRepository.findById).mockResolvedValue(mockGroup)
			const updated = { ...mockGroup, amountPerInstallment: 250 }
			vi.mocked(mockRepository.update).mockResolvedValue(updated)

			const result = await service.update("group-uuid-1", {
				amountPerInstallment: 250
			})

			expect(result).toEqual(updated)
			expect(mockRepository.update).toHaveBeenCalledWith(
				"group-uuid-1",
				{ amountPerInstallment: 250 },
				2026,
				4
			)
		})

		it("should update totalInstallments without cascade", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockGroup)
			const updated = { ...mockGroup, totalInstallments: 6 }
			vi.mocked(mockRepository.update).mockResolvedValue(updated)

			const result = await service.update("group-uuid-1", {
				totalInstallments: 6
			})

			expect(result).toEqual(updated)
			expect(mockRepository.update).toHaveBeenCalledWith(
				"group-uuid-1",
				{ totalInstallments: 6 },
				expect.any(Number),
				expect.any(Number)
			)
		})

		it("should throw InternalServerErrorException on unexpected error", async () => {
			vi.mocked(mockRepository.findById).mockResolvedValue(mockGroup)
			vi.mocked(mockRepository.update).mockRejectedValue(new Error("db error"))
			await expect(
				service.update("group-uuid-1", { amountPerInstallment: 250 })
			).rejects.toThrow(InternalServerErrorException)
		})
	})
})
