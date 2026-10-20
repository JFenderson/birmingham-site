import { notFound } from "next/navigation";
import Image from "next/image";
import encodeQR from "qr";
import { headers } from "next/headers";
import { getShoeProgramContactEmail } from "@/lib/email/config";
import { getTrustedSiteOrigin } from "@/lib/security/redirects";
import { shoeCheckInUrl } from "@/lib/shoes/check-in";
import { getTenantContext } from "@/lib/tenant/resolve-chapter";
import { getShoeReservationByToken } from "@/lib/shoes/store";
import { ReservationControls } from "./reservation-controls";

export default async function ManageShoeReservationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tenant = await getTenantContext();
  if (tenant.chapterSlug !== "root") notFound();
  const reservation = await getShoeReservationByToken(tenant.chapterId, token);
  if (!reservation) notFound();
  const campaign = reservation.shoe_campaigns;
  const sponsor = reservation.shoe_sponsors;
  const requestHost = (await headers()).get("host");
  const origin = process.env.NODE_ENV !== "production" && /^localhost:\d+$/.test(requestHost ?? "")
    ? `http://${requestHost}` : getTrustedSiteOrigin();
  const checkInCode = `SFK-CI:${reservation.id}`;
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14 print:py-3">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1748A3]">Shoes for Kids · Sponsor confirmation</p>
      <h1 className="mt-3 text-4xl font-bold">Reservation {reservation.reference}</h1>
      <p className="mt-3 text-slate-700">Sponsor: {sponsor.organization_name ?? sponsor.name} · Status: {reservation.status.replaceAll("_", " ")} · {reservation.delivery_method === "coordinator" ? "Coordinator handoff" : "Drop-off"}</p>
      <p className="mt-2 text-slate-700">Deadline: <strong>{new Date(reservation.expires_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "full", timeStyle: "short" })} Central Time</strong></p>
      <section className="mt-7 rounded-2xl border border-slate-200 p-6"><h2 className="text-xl font-bold">Promised pairs</h2>
        <ul className="mt-4 space-y-3">{reservation.items.map((item: { status: string; shoe_requests: { id: string; public_ref: string; size_system: string; shoe_size: string; width: string; shoe_type: string } }) => <li key={item.shoe_requests.id} className="border-b border-slate-100 pb-3"><strong>{item.shoe_requests.public_ref}</strong> · {item.shoe_requests.size_system} {item.shoe_requests.shoe_size} · {item.shoe_requests.width} · {item.shoe_requests.shoe_type} <span className="text-sm text-slate-600">({item.status})</span></li>)}</ul>
      </section>
      <section className="mt-7 flex flex-wrap items-center gap-5 rounded-2xl border border-slate-200 p-5">
        {origin ? <Image unoptimized src={encodeQR(shoeCheckInUrl(checkInCode, origin), "data-url", { scale: 4, border: 4 })} alt={`Check-in QR for ${reservation.reference}`} width={220} height={220} /> : null}
        <p className="max-w-sm text-sm text-slate-700">Scan this QR to open the check-in page, or show it when delivering shoes. It contains no sponsor details. Staff can also use the printed reference.</p>
      </section>
      <section className="mt-7 space-y-2 text-slate-700"><h2 className="text-xl font-bold text-slate-900">Delivery</h2><p>Shoes must be new and match the listed size, width, and style. Original packaging is preferred. Used shoes are not accepted.</p>
        {campaign.dropoff_location ? <p><strong>Confirmed drop-off:</strong> {campaign.dropoff_location}</p> : <p>A coordinator will confirm the drop-off location.</p>}
        {campaign.dropoff_hours ? <p><strong>Hours:</strong> {campaign.dropoff_hours}</p> : null}
        {campaign.dropoff_contact ? <p><strong>Contact:</strong> {campaign.dropoff_contact}</p> : null}
        {campaign.dropoff_instructions ? <p>{campaign.dropoff_instructions}</p> : null}
        <p>Questions? Contact the Social Action director at <a className="underline" href={`mailto:${getShoeProgramContactEmail()}`}>{getShoeProgramContactEmail()}</a>.</p>
      </section>
      <ReservationControls token={token} status={reservation.status} />
    </div>
  );
}
