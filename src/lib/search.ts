import type { Command, Tab } from "./types";

export interface SearchHit {
  command: Command;
  tab: Tab;
  score: number;
}

function haystack(command: Command, tab: Tab): string {
  return [command.title, command.notes, command.tags.join(" "), command.body, tab.name, command.os]
    .join("\n")
    .toLowerCase();
}

export function searchCommands(
  items: Array<{ tab: Tab; command: Command }>,
  query: string,
): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return items.map(({ tab, command }) => ({ tab, command, score: command.favorite ? 1 : 0 }));
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  const hits: SearchHit[] = [];

  for (const { tab, command } of items) {
    const title = command.title.toLowerCase();
    const blob = haystack(command, tab);
    if (!tokens.every((token) => blob.includes(token))) continue;

    let score = 10;
    if (title === q) score += 200;
    else if (title.startsWith(q)) score += 120;
    else if (title.includes(q)) score += 80;
    if (command.tags.some((tag) => tag.toLowerCase().includes(q))) score += 40;
    if (command.notes.toLowerCase().includes(q)) score += 20;
    if (command.body.toLowerCase().includes(q)) score += 12;
    if (tab.name.toLowerCase().includes(q)) score += 8;
    if (command.favorite) score += 6;
    hits.push({ tab, command, score });
  }

  hits.sort((a, b) => b.score - a.score || a.command.title.localeCompare(b.command.title));
  return hits;
}
