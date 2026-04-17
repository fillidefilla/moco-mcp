#!/usr/bin/env node

/**
 * moco-mcp - MCP server for MOCO time tracking and project management.
 *
 * Provides read-only access to MOCO data via the Model Context Protocol.
 * Requires MOCO_SUBDOMAIN and MOCO_API_KEY environment variables.
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  listProjectsSchema,
  listProjects,
  getProjectSchema,
  getProject,
} from "./tools/projects.js";
import { listInvoicesSchema, listInvoices } from "./tools/invoices.js";
import {
  listActivitiesSchema,
  listActivities,
} from "./tools/activities.js";
import { listUsersSchema, listUsers } from "./tools/users.js";

const server = new McpServer({
  name: "moco-mcp",
  version: "0.1.0",
});

// -- Projects --

server.tool(
  "moco_list_projects",
  "List projects from MOCO. Returns name, identifier, status, budget, leader, and customer for each project.",
  listProjectsSchema.shape,
  async (args: z.input<typeof listProjectsSchema>) => ({
    content: [{ type: "text" as const, text: await listProjects(args) }],
  }),
);

server.tool(
  "moco_get_project",
  "Get a single project by ID with full details. Optionally includes the business report (budget, hours, costs).",
  getProjectSchema.shape,
  async (args: z.input<typeof getProjectSchema>) => ({
    content: [{ type: "text" as const, text: await getProject(args) }],
  }),
);

// -- Invoices --

server.tool(
  "moco_list_invoices",
  "List invoices from MOCO. Filter by status, date range, company, project, or search term. Returns totals.",
  listInvoicesSchema.shape,
  async (args: z.input<typeof listInvoicesSchema>) => ({
    content: [{ type: "text" as const, text: await listInvoices(args) }],
  }),
);

// -- Activities --

server.tool(
  "moco_list_activities",
  "List time entries from MOCO. Requires a start date. Filter by user, project, task, company, or billable status.",
  listActivitiesSchema.shape,
  async (args: z.input<typeof listActivitiesSchema>) => ({
    content: [{ type: "text" as const, text: await listActivities(args) }],
  }),
);

// -- Users --

server.tool(
  "moco_list_users",
  "List all users in MOCO. Shows name, email, and department for each user.",
  listUsersSchema.shape,
  async (args: z.input<typeof listUsersSchema>) => ({
    content: [{ type: "text" as const, text: await listUsers(args) }],
  }),
);

// -- Start --

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
