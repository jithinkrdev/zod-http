
import { zFetch } from "zod-http"
import { z } from "zod"

const RequestSchema = z.object({ "title": z.string(), "content": z.string().optional() });
export const ResponseSchema = z.object({ "id": z.string().optional(), "title": z.string().optional() });

export const createPost = async (body: z.infer<typeof RequestSchema>, options?: { headers?: HeadersInit }) => {
  return zFetch({
    url: `/posts`,
    method: "POST",
    schema: ResponseSchema,
    body,
    
    headers: options?.headers,
  });
};
