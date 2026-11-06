import { type DateToken, type Db, loadJson, resolveDate } from "./helpers"

export async function seedInstallmentGroups(db: Db) {
	const rows = loadJson<{
		id: string
		description: string
		amountPerInstallment: number
		totalInstallments: number
		paymentIntervalDays: number
		firstPurchasedAt: DateToken
	}>("installment-groups.json")
	await db.installmentGroup.createMany({
		data: rows.map((g) => ({
			...g,
			firstPurchasedAt: resolveDate(g.firstPurchasedAt)
		}))
	})
	console.log(`  installment_groups: ${rows.length}`)
}
