/**
 * Invoice tools - list invoices from MOCO.
 */

import { z } from "zod";
import { fetchAll } from "../api.js";

export const listInvoicesSchema = z.object({
  status: z
    .string()
    .optional()
    .describe(
      "Filter by status: draft, created, sent, partially_paid, paid, overdue, ignored (comma-separated)",
    ),
  date_from: z
    .string()
    .optional()
    .describe("Invoice date from (YYYY-MM-DD)"),
  date_to: z
    .string()
    .optional()
    .describe("Invoice date to (YYYY-MM-DD)"),
  company_id: z
    .string()
    .optional()
    .describe("Filter by company ID"),
  project_id: z
    .string()
    .optional()
    .describe("Filter by project ID"),
  tags: z
    .string()
    .optional()
    .describe("Filter by tags (comma-separated)"),
  term: z
    .string()
    .optional()
    .describe("Search in title and identifier"),
});

export async function listInvoices(
  args: z.infer<typeof listInvoicesSchema>,
): Promise<string> {
  const params: Record<string, string> = {};
  if (args.status) params.status = args.status;
  if (args.date_from) params.date_from = args.date_from;
  if (args.date_to) params.date_to = args.date_to;
  if (args.company_id) params.company_id = args.company_id;
  if (args.project_id) params.project_id = args.project_id;
  if (args.tags) params.tags = args.tags;
  if (args.term) params.term = args.term;

  const invoices = await fetchAll<Record<string, unknown>>("/invoices", params);

  let totalNet = 0;
  let totalGross = 0;

  const lines = invoices.map((inv) => {
    const net = (inv.net_total as number) ?? 0;
    const gross = (inv.gross_total as number) ?? 0;
    totalNet += net;
    totalGross += gross;

    const customer = inv.customer as Record<string, unknown> | null;
    const customerName = customer ? ` | ${customer.name}` : "";

    return (
      `- **${inv.identifier}** (ID: ${inv.id})` +
      `\n  ${inv.title}${customerName}` +
      `\n  Date: ${inv.date} | Due: ${inv.due_date} | Status: ${inv.status}` +
      `\n  Net: ${net.toFixed(2)} ${inv.currency} | Gross: ${gross.toFixed(2)} ${inv.currency}`
    );
  });

  const summary =
    `Found ${invoices.length} invoice(s)\n` +
    `Total net: ${totalNet.toFixed(2)} EUR | Total gross: ${totalGross.toFixed(2)} EUR`;

  return `${summary}\n\n${lines.join("\n\n")}`;
}
