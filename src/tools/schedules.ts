/**
 * Schedule tools - list absences from MOCO.
 *
 * A schedule entry represents a planned absence: unplannable absence,
 * public holiday, sick day, holiday, or generic absence. Each entry is
 * tied to a user and a specific date, with optional am/pm flags.
 */

import { z } from "zod";
import { fetchAll } from "../api.js";

const ABSENCE_LABELS: Record<number, string> = {
  1: "unplannable absence",
  2: "public holiday",
  3: "sick day",
  4: "holiday",
  5: "absence",
};

export const listSchedulesSchema = z.object({
  from: z
    .string()
    .optional()
    .describe("Start date (YYYY-MM-DD)"),
  to: z
    .string()
    .optional()
    .describe("End date (YYYY-MM-DD)"),
  user_id: z
    .string()
    .optional()
    .describe("Filter by user ID"),
  absence_code: z
    .string()
    .optional()
    .describe(
      "Filter by absence code, comma-separated. " +
        "1=unplannable absence, 2=public holiday, 3=sick day, 4=holiday, 5=absence",
    ),
  absence_request_id: z
    .string()
    .optional()
    .describe("Filter by absence request ID"),
});

export async function listSchedules(
  args: z.infer<typeof listSchedulesSchema>,
): Promise<string> {
  const params: Record<string, string> = {};
  if (args.from) params.from = args.from;
  if (args.to) params.to = args.to;
  if (args.user_id) params.user_id = args.user_id;
  if (args.absence_code) params.absence_code = args.absence_code;
  if (args.absence_request_id) {
    params.absence_request_id = args.absence_request_id;
  }

  const schedules = await fetchAll<Record<string, unknown>>(
    "/schedules",
    params,
  );

  const lines = schedules.map((s) => {
    const user = s.user as Record<string, unknown> | null;
    const userName = user
      ? `${user.firstname} ${user.lastname}`
      : "Unknown";
    const code = s.absence_code as number;
    const label = ABSENCE_LABELS[code] ?? `code ${code}`;
    const halves: string[] = [];
    if (s.am) halves.push("am");
    if (s.pm) halves.push("pm");
    const halfDay = halves.length === 1 ? ` (${halves[0]} only)` : "";
    const comment = s.comment ? `\n  ${s.comment}` : "";

    return (
      `- **${s.date}** | ${label}${halfDay} | ${userName}` +
      `\n  Schedule ID: ${s.id}${comment}`
    );
  });

  if (schedules.length > 50) {
    return (
      `Found ${schedules.length} schedule entr${schedules.length === 1 ? "y" : "ies"}\n\n` +
      `_Showing first 50 of ${schedules.length}. Use filters to narrow results._\n\n` +
      lines.slice(0, 50).join("\n\n")
    );
  }

  return `Found ${schedules.length} schedule entr${schedules.length === 1 ? "y" : "ies"}\n\n${lines.join("\n\n")}`;
}
