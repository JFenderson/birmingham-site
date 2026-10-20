"use client";

import { useEffect, useRef, useState } from "react";
import type { QRCamera } from "qr/dom.js";
import { parseShoeCheckInCode } from "@/lib/shoes/check-in";

export function ShoeCheckInScanner({ onScan }: { onScan: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    let animation = 0;
    let camera: QRCamera | undefined;
    async function start() {
      try {
        const { QRCanvas, rearCamera } = await import("qr/dom.js");
        if (stopped || !video.current) return;
        const reader = new QRCanvas();
        camera = await rearCamera(video.current);
        if (stopped) { camera.stop(); return; }
        async function scan() {
          if (stopped || !camera) return;
          try {
            const result = await camera.readFrame(reader);
            const code = typeof result === "string" ? parseShoeCheckInCode(result) : null;
            if (code) {
              onScanRef.current(code);
              setOpen(false);
              return;
            }
          } catch { /* An unreadable frame is normal while positioning the code. */ }
          if (!stopped) animation = requestAnimationFrame(scan);
        }
        animation = requestAnimationFrame(scan);
      } catch {
        if (!stopped) { setError("Camera access is unavailable. Enter the printed reservation reference instead."); setOpen(false); }
      }
    }
    void start();
    return () => { stopped = true; cancelAnimationFrame(animation); camera?.stop(); };
  }, [open]);

  return <div className="space-y-3">
    <button type="button" onClick={() => { setError(""); setOpen((value) => !value); }} className="rounded-full border border-blue-800 px-4 py-2 text-sm font-semibold text-blue-800">{open ? "Stop camera" : "Scan check-in QR"}</button>
    {open ? <video ref={video} muted playsInline autoPlay aria-label="QR scanner camera preview" className="aspect-square max-h-80 w-full max-w-80 rounded-xl bg-zinc-900 object-cover" /> : null}
    {error ? <p role="alert" className="text-sm text-red-800">{error}</p> : null}
  </div>;
}
