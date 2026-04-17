/**
 * Activity tools - list time entries from MOCO.
 */

import { z } from "zod";
import { fetchAll } from "../api.js";

export const listActivitiesSchema = z.object({
  from: z.string().describe("Start date (YYYY-MM-DD) - required"),
  to: z
    .string()
    .optional()
    .describe("End date (YYYY-MM-DD) - defaults to today"),
  user_id: z
    .string()
    .optional()
    .describe("Filter by user ID"),
  project_id: z
    .string()
    .optional()
    .describe("Filter by project ID"),
  task_id: z
    .string()
    .optional()
    .describe("Filter by task ID"),
  company_id: z
    .string()
    .optional()
    .describe("Filter by company ID"),
  billable: z
    .boolean()
    .optional()
    .describe("Filter by billable status"),
});

export async function listActivities(
  args: z.infer<typeof listActivitiesSchema>,
): Promise<string> {
  const params: Record<string, string> = {};
  params.from = args.from;
  if (args.to) params.to = args.to;
  if (args.user_id) params.user_id = args.user_id;
  if (args.project_id) params.project_id = args.project_id;
  if (args.task_id) params.task_id = args.task_id;
  if (args.company_id) params.company_id = args.company_id;
  if (args.billable !== undefined) params.billable = String(args.billable);

  const activities = await fetchAll<Record<string, unknown>>(
    "/activities",
    params,
  );

  let totalHours = 0;

  const lines = activities.map((a) => {
    const hours = (a.hours as number) ?? 0;
    totalHours += hours;

    const project = a.project as Record<string, unknown> | null;
    const task = a.task as Record<string, unknown> | null;
    const user = a.user as Record<string, unknown> | null;

    const projectName = project ? `${project.name}` : "No project";
    const taskName = task ? ` > ${task.name}` : "";
    const userName = user
      ? `${user.firstname} ${user.lastname}`
      : "Unknown";

    return (
      `- **${a.date}** | ${hours}h | ${userName}` +
      `\n  ${projectName}${taskName}` +
      (a.description ? `\n  ${a.description}` : "")
    );
  });

  const summary =
    `Found ${activities.length} activit${activities.length === 1 ? "y" : "ies"} ` +
    `(${totalHours.toFixed(1)} hours total)`;

  if (activities.length > 50) {
    return (
      `${summary}\n\n` +
      `_Showing first 50 of ${activities.length} activities. Use filters to narrow results._\n\n` +
      lines.slice(0, 50).join("\n\n")
    );
  }

  return `${summary}\n\n${lines.join("\n\n")}`;
}
