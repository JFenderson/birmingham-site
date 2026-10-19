"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoeCheckInScanner } from "./shoe-check-in-scanner";
import {
  allocateDonationAction, assignShoeRoleAction, checkInAction, cloneCampaignAction, commitImportAction,
  distributeShoeAction, importDonationsAction, previewImportAction, purchaseShoeAction,
  reservationAdminAction, lookupShoeReservationAction, saveCampaignAction,
} from "./actions";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AdminData = { campaigns: any[]; campaign: any | null; requests: any[]; reservations: any[]; donations: any[]; allocations: any[]; purchases: any[]; distributions: any[]; audit: any[]; staff: any[]; activeReservations: number };
type ActionResult = { success?: string; error?: string; rows?: any[] };

function stateLabel(value: string) { return value.replaceAll("_", " "); }
function money(cents: number) { return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`; }

export function ShoesAdminConsole({ data, role }: { data: AdminData; role: "super" | "director" | "committee" | "finance" | "distribution" }) {
  const canCampaign = role === "super" || role === "director";
  const canReservations = canCampaign || role === "committee";
  const canFinance = role === "super" || role === "finance";
  const canDistribution = canCampaign || role === "distribution";
  const [message, setMessage] = useState<ActionResult>({});
  const [preview, setPreview] = useState<ActionResult | null>(null);
  const [search, setSearch] = useState("");
  const [lookupText, setLookupText] = useState("");
  const [lookedUpReservation, setLookedUpReservation] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [manifestSchool, setManifestSchool] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const c = data.campaign;

  function run(form: FormData, action: (form: FormData) => Promise<ActionResult>) {
    setMessage({});
    start(async () => {
      const result = await action(form);
      setMessage(result);
      if (result.success) {
        if (lookedUpReservation && c) {
          const lookup = new FormData();
          lookup.set("campaignId", c.id);
          lookup.set("lookup", lookedUpReservation.reference);
          const current = await lookupShoeReservationAction(lookup);
          if (current.reservation) setLookedUpReservation(current.reservation);
        }
        router.refresh();
      }
    });
  }

  function lookupReservation(value: string) {
    if (!c) return;
    const form = new FormData();
    form.set("campaignId", c.id);
    form.set("lookup", value);
    setMessage({});
    start(async () => {
      const result = await lookupShoeReservationAction(form);
      if (result.reservation) {
        setLookedUpReservation(result.reservation);
        setSearch(result.reservation.reference);
        setStatusFilter("all");
      } else setMessage({ error: result.error ?? "Reservation lookup failed." });
    });
  }

  const filteredReservations = useMemo(() => [
    ...(lookedUpReservation && !data.reservations.some((reservation) => reservation.id === lookedUpReservation.id) ? [lookedUpReservation] : []),
    ...data.reservations,
  ].filter((reservation) => {
    const haystack = `${reservation.reference} ${reservation.shoe_sponsors?.name ?? ""} ${reservation.shoe_sponsors?.email ?? ""} ${reservation.shoe_sponsors?.organization_name ?? ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (statusFilter === "all" || reservation.status === statusFilter);
  }), [data.reservations, lookedUpReservation, search, statusFilter]);
  const requested = data.requests.filter((r) => r.status !== "cancelled").length;
  const received = data.requests.filter((r) => !!r.received_at).length;
  const purchased = data.requests.filter((r) => !!r.purchased_at).length;
  const distributed = data.requests.filter((r) => r.status === "distributed").length;
  const fulfilled = data.requests.filter((r) => ["received","purchased","distributed"].includes(r.status)).length;
  const activeReservations = data.activeReservations;
  const verifiedDonations = data.donations.filter((d) => ["succeeded", "refunded", "partially_refunded"].includes(d.payment_status))
    .reduce((sum, d) => sum + d.amount_cents - d.refunded_cents, 0);
  const grossDonations = data.donations.filter((d) => ["succeeded", "refunded", "partially_refunded"].includes(d.payment_status)).reduce((sum, d) => sum + d.amount_cents, 0);
  const refunds = data.donations.reduce((sum, d) => sum + d.refunded_cents, 0);
  const allocatedFunds = data.allocations.reduce((sum, a) => sum + a.amount_cents, 0);
  const fundedPurchaseCosts = data.purchases.filter((p) => p.allocation_id).reduce((sum, p) => sum + p.cost_cents, 0);
  const metrics: Array<[string, number | string]> = [
    ["Requests", requested], ["Active reservations", activeReservations],
    ["Received", received], ["Purchased", purchased], ["Distributed", distributed],
    ["Outstanding", requested - fulfilled],
    ...(canFinance ? [["Net verified donations", money(verifiedDonations)] as [string, string]] : []),
  ];
  const schools = [...new Set(data.requests.map((row) => row.school_code as string))].filter(Boolean).sort();

  return <div className="space-y-10 pb-16">
    <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Tau Sigma Charity Foundation</p><h2 className="mt-2 text-3xl font-bold">Shoes for Kids operations</h2><p className="mt-2 text-sm text-zinc-600">Campaign, school inventory, reservations, physical check-in, and Zeffy reconciliation.</p></div>
    {message.success ? <p role="status" className="rounded-xl bg-green-50 p-4 text-green-900">{message.success}</p> : null}
    {message.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">{message.error}</p> : null}
    <nav className="flex flex-wrap gap-3 text-sm font-semibold" aria-label="Shoes operations sections">{[["Overview","overview"],...(canCampaign ? [["Campaign","campaign"],["School import","import"]] : []),...(canReservations ? [["Reservations","reservations"]] : []),...((canFinance || canDistribution) ? [["Inventory","inventory"]] : []),...(canFinance ? [["Donations","donations"]] : []),...(canCampaign ? [["Activity","activity"]] : [])].map(([label,id]) => <a key={id} href={`#${id}`} className="rounded-full border border-zinc-300 px-4 py-2 hover:bg-zinc-100">{label}</a>)}</nav>
    <section id="overview" className="scroll-mt-6 space-y-5">
      <div className="flex flex-wrap items-center gap-4"><h3 className="text-2xl font-bold">Overview</h3><select aria-label="Campaign" value={c?.id ?? ""} onChange={(event) => window.location.assign(`/admin/shoes-for-kids?campaign=${event.target.value}`)} className="rounded-lg border border-zinc-300 p-2">{data.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name} · {campaign.code} · {campaign.status}</option>)}</select></div>
      {c ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label,value]) => <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-5"><p className="text-sm text-zinc-600">{label}</p><p className="mt-2 text-2xl font-bold text-blue-800">{value}</p></div>)}</div> : <p>No campaign is configured. Create one below.</p>}
      {c ? <div className="flex flex-wrap gap-3">{(canCampaign || canFinance) ? <a href={`/admin/shoes-for-kids/report.csv?campaign=${c.id}`} className="rounded-full bg-blue-800 px-4 py-2 text-sm font-semibold text-white">Export CSV report</a> : null}<button type="button" onClick={() => window.print()} className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold">Print summary</button></div> : null}
    </section>
    {canCampaign ? <section id="campaign" className="scroll-mt-6 rounded-2xl border border-zinc-200 bg-white p-6"><h3 className="text-2xl font-bold">Campaign manager</h3>
      <form key={c?.id ?? "new"} onSubmit={(event) => { event.preventDefault(); run(new FormData(event.currentTarget), saveCampaignAction); }} className="mt-5 grid gap-4 sm:grid-cols-2">
        {c ? <input type="hidden" name="campaignId" value={c.id} /> : null}
        <label className="text-sm font-semibold">Campaign code<input required name="code" defaultValue={c?.code ?? "sfk-2026"} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">Name<input required name="name" defaultValue={c?.name ?? "Shoes for Kids — Adopt a Pair"} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">Year<input required type="number" name="year" defaultValue={c?.year ?? 2026} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">State<select name="status" defaultValue={c?.status ?? "draft"} className="mt-1 w-full rounded-lg border border-zinc-300 p-3">{["draft","published","paused","closed","archived"].map((status) => <option key={status} value={status}>{stateLabel(status)}</option>)}</select></label>
        <label className="text-sm font-semibold">Physical delivery deadline · Central Time<input required type="date" name="deadlineDate" defaultValue={c?.physical_deadline ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(c.physical_deadline)) : "2026-12-11"} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">Reservation days<input required type="number" min="1" max="30" name="reservationDays" defaultValue={c?.reservation_days ?? 7} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">Drop-off location<input name="dropoffLocation" defaultValue={c?.dropoff_location ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">Drop-off hours<input name="dropoffHours" defaultValue={c?.dropoff_hours ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">Recipient contact<input name="dropoffContact" defaultValue={c?.dropoff_contact ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">Distribution period<input name="distributionNote" defaultValue={c?.distribution_note ?? "The week before Christmas"} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">Suggested pair donation ($)<input required type="number" min="1" step="0.01" name="suggestedPairDollars" defaultValue={(c?.suggested_pair_cents ?? 5000) / 100} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold sm:col-span-2">Special drop-off instructions<textarea name="dropoffInstructions" defaultValue={c?.dropoff_instructions ?? ""} rows={2} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">Zeffy campaign sharing URL<input type="url" name="zeffyUrl" defaultValue={c?.zeffy_url ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="text-sm font-semibold">Zeffy iframe URL (optional)<input type="url" name="zeffyEmbedUrl" defaultValue={c?.zeffy_embed_url ?? ""} className="mt-1 w-full rounded-lg border border-zinc-300 p-3" /></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="showDonationTotal" defaultChecked={c?.show_donation_total ?? true} /> Show verified donation total publicly</label>
        <button disabled={pending} className="rounded-full bg-blue-800 px-5 py-3 font-semibold text-white disabled:opacity-50 sm:col-span-2">Save campaign settings</button>
      </form>
      {c ? <form onSubmit={(event) => { event.preventDefault(); run(new FormData(event.currentTarget), cloneCampaignAction); }} className="mt-8 grid gap-3 border-t border-zinc-200 pt-7 sm:grid-cols-4"><h4 className="text-lg font-bold sm:col-span-4">Clone settings for another campaign</h4><input type="hidden" name="sourceId" value={c.id} /><label className="text-sm">New code<input required name="code" placeholder="sfk-2027-spring" className="mt-1 w-full rounded-lg border p-2" /></label><label className="text-sm">Year<input required name="year" type="number" min="2026" defaultValue={c.year + 1} className="mt-1 w-full rounded-lg border p-2" /></label><label className="text-sm">Deadline<input required name="deadlineDate" type="date" className="mt-1 w-full rounded-lg border p-2" /></label><button disabled={pending} className="self-end rounded-full border border-blue-800 px-4 py-2 font-semibold text-blue-800">Create draft clone</button><p className="text-xs text-zinc-600 sm:col-span-4">Only settings are copied. Requests, reservations, sponsor details, donations, and receipts are excluded.</p></form> : null}
      {c ? <button type="button" onClick={() => window.location.assign("/admin/shoes-for-kids?campaign=new")} className="mt-5 text-sm font-semibold text-blue-800 underline">Create a separate campaign</button> : null}
    </section> : null}
    {c ? <>
      {canCampaign ? <section id="import" className="scroll-mt-6 rounded-2xl border border-zinc-200 bg-white p-6"><h3 className="text-2xl font-bold">School request import</h3><p className="mt-2 text-sm text-zinc-600">CSV or XLSX, up to 500 pairs per batch. The file must contain anonymous references only. Preview before committing.</p>
        <p className="mt-3 text-xs text-zinc-600">Columns: External Request Reference, School Code, Shoe Size System, Shoe Size, Shoe Width, Shoe Type, Quantity, Optional Approved Purchase Notes.</p>
        <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); setPreview(null); start(async () => setPreview(await previewImportAction(form))); }} className="mt-5 flex flex-wrap items-end gap-3"><input type="hidden" name="campaignId" value={c.id} /><label className="text-sm font-semibold">School file<input required name="file" type="file" accept=".csv,.xlsx" className="mt-1 block max-w-full rounded-lg border p-2" /></label><button disabled={pending} className="rounded-full border border-blue-800 px-5 py-2 font-semibold text-blue-800">Preview</button><button disabled={pending || !preview?.success} type="button" onClick={(event) => { const form = (event.currentTarget as HTMLElement).closest("form"); if (form && window.confirm("Import these validated pairs?")) run(new FormData(form), commitImportAction); }} className="rounded-full bg-blue-800 px-5 py-2 font-semibold text-white disabled:opacity-40">Commit import</button></form>
        {preview?.error ? <p role="alert" className="mt-4 text-red-700">{preview.error}</p> : null}{preview?.success ? <div className="mt-4"><p role="status" className="text-green-800">{preview.success}</p><div className="mt-2 overflow-x-auto"><table className="min-w-full text-left text-xs"><thead><tr><th>Reference</th><th>School</th><th>Size</th><th>Width</th><th>Type</th></tr></thead><tbody>{preview.rows?.map((row) => <tr key={row.externalRef} className="border-t"><td>{row.externalRef}</td><td>{row.schoolCode}</td><td>{row.sizeSystem} {row.shoeSize}</td><td>{row.width}</td><td>{row.shoeType}</td></tr>)}</tbody></table></div></div> : null}
      </section> : null}
      {canReservations ? <section id="reservations" className="scroll-mt-6 space-y-5"><h3 className="text-2xl font-bold">Reservations and check-in</h3><p className="text-sm text-zinc-600">Scan the QR on a sponsor confirmation or enter its reservation reference. Both find older reservations beyond the recent list.</p><form onSubmit={(event) => { event.preventDefault(); lookupReservation(lookupText); }} className="flex flex-wrap items-end gap-3"><label className="text-sm font-semibold">Reservation reference or check-in code<input required value={lookupText} onChange={(event) => setLookupText(event.target.value)} placeholder="SFK-R-2026-0024" className="mt-1 block min-w-64 rounded-lg border border-zinc-300 p-3" /></label><button disabled={pending} className="rounded-full bg-blue-800 px-5 py-3 font-semibold text-white">Find for check-in</button></form><ShoeCheckInScanner onScan={(code) => { setLookupText(code); lookupReservation(code); }} /><div className="flex flex-wrap gap-3"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter recent reference or sponsor" aria-label="Filter recent reservations" className="min-w-64 rounded-lg border border-zinc-300 p-3" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Reservation status" className="rounded-lg border border-zinc-300 p-3"><option value="all">All statuses</option>{["reserved","partially_received","received","expired","cancelled","exception"].map((status) => <option key={status} value={status}>{stateLabel(status)}</option>)}</select></div>
        {filteredReservations.length === 0 ? <p>No matching reservations.</p> : filteredReservations.map((reservation) => <article key={reservation.id} className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h4 className="text-lg font-bold">{reservation.reference} <span className="text-sm font-normal">· {stateLabel(reservation.status)}</span></h4><p className="text-sm text-zinc-600">{reservation.shoe_sponsors?.organization_name ?? reservation.shoe_sponsors?.name} · {reservation.shoe_sponsors?.email}</p><p className="text-xs text-zinc-600">Expires {new Date(reservation.expires_at).toLocaleString()}</p></div><div className="flex flex-wrap gap-2"><form onSubmit={(event) => { event.preventDefault(); if (window.confirm("Cancel remaining undelivered pairs?")) run(new FormData(event.currentTarget), reservationAdminAction); }}><input type="hidden" name="campaignId" value={c.id} /><input type="hidden" name="reservationId" value={reservation.id} /><input type="hidden" name="operation" value="cancel" /><button disabled={pending} className="rounded-full border border-red-300 px-3 py-2 text-sm text-red-800">Cancel remaining</button></form><form onSubmit={(event) => { event.preventDefault(); run(new FormData(event.currentTarget), reservationAdminAction); }} className="flex gap-2"><input type="hidden" name="campaignId" value={c.id} /><input type="hidden" name="reservationId" value={reservation.id} /><input type="hidden" name="operation" value="extend" /><input required type="date" name="until" aria-label="Extend until" className="rounded-lg border p-2 text-sm" /><button disabled={pending} className="rounded-full border border-blue-300 px-3 py-2 text-sm text-blue-800">Extend</button></form></div></div>
          <ul className="mt-4 space-y-3">{reservation.shoe_reservation_items?.map((item: any) => <li key={item.id} className="rounded-xl bg-zinc-50 p-3 text-sm"><p><strong>{item.shoe_requests?.public_ref}</strong> · {item.shoe_requests?.size_system} {item.shoe_requests?.shoe_size} · {item.shoe_requests?.width} · {item.shoe_requests?.shoe_type} · {stateLabel(item.status)}</p>{item.status === "reserved" ? <form onSubmit={(event) => { event.preventDefault(); run(new FormData(event.currentTarget), checkInAction); }} className="mt-3 flex flex-wrap items-center gap-3"><input type="hidden" name="campaignId" value={c.id} /><input type="hidden" name="requestId" value={item.request_id} /><label><input type="checkbox" name="sizeVerified" /> Size</label><label><input type="checkbox" name="widthVerified" /> Width</label><label><input type="checkbox" name="typeVerified" /> Type</label><select name="accepted" aria-label="Condition" className="rounded-lg border p-2"><option value="yes">Accept new pair</option><option value="no">Flag exception</option></select><input name="note" maxLength={500} placeholder="Check-in note" aria-label="Check-in note" className="rounded-lg border p-2" /><button disabled={pending} className="rounded-full bg-blue-800 px-4 py-2 text-white">Record check-in</button></form> : null}</li>)}</ul>
        </article>)}
      </section> : null}
      {(canFinance || canDistribution) ? <section id="inventory" className="scroll-mt-6 rounded-2xl border border-zinc-200 bg-white p-6"><h3 className="text-2xl font-bold">Inventory and distribution</h3><p className="mt-2 text-sm text-zinc-600">Record chapter purchases against specific available requests. Distribution requires an accepted receipt or recorded purchase.</p>
        {canDistribution ? <div className="mt-4 flex flex-wrap items-center gap-3"><label className="text-sm font-semibold">School manifest <select value={manifestSchool} onChange={(event) => setManifestSchool(event.target.value)} className="ml-2 rounded-lg border p-2"><option value="">Choose school</option>{schools.map((school) => <option key={school} value={school}>{school}</option>)}</select></label>{manifestSchool ? <a href={`/admin/shoes-for-kids/manifest.csv?campaign=${c.id}&school=${encodeURIComponent(manifestSchool)}`} className="rounded-full border border-blue-800 px-4 py-2 text-sm font-semibold text-blue-800">Download ready-pair manifest</a> : null}</div> : null}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {canFinance ? <form onSubmit={(event) => { event.preventDefault(); run(new FormData(event.currentTarget), purchaseShoeAction); }} className="space-y-3 rounded-xl bg-zinc-50 p-4"><h4 className="font-bold">Record chapter purchase</h4><input type="hidden" name="campaignId" value={c.id} /><select required name="requestId" aria-label="Available request to purchase" className="w-full rounded-lg border p-2"><option value="">Choose available request</option>{data.requests.filter((r) => r.status === "available").map((r) => <option key={r.id} value={r.id}>{r.public_ref} · {r.size_system} {r.shoe_size} · {r.width}</option>)}</select><input required name="costDollars" type="number" min="0.01" step="0.01" placeholder="Actual cost in USD" aria-label="Actual cost in USD" className="w-full rounded-lg border p-2" /><select name="allocationId" aria-label="Funding allocation" className="w-full rounded-lg border p-2"><option value="">General purchasing budget</option>{data.allocations.filter((a) => a.request_id && a.actual_purchase_cents === null).map((a) => <option key={a.id} value={a.id}>{data.requests.find((r) => r.id === a.request_id)?.public_ref} · {money(a.amount_cents)} allocated</option>)}</select><input name="note" placeholder="Purchase note or receipt reference" aria-label="Purchase note" className="w-full rounded-lg border p-2" /><button disabled={pending} className="rounded-full bg-blue-800 px-4 py-2 font-semibold text-white">Record purchase</button></form> : null}
          {canDistribution ? <form onSubmit={(event) => { event.preventDefault(); run(new FormData(event.currentTarget), distributeShoeAction); }} className="space-y-3 rounded-xl bg-zinc-50 p-4"><h4 className="font-bold">Record school distribution</h4><input type="hidden" name="campaignId" value={c.id} /><select required name="requestId" aria-label="Fulfilled pair to distribute" className="w-full rounded-lg border p-2"><option value="">Choose received or purchased pair</option>{data.requests.filter((r) => ["received","purchased"].includes(r.status)).map((r) => <option key={r.id} value={r.id}>{r.public_ref} · school {r.school_code} · {r.size_system} {r.shoe_size}</option>)}</select><input required name="deliveryReference" placeholder="School delivery confirmation reference" aria-label="Delivery confirmation reference" className="w-full rounded-lg border p-2" /><button disabled={pending} className="rounded-full bg-blue-800 px-4 py-2 font-semibold text-white">Confirm delivery</button></form> : null}
        </div>
        <p className="mt-5 text-sm text-zinc-700">{data.distributions.length} pairs distributed{canFinance ? ` · ${data.purchases.length} purchases · ${money(data.purchases.reduce((sum, p) => sum + p.cost_cents, 0))} in shoe costs` : ""}.</p>
      </section> : null}
      {canFinance ? <section id="donations" className="scroll-mt-6 rounded-2xl border border-zinc-200 bg-white p-6"><h3 className="text-2xl font-bold">Zeffy donation reconciliation</h3><p className="mt-2 text-sm text-zinc-600">Verify exported transactions against Zeffy before importing. Browser visits and sponsorship promises are never counted as payments. Reimporting a transaction ID updates that record, without double-counting it.</p><p className="mt-2 text-xs">CSV columns: Zeffy Transaction ID, Amount USD, Refunded USD, Currency, Status, Donor Reference, Paid At (ISO timestamp).</p>
        <p className="mt-3 text-sm font-semibold">Gross: {money(grossDonations)} · Refunds: {money(refunds)} · Net verified: {money(verifiedDonations)} · Allocated: {money(allocatedFunds)} · Unallocated: {money(verifiedDonations - allocatedFunds)} · Funded shoe costs: {money(fundedPurchaseCosts)} · Net less funded purchases: {money(verifiedDonations - fundedPurchaseCosts)}</p>
        <form onSubmit={(event) => { event.preventDefault(); run(new FormData(event.currentTarget), importDonationsAction); }} className="mt-4 flex flex-wrap items-end gap-3"><input type="hidden" name="campaignId" value={c.id} /><label className="text-sm font-semibold">Zeffy CSV<input required type="file" name="file" accept=".csv" className="mt-1 block rounded-lg border p-2" /></label><button disabled={pending} className="rounded-full bg-blue-800 px-5 py-2 font-semibold text-white">Import verified transactions</button></form>
        {data.donations.some((donation) => donation.review_note) ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">One or more refunds exceed allocated funds. Reconcile those donations in Zeffy and review their allocations.</p> : null}
        <div className="mt-6 space-y-3">{data.donations.length ? data.donations.map((donation) => <div key={donation.id} className="rounded-xl border border-zinc-200 p-4"><p className="font-semibold">{donation.zeffy_transaction_id} · {money(donation.amount_cents - donation.refunded_cents)} net · {stateLabel(donation.payment_status)}</p><p className="text-xs text-zinc-600">{donation.donor_reference || "No donor reference"}</p>{donation.payment_status === "succeeded" || donation.payment_status === "partially_refunded" ? <form onSubmit={(event) => { event.preventDefault(); run(new FormData(event.currentTarget), allocateDonationAction); }} className="mt-3 flex flex-wrap gap-2"><input type="hidden" name="campaignId" value={c.id} /><input type="hidden" name="donationId" value={donation.id} /><select name="requestId" aria-label="Request to fund" className="rounded-lg border p-2"><option value="">General fund</option>{data.requests.filter((request) => request.status !== "cancelled").map((request) => <option key={request.id} value={request.id}>{request.public_ref}</option>)}</select><input required name="amountDollars" type="number" min="0.01" step="0.01" placeholder="USD amount" aria-label="Amount in dollars" className="w-36 rounded-lg border p-2" /><button disabled={pending} className="rounded-full border border-blue-800 px-4 py-2 text-blue-800">Allocate</button></form> : null}</div>) : <p className="text-sm text-zinc-600">No verified donations imported.</p>}</div>
      </section> : null}
      {role === "super" ? <section className="rounded-2xl border border-zinc-200 bg-white p-6"><h3 className="text-2xl font-bold">Campaign staff roles</h3><p className="mt-2 text-sm text-zinc-600">Assign an approved Tau Sigma member by their existing member ID. MFA is required for staff access.</p><form onSubmit={(event) => { event.preventDefault(); run(new FormData(event.currentTarget), assignShoeRoleAction); }} className="mt-4 flex flex-wrap gap-3"><input required name="userId" placeholder="Member UUID" aria-label="Member ID" className="min-w-64 rounded-lg border p-2" /><select name="role" aria-label="Campaign role" className="rounded-lg border p-2"><option value="director">Campaign director</option><option value="committee">Committee member</option><option value="finance">Finance officer</option><option value="distribution">Distribution volunteer</option></select><button disabled={pending} className="rounded-full bg-blue-800 px-4 py-2 text-white">Assign role</button></form><ul className="mt-4 space-y-1 text-sm">{data.staff.map((person) => <li key={person.user_id}>{person.user_id} · {person.role}</li>)}</ul></section> : null}
      {canCampaign ? <section id="activity" className="scroll-mt-6"><h3 className="text-2xl font-bold">Recent activity</h3><ul className="mt-4 space-y-2 text-sm">{data.audit.map((entry) => <li key={entry.id} className="rounded-lg border border-zinc-200 p-3"><time>{new Date(entry.created_at).toLocaleString()}</time> · {entry.action} · {entry.entity_type}</li>)}</ul></section> : null}
    </> : null}
  </div>;
}
