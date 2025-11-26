import { describe, it, expect } from "vitest";
import { createZodFetchClient } from "../src";
import { z } from "zod";

const PostSchema = z.object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
});

describe("createZodFetchClient", () => {
    const client = createZodFetchClient({
        baseURL: "https://api.example.com",
        headers: { "X-API-Key": "secret" },
    });

    it("should make requests with base URL and headers", async () => {
        const data = await client.post("/posts", PostSchema, {
            body: { title: "Hello", content: "World" },
        });

        expect(data).toEqual({
            id: 101,
            title: "Hello",
            content: "World",
        });
    });
});
