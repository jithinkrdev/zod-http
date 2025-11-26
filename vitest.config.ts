import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        setupFiles: ["./tests/setup.ts"],
        globals: true,
    },
    resolve: {
        alias: {
            "@": "/src",
            "zod-fetch": "/src/index.ts",
        },
    },
});
