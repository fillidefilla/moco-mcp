/**
 * Project tools - list and get projects from MOCO.
 */

import { z } from "zod";
import { fetchAll, fetchOne } from "../api.js";

export const listProjectsSchema = z.object({
  include_archived: z
    .boolean()
    .optional()
    .describe("Include archived projects (default: false)"),
  company_id: z
    .string()
    .optional()
    .describe("Filter by company ID (comma-separated for multiple)"),
  leader_id: z
    .string()
    .optional()
    .describe("Filter by project leader user ID (comma-separated)"),
  tags: z
    .string()
    .optional()
    .describe("Filter by tags (comma-separated)"),
  created_from: z
    .string()
    .optional()
    .describe("Filter by creation date (YYYY-MM-DD)"),
  created_to: z
    .string()
    .optional()
    .describe("Filter by creation date (YYYY-MM-DD)"),
  updated_after: z
    .string()
    .optional()
    .describe("Only return projects updated after this date (YYYY-MM-DDTHH:MM:SSZ)"),
});

export async function listProjects(
  args: z.infer<typeof listProjectsSchema>,
): Promise<string> {
  const params: Record<string, string> = {};
  if (args.include_archived) params.include_archived = "true";
  if (args.company_id) params.company_id = args.company_id;
  if (args.leader_id) params.leader_id = args.leader_id;
  if (args.tags) params.tags = args.tags;
  if (args.created_from) params.created_from = args.created_from;
  if (args.created_to) params.created_to = args.created_to;
  if (args.updated_after) params.updated_after = args.updated_after;

  const projects = await fetchAll<Record<string, unknown>>("/projects", params);

  const lines = projects.map((p) => {
    const budget = p.budget ? ` | Budget: ${p.budget} ${p.currency}` : "";
    const leader =
      p.leader && typeof p.leader === "object"
        ? ` | Leader: ${(p.leader as Record<string, unknown>).firstname} ${(p.leader as Record<string, unknown>).lastname}`
        : "";
    return (
      `- **${p.name}** (ID: ${p.id})` +
      `\n  ${p.identifier} | ${p.active ? "Active" : "Archived"} | ${p.billable ? "Billable" : "Non-billable"}${budget}${leader}`
    );
  });

  return `Found ${projects.length} project(s):\n\n${lines.join("\n\n")}`;
}

export const getProjectSchema = z.object({
  id: z.number().describe("Project ID"),
  include_report: z
    .boolean()
    .optional()
    .describe("Also fetch the project business report (budget, hours, costs)"),
});

export async function getProject(
  args: z.infer<typeof getProjectSchema>,
): Promise<string> {
  const project = await fetchOne<Record<string, unknown>>(
    `/projects/${args.id}`,
  );

  let output = `# ${project.name}\n\n`;
  output += `- **ID:** ${project.id}\n`;
  output += `- **Identifier:** ${project.identifier}\n`;
  output += `- **Active:** ${project.active}\n`;
  output += `- **Billable:** ${project.billable}\n`;
  if (project.budget) output += `- **Budget:** ${project.budget} ${project.currency}\n`;
  if (project.start_date) output += `- **Start:** ${project.start_date}\n`;
  if (project.finish_date) output += `- **End:** ${project.finish_date}\n`;

  const customer = project.customer as Record<string, unknown> | null;
  if (customer) output += `- **Customer:** ${customer.name} (ID: ${customer.id})\n`;

  const leader = project.leader as Record<string, unknown> | null;
  if (leader) output += `- **Leader:** ${leader.firstname} ${leader.lastname}\n`;

  if (args.include_report) {
    try {
      const report = await fetchOne<Record<string, unknown>>(
        `/projects/${args.id}/report`,
      );
      output += `\n## Business Report\n\n`;
      for (const [key, value] of Object.entries(report)) {
        if (value !== null && value !== undefined) {
          output += `- **${key}:** ${value}\n`;
        }
      }
    } catch {
      output += `\n_Could not fetch project report._\n`;
    }
  }

  return output;
}
