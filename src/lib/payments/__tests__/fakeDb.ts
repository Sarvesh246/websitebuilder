/** Minimal in-memory stand-in for the supabase-js query builder (only what the payment code uses). */
type Row = Record<string, unknown>;
type Pred = (r: Row) => boolean;
const UNIQUE: Record<string, string[][]> = {
  payments: [["project_id", "kind"], ["stripe_refund_id"], ["stripe_checkout_session_id"]],
  stripe_webhook_events: [["event_id"]],
};
const CONFLICT: Record<string, string[]> = { payments: ["project_id", "kind"] };

export class FakeDb {
  tables: Record<string, Row[]> = { project_requests: [], payments: [], stripe_webhook_events: [] };
  private n = 0;
  from(table: string) {
    return new Query(this, table);
  }
  id() {
    return `00000000-0000-4000-8000-${String(++this.n).padStart(12, "0")}`;
  }
  rows(t: string) {
    return this.tables[t];
  }
}

class Query {
  private preds: Pred[] = [];
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: Row = {};
  private opts: { onConflict?: string; ignoreDuplicates?: boolean } = {};
  private returning = false;
  private sort?: { col: string; asc: boolean };
  constructor(private db: FakeDb, private table: string) {}

  select() {
    if (this.op !== "select") this.returning = true;
    return this;
  }
  insert(v: Row) { this.op = "insert"; this.payload = v; return this; }
  update(v: Row) { this.op = "update"; this.payload = v; return this; }
  upsert(v: Row, o: { onConflict?: string; ignoreDuplicates?: boolean } = {}) { this.op = "upsert"; this.payload = v; this.opts = o; return this; }
  delete() { this.op = "delete"; return this; }
  eq(c: string, v: unknown) { this.preds.push((r) => r[c] === v); return this; }
  neq(c: string, v: unknown) { this.preds.push((r) => r[c] !== v); return this; }
  in(c: string, v: unknown[]) { this.preds.push((r) => v.includes(r[c])); return this; }
  is(c: string, v: null) { this.preds.push((r) => (r[c] ?? null) === v); return this; }
  not(c: string, _op: string, v: null) { this.preds.push((r) => (r[c] ?? null) !== v); return this; }
  order(col: string, o: { ascending: boolean }) { this.sort = { col, asc: o.ascending }; return this; }
  maybeSingle() { return this.run().then((r) => ({ data: r.data?.[0] ?? null, error: r.error })); }
  single() { return this.run().then((r) => ({ data: r.data?.[0] ?? null, error: r.data?.[0] ? null : { code: "PGRST116" } })); }
  then<T>(res: (v: { data: Row[] | null; error: { code: string } | null }) => T) { return this.run().then(res); }

  private conflict(row: Row): boolean {
    return (UNIQUE[this.table] ?? []).some((cols) =>
      this.db.rows(this.table).some((r) => r !== row && cols.every((c) => row[c] != null && r[c] === row[c])),
    );
  }

  private async run(): Promise<{ data: Row[] | null; error: { code: string } | null }> {
    await Promise.resolve(); // yield, so concurrent callers interleave like real I/O
    const rows = this.db.rows(this.table);
    const match = rows.filter((r) => this.preds.every((p) => p(r)));
    const out = (list: Row[]) => structuredClone(list);
    switch (this.op) {
      case "select": {
        let list = match;
        if (this.sort) list = [...list].sort((a, b) => (String(a[this.sort!.col]) < String(b[this.sort!.col]) ? -1 : 1) * (this.sort!.asc ? 1 : -1));
        return { data: out(list), error: null };
      }
      case "insert":
      case "upsert": {
        const row: Row = { id: this.db.id(), created_at: new Date().toISOString(), ...this.payload };
        if (this.table === "project_requests") Object.assign(row, defaults(), this.payload);
        if (this.table === "payments") Object.assign(row, { status: "pending", refunded_cents: 0, checkout_seq: 0, currency: "usd" }, this.payload);
        if (this.op === "upsert") {
          const keys = (this.opts.onConflict ?? CONFLICT[this.table]?.join(",") ?? "id").split(",");
          const hit = rows.find((r) => keys.every((k) => r[k] === row[k]));
          if (hit) {
            if (!this.opts.ignoreDuplicates) Object.assign(hit, this.payload);
            return { data: out([hit]), error: null };
          }
        }
        if (this.conflict(row)) return { data: null, error: { code: "23505" } };
        rows.push(row);
        return { data: out([row]), error: null };
      }
      case "update": {
        for (const r of match) Object.assign(r, this.payload);
        return { data: this.returning ? out(match) : null, error: null };
      }
      case "delete": {
        this.db.tables[this.table] = rows.filter((r) => !match.includes(r));
        return { data: null, error: null };
      }
    }
  }
}

const defaults = (): Row => ({
  status: "new", payment_status: "unpaid", currency: "usd", initial_payment_status: "not_required", final_payment_status: "not_required",
  final_attempts: 0, refunded_cents: 0, refund_status: "none", payment_terms_accepted: false, future_charge_authorized: false,
});
