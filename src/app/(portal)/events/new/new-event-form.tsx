"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventFormSchema, type EventFormInput } from "@/lib/validation/schemas";
import { createEvent } from "../actions";

export function NewEventForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormInput>({
    // z.coerce.number() gives the resolver a pre-coercion "unknown" input
    // type that doesn't line up with useForm's declared field types — same
    // friction as join-form.tsx, cast away rather than fight the generics.
    resolver: zodResolver(eventFormSchema) as unknown as Resolver<EventFormInput>,
  });

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((position) => {
      setValue("geofenceLat", position.coords.latitude);
      setValue("geofenceLng", position.coords.longitude);
    });
  }

  async function onSubmit(values: EventFormInput) {
    setError(null);
    const result = await createEvent(values);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/events");
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Title</label>
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("title")}
        />
        {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Description (optional)</label>
        <textarea
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("description")}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Starts At</label>
        <input
          type="datetime-local"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("startsAt")}
        />
        {errors.startsAt && (
          <p className="text-sm text-red-600">{errors.startsAt.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Location Name (optional)</label>
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          {...register("locationName")}
        />
      </div>

      <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">
            Geofence Check-In (optional — leave blank to disable check-in for this event)
          </p>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="text-xs font-semibold text-navy hover:underline"
          >
            Use my current location
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Latitude</label>
            <input
              type="number"
              step="any"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              {...register("geofenceLat")}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Longitude</label>
            <input
              type="number"
              step="any"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              {...register("geofenceLng")}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-500">Radius (m)</label>
            <input
              type="number"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              {...register("geofenceRadiusM")}
            />
          </div>
        </div>
        {errors.root && <p className="mt-2 text-sm text-red-600">{errors.root.message}</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-navy px-4 py-2 font-semibold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
      >
        {isSubmitting ? "Creating…" : "Create Event"}
      </button>
    </form>
  );
}
