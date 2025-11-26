import { describe, it, expect, vi } from "vitest";
import { zFetch, ZodFetchError } from "../src";
import { z } from "zod";

const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
});

describe("zFetch", () => {
    it("should fetch and validate data successfully", async () => {
        const data = await zFetch({
            url: "https://api.example.com/users/1",
            schema: UserSchema,
        });
        expect(data).toEqual({
            id: 1,
            name: "John Doe",
            email: "john@example.com",
        });
    });

    it("should throw ZodFetchError on validation failure", async () => {
        const InvalidSchema = z.object({
            id: z.string(), // Expecting string, got number
        });

        try {
            await zFetch({
                url: "https://api.example.com/users/1",
                schema: InvalidSchema,
            });
            expect.fail("Should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(ZodFetchError);
            if (error instanceof ZodFetchError) {
                expect(error.cause).toBe("validation");
                expect(error.issues).toBeDefined();
            }
        }
    });

    it("should throw ZodFetchError on 404", async () => {
        try {
            await zFetch({
                url: "https://api.example.com/error/404",
                schema: z.any(),
            });
            expect.fail("Should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(ZodFetchError);
            if (error instanceof ZodFetchError) {
                expect(error.status).toBe(404);
                expect(error.cause).toBe("network"); // or http error
            }
        }
    });

    it("should retry on 500", async () => {
        // MSW handler returns 500 always, so it should fail after retries
        const start = Date.now();
        try {
            await zFetch({
                url: "https://api.example.com/error/500",
                schema: z.any(),
                retry: { attempts: 2, delay: 100 },
            });
            expect.fail("Should have thrown");
        } catch (error) {
            const duration = Date.now() - start;
            expect(duration).toBeGreaterThan(200); // 2 retries * 100ms
            expect(error).toBeInstanceOf(ZodFetchError);
            if (error instanceof ZodFetchError) {
                expect(error.status).toBe(500);
            }
        }
    });

    it("should timeout", async () => {
        try {
            await zFetch({
                url: "https://api.example.com/timeout",
                schema: z.any(),
                timeout: 500,
            });
            expect.fail("Should have thrown");
        } catch (error) {
            expect(error).toBeInstanceOf(ZodFetchError);
            if (error instanceof ZodFetchError) {
                expect(error.cause).toBe("timeout");
            }
        }
    });

    it("should stream data", async () => {
        // Mock fetch for streaming since MSW stream support in node might need polyfills or specific setup
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(JSON.stringify({ count: 1 })));
                controller.enqueue(new TextEncoder().encode(JSON.stringify({ count: 2 })));
                controller.close();
            },
        });

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            body: stream,
            headers: new Headers(),
        });

        const chunks: any[] = [];
        await zFetch.stream({
            url: "https://api.example.com/stream",
            schema: z.object({ count: z.number() }),
            onChunk: (data) => chunks.push(data),
        });

        expect(chunks).toEqual([{ count: 1 }, { count: 2 }]);
    });

    it("should upload file", async () => {
        const mockXHR = {
            open: vi.fn(),
            setRequestHeader: vi.fn(),
            send: vi.fn(),
            upload: { onprogress: null },
            onload: null as any,
            onerror: null as any,
            status: 201,
            statusText: "Created",
            responseText: JSON.stringify({ id: "file_123" }),
        };

        // Trigger onload when send is called
        mockXHR.send.mockImplementation(() => {
            setTimeout(() => {
                if (mockXHR.upload.onprogress) {
                    (mockXHR.upload.onprogress as any)({ lengthComputable: true, loaded: 50, total: 100 });
                }
                if (mockXHR.onload) mockXHR.onload();
            }, 10);
        });

        vi.stubGlobal("XMLHttpRequest", vi.fn(() => mockXHR));

        const progress: number[] = [];
        const result = await zFetch.upload({
            url: "https://api.example.com/upload",
            file: new Blob(["content"]) as any,
            schema: z.object({ id: z.string() }),
            onProgress: (p) => progress.push(p),
        });

        expect(result).toEqual({ id: "file_123" });
        expect(progress).toContain(50);
    });
});
