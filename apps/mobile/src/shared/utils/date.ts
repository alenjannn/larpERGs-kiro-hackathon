export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  // Date-only values (e.g. birth_date) are calendar dates, not UTC instants.
  const d = parseYMD(iso) ?? new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return 'never';
  const diff = now - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '—';
  const future = diff < 0;
  const mins = Math.round(Math.abs(diff) / 60000);
  const [value, unit] =
    mins < 1 ? [0, 'now'] : mins < 60 ? [mins, 'min'] : mins < 1440 ? [Math.round(mins / 60), 'hr'] : [Math.round(mins / 1440), 'day'];
  if (unit === 'now') return 'just now';
  const label = `${value} ${unit}${value === 1 ? '' : 's'}`;
  return future ? `in ${label}` : `${label} ago`;
}

export function isWithinDays(iso: string | null | undefined, days: number, now = Date.now()): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return !Number.isNaN(t) && now - t <= days * 86400000 && t <= now;
}

/** Strict YYYY-MM-DD parser (rejects impossible dates like 2026-02-31). Returns local midnight. */
export function parseYMD(text: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text.trim());
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}
