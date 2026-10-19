"use client";

import { useState, useTransition } from "react";
import { cancelMyReservation } from "./actions";

export function ReservationControls({ token, status }: { token: string; status: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  return <div className="mt-8 flex flex-wrap gap-3 print:hidden">
    <button type="button" onClick={() => window.print()} className="rounded-full bg-[#1748A3] px-5 py-3 font-semibold text-white">Print or save</button>
    {["reserved", "partially_received"].includes(status) ? <button type="button" disabled={pending} onClick={() => {
      if (!window.confirm("Cancel the remaining undelivered pairs in this reservation?")) return;
      start(async () => { const result = await cancelMyReservation(token); setMessage(result.success ? "Reservation cancelled." : "This reservation can no longer be cancelled online."); });
    }} className="rounded-full border border-slate-300 px-5 py-3 font-semibold disabled:opacity-50">{pending ? "Cancelling…" : "Cancel remaining pairs"}</button> : null}
    {message ? <p role="status" className="w-full text-sm">{message}</p> : null}
  </div>;
}
