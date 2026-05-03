/**
 * Presence tools - list presences from MOCO.
 *
 * A presence is a tracked work-time entry (start time, end time, optional
 * home-office flag). Presences feed the legal work-time record and are
 * independent from project time entries (activities).
 */

import { z } from "zod";
import { fetchAll } from "../api.js";

export const listPresencesSchema = z.object({
  from: z
    .string()
    .describe("Start date (YYYY-MM-DD) - required, must be paired with `to`"),
  to: z
    .string()
    .describe("End date (YYYY-MM-DD) - required, must be paired with `from`"),
  user_id: z
    .string()
    .optional()
    .describe("Filter by user ID"),
  is_home_office: z
    .boolean()
    .optional()
    .describe("Filter by home-office flag"),
});

export async function listPresences(
  args: z.infer<typeof listPresencesSchema>,
): Promise<string> {
  const params: Record<string, string> = {};
  params.from = args.from;
  params.to = args.to;
  if (args.user_id) params.user_id = args.user_id;
  if (args.is_home_office !== undefined) {
    params.is_home_office = String(args.is_home_office);
  }

  const presences = await fetchAll<Record<string, unknown>>(
    "/users/presences",
    params,
  );

  let totalHours = 0;

  const lines = presences.map((p) => {
    const from = (p.from as string) ?? "";
    const to = (p.to as string) ?? "";
    let hours = 0;
    if (from && to) {
      const [fh, fm] = from.split(":").map(Number);
      const [th, tm] = to.split(":").map(Number);
      hours = (th * 60 + tm - (fh * 60 + fm)) / 60;
      if (hours > 0) totalHours += hours;
    }

    const user = p.user as Record<string, unknown> | null;
    const userName = user
      ? `${user.firstname} ${user.lastname}`
      : "Unknown";
    const homeOffice = p.is_home_office ? " | home-office" : "";
    const duration = from && to ? ` (${hours.toFixed(2)}h)` : " (open)";

    return (
      `- **${p.date}** | ${from}-${to || "open"}${duration} | ${userName}${homeOffice}` +
      `\n  Presence ID: ${p.id}`
    );
  });

  const summary =
    `Found ${presences.length} presence(s) ` +
    `(${totalHours.toFixed(2)} hours total, completed entries only)`;

  if (presences.length > 50) {
    return (
      `${summary}\n\n` +
      `_Showing first 50 of ${presences.length} presences. Use filters to narrow results._\n\n` +
      lines.slice(0, 50).join("\n\n")
    );
  }

  return `${summary}\n\n${lines.join("\n\n")}`;
}
