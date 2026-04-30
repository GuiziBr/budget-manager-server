import { NotFoundException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { InstallmentGroup } from "./entities/installment-group.entity"
import { InstallmentGroupController } from "./installment-group.controller"
import type { InstallmentGroupService } from "./installment-group.service"

const mockGroup: InstallmentGroup = {
	id: "group-uuid-1",
	description: "Laptop",
	amountPerInstallment: 200,
	totalInstallments: 3,
	paymentIntervalDays: 30,
	firstPurchaseDate: new Date("2026-04-01"),
	createdAt: new Date(),
	updatedAt: new Date(),
	deletedAt: null
}

const mockService: InstallmentGroupService = {
	findById: vi.fn(),
	update: vi.fn()
} as unknown as InstallmentGroupService

describe("InstallmentGroupController", () => {
	let controller: InstallmentGroupController

	beforeEach(() => {
		vi.clearAllMocks()
		controller = new InstallmentGroupController(mockService)
	})

	describe("findById", () => {
		it("should return the group from the service", async () => {
			vi.mocked(mockService.findById).mockResolvedValue(mockGroup)
			const result = await controller.findById("group-uuid-1")
			expect(result).toEqual(mockGroup)
			expect(mockService.findById).toHaveBeenCalledWith("group-uuid-1")
		})

		it("should propagate NotFoundException from service", async () => {
			vi.mocked(mockService.findById).mockRejectedValue(new NotFoundException())
			await expect(controller.findById("group-uuid-1")).rejects.toThrow(
				NotFoundException
			)
		})
	})

	describe("update", () => {
		it("should return the updated group from the service", async () => {
			const updated = { ...mockGroup, amountPerInstallment: 250 }
			vi.mocked(mockService.update).mockResolvedValue(updated)
			const result = await controller.update("group-uuid-1", {
				amountPerInstallment: 250
			})
			expect(result).toEqual(updated)
			expect(mockService.update).toHaveBeenCalledWith("group-uuid-1", {
				amountPerInstallment: 250
			})
		})

		it("should propagate NotFoundException from service", async () => {
			vi.mocked(mockService.update).mockRejectedValue(new NotFoundException())
			await expect(
				controller.update("group-uuid-1", { totalInstallments: 6 })
			).rejects.toThrow(NotFoundException)
		})
	})
})
