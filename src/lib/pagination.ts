export const PAGE_SIZE = 20;
export type Cursor = { time: string; id: string };
export type CursorRow = { id: string; sort_at: string; sort_id: string };
export function nextCursor(page: CursorRow[]): Cursor | undefined {
  const last = page.at(-1);
  // Do not parse/re-serialize PostgreSQL timestamps: Date loses microseconds.
  return last && page.length === PAGE_SIZE ? { time: last.sort_at, id: last.sort_id } : undefined;
}
export function uniqueRows<T extends { id: string }>(pages: T[][] | undefined): T[] {
  const seen = new Set<string>();
  return (pages ?? []).flat().filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}
