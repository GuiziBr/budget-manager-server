import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { Prisma } from "@prisma/client"

// Works with both the PrismaClient and a transaction client.
export type Db = Prisma.TransactionClient

export function loadJson<T>(filename: string): T[] {
	const filepath = join(__dirname, "..", "seed-data", filename)
	return JSON.parse(readFileSync(filepath, "utf-8")) as T[]
}

// Relative dates keep the seed data current. A date token is "<monthOffset>/<day>":
// the month is the run month shifted by monthOffset (0 = this month, -1 = last month),
// and the day is clamped to the length of that month.
export type DateToken = string

export function monthStart(monthOffset: number, base = new Date()) {
	return new Date(
		Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + monthOffset, 1)
	)
}

export function resolveDate(token: DateToken): Date {
	const [offset, day] = token.split("/").map(Number)
	const first = monthStart(offset)
	const year = first.getUTCFullYear()
	const month = first.getUTCMonth()
	const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
	return new Date(Date.UTC(year, month, Math.min(day, lastDay)))
}

export const optionalDate = (token?: DateToken) =>
	token ? resolveDate(token) : undefined

type NameRef = { id: string; name: string }

// Resolves a lookup name (e.g. "Grocery") to its id.
export function byName(rows: NameRef[], kind: string) {
	const map = new Map(rows.map((r) => [r.name, r.id]))
	return (name: string | undefined, required = false) => {
		if (!name) {
			if (required) {
				throw new Error(`Missing required ${kind} reference`)
			}
			return undefined
		}
		const id = map.get(name)
		if (!id) {
			throw new Error(`Unknown ${kind} "${name}" in seed data`)
		}
		return id
	}
}

export type LookupRefs = {
	category: ReturnType<typeof byName>
	paymentType: ReturnType<typeof byName>
	bank: ReturnType<typeof byName>
	store: ReturnType<typeof byName>
}

// Shared between the transactional seeds.
export type SeedContext = {
	ref: LookupRefs
	periodId: (monthOffset: number) => string
}
