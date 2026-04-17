# moco-mcp

> MCP server for [MOCO](https://www.mocoapp.com) - read-only access to projects, invoices, time entries, and users.

An open source [Model Context Protocol](https://modelcontextprotocol.io) server that lets AI assistants (Claude, ChatGPT, Cursor, etc.) query your MOCO data in natural language. Built with TypeScript and Nix.

## Tools

| Tool | Description |
|---|---|
| `moco_list_projects` | List projects with filters (company, leader, tags, date range) |
| `moco_get_project` | Get a single project with full details and optional business report |
| `moco_list_invoices` | List invoices with filters (status, date range, company, project) |
| `moco_list_activities` | List time entries with filters (date range, user, project, billable) |
| `moco_list_users` | List all users with name, email, and department |

## Prerequisites

- [Nix](https://nixos.org/download) with flakes enabled, or Node.js >= 20 with pnpm
- A MOCO account with API access

## Setup

### 1. Clone and build

```bash
git clone https://github.com/fillidefilla/moco-mcp.git
cd moco-mcp

# With Nix (recommended)
nix develop
pnpm install
pnpm build

# Without Nix
pnpm install
pnpm build
```

### 2. Get your MOCO API key

Go to your MOCO account: **Profile > Integrations > API** and copy your API key.

### 3. Configure your MCP client

#### Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "moco-mcp": {
      "command": "node",
      "args": ["/path/to/moco-mcp/build/index.js"],
      "env": {
        "MOCO_API_KEY": "your-api-key",
        "MOCO_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

Replace `/path/to/moco-mcp` with the actual path where you cloned the repo. Replace `your-subdomain` with the part before `.mocoapp.com` in your MOCO URL.

#### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "moco-mcp": {
      "command": "node",
      "args": ["/path/to/moco-mcp/build/index.js"],
      "env": {
        "MOCO_API_KEY": "your-api-key",
        "MOCO_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

#### Cursor

Add to `.cursor/mcp.json` in your project:

```json
{
  "mcpServers": {
    "moco-mcp": {
      "command": "node",
      "args": ["/path/to/moco-mcp/build/index.js"],
      "env": {
        "MOCO_API_KEY": "your-api-key",
        "MOCO_SUBDOMAIN": "your-subdomain"
      }
    }
  }
}
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `MOCO_SUBDOMAIN` | Yes | Your MOCO subdomain (the part before `.mocoapp.com`) |
| `MOCO_API_KEY` | Yes | Your MOCO API key (Profile > Integrations > API) |

## Scripts

| Script | Purpose |
|---|---|
| `pnpm build` | Compile TypeScript to `build/` |
| `pnpm dev` | Watch mode - rebuild on changes |
| `pnpm check` | Type check without emitting |
| `pnpm start` | Run the built server |
| `pnpm clean` | Remove the `build/` directory |

## Project structure

```
src/
  index.ts          # Server entry point, tool registration
  api.ts            # MOCO API client (auth, pagination, fetch helpers)
  tools/
    projects.ts     # Project tools (list, get with report)
    invoices.ts     # Invoice tools (list with filters)
    activities.ts   # Activity/time entry tools (list with filters)
    users.ts        # User tools (list)
build/              # Compiled output (gitignored)
flake.nix           # Nix dev shell definition
```

## MOCO API

This server uses the [MOCO REST API v1](https://everii-group.github.io/mocoapp-api-docs/). Authentication is via API key passed as a bearer token. The server is read-only and does not create, update, or delete any data in MOCO.

Rate limits: 120 requests per 2 minutes on the standard plan, 1200 on the unlimited plan.

## Contributing

Issues and pull requests welcome. Before opening a PR:

- Open an issue first to discuss larger changes
- Keep runtime dependencies minimal. Every new one is a supply-chain risk and a size cost.
- TypeScript strict mode, ES modules, no raw `fetch` calls outside `src/api.ts`
- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages

[`AGENTS.md`](./AGENTS.md) documents how AI agents should use the tools, not how to develop the server.

## Releases

This repo follows [Semantic Versioning](https://semver.org). No release has been cut yet. A `CHANGELOG.md` will be added alongside the first tagged release.

## License

MIT - see [LICENSE](./LICENSE).
