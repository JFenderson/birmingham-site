"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import encodeQR from "qr";
import { shoeCheckInUrl } from "@/lib/shoes/check-in";
import { genders, gradeLevels, shoeGroupKey, type PublicCampaign, type PublicInventoryGroup, type PublicProgress, type PublicShoeRequest, type ShoeSelection } from "@/lib/shoes/model";
import { ZeffyDonationEmbed } from "@/components/public/zeffy-donation-embed";
import { reserveShoes } from "./actions";

type PortalData = { campaign: PublicCampaign | null; requests: PublicShoeRequest[]; inventoryGroups: PublicInventoryGroup[]; progress: PublicProgress | null; error?: string };
type Mode = "requests" | "sizes";

function shoeLabel(request: PublicShoeRequest) {
  const system = request.sizeSystem === "little-kid" ? "Little kid" : request.sizeSystem === "youth" ? "Youth" : request.sizeSystem === "toddler" ? "Toddler" : "Adult";
  return `${request.gradeLevel ?? "Grade not listed"} · ${request.gender ?? "Gender not listed"} · ${system} ${request.shoeSize} · ${request.width} · ${request.shoeType}`;
}

function deadline(value: string) {
  return new Date(value).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "long", timeStyle: "short" });
}

export function ShoesPortal(initial: PortalData & { contactEmail: string }) {
  const [data, setData] = useState<PortalData>(initial);
  const [mode, setMode] = useState<Mode>("requests");
  const [selected, setSelected] = useState<string[]>([]);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [sizeSystem, setSizeSystem] = useState("all");
  const [gradeLevel, setGradeLevel] = useState("all");
  const [gender, setGender] = useState("all");
  const [width, setWidth] = useState("all");
  const [shoeType, setShoeType] = useState("all");
  const [availability, setAvailability] = useState("available");
  const [sponsorType, setSponsorType] = useState<"individual" | "organization">("individual");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState<{ reference: string; token: string; expiresAt: string; checkInCode: string; emailSent: boolean; pairs: string[]; deliveryMethod: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (data.campaign?.status !== "published") return;
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/shoes-for-kids", { cache: "no-store" });
        if (response.ok) setData(await response.json() as PortalData);
      } catch { /* Keep the last loaded inventory until the next refresh. */ }
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [data.campaign?.status]);

  const groups = data.inventoryGroups;
  const shoeTypes = [...new Set(data.requests.map((request) => request.shoeType))].sort();
  const matchesFilters = (request: PublicShoeRequest) =>
    (gradeLevel === "all" || (request.gradeLevel ?? "Not specified") === gradeLevel) &&
    (gender === "all" || (request.gender ?? "Not specified") === gender) &&
    (sizeSystem === "all" || request.sizeSystem === sizeSystem) &&
    (width === "all" || request.width === width) &&
    (shoeType === "all" || request.shoeType === shoeType);
  const visibleRequests = data.requests.filter(matchesFilters);
  const visibleGroups = groups.filter((group) => (availability === "all" || group.count > 0) && matchesFilters(group.request));
  const noVisiblePairs = mode === "requests" ? visibleRequests.length === 0 : visibleGroups.length === 0;

  const selectedRequests = data.requests.filter((request) => selected.includes(request.id));
  const sizeSelections: ShoeSelection[] = groups.flatMap((group) =>
    data.requests.filter((request) => shoeGroupKey(request) === group.key)
      .slice(0, sizeQuantities[group.key] ?? 0)
      .map((request) => ({ requestId: request.id, quantity: 1 as const }))
  );
  const selections: ShoeSelection[] = mode === "requests"
    ? selectedRequests.map((request) => ({ requestId: request.id, quantity: 1 as const }))
    : sizeSelections;
  const total = selections.reduce((n, selection) => n + selection.quantity, 0);
  const campaign = data.campaign;
  const progress = data.progress;

  function switchMode(next: Mode) {
    setMode(next); setSelected([]); setSizeQuantities({}); setMessage("");
  }

  function fillGroup(target: number) {
    setMode("sizes"); setSelected([]);
    let remaining = target;
    const quantities: Record<string, number> = {};
    for (const group of visibleGroups) {
      if (remaining <= 0) break;
      const count = Math.min(group.count, remaining);
      quantities[group.key] = count; remaining -= count;
    }
    setSizeQuantities(quantities);
    setMessage(remaining ? `Only ${target - remaining} pairs are currently available. Your selection was reduced to that amount.` : "");
  }

  async function submit(form: FormData) {
    if (!campaign) return;
    setMessage("");
    if (total < 1) { setMessage("Select at least one available pair."); return; }
    const input = {
      campaignId: campaign.id,
      name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""), sponsorType,
      organizationName: String(form.get("organizationName") ?? ""),
      recognitionConsent: form.get("recognitionConsent") === "on",
      transactionalConsent: form.get("transactionalConsent") === "on",
      deliveryAgreement: form.get("deliveryAgreement") === "on",
      deliveryMethod: String(form.get("deliveryMethod") ?? "dropoff") as "dropoff" | "coordinator", selections,
      website: String(form.get("website") ?? ""),
    };
    const pairs = mode === "requests" ? selectedRequests.map((request) => `${request.publicRef} — ${shoeLabel(request)}`)
      : groups.filter((group) => sizeQuantities[group.key]).map((group) => `${sizeQuantities[group.key]} × ${shoeLabel(group.request)}`);
    startTransition(async () => {
      const result = await reserveShoes(input);
      if (result.success) {
        setConfirmation({ ...result, pairs, deliveryMethod: input.deliveryMethod });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setMessage(result.error);
    });
  }

  if (confirmation) return (
    <div className="mx-auto w-full max-w-3xl px-5 py-16 print:py-4">
      <p className="font-semibold uppercase tracking-[0.2em] text-[#1748A3]">Tau Sigma Charity Foundation</p>
      <h1 className="mt-3 text-4xl font-bold text-slate-950">Your pairs are reserved</h1>
      <p className="mt-5 text-xl font-semibold">Reference: {confirmation.reference}</p>
      <p className="mt-2 text-slate-700">Deliver your new shoes by <strong>{deadline(confirmation.expiresAt)} Central Time</strong>.</p>
      <div className="mt-7 rounded-2xl bg-slate-50 p-6">
        <h2 className="text-xl font-bold">Your promised pairs</h2>
        <ul className="mt-3 list-inside list-disc space-y-1">{confirmation.pairs.map((pair) => <li key={pair}>{pair}</li>)}</ul>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-5 rounded-2xl border border-slate-200 p-5">
        <Image unoptimized src={encodeQR(shoeCheckInUrl(confirmation.checkInCode, window.location.origin), "data-url", { scale: 4, border: 4 })} alt={`Check-in QR for ${confirmation.reference}`} width={220} height={220} />
        <p className="max-w-sm text-sm text-slate-700">Scan this QR to open the check-in page, or show it when delivering shoes. It contains no sponsor details. Your printed reference also works.</p>
      </div>
      <div className="mt-6 space-y-2 text-slate-700">
        <p>Shoes must be new and match the size, width, and style above. Original packaging is preferred. Used shoes cannot be accepted.</p>
        {confirmation.deliveryMethod === "coordinator" ? <p>A committee member will coordinate the handoff with you.</p> : campaign?.dropoffLocation ? <p><strong>Drop-off:</strong> {campaign.dropoffLocation}</p> : <p>A coordinator will confirm the drop-off location. Please do not deliver shoes until it is confirmed.</p>}
        {campaign?.dropoffHours ? <p><strong>Hours:</strong> {campaign.dropoffHours}</p> : null}
        {campaign?.dropoffInstructions ? <p>{campaign.dropoffInstructions}</p> : null}
        <p>Questions? Contact the Social Action director at <a className="underline" href={`mailto:${initial.contactEmail}`}>{initial.contactEmail}</a>.</p>
      </div>
      <p className="mt-6 text-sm text-slate-600">{confirmation.emailSent ? "A confirmation email was sent." : "Email delivery is unavailable; save or print this confirmation now."}</p>
      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <a className="rounded-full bg-[#1748A3] px-5 py-3 font-semibold text-white" href={`/shoes-for-kids/manage/${confirmation.token}`}>Manage reservation</a>
        <button className="rounded-full border border-slate-300 px-5 py-3 font-semibold" onClick={() => window.print()}>Print or save</button>
      </div>
    </div>
  );

  return (
    <div className="bg-white text-slate-900">
      <section className="bg-[#103777] px-5 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-200">Tau Sigma Charity Foundation · Est. 1948</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">Shoes for Kids — Adopt a Pair</h1>
          <p className="mt-5 text-xl font-semibold text-blue-100">Every Child Deserves a Great Pair of Shoes.</p>
          <p className="mt-5 max-w-3xl text-base leading-8 text-blue-50">Since 1948, Tau Sigma has worked to make a difference in the lives of children through Shoes for Kids. Help us continue that tradition by adopting a child&apos;s shoe request, purchasing a pair in a needed size, or making a monetary donation.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {campaign?.status === "published" ? <><a href="#adopt" onClick={() => switchMode("requests")} className="rounded-full bg-white px-5 py-3 font-bold text-[#103777]">Adopt a Child&apos;s Request</a><a href="#adopt" onClick={() => switchMode("sizes")} className="rounded-full border border-white/70 px-5 py-3 font-bold text-white">Choose a Shoe Size</a></> : null}
            <a href="#donate" className={campaign?.status === "published" ? "rounded-full border border-white/70 px-5 py-3 font-bold text-white" : "rounded-full bg-white px-5 py-3 font-bold text-[#103777]"}>Make a Donation</a>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-16 px-5 py-12 sm:py-16">
        {data.error ? <section className="rounded-3xl border border-amber-200 bg-amber-50 p-7" role="alert"><h2 className="text-2xl font-bold">Campaign data unavailable</h2><p className="mt-2">{data.error} Please try again later.</p></section> : !campaign || campaign.status !== "published" ? (
          <section className="rounded-3xl border border-blue-100 bg-blue-50 p-7" aria-live="polite">
            <h2 className="text-2xl font-bold text-[#103777]">{campaign?.zeffyUrl ? "Shoes for Kids fundraising is active" : "Shoe adoption is not open yet"}</h2>
            <p className="mt-2 leading-7 text-slate-700">{campaign?.zeffyUrl ? "The Zeffy donation campaign is accepting gifts now. Shoe adoption will open when the request list is ready." : "The shoe request list is being prepared. Please check back when Tau Sigma opens adoption."}</p>
          </section>
        ) : (
          <>
            {progress ? <section aria-label="Campaign progress">
              <h2 className="text-3xl font-bold">Campaign progress</h2>
              <p className="mt-2 text-slate-600">Fulfillment counts only shoes physically received or purchased and verified.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[["Pairs requested", progress.requested], ["Pairs fulfilled", progress.fulfilled], ["Reserved, awaiting delivery", progress.reserved], ["Still outstanding", progress.outstanding]].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 p-5"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold text-[#1748A3]">{value}</p></div>)}
              </div>
              <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={progress.requested ? Math.round(progress.fulfilled / progress.requested * 100) : 0} aria-valuemin={0} aria-valuemax={100} aria-label="Pairs fulfilled">
                <div className="h-full bg-[#1748A3]" style={{ width: `${progress.requested ? progress.fulfilled / progress.requested * 100 : 0}%` }} />
              </div>
              <p className="mt-2 text-sm">{progress.requested ? Math.round(progress.fulfilled / progress.requested * 100) : 0}% fulfilled · {progress.received} received · {progress.purchased} purchased{progress.donationsCents !== null ? ` · $${(progress.donationsCents / 100).toLocaleString()} net verified donations` : ""}</p>
            </section> : null}
            <section id="adopt" className="scroll-mt-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1748A3]">Adopt a pair</p><h2 className="mt-2 text-3xl font-bold">Choose how you would like to help</h2></div>
                <p className="text-sm text-slate-600">Availability refreshes automatically. Final selection is checked at checkout.</p>
              </div>
              <div className="mt-6 flex gap-2" role="tablist" aria-label="Adoption method">
                <button type="button" role="tab" aria-selected={mode === "requests"} onClick={() => switchMode("requests")} className={`rounded-full px-5 py-3 font-semibold ${mode === "requests" ? "bg-[#1748A3] text-white" : "bg-slate-100"}`}>Anonymous requests</button>
                <button type="button" role="tab" aria-selected={mode === "sizes"} onClick={() => switchMode("sizes")} className={`rounded-full px-5 py-3 font-semibold ${mode === "sizes" ? "bg-[#1748A3] text-white" : "bg-slate-100"}`}>Shop by size</button>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <label className="text-sm font-semibold">Size range <select value={sizeSystem} onChange={(e) => setSizeSystem(e.target.value)} className="ml-2 rounded-lg border border-slate-300 p-2"><option value="all">All sizes</option><option value="toddler">Toddler</option><option value="little-kid">Little kid</option><option value="youth">Youth</option><option value="adult">Adult</option></select></label>
                <label className="text-sm font-semibold">Grade <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="ml-2 rounded-lg border border-slate-300 p-2"><option value="all">All grades</option>{gradeLevels.map((grade) => <option key={grade} value={grade}>{grade}</option>)}<option value="Not specified">Not specified</option></select></label>
                <label className="text-sm font-semibold">Gender <select value={gender} onChange={(e) => setGender(e.target.value)} className="ml-2 rounded-lg border border-slate-300 p-2"><option value="all">All genders</option>{genders.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                <label className="text-sm font-semibold">Width <select value={width} onChange={(e) => setWidth(e.target.value)} className="ml-2 rounded-lg border border-slate-300 p-2"><option value="all">All widths</option><option value="standard">Standard</option><option value="wide">Wide</option><option value="extra-wide">Extra wide</option><option value="narrow">Narrow</option></select></label>
                <label className="text-sm font-semibold">Shoe type <select value={shoeType} onChange={(e) => setShoeType(e.target.value)} className="ml-2 rounded-lg border border-slate-300 p-2"><option value="all">All types</option>{shoeTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
                <label className="text-sm font-semibold">Availability <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="ml-2 rounded-lg border border-slate-300 p-2"><option value="available">Available</option><option value="all">All</option></select></label>
              </div>
              {data.requests.length === 0 && (mode === "requests" || availability === "available") ? <p className="mt-6 rounded-2xl bg-slate-50 p-6">No pairs are currently available. Please check back or make a donation.</p> : noVisiblePairs ? (
                <p className="mt-6 rounded-2xl bg-slate-50 p-6">No pairs match these filters. Try another grade, gender, or size.</p>
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {mode === "requests" ? visibleRequests.map((request) => (
                    <label key={request.id} className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-5 hover:border-[#1748A3]"><input type="checkbox" checked={selected.includes(request.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, request.id].slice(0, 20) : current.filter((id) => id !== request.id))} className="mt-1 size-5" /><span><strong className="block text-[#1748A3]">{request.publicRef}</strong><span className="mt-1 block text-sm">{shoeLabel(request)}</span><span className="mt-2 block text-xs font-semibold text-green-700">Available · one pair</span></span></label>
                  )) : visibleGroups.map((group) => (
                    <label key={group.key} className="rounded-2xl border border-slate-200 p-5"><strong className="block text-[#1748A3]">{shoeLabel(group.request)}</strong><span className="mt-1 block text-sm">{group.needed} needed · {group.count} available</span><span className="mt-3 flex items-center gap-3 text-sm font-semibold">Quantity <input type="number" min="0" max={Math.min(group.count, 20)} disabled={group.count === 0} value={sizeQuantities[group.key] ?? 0} onChange={(e) => setSizeQuantities((current) => ({ ...current, [group.key]: Math.max(0, Math.min(group.count, Number(e.target.value) || 0)) }))} className="w-20 rounded-lg border border-slate-300 p-2 disabled:opacity-50" /></span></label>
                  ))}
                </div>
              )}
              {availability === "all" ? <p className="mt-3 text-sm text-slate-600">Reserved and fulfilled pairs appear in the campaign progress above; only available pairs can be selected.</p> : null}
              <p className="mt-5 font-semibold" aria-live="polite">{total} {total === 1 ? "pair" : "pairs"} selected (maximum 20 per reservation)</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold">Group quantities:</span>{[5,10,20].map((count) => <button key={count} type="button" onClick={() => fillGroup(count)} className="rounded-full border border-[#1748A3] px-3 py-1 font-semibold text-[#1748A3]">{count} pairs</button>)}<span className="text-slate-600">Or choose custom quantities above.</span></div>
              <form action={submit} className="mt-8 grid gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:grid-cols-2 sm:p-8">
                <div className="sm:col-span-2"><h3 className="text-2xl font-bold">Sponsor details</h3><p className="mt-1 text-sm text-slate-600">No account is required. Your contact details stay private.</p></div>
                <label className="text-sm font-semibold">Name <input required name="name" maxLength={160} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3" /></label>
                <label className="text-sm font-semibold">Email <input required type="email" name="email" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3" /></label>
                <label className="text-sm font-semibold">Phone (optional) <input type="tel" name="phone" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3" /></label>
                <label className="text-sm font-semibold">Sponsorship type <select value={sponsorType} onChange={(e) => setSponsorType(e.target.value as "individual" | "organization")} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3"><option value="individual">Individual</option><option value="organization">Organization or group</option></select></label>
                {sponsorType === "organization" ? <label className="text-sm font-semibold sm:col-span-2">Organization name <input required name="organizationName" maxLength={160} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3" /></label> : null}
                {campaign.dropoffLocation ? <label className="text-sm font-semibold sm:col-span-2">Delivery method <select name="deliveryMethod" className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3"><option value="dropoff">Deliver to confirmed drop-off location</option><option value="coordinator">Coordinate handoff with committee</option></select></label> : <div className="sm:col-span-2"><input type="hidden" name="deliveryMethod" value="coordinator" /><p className="font-semibold">Delivery: committee-coordinated handoff</p><p className="mt-1 text-sm text-slate-600">A program team member will contact you with handoff details after you reserve.</p></div>}
                <div className="space-y-3 text-sm sm:col-span-2">
                  <p><strong>Delivery deadline:</strong> {deadline(campaign.physicalDeadline)} Central Time. {campaign.reservationDays >= 365 ? "Reservations stay active until this deadline." : `Reservations are held for up to ${campaign.reservationDays} days.`}</p>
                  <p>Shoes must be new athletic shoes and match the selected size and width. Kid-friendly styles are encouraged. Used shoes are not accepted. Original packaging is preferred.</p>
                  {campaign.dropoffLocation ? <p><strong>Confirmed drop-off:</strong> {campaign.dropoffLocation}{campaign.dropoffHours ? ` · ${campaign.dropoffHours}` : ""}</p> : <p>The committee will arrange the handoff with you. Please wait for those details before delivering shoes.</p>}
                  <label className="flex gap-2"><input required type="checkbox" name="deliveryAgreement" /> I agree to the shoe and delivery requirements.</label>
                  <label className="flex gap-2"><input required type="checkbox" name="transactionalConsent" /> I agree to receive communications about this reservation.</label>
                  <label className="flex gap-2"><input type="checkbox" name="recognitionConsent" /> My name or organization may be recognized in campaign acknowledgments.</label>
                  <input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[10000px]" aria-hidden="true" />
                </div>
                {message ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800 sm:col-span-2">{message}</p> : null}
                <button disabled={pending || total === 0 || total > 20} className="min-h-12 rounded-full bg-[#1748A3] px-6 font-bold text-white disabled:opacity-50 sm:col-span-2">{pending ? "Reserving pairs…" : `Reserve ${total} ${total === 1 ? "pair" : "pairs"}`}</button>
              </form>
            </section>
          </>
        )}
        <section id="donate" className="scroll-mt-6 rounded-3xl bg-[#f1f5fc] p-7 sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#1748A3]">Give with Zeffy</p>
          <h2 className="mt-2 text-3xl font-bold">Make a monetary donation</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">Suggested gifts: one pair $50, two pairs $100, five pairs $250, or any amount you choose. A financial gift supports the general Shoes for Kids fund until it is verified and allocated by the committee.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Sponsor one pair","$50"],["Sponsor two pairs","$100"],["Sponsor five pairs","$250"],["Give a custom amount","Your choice"]].map(([label,amount]) => <div key={label} className="rounded-2xl border border-blue-100 bg-white p-4"><p className="text-sm font-semibold text-slate-700">{label}</p><p className="mt-1 text-2xl font-bold text-[#1748A3]">{amount}</p></div>)}</div>
          <div className="mt-6"><ZeffyDonationEmbed url={campaign?.zeffyUrl ?? null} embedUrl={campaign?.zeffyEmbedUrl ?? null} /></div>
        </section>
      </div>
    </div>
  );
}
