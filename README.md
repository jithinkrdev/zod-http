# zod-fetch

**The Ultimate Type-Safe Fetch Wrapper for Zod**

`zod-fetch` is a lightweight (< 5kB), zero-dependency (except Zod) wrapper for `fetch` that brings complete type safety and validation to your API calls. It eliminates boilerplate and provides robust error handling.

## Features

- 🔒 **Type-Safe**: Validates response bodies with Zod schemas.
- 🚀 **Zero Boilerplate**: Auto-stringifies bodies, handles Content-Type, and appends search params.
- 🛡️ **Robust Error Handling**: Unified `ZodFetchError` for network, timeout, validation, and abort errors.
- 🔄 **Retry & Timeout**: Built-in retry logic (linear/exponential) and timeout support.
- 🛠️ **CLI Generator**: Generate fully typed clients from OpenAPI specs.
- 📦 **Tiny Bundle**: < 5kB gzipped.

## Installation

```bash
npm install zod-fetch zod
# or
yarn add zod-fetch zod
# or
pnpm add zod-fetch zod
```

## Usage

### Basic Usage

```typescript
import { zFetch, ZodFetchError } from "zod-fetch";
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

try {
  const user = await zFetch({
    url: "https://api.example.com/users/1",
    schema: UserSchema,
    // Optional
    headers: { Authorization: "Bearer token" },
    retry: { attempts: 3, backoff: "exponential" },
    timeout: 5000,
  });

  console.log(user.name); // Typed as string
} catch (err) {
  if (err instanceof ZodFetchError) {
    if (err.cause === "validation") console.log(err.issues);
    if (err.status === 404) console.log("User not found");
  }
}
```

### Reusable Client

```typescript
import { createZodFetchClient } from "zod-fetch";

const api = createZodFetchClient({
  baseURL: "https://api.example.com",
  headers: { Authorization: "Bearer token" },
  retry: 3,
});

const user = await api.get("/users/123", UserSchema);
const newPost = await api.post("/posts", PostSchema, { body: { title: "Hello" } });
```

### CLI: OpenAPI Generator

Generate a fully typed client from your OpenAPI spec.

```bash
# Generate from local file
npx zod-fetch generate ./openapi.yaml --output src/api

# Generate from URL
npx zod-fetch generate https://api.example.com/openapi.json --output src/api
```

**Generated Code Example:**

```typescript
// src/api/getUserById.ts
import { zFetch } from "zod-fetch";
import { z } from "zod";

export const ResponseSchema = z.object({ ... });

export const getUserById = async (id: string, options?: { headers?: HeadersInit }) => {
  return zFetch({
    url: `/users/${id}`,
    method: "GET",
    schema: ResponseSchema,
    headers: options?.headers,
  });
};
```

### Streaming & Upload

```typescript
// Streaming
zFetch.stream({
  url: "/stream",
  schema: z.object({ count: z.number() }),
  onChunk: (data) => console.log(data.count),
});

// Upload
zFetch.upload({
  url: "/upload",
  file: myFile, // File or Blob
  schema: UploadResponseSchema,
  onProgress: (percent) => console.log(`Upload: ${percent}%`),
});
```

## API Reference

### `zFetch<T>(options)`

- `url`: string | URL
- `schema`: ZodType<T>
- `method`: "GET" | "POST" | ... (default: GET)
- `headers`: HeadersInit
- `searchParams`: Record<string, string | number | boolean | undefined>
- `body`: BodyInit | object | null
- `timeout`: number (default: 10000ms)
- `retry`: number | { attempts: number; delay?: number; backoff?: "linear" | "exponential" }
- `signal`: AbortSignal

### `createZodFetchClient(config)`

- `baseURL`: string
- `headers`: HeadersInit
- `retry`: ...
- `timeout`: ...

Returns an object with `get`, `post`, `put`, `delete`, `patch`, `fetch` methods.

## License

MIT
