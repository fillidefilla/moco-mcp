/**
 * Employment tools - list employments from MOCO.
 *
 * An employment record describes a user's contract: weekly target hours,
 * the daily work pattern (am/pm hours per weekday), and the contract
 * date range.
 */

import { z } from "zod";
import { fetchAll } from "../api.js";

export const listEmploymentsSchema = z.object({
  from: z
    .string()
    .optional()
    .describe("Start date (YYYY-MM-DD). Required when filtering by date range."),
  to: z
    .string()
    .optional()
    .describe("End date (YYYY-MM-DD). Optional for open-ended employments."),
  user_id: z
    .string()
    .optional()
    .describe("Filter by user ID"),
});

export async function listEmployments(
  args: z.infer<typeof listEmploymentsSchema>,
): Promise<string> {
  const params: Record<string, string> = {};
  if (args.from) params.from = args.from;
  if (args.to) params.to = args.to;
  if (args.user_id) params.user_id = args.user_id;

  const employments = await fetchAll<Record<string, unknown>>(
    "/users/employments",
    params,
  );

  const lines = employments.map((e) => {
    const user = e.user as Record<string, unknown> | null;
    const userName = user
      ? `${user.firstname} ${user.lastname} (ID: ${user.id})`
      : "Unknown user";
    const range = `${e.from ?? "?"} -> ${e.to ?? "open"}`;
    const weekly = e.weekly_target_hours ?? "?";

    return (
      `- **${userName}** | ${range}` +
      `\n  Weekly target: ${weekly}h | Employment ID: ${e.id}`
    );
  });

  return `Found ${employments.length} employment(s)\n\n${lines.join("\n\n")}`;
}
