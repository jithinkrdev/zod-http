import fs from "node:fs/promises";
import path from "node:path";
import jsonSchemaToZod from "json-schema-to-zod";
import yaml from "yaml";
import type { OpenAPIV3 } from "openapi-types";

interface GenerateOptions {
    output: string;
    clientName: string;
}

export async function generate(input: string, options: GenerateOptions) {
    const spec = await loadSpec(input);
    const outputDir = path.resolve(process.cwd(), options.output);

    await fs.mkdir(outputDir, { recursive: true });

    const operations: { name: string; path: string }[] = [];

    for (const [route, pathItem] of Object.entries(spec.paths || {})) {
        if (!pathItem) continue;

        for (const method of ["get", "post", "put", "delete", "patch"] as const) {
            const operation = pathItem[method];
            if (!operation) continue;

            const operationId = operation.operationId || `${method}${route.replace(/\//g, "_").replace(/[{}]/g, "")}`;
            const safeOperationId = operationId.replace(/[^a-zA-Z0-9]/g, "_");

            const fileContent = await generateOperation(route, method, operation, spec, safeOperationId);
            const filePath = path.join(outputDir, `${safeOperationId}.ts`);

            await fs.writeFile(filePath, fileContent);
            operations.push({ name: safeOperationId, path: `./${safeOperationId}` });
            console.log(`Generated ${safeOperationId}`);
        }
    }

    // Generate index.ts
    const indexContent = operations.map(op => `export * from "${op.path}";`).join("\n");
    await fs.writeFile(path.join(outputDir, "index.ts"), indexContent);
}

async function loadSpec(input: string): Promise<OpenAPIV3.Document> {
    let content: string;
    if (input.startsWith("http")) {
        const res = await fetch(input);
        content = await res.text();
    } else {
        content = await fs.readFile(input, "utf-8");
    }

    try {
        return JSON.parse(content);
    } catch {
        return yaml.parse(content);
    }
}

async function generateOperation(
    route: string,
    method: string,
    operation: OpenAPIV3.OperationObject,
    spec: OpenAPIV3.Document,
    operationId: string
): Promise<string> {
    const imports = new Set<string>(['import { zFetch } from "zod-http"', 'import { z } from "zod"']);

    // Helper to resolve refs (simplified)
    const resolve = (ref: string) => {
        const parts = ref.split("/");
        let current: any = spec;
        for (const part of parts.slice(1)) {
            current = current[part];
        }
        return current;
    };

    const getBodySchema = () => {
        if (!operation.requestBody) return null;
        const body = "$ref" in operation.requestBody ? resolve(operation.requestBody.$ref) : operation.requestBody;
        const content = body.content?.["application/json"];
        if (!content?.schema) return null;
        return content.schema;
    };

    const getResponseSchema = () => {
        const success = operation.responses["200"] || operation.responses["201"];
        if (!success) return null;
        const res = "$ref" in success ? resolve(success.$ref) : success;
        const content = res.content?.["application/json"];
        if (!content?.schema) return null;
        return content.schema;
    };

    const bodySchema = getBodySchema();
    const responseSchema = getResponseSchema();

    let bodyZod = "z.void()";
    let responseZod = "z.void()";

    if (bodySchema) {
        bodyZod = jsonSchemaToZod(bodySchema as any);
    }
    if (responseSchema) {
        responseZod = jsonSchemaToZod(responseSchema as any);
    }

    // Params
    const params = (operation.parameters || []) as (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[];
    const resolvedParams = params.map(p => "$ref" in p ? resolve(p.$ref) : p) as OpenAPIV3.ParameterObject[];

    const pathParams = resolvedParams.filter(p => p.in === "path");
    const queryParams = resolvedParams.filter(p => p.in === "query");

    const args = [];
    if (pathParams.length > 0) {
        pathParams.forEach(p => args.push(`${p.name}: string | number`));
    }
    if (bodySchema) {
        args.push(`body: z.infer<typeof RequestSchema>`);
    }
    if (queryParams.length > 0) {
        args.push(`params?: { ${queryParams.map(p => `${p.name}?: string | number`).join("; ")} }`);
    }
    args.push(`options?: { headers?: HeadersInit }`);

    // Construct URL
    let url = route;
    pathParams.forEach(p => {
        url = url.replace(`{${p.name}}`, `\${${p.name}}`);
    });

    return `
${Array.from(imports).join("\n")}

${bodySchema ? `const RequestSchema = ${bodyZod};` : ""}
export const ResponseSchema = ${responseZod};

export const ${operationId} = async (${args.join(", ")}) => {
  return zFetch({
    url: \`${url}\`,
    method: "${method.toUpperCase()}",
    schema: ResponseSchema,
    ${bodySchema ? "body," : ""}
    ${queryParams.length > 0 ? "searchParams: params," : ""}
    headers: options?.headers,
  });
};
`;
}
