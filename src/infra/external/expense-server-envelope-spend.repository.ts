import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { z } from "zod"
import { EnvelopeSpendRepository } from "@/domains/budget-envelope/repositories/envelope-spend.repository"
import type { Env } from "@/infra/env"

const REQUEST_TIMEOUT_MS = 3000

const responseSchema = z.array(
	z.object({
		id: z.string(),
		total: z.number()
	})
)

@Injectable()
export class ExpenseServerEnvelopeSpendRepository
	implements EnvelopeSpendRepository
{
	constructor(private readonly config: ConfigService<Env, true>) {}

	async findByMonth(year: number, month: number): Promise<Map<string, number>> {
		const baseUrl = this.config.get("EXPENSE_API_URL", { infer: true })
		const userId = this.config.get("EXPENSE_API_USER_ID", { infer: true })
		const url = new URL(`/balance/envelopes/${year}/${month}`, baseUrl)
		url.searchParams.set("userId", userId)

		const response = await fetch(url, {
			headers: {
				"x-api-key": this.config.get("EXPENSE_API_KEY", { infer: true })
			},
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
		})
		if (!response.ok) {
			throw new Error(`Expense server responded with status ${response.status}`)
		}

		const items = responseSchema.parse(await response.json())
		// The external API returns amounts in cents
		return new Map(items.map((item) => [item.id, item.total / 100]))
	}
}
