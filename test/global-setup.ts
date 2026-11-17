import { execSync } from "node:child_process"
import { Client } from "pg"
import { TEST_DATABASE_URL } from "./test-database-url"

// Creates the dedicated test database if needed and applies migrations.
// Never touches the development database.
export default async function setup() {
	const url = new URL(TEST_DATABASE_URL)
	const dbName = url.pathname.slice(1)
	if (!/^[a-z0-9_]+$/i.test(dbName) || !dbName.includes("test")) {
		throw new Error(`Refusing to run e2e tests against database "${dbName}"`)
	}
	const admin = new URL(TEST_DATABASE_URL)
	admin.pathname = "/postgres"
	const client = new Client({ connectionString: admin.toString() })
	await client.connect()
	const exists = await client.query(
		"SELECT 1 FROM pg_database WHERE datname = $1",
		[dbName]
	)
	if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${dbName}"`)
	await client.end()
	execSync("npx prisma migrate deploy", {
		stdio: "inherit",
		env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL }
	})
}
