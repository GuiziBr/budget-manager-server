import swc from "unplugin-swc"
import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

export default defineConfig({
	plugins: [swc.vite()],
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
	test: {
		coverage: {
			provider: "v8",
			exclude: [
				"src/infra/database/prisma/repositories/**",
				"src/domains/**/repositories/**",
				"src/shared/**",
				"src/main.ts",
				"src/**/*.entity.ts",
				"src/**/*.module.ts",
				"src/**/*.dto.ts"
			]
		},
	},
})
