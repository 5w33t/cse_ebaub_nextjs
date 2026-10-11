import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/require-admin";

/**
 * GET /api/draft?path=/about
 * Enables Draft Mode for the signed-in admin (cookie `__prerender_bypass`) and redirects to the
 * public path so unpublished content renders. Only admins can enable it.
 */
export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "/";
  if (!path.startsWith("/") || path.startsWith("//")) return new Response("Bad path", { status: 400 });

  const draft = await draftMode();
  draft.enable();
  redirect(path);
}
