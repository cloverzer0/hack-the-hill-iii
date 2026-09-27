import { NextResponse, type NextRequest } from "next/server";
import { handleRouteError, jsonError } from "@/lib/http";
import { listStories } from "@/lib/stories";

/**
 * Purpose:
 *	GET /api/spending?department=ND: the feed (screen 03). Public, no login needed.
 *
 * Args:
 *	- request: the incoming request; optional ?department= is a department code from GET /api/departments
 *
 * Returns:
 *	NextResponse: JSON Story[] newest first (empty when the department has none); 400 invalid_department
 */
export async function GET(request: NextRequest) {
  try {
    const department = request.nextUrl.searchParams.get("department");
    if (department !== null && !/^[A-Za-z]{1,10}$/.test(department)) return jsonError("invalid_department", 400);
    return NextResponse.json(await listStories({ department: department ?? undefined }));
  } catch (error) {
    return handleRouteError(error);
  }
}
