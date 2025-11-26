import { getUserById } from "./generated/getUserById";
import { createPost } from "./generated/createPost";
import { z } from "zod";

// Mock zFetch to avoid actual network calls and just verify types/execution
import { zFetch } from "zod-fetch";

// We can't easily mock zFetch here without a mock library since it's imported directly in generated code.
// But we can check if the functions exist and are callable.
// For runtime test, we can use MSW or just run it and expect network error (which proves it runs).

async function main() {
    console.log("Verifying generated code...");

    try {
        // This should fail with network error or 404, but it proves the code runs and imports work.
        await getUserById("1");
    } catch (e: any) {
        console.log("getUserById executed (caught error):", e.message);
    }

    try {
        await createPost({ title: "foo", content: "bar" });
    } catch (e: any) {
        console.log("createPost executed (caught error):", e.message);
    }
}

main();
