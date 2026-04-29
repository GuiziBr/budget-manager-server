// Default allocated amounts per envelope category.
// Keyed by exact category name as stored in the database.
// Replace with external API integration when available.
export const BUDGET_ENVELOPE_AMOUNTS: Record<string, number> = {
	Baby: 200,
	Fuel: 80,
	Grocery: 300,
	Shopping: 50,
	Restaurant: 200,
	Parking: 20,
	Pharmacy: 10
}
