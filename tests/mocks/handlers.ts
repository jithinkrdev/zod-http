import { http, HttpResponse } from "msw";

export const handlers = [
    http.get("https://api.example.com/users/1", () => {
        return HttpResponse.json({
            id: 1,
            name: "John Doe",
            email: "john@example.com",
        });
    }),
    http.post("https://api.example.com/posts", async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
            id: 101,
            ...body,
        }, { status: 201 });
    }),
    http.get("https://api.example.com/error/404", () => {
        return new HttpResponse(null, { status: 404, statusText: "Not Found" });
    }),
    http.get("https://api.example.com/error/500", () => {
        return new HttpResponse(null, { status: 500 });
    }),
    http.get("https://api.example.com/timeout", async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return HttpResponse.json({ ok: true });
    }),
];
