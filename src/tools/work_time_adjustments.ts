/**
 * Work time adjustment tools - list adjustments from MOCO.
 *
 * A work time adjustment is a manual correction to a user's target/actual
 * hours saldo. Used for hours that should land in the saldo without going
 * through a regular presence entry (e.g. extra work during vacation,
 * bonus hours, generic corrections).
 */

import { z } from "zod";
import { fetchAll } from "../api.js";

export const listWorkTimeAdjustmentsSchema = z.object({
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
});

export async function listWorkTimeAdjustments(
  args: z.infer<typeof listWorkTimeAdjustmentsSchema>,
): Promise<string> {
  const params: Record<string, string> = {};
  if (args.from) params.from = args.from;
  if (args.to) params.to = args.to;
  if (args.user_id) params.user_id = args.user_id;

  const adjustments = await fetchAll<Record<string, unknown>>(
    "/users/work_time_adjustments",
    params,
  );

  let totalHours = 0;

  const lines = adjustments.map((a) => {
    const hours = (a.hours as number) ?? 0;
    totalHours += hours;

    const user = a.user as Record<string, unknown> | null;
    const userName = user
      ? `${user.firstname} ${user.lastname}`
      : "Unknown";
    const sign = hours >= 0 ? "+" : "";

    return (
      `- **${a.date}** | ${sign}${hours}h | ${userName}` +
      `\n  ${a.description ?? "(no description)"} | Adjustment ID: ${a.id}`
    );
  });

  const summary =
    `Found ${adjustments.length} adjustment(s) ` +
    `(net ${totalHours >= 0 ? "+" : ""}${totalHours.toFixed(2)} hours)`;

  return `${summary}\n\n${lines.join("\n\n")}`;
}
