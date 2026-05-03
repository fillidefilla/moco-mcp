/**
 * User tools - list users, fetch a single user, and read the
 * performance report (target hours vs tracked hours, with the
 * resulting variation).
 */

import { z } from "zod";
import { fetchAll, fetchOne } from "../api.js";

export const listUsersSchema = z.object({
  include_archived: z
    .boolean()
    .optional()
    .describe("Include deactivated users (default: false)"),
  tags: z
    .string()
    .optional()
    .describe("Filter by tags (comma-separated)"),
  email: z
    .string()
    .optional()
    .describe("Filter by exact email address"),
});

export async function listUsers(
  args: z.infer<typeof listUsersSchema>,
): Promise<string> {
  const params: Record<string, string> = {};
  if (args.include_archived) params.include_archived = "true";
  if (args.tags) params.tags = args.tags;
  if (args.email) params.email = args.email;

  const users = await fetchAll<Record<string, unknown>>("/users", params);

  const active = users.filter((u) => !u.deactivated);
  const inactive = users.filter((u) => u.deactivated);

  const formatUser = (u: Record<string, unknown>) => {
    const unit = u.unit as Record<string, unknown> | null;
    const unitName = unit ? ` | ${unit.name}` : "";
    return (
      `- **${u.firstname} ${u.lastname}** (ID: ${u.id})` +
      `\n  ${u.email}${unitName}`
    );
  };

  let output = `Found ${users.length} user(s): ${active.length} active, ${inactive.length} inactive\n\n`;
  output += `## Active\n\n${active.map(formatUser).join("\n\n")}`;

  if (inactive.length > 0 && args.include_archived) {
    output += `\n\n## Inactive\n\n${inactive.map(formatUser).join("\n\n")}`;
  }

  return output;
}

export const getUserSchema = z.object({
  id: z.number().describe("User ID"),
});

export async function getUser(
  args: z.infer<typeof getUserSchema>,
): Promise<string> {
  const user = await fetchOne<Record<string, unknown>>(`/users/${args.id}`);

  let output = `# ${user.firstname} ${user.lastname}\n\n`;
  output += `- **ID:** ${user.id}\n`;
  output += `- **Email:** ${user.email}\n`;
  if (user.active !== undefined) output += `- **Active:** ${user.active}\n`;
  if (user.external !== undefined) output += `- **External:** ${user.external}\n`;
  if (user.deactivated !== undefined) {
    output += `- **Deactivated:** ${user.deactivated}\n`;
  }
  if (user.language) output += `- **Language:** ${user.language}\n`;
  if (user.work_phone) output += `- **Work phone:** ${user.work_phone}\n`;
  if (user.mobile_phone) output += `- **Mobile phone:** ${user.mobile_phone}\n`;
  if (user.bday) output += `- **Birthday:** ${user.bday}\n`;

  const unit = user.unit as Record<string, unknown> | null;
  if (unit) output += `- **Unit:** ${unit.name} (ID: ${unit.id})\n`;

  const role = user.role as Record<string, unknown> | null;
  if (role) output += `- **Role:** ${role.name}\n`;

  const tags = user.tags as string[] | undefined;
  if (tags && tags.length > 0) {
    output += `- **Tags:** ${tags.join(", ")}\n`;
  }

  if (user.info) output += `\n## Info\n\n${user.info}\n`;

  return output;
}

export const getUserPerformanceReportSchema = z.object({
  id: z.number().describe("User ID"),
  year: z
    .number()
    .optional()
    .describe("Year to report on (defaults to current year)"),
});

export async function getUserPerformanceReport(
  args: z.infer<typeof getUserPerformanceReportSchema>,
): Promise<string> {
  const path = args.year
    ? `/users/${args.id}/performance_report?year=${args.year}`
    : `/users/${args.id}/performance_report`;

  const report = await fetchOne<Record<string, unknown>>(path);

  const annually = report.annually as Record<string, unknown> | undefined;
  const monthly = report.monthly as Record<string, unknown>[] | undefined;

  const yearLabel = args.year ?? "(current year)";
  let output = `# Performance Report - User ${args.id} - ${yearLabel}\n\n`;

  if (annually) {
    output += `## Annual\n\n`;
    output += `- **Employment hours:** ${annually.employment_hours ?? "?"}\n`;
    output += `- **Target hours:** ${annually.target_hours ?? "?"}\n`;
    output += `- **Hours tracked total:** ${annually.hours_tracked_total ?? "?"}\n`;
    output += `- **Hours billable total:** ${annually.hours_billable_total ?? "?"}\n`;
    output += `- **Variation (full year):** ${annually.variation ?? "?"}\n`;
    output += `- **Variation until today:** ${annually.variation_until_today ?? "?"}\n`;
  }

  if (monthly && monthly.length > 0) {
    output += `\n## Monthly\n\n`;
    output += `| Year | Month | Target | Tracked | Billable | Variation |\n`;
    output += `|---|---|---|---|---|---|\n`;
    for (const m of monthly) {
      output +=
        `| ${m.year} | ${m.month} | ${m.target_hours ?? "?"} | ` +
        `${m.hours_tracked_total ?? "?"} | ${m.hours_billable_total ?? "?"} | ` +
        `${m.variation ?? "?"} |\n`;
    }
  }

  return output;
}
