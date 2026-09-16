export interface TokenMatch {
  raw: string;
  name: string;
  defaultValue: string | undefined;
  index: number;
  length: number;
}

export interface FillResult {
  text: string;
  missing: string[];
  used: string[];
}

const TOKEN_RE =
  /\{\{([A-Za-z_][A-Za-z0-9_]*)(?::([^{}]*))?\}\}|\$\{([A-Za-z_][A-Za-z0-9_]*)(?::([^}]*))?\}/g;

export function normalizePlaceholderName(name: string): string {
  return name.trim().toLowerCase();
}

export function extractTokens(body: string): TokenMatch[] {
  const out: TokenMatch[] = [];
  const re = new RegExp(TOKEN_RE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(body)) !== null) {
    const name = match[1] ?? match[3] ?? "";
    const defaultValue = match[2] ?? match[4];
    out.push({
      raw: match[0],
      name,
      defaultValue: defaultValue === undefined ? undefined : defaultValue,
      index: match.index,
      length: match[0].length,
    });
  }
  return out;
}

export function uniqueTokenNames(body: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const token of extractTokens(body)) {
    const key = normalizePlaceholderName(token.name);
    if (!seen.has(key)) {
      seen.add(key);
      names.push(key);
    }
  }
  return names;
}

export function fillPlaceholders(
  body: string,
  values: Record<string, string>,
): FillResult {
  const missing: string[] = [];
  const used: string[] = [];
  const seenMissing = new Set<string>();
  const seenUsed = new Set<string>();

  const text = body.replace(TOKEN_RE, (_raw, braceName, braceDefault, dollarName, dollarDefault) => {
    const name = String(braceName ?? dollarName ?? "");
    const fallback = (braceDefault ?? dollarDefault) as string | undefined;
    const key = normalizePlaceholderName(name);
    const stored = values[key] ?? values[name] ?? "";
    const trimmed = stored.trim();
    if (trimmed) {
      if (!seenUsed.has(key)) {
        seenUsed.add(key);
        used.push(key);
      }
      return trimmed;
    }
    if (fallback !== undefined) {
      if (!seenUsed.has(key)) {
        seenUsed.add(key);
        used.push(key);
      }
      return fallback;
    }
    if (!seenMissing.has(key)) {
      seenMissing.add(key);
      missing.push(key);
    }
    return _raw;
  });

  return { text, missing, used };
}

export function collectLibraryPlaceholders(
  bodies: string[],
  standard: readonly string[],
): string[] {
  const extras: string[] = [];
  const seen = new Set(standard.map((name) => normalizePlaceholderName(name)));
  for (const body of bodies) {
    for (const name of uniqueTokenNames(body)) {
      if (!seen.has(name)) {
        seen.add(name);
        extras.push(name);
      }
    }
  }
  extras.sort();
  return extras;
}
