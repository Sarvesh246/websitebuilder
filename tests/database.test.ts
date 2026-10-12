import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const PROJECT = "a0000000-0000-4000-8000-000000000001";
const OWNER = "b0000000-0000-4000-8000-000000000001";
const OTHER = "b0000000-0000-4000-8000-000000000002";
const pg = new PGlite();

// Supabase-owned schemas are represented locally; every application migration is executed unchanged.
beforeAll(async () => {
  await pg.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create publication supabase_realtime;
  `);
  const dir = path.join(process.cwd(), "supabase/migrations");
  for (const file of (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort()) {
    await pg.exec(await readFile(path.join(dir, file), "utf8"));
  }
}, 30000);

beforeEach(async () => {
  await pg.exec(`reset role; drop trigger if exists fail_audit_event on public.project_events;
    truncate public.project_requests cascade; truncate auth.users cascade;
    insert into auth.users (id, email) values ('${OWNER}', 'client@example.com'), ('${OTHER}', 'other@example.com');
    insert into public.project_requests (id, submission_key, client_name, email, package, user_id, status, initial_payment_status,
      total_amount, deposit_amount, remaining_amount, amount_paid, preview_url)
    values ('${PROJECT}', gen_random_uuid(), 'Client', 'client@example.com', 'presence', '${OWNER}', 'client_review', 'paid',
      20000, 10000, 10000, 10000, 'https://example.com/preview');
    insert into public.payments (project_id, type, status, amount, stripe_payment_intent_id, idempotency_key)
    values ('${PROJECT}', 'deposit', 'succeeded', 10000, 'pi_deposit', 'deposit');
  `);
});
afterAll(async () => pg.close());

const refund = (total: number) =>
  pg.query<{ applied: boolean }>("select public.record_refund_total($1, 'pi_deposit', $2) as applied", [
    PROJECT,
    total,
  ]);
const approve = () =>
  pg.query<{ approved: boolean }>("select public.approve_project_review($1) as approved", [PROJECT]);
const draft = () =>
  pg.exec(`
  insert into public.feedback_rounds (project_id, number) values ('${PROJECT}', 1);
  insert into public.feedback_items (project_id, round_id, body)
  select '${PROJECT}', id, 'Please update the heading' from public.feedback_rounds where project_id = '${PROJECT}';
`);

describe("application migrations on PostgreSQL", () => {
  it("applies cumulative refund notifications once, including old notifications arriving late", async () => {
    for (const total of [0, 6000, 10000, 6000, 10000]) await refund(total);
    const project = await pg.query<{ refunded_amount: number; refund_status: string }>(
      "select refunded_amount, refund_status from public.project_requests where id = $1",
      [PROJECT],
    );
    expect(project.rows[0]).toEqual({ refunded_amount: 10000, refund_status: "full" });
    const ledger = await pg.query<{ total: number; count: number }>(
      "select sum(amount)::integer as total, count(*)::integer as count from public.payments where type = 'refund'",
    );
    expect(ledger.rows[0]).toEqual({ total: 10000, count: 2 });
    expect(
      (await pg.query<{ status: string }>("select status from public.payments where type = 'deposit'")).rows[0].status,
    ).toBe("refunded");
  });
  it("rolls back money, ledger and source state together if the final event write fails", async () => {
    await pg.exec(`create or replace function public.audit_event_failure() returns trigger language plpgsql as $$ begin raise exception 'event storage unavailable'; end $$;
      create trigger fail_audit_event before insert on public.project_events for each row execute function public.audit_event_failure();`);
    await expect(refund(5000)).rejects.toThrow("event storage unavailable");
    expect(
      (await pg.query<{ refunded_amount: number }>("select refunded_amount from public.project_requests")).rows[0]
        .refunded_amount,
    ).toBe(0);
    expect(
      (
        await pg.query<{ count: number }>(
          "select count(*)::integer as count from public.payments where type = 'refund'",
        )
      ).rows[0].count,
    ).toBe(0);
    expect(
      (await pg.query<{ status: string }>("select status from public.payments where type = 'deposit'")).rows[0].status,
    ).toBe("succeeded");
  });
  it("refuses invalid refund totals and preserves open disputes", async () => {
    await expect(refund(10001)).rejects.toThrow("invalid_refund_total");
    await expect(refund(-1)).rejects.toThrow("invalid_refund_total");
    await pg.query(
      "update public.project_requests set dispute_status = 'open', payment_status = 'disputed' where id = $1",
      [PROJECT],
    );
    await refund(5000);
    expect(
      (await pg.query<{ payment_status: string }>("select payment_status from public.project_requests")).rows[0]
        .payment_status,
    ).toBe("disputed");
  });
  it("refuses refund storage when the source currency differs from the project", async () => {
    await pg.exec("update public.payments set currency = 'eur'");
    await expect(refund(5000)).rejects.toThrow("refund_currency_mismatch");
    expect(
      (await pg.query<{ refunded_amount: number }>("select refunded_amount from public.project_requests")).rows[0]
        .refunded_amount,
    ).toBe(0);
  });
  it("does not submit a draft after approval has already won the review", async () => {
    await draft();
    expect((await approve()).rows[0].approved).toBe(true);
    expect((await pg.query("select * from public.submit_feedback_round($1)", [PROJECT])).rows).toHaveLength(0);
    expect((await approve()).rows[0].approved).toBe(false);
    expect(
      (await pg.query<{ revisions_used: number }>("select revisions_used from public.project_requests")).rows[0]
        .revisions_used,
    ).toBe(0);
  });
  it("waits for a submitted feedback round to be addressed before approving", async () => {
    await draft();
    expect((await pg.query("select * from public.submit_feedback_round($1)", [PROJECT])).rows).toHaveLength(1);
    expect((await approve()).rows[0].approved).toBe(false);
    await pg.exec("select public.resolve_feedback_round(id) from public.feedback_rounds");
    expect((await approve()).rows[0].approved).toBe(true);
  });
  it("refuses approval for unpaid, cancelled or preview-less projects", async () => {
    await pg.query("update public.project_requests set initial_payment_status = 'pending' where id = $1", [PROJECT]);
    expect((await approve()).rows[0].approved).toBe(false);
    await pg.query(
      "update public.project_requests set initial_payment_status = 'paid', status = 'cancelled' where id = $1",
      [PROJECT],
    );
    expect((await approve()).rows[0].approved).toBe(false);
    await pg.query("update public.project_requests set status = 'client_review', preview_url = null where id = $1", [
      PROJECT,
    ]);
    expect((await approve()).rows[0].approved).toBe(false);
  });
  it("grants financial and review functions only to the service role", async () => {
    for (const fn of [
      "public.record_refund_total(uuid,text,integer,text)",
      "public.approve_project_review(uuid)",
      "public.submit_feedback_round(uuid)",
    ]) {
      for (const role of ["anon", "authenticated", "service_role"]) {
        const result = await pg.query<{ allowed: boolean }>(
          "select has_function_privilege($1, $2, 'EXECUTE') as allowed",
          [role, fn],
        );
        expect(result.rows[0].allowed).toBe(role === "service_role");
      }
    }
  });
  it("enforces owner reads and hides financial secrets from browser roles", async () => {
    await pg.query("update public.project_requests set stripe_customer_id = 'cus_private' where id = $1", [PROJECT]);
    try {
      await pg.exec(`set role authenticated; set "request.jwt.claim.sub" = '${OTHER}';`);
      expect((await pg.query("select id from public.project_requests")).rows).toHaveLength(0);
      await pg.exec(`set "request.jwt.claim.sub" = '${OWNER}';`);
      expect((await pg.query("select id from public.project_requests")).rows).toHaveLength(1);
      await expect(pg.query("select stripe_customer_id from public.project_requests")).rejects.toThrow(
        "permission denied",
      );
      await expect(pg.query("update public.project_requests set amount_paid = 1")).rejects.toThrow("permission denied");
    } finally {
      await pg.exec("reset role");
    }
  });
  it("does not trust sign-up metadata for the studio role", async () => {
    await pg.exec(`insert into auth.users (id, email, raw_user_meta_data) values
      ('b0000000-0000-4000-8000-000000000003', 'MixedCase@Example.com', '{"role":"admin","full_name":"Test Client"}');`);
    const profile = await pg.query<{ role: string; email: string }>(
      "select role, email from public.profiles where id = 'b0000000-0000-4000-8000-000000000003'",
    );
    expect(profile.rows[0]).toEqual({ role: "client", email: "mixedcase@example.com" });
  });
  it("rotates reconciliation without changing project activity or forgetting old open payments", async () => {
    const old = "a0000000-0000-4000-8000-000000000002";
    await pg.exec(`insert into public.project_requests (id, submission_key, client_name, email, package, status, created_at, stripe_deposit_pi)
      values ('${old}', gen_random_uuid(), 'Old client', 'old@example.com', 'launch', 'building', '2025-01-01', 'pi_old');`);
    const queue = () => pg.query<{ id: string }>("select id from public.payment_reconciliation_queue('2026-01-01', 1)");
    expect((await queue()).rows[0].id).toBe(old);
    const before = (
      await pg.query<{ updated_at: Date }>("select updated_at from public.project_requests where id = $1", [old])
    ).rows[0].updated_at;
    await pg.query("insert into public.payment_reconciliation (project_id) values ($1)", [old]);
    expect((await queue()).rows[0].id).toBe(PROJECT);
    const after = (
      await pg.query<{ updated_at: Date }>("select updated_at from public.project_requests where id = $1", [old])
    ).rows[0].updated_at;
    expect(after).toEqual(before);
  });
});
