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
import {
  listUsersSchema,
  listUsers,
  getUserSchema,
  getUser,
  getUserPerformanceReportSchema,
  getUserPerformanceReport,
} from "./tools/users.js";
import {
  listEmploymentsSchema,
  listEmployments,
} from "./tools/employments.js";
import {
  listPresencesSchema,
  listPresences,
} from "./tools/presences.js";
import {
  listHolidaysSchema,
  listHolidays,
} from "./tools/holidays.js";
import {
  listWorkTimeAdjustmentsSchema,
  listWorkTimeAdjustments,
} from "./tools/work_time_adjustments.js";
import {
  listSchedulesSchema,
  listSchedules,
} from "./tools/schedules.js";

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
  "List users in MOCO. Filter by tags, email, or include deactivated users. Returns name, email, and unit for each user.",
  listUsersSchema.shape,
  async (args: z.input<typeof listUsersSchema>) => ({
    content: [{ type: "text" as const, text: await listUsers(args) }],
  }),
);

server.tool(
  "moco_get_user",
  "Get a single user by ID with full details (contact, role, unit, tags, info).",
  getUserSchema.shape,
  async (args: z.input<typeof getUserSchema>) => ({
    content: [{ type: "text" as const, text: await getUser(args) }],
  }),
);

server.tool(
  "moco_get_user_performance_report",
  "Get a user's performance report for a given year: target hours vs tracked hours, with the resulting variation (work-time saldo) annually and per month.",
  getUserPerformanceReportSchema.shape,
  async (args: z.input<typeof getUserPerformanceReportSchema>) => ({
    content: [
      { type: "text" as const, text: await getUserPerformanceReport(args) },
    ],
  }),
);

// -- Employments --

server.tool(
  "moco_list_employments",
  "List employment records (contracts) from MOCO. Each record has weekly target hours, daily work pattern, and contract date range. Filter by user, from, or to.",
  listEmploymentsSchema.shape,
  async (args: z.input<typeof listEmploymentsSchema>) => ({
    content: [{ type: "text" as const, text: await listEmployments(args) }],
  }),
);

// -- Presences --

server.tool(
  "moco_list_presences",
  "List presences (work-time entries) from MOCO. Requires a date range. Filter by user or home-office flag. Independent from project time entries.",
  listPresencesSchema.shape,
  async (args: z.input<typeof listPresencesSchema>) => ({
    content: [{ type: "text" as const, text: await listPresences(args) }],
  }),
);

// -- Holidays --

server.tool(
  "moco_list_holidays",
  "List user holiday entitlements from MOCO. Filter by year or user. Each record holds the annual entitlement in days and hours.",
  listHolidaysSchema.shape,
  async (args: z.input<typeof listHolidaysSchema>) => ({
    content: [{ type: "text" as const, text: await listHolidays(args) }],
  }),
);

// -- Work time adjustments --

server.tool(
  "moco_list_work_time_adjustments",
  "List work time adjustments from MOCO. These are manual corrections to the work-time saldo (e.g. extra hours during vacation, bonus hours, generic corrections). Filter by user or date range.",
  listWorkTimeAdjustmentsSchema.shape,
  async (args: z.input<typeof listWorkTimeAdjustmentsSchema>) => ({
    content: [
      { type: "text" as const, text: await listWorkTimeAdjustments(args) },
    ],
  }),
);

// -- Schedules --

server.tool(
  "moco_list_schedules",
  "List schedule entries (planned absences) from MOCO. Covers unplannable absence, public holiday, sick day, holiday, and generic absence. Filter by user, date range, absence code, or absence request.",
  listSchedulesSchema.shape,
  async (args: z.input<typeof listSchedulesSchema>) => ({
    content: [{ type: "text" as const, text: await listSchedules(args) }],
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
