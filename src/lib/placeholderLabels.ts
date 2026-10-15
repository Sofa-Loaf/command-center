import { createPlaceholderMap, readPlaceholder } from "./placeholders";

const LABELS = createPlaceholderMap({
  host: "Host",
  ip: "IP",
  user: "User",
  port: "Port",
  path: "Path",
  service: "Service",
  pid: "PID",
  interface: "Iface",
  days: "Days",
});

/** Never read Object.prototype. `constructor` / `toString` / `__proto__` stay literal labels. */
export function placeholderLabel(key: string): string {
  return readPlaceholder(LABELS, key) ?? key;
}
