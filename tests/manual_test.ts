import { zFetch, createZodFetchClient, ZodFetchError } from "../src";
import { z } from "zod";

const TodoSchema = z.object({
    userId: z.number(),
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
});

async function main() {
    console.log("Testing zFetch...");
    try {
        const todo = await zFetch({
            url: "https://jsonplaceholder.typicode.com/todos/1",
            schema: TodoSchema,
        });
        console.log("zFetch success:", todo);
    } catch (error) {
        console.error("zFetch error:", error);
    }

    console.log("\nTesting createZodFetchClient...");
    const client = createZodFetchClient({
        baseURL: "https://jsonplaceholder.typicode.com",
    });

    try {
        const todo = await client.get("/todos/2", TodoSchema);
        console.log("Client success:", todo);
    } catch (error) {
        console.error("Client error:", error);
    }

    console.log("\nTesting Error Handling (404)...");
    try {
        await zFetch({
            url: "https://jsonplaceholder.typicode.com/todos/999999",
            schema: TodoSchema,
        });
    } catch (error) {
        if (error instanceof ZodFetchError) {
            console.log("Caught expected error:", error.message, error.status);
        } else {
            console.error("Unexpected error:", error);
        }
    }
}

main();
