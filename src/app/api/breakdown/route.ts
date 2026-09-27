import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_YEAR, getBreakdown } from "@/lib/breakdown";
import { handleRouteError, jsonError } from "@/lib/http";

/**
 * Purpose:
 *	GET /api/breakdown?year=2024: total federal spending and the 7 biggest programs plus "All other programs", from the database.
 *	Public: no login needed (screen 02).
 *
 * Args:
 *	- request: the incoming request; optional ?year= is the data's year (2024 = 2024-25), default 2024
 *
 * Returns:
 *	NextResponse: JSON Breakdown (see src/shared/breakdown.ts); 400 invalid_year, 404 not_found, 500 server_error
 */
export async function GET(request: NextRequest) {
  try {
    const param = request.nextUrl.searchParams.get("year");
    const year = param === null ? DEFAULT_YEAR : Number(param);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return jsonError("invalid_year", 400);

    const breakdown = await getBreakdown(year);
    if (!breakdown) return jsonError("not_found", 404);
    return NextResponse.json(breakdown);
  } catch (error) {
    return handleRouteError(error);
  }
}
