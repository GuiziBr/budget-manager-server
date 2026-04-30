import { Injectable } from "@nestjs/common"
import type { InstallmentGroup } from "@/domains/installment-group/entities/installment-group.entity"
import {
	InstallmentGroupRepository,
	type UpdateInstallmentGroupData
} from "@/domains/installment-group/repositories/installment-group.repository"
import { DatabaseService } from "@/infra/database/database.service"

type PrismaInstallmentGroupRow = {
	id: string
	description: string
	amountPerInstallment: { toNumber(): number }
	totalInstallments: number
	paymentIntervalDays: number
	firstPurchaseDate: Date
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}

@Injectable()
export class PrismaInstallmentGroupRepository extends InstallmentGroupRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	private mapToInstallmentGroup(
		row: PrismaInstallmentGroupRow
	): InstallmentGroup {
		return {
			...row,
			amountPerInstallment: row.amountPerInstallment.toNumber()
		}
	}

	async findById(id: string): Promise<InstallmentGroup | null> {
		const row = await this.db.installmentGroup.findFirst({
			where: { id, deletedAt: null }
		})
		if (!row) return null
		return this.mapToInstallmentGroup(row)
	}

	async update(
		id: string,
		data: UpdateInstallmentGroupData,
		currentYear: number,
		currentMonth: number
	): Promise<InstallmentGroup> {
		return this.db.$transaction(async (tx) => {
			await tx.installmentGroup.update({
				where: { id, deletedAt: null },
				data: {
					...(data.amountPerInstallment !== undefined && {
						amountPerInstallment: data.amountPerInstallment
					}),
					...(data.totalInstallments !== undefined && {
						totalInstallments: data.totalInstallments
					})
				}
			})

			if (data.amountPerInstallment !== undefined) {
				await tx.expense.updateMany({
					where: {
						installmentGroupId: id,
						deletedAt: null,
						budgetPeriod: {
							OR: [
								{ year: { gt: currentYear } },
								{ year: currentYear, month: { gte: currentMonth } }
							]
						}
					},
					data: { amount: data.amountPerInstallment }
				})
			}

			const updated = await tx.installmentGroup.findFirstOrThrow({
				where: { id, deletedAt: null }
			})
			return this.mapToInstallmentGroup(updated)
		})
	}
}
