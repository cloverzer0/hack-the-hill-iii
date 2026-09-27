import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/http";
import { listDepartments } from "@/lib/stories";

/**
 * Purpose:
 *	GET /api/departments: departments that have stories, for the feed's filter chips. Public, no login needed.
 *
 * Args:
 *	(none)
 *
 * Returns:
 *	NextResponse: JSON [{ dept_code, name, count }], most stories first
 */
export async function GET() {
  try {
    return NextResponse.json(await listDepartments());
  } catch (error) {
    return handleRouteError(error);
  }
}
