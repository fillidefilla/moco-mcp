/**
 * User tools - list users from MOCO.
 */

import { z } from "zod";
import { fetchAll } from "../api.js";

export const listUsersSchema = z.object({
  include_archived: z
    .boolean()
    .optional()
    .describe("Include deactivated users (default: false)"),
});

export async function listUsers(
  args: z.infer<typeof listUsersSchema>,
): Promise<string> {
  const params: Record<string, string> = {};
  if (args.include_archived) params.include_archived = "true";

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
