export abstract class EnvelopeSpendRepository {
	/**
	 * Returns the amount spent in the month for every envelope category,
	 * keyed by category id, in currency units (not cents).
	 * Throws when the spend source is unavailable.
	 */
	abstract findByMonth(
		year: number,
		month: number
	): Promise<Map<string, number>>
}
