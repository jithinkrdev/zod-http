
import { zFetch } from "zod-http"
import { z } from "zod"


export const ResponseSchema = z.object({ "id": z.string(), "name": z.string(), "email": z.string().optional() });

export const getUserById = async (id: string | number, options?: { headers?: HeadersInit }) => {
  return zFetch({
    url: `/users/${id}`,
    method: "GET",
    schema: ResponseSchema,
    
    
    headers: options?.headers,
  });
};
