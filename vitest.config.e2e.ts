import { resolve } from "node:path"
import swc from "unplugin-swc"
import { defineConfig } from "vitest/config"

export default defineConfig({
	plugins: [swc.vite()],
	resolve: { alias: { "@": resolve(__dirname, "src") } },
	test: {
		include: ["test/**/*.e2e-spec.ts"],
		globalSetup: ["test/global-setup.ts"],
		fileParallelism: false,
		testTimeout: 30_000,
		hookTimeout: 60_000
	}
})
