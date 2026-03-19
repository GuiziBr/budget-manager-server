import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

export default defineConfig({
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
	test: {
		coverage: {
			provider: "v8",
			exclude: ["src/infra/database/prisma/repositories/**"],
		},
	},
})
