# Instructions for AI Agents

> How to use moco-mcp effectively when answering questions about a MOCO account.

This file is for the AI agent that connects to moco-mcp as an MCP client (Claude, ChatGPT, Cursor, etc.), not for someone developing the server itself. For development, see [`README.md`](./README.md).

## What this server is

A read-only connector to [MOCO](https://www.mocoapp.com), a time tracking and project management tool. It exposes five tools that query a single MOCO account via its REST API. The account is determined by the `MOCO_SUBDOMAIN` and `MOCO_API_KEY` environment variables configured on the server.

Nothing the server returns is cached. Every tool call hits MOCO live.

## The tools

| Tool | Purpose | Required args |
|---|---|---|
| `moco_list_projects` | List projects with filters | none |
| `moco_get_project` | Get one project, optionally with a business report | `id` |
| `moco_list_invoices` | List invoices with filters, returns totals | none |
| `moco_list_activities` | List time entries | `from` (date) |
| `moco_list_users` | List users with departments | none |

Every list tool returns Markdown text, not raw JSON. Parse it by reading, not by regex.

## Tool selection

| User question | Tool(s) to use |
|---|---|
| "What projects are active?" | `moco_list_projects` |
| "Show me project X in detail" | `moco_get_project` with `include_report: true` |
| "Revenue this quarter" | `moco_list_invoices` with `date_from`/`date_to`, read the totals line |
| "How many hours did the team log last month?" | `moco_list_activities` with a date range |
| "Who is on the team?" | `moco_list_users` |
| "Top clients by revenue" | `moco_list_invoices` across a date range, group by `customer` in the output |
| "Time by person on project Y" | `moco_list_activities` with `project_id`, then group by user |

## Filter first, iterate never

MOCO has rate limits (120 requests per 2 minutes on standard plans). Always filter on the server before bringing data into the conversation.

- Use `company_id`, `project_id`, `user_id`, `task_id`, `date_from`, `date_to` whenever the question narrows the scope
- Do **not** call `moco_get_project` in a loop over a list of project IDs. Use `moco_list_projects` with filters and work from that output instead.
- If you need more than one entity's details, call `moco_list_*` and parse the combined result

## Output conventions

- Durations are in **hours as floats** (e.g. `7.5` means 7 hours 30 minutes)
- Money is in the record's own currency (`EUR` in most cases, but always check the field)
- Dates are ISO `YYYY-MM-DD`
- IDs are integers. When chaining tools, pass IDs as strings to the schema (the tool wrappers expect comma-separated string filters)
- The server truncates activity listings to 50 rows with a note when the result is larger. Narrow the filter if you need full coverage.

## Gotchas

- `moco_list_activities` requires a `from` date. Without it the API returns 400, not an empty list.
- Dates are interpreted in the MOCO account's timezone, not UTC. Avoid relying on timezone-sensitive cutoffs.
- Archived projects are hidden by default from `moco_list_projects`. Pass `include_archived: true` to include them.
- Deactivated users are hidden by default from `moco_list_users`. Pass `include_archived: true` to include them.
- `moco_get_project`'s business report can fail on projects without financial data. The tool catches this and returns a note instead of crashing.

## What the server will not do

- No write operations. The server exposes no create/update/delete tools for MOCO data.
- No caching. Each call is a live API hit.
- No cross-account queries. The server is bound to one MOCO account via environment variables.

If a user asks to change MOCO data ("create this invoice", "log time for me"), explain that this server is read-only and they can make the change in MOCO directly.
