"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkIn } from "./actions";

export function CheckInButton({
  eventId,
  alreadyCheckedIn,
}: {
  eventId: string;
  alreadyCheckedIn: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alreadyCheckedIn);

  function handleCheckIn() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Your browser doesn't support location check-in.");
      return;
    }

    setPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          const result = await checkIn({
            eventId,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setPending(false);
          if (result.error) {
            setError(result.error);
            return;
          }
          setDone(true);
          router.refresh();
        })();
      },
      () => {
        setPending(false);
        setError("Location permission is required to check in.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  if (done) {
    return <span className="text-sm font-medium text-green-700">Checked in</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleCheckIn}
        disabled={pending}
        className="rounded-md bg-navy px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {pending ? "Checking in…" : "Check In"}
      </button>
      {error && <span className="max-w-48 text-right text-xs text-red-600">{error}</span>}
    </div>
  );
}
