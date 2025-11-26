#!/usr/bin/env node
import { Command } from "commander";
import { generate } from "./generator";

const program = new Command();

program
    .name("zod-fetch")
    .description("CLI for zod-fetch")
    .version("0.1.0");

program
    .command("generate")
    .description("Generate typed client from OpenAPI spec")
    .argument("<input>", "Path or URL to OpenAPI spec")
    .option("-o, --output <dir>", "Output directory", "src/api")
    .option("-c, --client-name <name>", "Client name", "api")
    .action(async (input, options) => {
        try {
            await generate(input, options);
        } catch (error) {
            console.error("Generation failed:", error);
            process.exit(1);
        }
    });

program.parse();
