import { handlers } from "@/lib/auth";

// Auth.js route handlers. This lives outside the `[locale]` segment (the proxy
// matcher excludes `/api`) so auth callbacks are not locale-prefixed.
export const { GET, POST } = handlers;
