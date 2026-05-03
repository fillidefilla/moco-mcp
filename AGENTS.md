# Instructions for AI Agents

> How to use moco-mcp effectively when answering questions about a MOCO account.

This file is for the AI agent that connects to moco-mcp as an MCP client (Claude, ChatGPT, Cursor, etc.), not for someone developing the server itself. For development, see [`README.md`](./README.md).

## What this server is

A read-only connector to [MOCO](https://www.mocoapp.com), a time tracking and project management tool. It exposes a set of tools that query a single MOCO account via its REST API. The account is determined by the `MOCO_SUBDOMAIN` and `MOCO_API_KEY` environment variables configured on the server.

Nothing the server returns is cached. Every tool call hits MOCO live.

## The tools

| Tool | Purpose | Required args |
|---|---|---|
| `moco_list_projects` | List projects with filters | none |
| `moco_get_project` | Get one project, optionally with a business report | `id` |
| `moco_list_invoices` | List invoices with filters, returns totals | none |
| `moco_list_activities` | List project time entries | `from` (date) |
| `moco_list_users` | List users with filters | none |
| `moco_get_user` | Get one user with full details | `id` |
| `moco_get_user_performance_report` | Target hours vs tracked hours with the variation (work-time saldo) | `id` |
| `moco_list_employments` | List employment contracts (weekly target hours, work pattern, dates) | none |
| `moco_list_presences` | List presences (work-time entries) | `from`, `to` |
| `moco_list_holidays` | List user holiday entitlements | none |
| `moco_list_work_time_adjustments` | List manual saldo corrections | none |
| `moco_list_schedules` | List planned absences (unplannable, public holiday, sick, holiday, absence) | none |

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
| "What is X's overtime balance / saldo?" | `moco_get_user_performance_report` with the user `id` and a `year` (read the `variation`) |
| "What is X's contract / weekly target hours?" | `moco_list_employments` with `user_id` |
| "What were X's actual work hours last week?" | `moco_list_presences` with `user_id`, `from`, `to` |
| "How much vacation does X have this year?" | `moco_list_holidays` with `user_id` and `year` |
| "Why does the saldo not match the presences?" | `moco_list_work_time_adjustments` with `user_id` for the period |
| "When was X sick / on holiday?" | `moco_list_schedules` with `user_id` and `absence_code` |

## Work-time data model

MOCO separates **project time** (`activities`) from **legal work time**. Both are populated independently and one does not feed the other.

- **Activities** (`moco_list_activities`) - hours booked against projects and tasks. Used for billing and project reporting.
- **Presences** (`moco_list_presences`) - actual work-time clock entries (start/end times per day). Used for the legal work-time record.
- **Employments** (`moco_list_employments`) - the contract: weekly target hours and the daily am/pm pattern. Defines the "Soll".
- **Work time adjustments** (`moco_list_work_time_adjustments`) - manual corrections to the saldo for hours that should not flow through a regular presence (e.g. extra work during vacation, bonus hours).
- **Schedules** (`moco_list_schedules`) - planned absences (holiday, sick, public holiday) that affect the target hours for those days.
- **Performance report** (`moco_get_user_performance_report`) - MOCO's own derivation of target vs tracked vs variation, annual and monthly. Use this as the canonical saldo answer instead of computing it from the raw resources.

When asked about overtime, vacation balance, or work-time history, prefer the performance report. Drop down to the raw resources only when the question needs a per-day or per-entry view.

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
- `moco_list_presences` requires both `from` and `to`. The MOCO API rejects one without the other.
- Dates are interpreted in the MOCO account's timezone, not UTC. Avoid relying on timezone-sensitive cutoffs.
- Archived projects are hidden by default from `moco_list_projects`. Pass `include_archived: true` to include them.
- Deactivated users are hidden by default from `moco_list_users`. Pass `include_archived: true` to include them.
- `moco_get_project`'s business report can fail on projects without financial data. The tool catches this and returns a note instead of crashing.
- `moco_get_user_performance_report` defaults to the current year when `year` is omitted. For a former employee, pass the year(s) the contract covered.
- An open presence (no `to` time) shows as `(open)` and is not counted in the total hours. The full saldo only settles after the entry is closed.

## What the server will not do

- No write operations. The server exposes no create/update/delete tools for MOCO data.
- No caching. Each call is a live API hit.
- No cross-account queries. The server is bound to one MOCO account via environment variables.

If a user asks to change MOCO data ("create this invoice", "log time for me"), explain that this server is read-only and they can make the change in MOCO directly.
