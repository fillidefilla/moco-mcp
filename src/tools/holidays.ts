/**
 * Holiday tools - list user holiday entitlements from MOCO.
 *
 * A holiday record is an annual entitlement (e.g. 20 days for the year)
 * for a single user. Days are converted to hours using the user's daily
 * hours setting in MOCO.
 */

import { z } from "zod";
import { fetchAll } from "../api.js";

export const listHolidaysSchema = z.object({
  year: z
    .string()
    .optional()
    .describe("Filter by year (e.g. 2026)"),
  user_id: z
    .string()
    .optional()
    .describe("Filter by user ID"),
});

export async function listHolidays(
  args: z.infer<typeof listHolidaysSchema>,
): Promise<string> {
  const params: Record<string, string> = {};
  if (args.year) params.year = args.year;
  if (args.user_id) params.user_id = args.user_id;

  const holidays = await fetchAll<Record<string, unknown>>(
    "/users/holidays",
    params,
  );

  const lines = holidays.map((h) => {
    const user = h.user as Record<string, unknown> | null;
    const userName = user
      ? `${user.firstname} ${user.lastname}`
      : "Unknown";
    const days = h.days ?? 0;
    const hours = h.hours ?? 0;

    return (
      `- **${userName}** | ${h.year} | ${h.title}` +
      `\n  ${days} day(s) / ${hours} hour(s) | Holiday ID: ${h.id}`
    );
  });

  return `Found ${holidays.length} holiday entitlement(s)\n\n${lines.join("\n\n")}`;
}
